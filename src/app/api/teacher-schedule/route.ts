import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get teacher's teaching schedule
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

    // Check if user is a teacher
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['subject_teacher', 'homeroom_teacher'].includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: 'Only teachers can access teaching schedules' },
        { status: 403 }
      )
    }

    // Query parameters
    const academic_term_id = searchParams.get('academic_term_id')
    const week_start = searchParams.get('week_start') // Optional: filter by week
    
    // Get current academic term if not specified
    let termId = academic_term_id
    if (!termId) {
      const { data: currentTerm } = await supabase
        .from('academic_terms')
        .select('id')
        .eq('is_current', true)
        .single()
      
      termId = currentTerm?.id
    }

    if (!termId) {
      return NextResponse.json(
        { success: false, error: 'No active academic term found' },
        { status: 400 }
      )
    }

    // Get teacher's teaching schedule
    const { data: schedules, error: scheduleError } = await supabase
      .from('teaching_schedules')
      .select(`
        *,
        class:classes!class_id(
          id,
          name,
          code,
          capacity,
          academic_year:academic_years!academic_year_id(id, name),
          grade_level:grade_levels!grade_level_id(id, name, level)
        ),
        subject:subjects!subject_id(id, name, code),
        time_slot:time_slots!time_slot_id(id, name, start_time, end_time, order_index)
      `)
      .eq('teacher_id', user.id)
      .eq('academic_term_id', termId)
      .eq('is_active', true)
      .order('day_of_week')
      .order('time_slot.order_index')

    if (scheduleError) {
      console.error('Error fetching teaching schedule:', scheduleError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch teaching schedule' },
        { status: 500 }
      )
    }

    // Get time slots for reference
    const { data: timeSlots } = await supabase
      .from('time_slots')
      .select('*')
      .order('order_index')

    // Get academic term info
    const { data: termInfo } = await supabase
      .from('academic_terms')
      .select(`
        *,
        academic_year:academic_years!academic_year_id(id, name)
      `)
      .eq('id', termId)
      .single()

    // Group schedules by day of week
    const schedulesByDay: { [key: string]: any[] } = {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: []
    }

    schedules?.forEach((schedule: any) => {
      if (schedulesByDay[schedule.day_of_week]) {
        schedulesByDay[schedule.day_of_week].push(schedule)
      }
    })

    // Get teacher's homeroom classes if applicable
    const { data: homeroomClasses } = await supabase
      .from('homeroom_assignments')
      .select(`
        *,
        class:classes!class_id(
          id,
          name,
          code,
          capacity,
          academic_year:academic_years!academic_year_id(id, name),
          grade_level:grade_levels!grade_level_id(id, name, level)
        )
      `)
      .eq('teacher_id', user.id)
      .eq('is_active', true)

    return NextResponse.json({
      success: true,
      data: {
        schedules: schedulesByDay,
        raw_schedules: schedules,
        time_slots: timeSlots,
        academic_term: termInfo,
        homeroom_classes: homeroomClasses,
        teacher_info: {
          id: user.id,
          role: userData.role
        }
      }
    })
  } catch (error) {
    console.error('Teacher schedule GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 