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
    const teacherId = searchParams.get('teacher_id')
    const semesterId = searchParams.get('semester_id')

    if (!teacherId || !semesterId) {
      return NextResponse.json({ success: false, error: 'Teacher ID and Semester ID are required' }, { status: 400 })
    }

    // Verify user can access this teacher's data (either the teacher themselves or an admin)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'admin' && user.id !== teacherId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }

    // Get timetable events
    const { data: timetableEvents, error } = await supabase
      .from('timetable_events')
      .select(`
        id,
        day_of_week,
        start_time,
        end_time,
        week_number,
        semester_id,
        class_id,
        subject_id,
        classroom_id
      `)
      .eq('teacher_id', teacherId)
      .eq('semester_id', semesterId)

    if (error) {
      console.error('Error fetching teacher timetable events:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch timetable events' }, { status: 500 })
    }

    if (!timetableEvents || timetableEvents.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get related data
    const classIds = timetableEvents.map((event: Record<string, unknown>) => event.class_id).filter(Boolean)
    const subjectIds = timetableEvents.map((event: Record<string, unknown>) => event.subject_id).filter(Boolean)
    const classroomIds = timetableEvents.map((event: Record<string, unknown>) => event.classroom_id).filter(Boolean)

    const [classesData, subjectsData, classroomsData] = await Promise.all([
      classIds.length > 0 ? supabase.from('classes').select('id, name').in('id', classIds) : { data: [] },
      subjectIds.length > 0 ? supabase.from('subjects').select('id, code, name_vietnamese, name_english').in('id', subjectIds) : { data: [] },
      classroomIds.length > 0 ? supabase.from('classrooms').select('id, name').in('id', classroomIds) : { data: [] }
    ])

    // Create lookup maps
    const classMap = new Map((classesData.data || []).map((c: Record<string, unknown>) => [c.id, c]))
    const subjectMap = new Map((subjectsData.data || []).map((s: Record<string, unknown>) => [s.id, s]))
    const classroomMap = new Map((classroomsData.data || []).map((cr: Record<string, unknown>) => [cr.id, cr]))

    // Transform data
    const transformedData = timetableEvents.map((event: Record<string, unknown>) => {
      const classInfo = classMap.get(event.class_id) as Record<string, unknown>
      const subjectInfo = subjectMap.get(event.subject_id) as Record<string, unknown>
      const classroomInfo = classroomMap.get(event.classroom_id) as Record<string, unknown>

      return {
        ...event,
        class_name: classInfo?.name || 'Unknown',
        subject_code: subjectInfo?.code || 'Unknown',
        subject_name: subjectInfo?.name_vietnamese || subjectInfo?.name_english || 'Unknown',
        classroom_name: classroomInfo?.name || 'Unknown'
      }
    })

    return NextResponse.json({ success: true, data: transformedData })
  } catch (error) {
    console.error('Error in teacher timetable events API:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
