import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('event_id')
    const requestingTeacherId = searchParams.get('requesting_teacher_id')

    if (!eventId || !requestingTeacherId) {
      return NextResponse.json({ success: false, error: 'Event ID and requesting teacher ID are required' }, { status: 400 })
    }

    // Verify user can access this data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'admin' && user.id !== requestingTeacherId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Get the timetable event details
    const { data: timetableEvent, error: eventError } = await supabase
      .from('timetable_events')
      .select('subject_id, teacher_id')
      .eq('id', eventId)
      .single()

    if (eventError || !timetableEvent) {
      return NextResponse.json({ success: false, error: 'Timetable event not found' }, { status: 404 })
    }

    // Verify the requesting teacher owns this event
    if (timetableEvent.teacher_id !== requestingTeacherId) {
      return NextResponse.json({ success: false, error: 'You can only request exchanges for your own teaching slots' }, { status: 403 })
    }

    // Get teachers who have specialization for this subject (excluding the requesting teacher)
    const { data: eligibleTeachers, error: teacherError } = await supabase
      .from('teacher_specializations')
      .select(`
        teacher_id,
        profiles!inner(id, full_name, email, employee_id)
      `)
      .contains('subjects', [timetableEvent.subject_id])
      .neq('teacher_id', requestingTeacherId)

    if (teacherError) {
      console.error('Error fetching eligible teachers:', teacherError)
      return NextResponse.json({ success: false, error: 'Failed to fetch eligible teachers' }, { status: 500 })
    }

    if (!eligibleTeachers || eligibleTeachers.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Transform data to match expected interface
    const transformedData = eligibleTeachers
      .filter((teacher: Record<string, unknown>) => teacher.profiles) // Filter out null profiles
      .map((teacher: Record<string, unknown>) => {
        const profile = Array.isArray(teacher.profiles) ? teacher.profiles[0] : teacher.profiles as Record<string, unknown>
        return {
          teacher_id: teacher.teacher_id,
          teacher_name: profile.full_name || 'Unknown',
          teacher_email: profile.email || 'Unknown',
          employee_id: profile.employee_id || ''
        }
      })

    return NextResponse.json({ success: true, data: transformedData })
  } catch (error) {
    console.error('Error in eligible teachers API:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
