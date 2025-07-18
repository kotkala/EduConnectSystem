import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get lesson feedback
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Query parameters
    const schedule_id = searchParams.get('schedule_id')
    const class_id = searchParams.get('class_id')
    const teacher_id = searchParams.get('teacher_id')
    const feedback_date = searchParams.get('feedback_date')
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '20')

    // Build query
    let query = supabase
      .from('teacher_feedback')
      .select(`
        *,
        teacher:users!teacher_id(id, full_name),
        class:classes!class_id(
          id,
          name,
          code,
          academic_year:academic_years!academic_year_id(id, name),
          grade_level:grade_levels!grade_level_id(id, name, level)
        ),
        schedule:teaching_schedules!schedule_id(
          id,
          day_of_week,
          subject:subjects!subject_id(id, name, code),
          time_slot:time_slots!time_slot_id(id, name, start_time, end_time)
        )
      `)
      .order('feedback_date', { ascending: false })

    // Apply filters
    if (schedule_id) {
      query = query.eq('schedule_id', schedule_id)
    }
    if (class_id) {
      query = query.eq('class_id', class_id)
    }
    if (teacher_id) {
      query = query.eq('teacher_id', teacher_id)
    }
    if (feedback_date) {
      query = query.eq('feedback_date', feedback_date)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('teacher_feedback')
      .select('*', { count: 'exact', head: true })

    // Apply pagination
    const from = (page - 1) * per_page
    const to = from + per_page - 1
    query = query.range(from, to)

    const { data: feedback, error } = await query

    if (error) {
      console.error('Error fetching feedback:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: feedback,
      pagination: {
        page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page)
      }
    })
  } catch (error) {
    console.error('Lesson feedback GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create lesson feedback
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is a teacher
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['subject_teacher', 'homeroom_teacher'].includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: 'Only teachers can create lesson feedback' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      schedule_id,
      class_id,
      feedback_date,
      feedback_type,
      scope,
      content,
      tags,
      attachments,
      student_feedbacks // Array of individual student feedback
    } = body

    // Validate required fields
    if (!class_id || !feedback_date || !feedback_type || !scope || !content) {
      return NextResponse.json(
        { success: false, error: 'Class, date, type, scope, and content are required' },
        { status: 400 }
      )
    }

    // Validate feedback type and scope
    const validTypes = ['lesson', 'behavior', 'general']
    const validScopes = ['individual', 'group', 'class']
    
    if (!validTypes.includes(feedback_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    if (!validScopes.includes(scope)) {
      return NextResponse.json(
        { success: false, error: 'Invalid feedback scope' },
        { status: 400 }
      )
    }

    // Verify class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, code')
      .eq('id', class_id)
      .single()

    if (classError || !classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }

    // Verify schedule exists if provided
    if (schedule_id) {
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('teaching_schedules')
        .select('id, teacher_id')
        .eq('id', schedule_id)
        .single()

      if (scheduleError || !scheduleData) {
        return NextResponse.json(
          { success: false, error: 'Schedule not found' },
          { status: 404 }
        )
      }

      // Verify teacher owns the schedule
      if (scheduleData.teacher_id !== user.id) {
        return NextResponse.json(
          { success: false, error: 'You can only create feedback for your own lessons' },
          { status: 403 }
        )
      }
    }

    // Create main feedback record
    const { data: feedback, error: feedbackError } = await supabase
      .from('teacher_feedback')
      .insert({
        teacher_id: user.id,
        class_id,
        schedule_id,
        feedback_date,
        feedback_type,
        scope,
        content,
        tags: tags || [],
        attachments: attachments || [],
        is_ai_processed: false
      })
      .select(`
        *,
        teacher:users!teacher_id(id, full_name),
        class:classes!class_id(
          id,
          name,
          code,
          academic_year:academic_years!academic_year_id(id, name),
          grade_level:grade_levels!grade_level_id(id, name, level)
        ),
        schedule:teaching_schedules!schedule_id(
          id,
          day_of_week,
          subject:subjects!subject_id(id, name, code),
          time_slot:time_slots!time_slot_id(id, name, start_time, end_time)
        )
      `)
      .single()

    if (feedbackError) {
      console.error('Error creating feedback:', feedbackError)
      return NextResponse.json(
        { success: false, error: 'Failed to create feedback' },
        { status: 500 }
      )
    }

    // Handle individual student feedback if provided
    let studentFeedbackResults = []
    if (student_feedbacks && Array.isArray(student_feedbacks) && student_feedbacks.length > 0) {
      
      // Validate students exist and are enrolled in the class
      const studentIds = student_feedbacks.map((sf: any) => sf.student_id)
      const { data: enrollments, error: enrollError } = await supabase
        .from('student_enrollments')
        .select('student_id')
        .eq('class_id', class_id)
        .eq('is_active', true)
        .in('student_id', studentIds)

      if (enrollError) {
        console.error('Error validating student enrollments:', enrollError)
        return NextResponse.json(
          { success: false, error: 'Failed to validate student enrollments' },
          { status: 500 }
        )
      }

      const enrolledStudentIds = enrollments?.map(e => e.student_id) || []
      const invalidStudentIds = studentIds.filter(id => !enrolledStudentIds.includes(id))

      if (invalidStudentIds.length > 0) {
        return NextResponse.json(
          { success: false, error: `Some students are not enrolled in this class: ${invalidStudentIds.join(', ')}` },
          { status: 400 }
        )
      }

      // Create individual student feedback records
      for (const studentFeedback of student_feedbacks) {
        const { data: individualFeedback, error: individualError } = await supabase
          .from('teacher_feedback')
          .insert({
            teacher_id: user.id,
            class_id,
            schedule_id,
            feedback_date,
            feedback_type,
            scope: 'individual',
            content: studentFeedback.content,
            tags: studentFeedback.tags || [],
            attachments: studentFeedback.attachments || [],
            is_ai_processed: false
          })

        if (individualError) {
          console.error('Error creating individual feedback:', individualError)
          // Continue with other feedback, don't fail entire operation
        } else {
          studentFeedbackResults.push(individualFeedback)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        main_feedback: feedback,
        student_feedbacks: studentFeedbackResults
      },
      message: 'Lesson feedback created successfully'
    })
  } catch (error) {
    console.error('Lesson feedback POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 