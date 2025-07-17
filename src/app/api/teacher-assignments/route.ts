import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Helper function to map day numbers to enum values
function mapDayOfWeek(dayNumber: number | string): string {
  const dayMap: { [key: number]: string } = {
    1: 'monday',
    2: 'tuesday', 
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday'
  };
  
  const numericDay = typeof dayNumber === 'string' ? parseInt(dayNumber) : dayNumber;
  return dayMap[numericDay] || 'monday';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const academic_term_id = searchParams.get('academic_term_id')
    const teacher_id = searchParams.get('teacher_id')
    const class_id = searchParams.get('class_id')
    const subject_id = searchParams.get('subject_id')
    const assignment_type = searchParams.get('type') // 'subject' or 'homeroom'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get subject teacher assignments from teacher_assignments table
    if (!assignment_type || assignment_type === 'subject') {
      let query = supabase
        .from('teacher_assignments')
        .select(`
          id,
          academic_term_id,
          teacher_id,
          class_id,
          subject_id,
          assigned_date,
          is_active,
          notes,
          created_at,
          updated_at,
          academic_term:academic_terms!academic_term_id(*),
          class:classes!class_id(*, grade_level:grade_levels!grade_level_id(name)),
          subject:subjects!subject_id(*),
          teacher:users!teacher_id(*)
        `, { count: 'exact' })
        .eq('is_active', true)

      // Apply filters
      if (academic_term_id) query = query.eq('academic_term_id', academic_term_id)
      if (teacher_id) query = query.eq('teacher_id', teacher_id)
      if (class_id) query = query.eq('class_id', class_id)
      if (subject_id) query = query.eq('subject_id', subject_id)

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data: assignments, error, count } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching subject assignments:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      // For each assignment, get the related teaching schedules (if any)
      const assignmentsWithSchedules = await Promise.all(
        assignments?.map(async (assignment) => {
          const { data: schedules } = await supabase
            .from('teaching_schedules')
            .select(`
              id,
              day_of_week,
              time_slot_id,
              room_number,
              time_slot:time_slots!time_slot_id(*)
            `)
            .eq('academic_term_id', assignment.academic_term_id)
            .eq('teacher_id', assignment.teacher_id)
            .eq('class_id', assignment.class_id)
            .eq('subject_id', assignment.subject_id)
            .eq('is_active', true)

          return {
            ...assignment,
            total_periods: schedules?.length || 0,
            schedules: schedules || []
          }
        }) || []
      )

      return NextResponse.json({
        data: assignmentsWithSchedules,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        type: 'subject'
      })
    }

    // Get homeroom teacher assignments
    if (assignment_type === 'homeroom') {
      let query = supabase
        .from('homeroom_assignments')
        .select(`
          *,
          teacher:users!teacher_id(*),
          class:classes!class_id(*),
          academic_year:academic_years!academic_year_id(*)
        `, { count: 'exact' })

      // Apply filters
      if (teacher_id) query = query.eq('teacher_id', teacher_id)
      if (class_id) query = query.eq('class_id', class_id)

      // Pagination
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)

      const { data, error, count } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching homeroom assignments:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        data,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        type: 'homeroom'
      })
    }

    return NextResponse.json({ error: 'Invalid assignment type' }, { status: 400 })

  } catch (error) {
    console.error('Error in teacher assignments GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { 
      action,
      assignment_type = 'subject',
      assignments
    } = body

    // NEW: Handle simple teacher assignment (only create teacher_assignments record)
    if (action === 'simple_assign') {
      return await createSimpleTeacherAssignment(supabase, body)
    }

    if (action === 'bulk_assign') {
      return await bulkAssignTeachers(supabase, assignment_type, assignments)
    }

    if (assignment_type === 'homeroom') {
      return await createHomeroomAssignment(supabase, body)
    }

    // For subject assignments, we create teaching schedules
    return await createSubjectAssignment(supabase, body)

  } catch (error) {
    console.error('Error in teacher assignments POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create homeroom teacher assignment
async function createHomeroomAssignment(supabase: any, data: any) {
  const { 
    teacher_id,
    class_id,
    academic_year_id,
    assigned_date,
    end_date
  } = data

  if (!teacher_id || !class_id || !academic_year_id) {
    return NextResponse.json({ 
      error: 'teacher_id, class_id, and academic_year_id are required' 
    }, { status: 400 })
  }

  // Check if teacher has homeroom_teacher or school_administrator role
  const { data: teacherData } = await supabase
    .from('users')
    .select('role')
    .eq('id', teacher_id)
    .single()

  if (!teacherData || !['homeroom_teacher', 'subject_teacher', 'school_administrator'].includes(teacherData.role)) {
    return NextResponse.json({ 
      error: 'Teacher must have homeroom_teacher, subject_teacher, or school_administrator role' 
    }, { status: 400 })
  }

  // Check for existing homeroom assignment for this class
  const { data: existingAssignment } = await supabase
    .from('homeroom_assignments')
    .select('id')
    .eq('class_id', class_id)
    .eq('academic_year_id', academic_year_id)
    .eq('is_active', true)
    .single()

  if (existingAssignment) {
    return NextResponse.json({ 
      error: 'This class already has an active homeroom teacher' 
    }, { status: 409 })
  }

  const { data: homeroomData, error } = await supabase
    .from('homeroom_assignments')
    .insert({
      teacher_id,
      class_id,
      academic_year_id,
      assigned_date: assigned_date || new Date().toISOString().split('T')[0],
      end_date,
      is_active: true
    })
    .select(`
      *,
      teacher:users!teacher_id(*),
      class:classes!class_id(*),
      academic_year:academic_years!academic_year_id(*)
    `)
    .single()

  if (error) {
    console.error('Error creating homeroom assignment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: homeroomData }, { status: 201 })
}

// Create subject teacher assignment (via teaching schedule)
async function createSubjectAssignment(supabase: any, assignmentData: any) {
  const { 
    academic_term_id,
    teacher_id,
    class_id,
    subject_id,
    schedules // Array of { day_of_week, time_slot_id, room_number }
  } = assignmentData

  if (!academic_term_id || !teacher_id || !class_id || !subject_id || !schedules || !Array.isArray(schedules)) {
    return NextResponse.json({ 
      error: 'academic_term_id, teacher_id, class_id, subject_id, and schedules array are required' 
    }, { status: 400 })
  }

  // Check if teacher has subject_teacher role
  const { data: subjectTeacher } = await supabase
    .from('users')
    .select('role')
    .eq('id', teacher_id)
    .single()

  if (!subjectTeacher || !['subject_teacher', 'homeroom_teacher', 'school_administrator'].includes(subjectTeacher.role)) {
    return NextResponse.json({ 
      error: 'Teacher must have subject_teacher, homeroom_teacher, or school_administrator role' 
    }, { status: 400 })
  }

  // Validate all schedules
  for (const schedule of schedules) {
    if (!schedule.day_of_week || !schedule.time_slot_id) {
      return NextResponse.json({ 
        error: 'Each schedule must have day_of_week and time_slot_id' 
      }, { status: 400 })
    }

    // Check for conflicts
    const { data: scheduleConflict } = await supabase
      .from('teaching_schedules')
      .select('id')
      .eq('academic_term_id', academic_term_id)
      .eq('day_of_week', schedule.day_of_week)
      .eq('time_slot_id', schedule.time_slot_id)
      .or(`teacher_id.eq.${teacher_id},class_id.eq.${class_id}`)
      .single()

    if (scheduleConflict) {
      return NextResponse.json({ 
        error: `Schedule conflict on ${schedule.day_of_week} at time slot ${schedule.time_slot_id}` 
      }, { status: 409 })
    }
  }

  // 1. First create the teacher assignment record for tracking
  const { data: teacherAssignmentData, error: assignmentError } = await supabase
    .from('teacher_assignments')
    .insert({
      academic_term_id,
      teacher_id,
      class_id,
      subject_id,
      assigned_date: new Date().toISOString().split('T')[0],
      is_active: true,
      notes: `Created with ${schedules.length} scheduled periods`
    })
    .select()
    .single()

  if (assignmentError) {
    console.error('Error creating teacher assignment:', assignmentError)
    return NextResponse.json({ error: assignmentError.message }, { status: 500 })
  }

  // 2. Then create all teaching schedules
  const teachingSchedules = schedules.map(schedule => ({
    academic_term_id,
    teacher_id,
    class_id,
    subject_id,
    day_of_week: mapDayOfWeek(schedule.day_of_week),
    time_slot_id: schedule.time_slot_id,
    room_number: schedule.room_number,
    is_active: true
  }))

  const { data: scheduleData, error } = await supabase
    .from('teaching_schedules')
    .insert(teachingSchedules)
    .select(`
      *,
      academic_term:academic_terms!academic_term_id(*),
      class:classes!class_id(*),
      subject:subjects!subject_id(*),
      teacher:users!teacher_id(*),
      time_slot:time_slots!time_slot_id(*)
    `)

  if (error) {
    // If schedule creation fails, we should also remove the assignment record
    await supabase
      .from('teacher_assignments')
      .delete()
      .eq('id', teacherAssignmentData.id)
    
    console.error('Error creating subject assignment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    assignment: teacherAssignmentData,
    schedules: scheduleData,
    message: `Created teacher assignment with ${scheduleData.length} teaching schedules`
  }, { status: 201 })
}

// NEW: Create simple teacher assignment (only teacher_assignments record)
async function createSimpleTeacherAssignment(supabase: any, data: any) {
  const { 
    academic_term_id,
    teacher_id,
    class_id,
    subject_id
  } = data

  if (!academic_term_id || !teacher_id || !class_id || !subject_id) {
    return NextResponse.json({ 
      error: 'academic_term_id, teacher_id, class_id, and subject_id are required' 
    }, { status: 400 })
  }

  // Check if teacher has appropriate role
  const { data: teacherData } = await supabase
    .from('users')
    .select('role, full_name')
    .eq('id', teacher_id)
    .single()

  if (!teacherData || !['subject_teacher', 'homeroom_teacher', 'school_administrator'].includes(teacherData.role)) {
    return NextResponse.json({ 
      error: 'Teacher must have subject_teacher, homeroom_teacher, or school_administrator role' 
    }, { status: 400 })
  }

  // Check for existing assignment
  const { data: existingAssignment } = await supabase
    .from('teacher_assignments')
    .select('id')
    .eq('academic_term_id', academic_term_id)
    .eq('teacher_id', teacher_id)
    .eq('class_id', class_id)
    .eq('subject_id', subject_id)
    .eq('is_active', true)
    .single()

  if (existingAssignment) {
    return NextResponse.json({ 
      error: 'This teacher is already assigned to teach this subject for this class' 
    }, { status: 409 })
  }

  // Create teacher assignment record
  const { data: assignmentData, error } = await supabase
    .from('teacher_assignments')
    .insert({
      academic_term_id,
      teacher_id,
      class_id,
      subject_id,
      assigned_date: new Date().toISOString().split('T')[0],
      is_active: true,
      notes: 'Created via simple assignment - schedule will be generated automatically'
    })
    .select(`
      *,
      academic_term:academic_terms!academic_term_id(*),
      teacher:users!teacher_id(*),
      class:classes!class_id(*),
      subject:subjects!subject_id(*)
    `)
    .single()

  if (error) {
    console.error('Error creating teacher assignment:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ 
    data: assignmentData,
    message: `Successfully assigned ${teacherData.full_name} to teach ${assignmentData.subject.name} for ${assignmentData.class.name}`
  }, { status: 201 })
}

// Bulk assign teachers
async function bulkAssignTeachers(supabase: any, assignment_type: string, assignments: any[]) {
  try {
    if (assignment_type === 'homeroom') {
      const results = []
      for (const assignment of assignments) {
        const result = await createHomeroomAssignment(supabase, assignment)
        results.push(result)
      }
      return NextResponse.json({ 
        message: `Bulk assigned ${assignments.length} homeroom teachers`,
        results 
      })
    } else {
      const results = []
      for (const assignment of assignments) {
        const result = await createSubjectAssignment(supabase, assignment)
        results.push(result)
      }
      return NextResponse.json({ 
        message: `Bulk assigned ${assignments.length} subject teachers`,
        results 
      })
    }

  } catch (error) {
    console.error('Error in bulk assignment:', error)
    return NextResponse.json({ error: 'Failed to bulk assign teachers' }, { status: 500 })
  }
} 