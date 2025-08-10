'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const scheduleExchangeRequestSchema = z.object({
  target_teacher_id: z.string().uuid('Vui lòng chọn giáo viên hợp lệ'),
  timetable_event_id: z.string().uuid('Vui lòng chọn sự kiện thời khóa biểu hợp lệ'),
  exchange_date: z.string().refine((date) => {
    const exchangeDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return exchangeDate >= today
  }, 'Ngày đổi lịch phải là hôm nay hoặc tương lai'),
  reason: z.string()
    .min(10, 'Lý do phải có ít nhất 10 ký tự')
    .max(500, 'Lý do phải ít hơn 500 ký tự')
})

const approveRejectRequestSchema = z.object({
  request_id: z.string().uuid('ID yêu cầu không hợp lệ'),
  status: z.enum(['approved', 'rejected']),
  admin_response: z.string().max(500, 'Phản hồi phải ít hơn 500 ký tự').optional()
})

// Types
export type ScheduleExchangeRequestFormData = z.infer<typeof scheduleExchangeRequestSchema>
export type ApproveRejectRequestFormData = z.infer<typeof approveRejectRequestSchema>

export interface ScheduleExchangeRequest {
  id: string
  requester_teacher_id: string
  target_teacher_id: string
  timetable_event_id: string
  exchange_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_response: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface ScheduleExchangeRequestDetailed extends ScheduleExchangeRequest {
  requester_name: string
  requester_email: string
  target_name: string
  target_email: string
  class_name: string
  subject_code: string
  subject_name: string
  start_time: string
  end_time: string
  day_of_week: number
  week_number: number
  classroom_name: string
  approved_by_name: string | null
}

export interface EligibleTeacher {
  teacher_id: string
  teacher_name: string
  teacher_email: string
}

// Get teacher's own timetable events for exchange requests
export async function getTeacherTimetableEventsAction(teacherId: string, semesterId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('timetable_events')
      .select(`
        id,
        day_of_week,
        start_time,
        end_time,
        week_number,
        semester_id,
        classes!class_id(name),
        subjects!subject_id(code, name),
        classrooms!classroom_id(name)
      `)
      .eq('teacher_id', teacherId)
      .eq('semester_id', semesterId)
      .order('day_of_week')
      .order('start_time')

    if (error) {
      console.error('Error fetching teacher timetable events:', error)
      return { success: false, error: 'Failed to fetch timetable events' }
    }

    // Transform the data to match the expected interface
    const transformedData = data?.map((event: Record<string, unknown>) => ({
      ...event,
      class_name: (event.classes as Record<string, unknown>)?.name || 'Unknown',
      subject_code: (event.subjects as Record<string, unknown>)?.code || 'Unknown',
      subject_name: (event.subjects as Record<string, unknown>)?.name || 'Unknown',
      classroom_name: (event.classrooms as Record<string, unknown>)?.name || 'Unknown'
    })) || []

    return { success: true, data: transformedData }
  } catch (error) {
    console.error('Error in getTeacherTimetableEventsAction:', error)
    return { success: false, error: 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Get eligible teachers for exchange (same subject)
export async function getEligibleTeachersForExchangeAction(
  timetableEventId: string,
  requestingTeacherId: string
) {
  try {
    const supabase = await createClient()

    // First get the subject of the timetable event
    const { data: eventData, error: eventError } = await supabase
      .from('timetable_events')
      .select('subject_id')
      .eq('id', timetableEventId)
      .single()

    if (eventError || !eventData) {
      return { success: false, error: 'Timetable event not found' }
    }

    // Get teachers who teach the same subject (excluding the requesting teacher)
    const { data, error } = await supabase
      .from('teachers_for_subjects')
      .select(`
        teacher_id,
        teacher_name,
        teacher_email
      `)
      .eq('subject_id', eventData.subject_id)
      .neq('teacher_id', requestingTeacherId)

    if (error) {
      console.error('Error fetching eligible teachers:', error)
      return { success: false, error: 'Failed to fetch eligible teachers' }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getEligibleTeachersForExchangeAction:', error)
    return { success: false, error: 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Create a new schedule exchange request
export async function createScheduleExchangeRequestAction(formData: ScheduleExchangeRequestFormData) {
  try {
    const validatedData = scheduleExchangeRequestSchema.parse(formData)
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if user is a teacher
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return { success: false, error: 'Only teachers can create exchange requests' }
    }

    // Check for existing pending request for the same event and date
    const { data: existingRequest, error: existingError } = await supabase
      .from('schedule_exchange_requests')
      .select('id')
      .eq('timetable_event_id', validatedData.timetable_event_id)
      .eq('exchange_date', validatedData.exchange_date)
      .eq('status', 'pending')
      .maybeSingle()

    if (existingError) {
      console.error('Error checking existing requests:', existingError)
      return { success: false, error: 'Failed to check existing requests' }
    }

    if (existingRequest) {
      return { success: false, error: 'A pending exchange request already exists for this slot and date' }
    }

    // Create the exchange request
    const { data, error } = await supabase
      .from('schedule_exchange_requests')
      .insert({
        requester_teacher_id: user.id,
        target_teacher_id: validatedData.target_teacher_id,
        timetable_event_id: validatedData.timetable_event_id,
        exchange_date: validatedData.exchange_date,
        reason: validatedData.reason
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating exchange request:', error)
      return { success: false, error: 'Không thể tạo yêu cầu đổi lịch' }
    }

    revalidatePath('/dashboard/teacher')
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Error in createScheduleExchangeRequestAction:', error)
    return { success: false, error: 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Get schedule exchange requests (for teachers and admins)
export async function getScheduleExchangeRequestsAction(filters?: {
  status?: 'pending' | 'approved' | 'rejected'
  teacher_id?: string
}) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Simple query first to test
    let query = supabase
      .from('schedule_exchange_requests')
      .select('*')

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    if (filters?.teacher_id) {
      query = query.or(`requester_teacher_id.eq.${filters.teacher_id},target_teacher_id.eq.${filters.teacher_id}`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching exchange requests:', error)
      return { success: false, error: 'Không thể lấy danh sách yêu cầu đổi lịch' }
    }

    // Return basic data with mock values for now
    const transformedData = (data || []).map((request: Record<string, unknown>) => ({
      ...request,
      requester_name: 'Test Teacher',
      requester_email: 'test@example.com',
      target_name: 'Target Teacher',
      target_email: 'target@example.com',
      class_name: 'Test Class',
      subject_code: 'TEST',
      subject_name: 'Test Subject',
      start_time: '08:00',
      end_time: '09:00',
      day_of_week: 1,
      week_number: 1,
      classroom_name: 'Test Room',
      approved_by_name: null
    }))

    return { success: true, data: transformedData }
  } catch (error) {
    console.error('Error in getScheduleExchangeRequestsAction:', error)
    return { success: false, error: 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Approve or reject a schedule exchange request (admin only)
export async function approveRejectScheduleExchangeRequestAction(formData: ApproveRejectRequestFormData) {
  try {
    const validatedData = approveRejectRequestSchema.parse(formData)
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return { success: false, error: 'Only admins can approve/reject exchange requests' }
    }

    // Get the request details
    const { data: request, error: requestError } = await supabase
      .from('schedule_exchange_requests')
      .select(`
        id,
        timetable_event_id,
        target_teacher_id,
        exchange_date,
        status
      `)
      .eq('id', validatedData.request_id)
      .single()

    if (requestError || !request) {
      return { success: false, error: 'Không tìm thấy yêu cầu đổi lịch' }
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'Yêu cầu đã được xử lý trước đó' }
    }

    // Update the request status
    const { error: updateError } = await supabase
      .from('schedule_exchange_requests')
      .update({
        status: validatedData.status,
        admin_response: validatedData.admin_response || null,
        approved_by: user.id,
        approved_at: new Date().toISOString()
      })
      .eq('id', validatedData.request_id)

    if (updateError) {
      console.error('Error updating exchange request:', updateError)
      return { success: false, error: 'Failed to update exchange request' }
    }

    // If approved, update the timetable event with substitute teacher
    if (validatedData.status === 'approved') {
      const { error: timetableError } = await supabase
        .from('timetable_events')
        .update({
          substitute_teacher_id: request.target_teacher_id,
          substitute_date: request.exchange_date,
          exchange_request_id: request.id
        })
        .eq('id', request.timetable_event_id)

      if (timetableError) {
        console.error('Error updating timetable event:', timetableError)
        // Rollback the request status update
        await supabase
          .from('schedule_exchange_requests')
          .update({
            status: 'pending',
            admin_response: null,
            approved_by: null,
            approved_at: null
          })
          .eq('id', validatedData.request_id)

        return { success: false, error: 'Failed to update timetable. Request status reverted.' }
      }
    }

    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/teacher')
    return { success: true, message: `Yêu cầu đã được ${validatedData.status === 'approved' ? 'phê duyệt' : 'từ chối'} thành công` }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message }
    }
    console.error('Error in approveRejectScheduleExchangeRequestAction:', error)
    return { success: false, error: 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Delete a pending schedule exchange request (teacher only)
export async function deleteScheduleExchangeRequestAction(requestId: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Delete the request (RLS will ensure only the requester can delete their pending requests)
    const { error } = await supabase
      .from('schedule_exchange_requests')
      .delete()
      .eq('id', requestId)
      .eq('requester_teacher_id', user.id)
      .eq('status', 'pending')

    if (error) {
      console.error('Error deleting exchange request:', error)
      return { success: false, error: 'Failed to delete exchange request' }
    }

    revalidatePath('/dashboard/teacher')
    return { success: true, message: 'Xóa yêu cầu thành công' }
  } catch (error) {
    console.error('Error in deleteScheduleExchangeRequestAction:', error)
    return { success: false, error: 'Đã xảy ra lỗi không mong muốn' }
  }
}
