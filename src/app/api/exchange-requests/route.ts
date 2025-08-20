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
    const status = searchParams.get('status')
    const teacherId = searchParams.get('teacher_id')
  const limitParam = searchParams.get('limit')
  const offsetParam = searchParams.get('offset')

    // If this is a count-only request, short-circuit and return counts
    const isCountOnly = searchParams.get('count') === 'true'

    if (isCountOnly) {
      // total count (optionally filtered by teacher)
      let totalQuery = supabase
        .from('schedule_exchange_requests')
        .select('*', { count: 'exact', head: true })
      if (teacherId) {
        totalQuery = totalQuery.or(`requester_teacher_id.eq.${teacherId},target_teacher_id.eq.${teacherId}`)
      }
      const { count, error } = await totalQuery
      if (error) {
        console.error('Error counting exchange requests:', error)
        return NextResponse.json({ success: false, error: 'Failed to count exchange requests' }, { status: 500 })
      }
      // Count pending as well
      let pendingQuery = supabase
        .from('schedule_exchange_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      if (teacherId) {
        pendingQuery = pendingQuery.or(`requester_teacher_id.eq.${teacherId},target_teacher_id.eq.${teacherId}`)
      }
      const { count: pending, error: pendingError } = await pendingQuery
      if (pendingError) {
        console.error('Error counting pending exchange requests:', pendingError)
      }
      return NextResponse.json({ success: true, data: { total: count ?? 0, pending: pending ?? 0 } })
    }

  // Full detail path: fetch only necessary columns and paginate by default
  let query = supabase
    .from('schedule_exchange_requests')
    .select(`
        id,
        timetable_event_id,
        status,
        created_at,
        requester_teacher_id,
        target_teacher_id,
        admin_response,
        approved_at,
        approved_by,
        exchange_date,
        reason,
        requester:profiles!requester_teacher_id(full_name, email),
        target:profiles!target_teacher_id(full_name, email),
        approved_by_profile:profiles!approved_by(full_name)
      `)

    if (status) {
      query = query.eq('status', status)
    }
    if (teacherId) {
      query = query.or(`requester_teacher_id.eq.${teacherId},target_teacher_id.eq.${teacherId}`)
    }

  // Pagination: default 50 rows if not specified
  const limit = Math.min(Math.max(parseInt(limitParam || '50', 10) || 50, 1), 200)
  const offset = Math.max(parseInt(offsetParam || '0', 10) || 0, 0)

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching exchange requests:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch exchange requests' }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Get timetable event details
    const timetableEventIds = data.map((req: Record<string, unknown>) => req.timetable_event_id)
    const { data: timetableEvents } = await supabase
      .from('timetable_events')
      .select(`
        id,
        start_time,
        end_time,
        day_of_week,
        week_number,
        class_id,
        subject_id,
        classroom_id
      `)
      .in('id', timetableEventIds)

    // Get related data
    const classIds = timetableEvents?.map((event: Record<string, unknown>) => event.class_id).filter(Boolean) || []
    const subjectIds = timetableEvents?.map((event: Record<string, unknown>) => event.subject_id).filter(Boolean) || []
    const classroomIds = timetableEvents?.map((event: Record<string, unknown>) => event.classroom_id).filter(Boolean) || []

    const [classesData, subjectsData, classroomsData] = await Promise.all([
      classIds.length > 0 ? supabase.from('classes').select('id, name').in('id', classIds) : { data: [] },
      subjectIds.length > 0 ? supabase.from('subjects').select('id, code, name_vietnamese, name_english').in('id', subjectIds) : { data: [] },
      classroomIds.length > 0 ? supabase.from('classrooms').select('id, name').in('id', classroomIds) : { data: [] }
    ])

    // Create lookup maps
    const classMap = new Map((classesData.data || []).map((c: Record<string, unknown>) => [c.id, c]))
    const subjectMap = new Map((subjectsData.data || []).map((s: Record<string, unknown>) => [s.id, s]))
    const classroomMap = new Map((classroomsData.data || []).map((cr: Record<string, unknown>) => [cr.id, cr]))

    // Create timetable event map
    const timetableEventMap = new Map()
    timetableEvents?.forEach((event: Record<string, unknown>) => {
      const classInfo = classMap.get(event.class_id) as Record<string, unknown>
      const subjectInfo = subjectMap.get(event.subject_id) as Record<string, unknown>
      const classroomInfo = classroomMap.get(event.classroom_id) as Record<string, unknown>

      timetableEventMap.set(event.id, {
        ...event,
        class_name: classInfo?.name || 'Unknown',
        subject_code: subjectInfo?.code || 'Unknown',
        subject_name: subjectInfo?.name_vietnamese || subjectInfo?.name_english || 'Unknown',
        classroom_name: classroomInfo?.name || 'Unknown'
      })
    })

    // Transform data
    const transformedData = data.map((request: Record<string, unknown>) => {
      const timetableEvent = timetableEventMap.get(request.timetable_event_id) as Record<string, unknown>
      const requester = request.requester as Record<string, unknown>
      const target = request.target as Record<string, unknown>
      const approvedBy = request.approved_by_profile as Record<string, unknown>

      return {
        ...request,
        requester_name: requester?.full_name || 'Unknown',
        requester_email: requester?.email || 'Unknown',
        target_name: target?.full_name || 'Unknown',
        target_email: target?.email || 'Unknown',
        class_name: timetableEvent?.class_name || 'Unknown',
        subject_code: timetableEvent?.subject_code || 'Unknown',
        subject_name: timetableEvent?.subject_name || 'Unknown',
        start_time: timetableEvent?.start_time || 'Unknown',
        end_time: timetableEvent?.end_time || 'Unknown',
        day_of_week: timetableEvent?.day_of_week || 0,
        week_number: timetableEvent?.week_number || 0,
        classroom_name: timetableEvent?.classroom_name || 'Unknown',
        approved_by_name: approvedBy?.full_name || null
      }
    })

    return NextResponse.json({ success: true, data: transformedData })
  } catch (error) {
    console.error('Error in exchange requests API:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
