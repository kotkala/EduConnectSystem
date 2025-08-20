import { createClient } from '@/shared/utils/supabase/server'
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

    // Get teachers who teach the same subject (excluding the requesting teacher)
    const { data: eligibleAssignments, error: assignmentError } = await supabase
      .from('teacher_class_assignments')
      .select(`
        teacher_id,
        profiles!teacher_class_assignments_teacher_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('subject_id', timetableEvent.subject_id)
      .neq('teacher_id', requestingTeacherId)

    if (assignmentError) {
      console.error('Error fetching eligible teachers:', assignmentError)
      return NextResponse.json({ success: false, error: 'Failed to fetch eligible teachers' }, { status: 500 })
    }

    if (!eligibleAssignments || eligibleAssignments.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Transform data to match expected interface
    const transformedData = eligibleAssignments
      .filter((assignment: Record<string, unknown>) => assignment.profiles) // Filter out null profiles
      .map((assignment: Record<string, unknown>) => {
        const profile = assignment.profiles as Record<string, unknown>
        return {
          teacher_id: assignment.teacher_id,
          teacher_name: profile.full_name || 'Unknown',
          teacher_email: profile.email || 'Unknown'
        }
      })

    return NextResponse.json({ success: true, data: transformedData })
  } catch (error) {
    console.error('Error in eligible teachers API:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
