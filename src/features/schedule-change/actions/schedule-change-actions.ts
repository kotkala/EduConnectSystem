'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  scheduleChangeRequestSchema,
  adminResponseSchema,
  type ScheduleChangeRequestFormData,
  type AdminResponseFormData,
  type ScheduleChangeRequest
} from '../types/schedule-change-types'

/**
 * Create a new schedule change request
 */
export async function createScheduleChangeRequestAction(data: ScheduleChangeRequestFormData) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Không thể xác thực người dùng')
    }

    // Validate user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      throw new Error('Chỉ giáo viên mới có thể tạo đơn thay đổi lịch dạy')
    }

    // Validate input data
    const validatedData = scheduleChangeRequestSchema.parse(data)

    // Check if teacher teaches this subject in this class (more flexible check)
    const { data: timetableCheck } = await supabase
      .from('timetable_events')
      .select('id')
      .eq('teacher_id', user.id)
      .eq('subject_id', validatedData.subject_id)
      .eq('class_id', validatedData.class_id)
      .limit(1)

    // If no direct timetable match, check teacher assignments
    if (!timetableCheck || timetableCheck.length === 0) {
      const { data: assignmentCheck } = await supabase
        .from('teacher_assignments')
        .select('id')
        .eq('teacher_id', user.id)
        .eq('subject_id', validatedData.subject_id)
        .eq('class_id', validatedData.class_id)
        .eq('is_active', true)
        .limit(1)

      if (!assignmentCheck || assignmentCheck.length === 0) {
        throw new Error('Bạn không có quyền thay đổi lịch dạy cho môn học và lớp này')
      }
    }

    // Create the request
    const { data: request, error } = await supabase
      .from('schedule_change_requests')
      .insert({
        teacher_id: user.id,
        ...validatedData
      })
      .select(`
        id,
        teacher_id,
        academic_year_id,
        semester_id,
        week_number,
        change_date,
        subject_id,
        class_id,
        original_period,
        reason,
        status,
        created_at,
        teacher:profiles!teacher_id(id, full_name, email),
        academic_year:academic_years!academic_year_id(id, name),
        semester:semesters!semester_id(id, name),
        subject:subjects!subject_id(id, name_vietnamese, code),
        class:classes!class_id(id, name)
      `)
      .single()

    if (error) {
      throw new Error('Không thể tạo đơn thay đổi lịch dạy')
    }

    revalidatePath('/dashboard/teacher/schedule-change')
    revalidatePath('/dashboard/admin/schedule-change')

    return {
      success: true,
      data: request as unknown as ScheduleChangeRequest
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }
  }
}

/**
 * Get schedule change requests for teacher
 */
export async function getTeacherScheduleChangeRequestsAction() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Không thể xác thực người dùng')
    }

    const { data: requests, error } = await supabase
      .from('schedule_change_requests')
      .select(`
        id,
        teacher_id,
        academic_year_id,
        semester_id,
        week_number,
        change_date,
        subject_id,
        class_id,
        original_period,
        reason,
        status,
        admin_response,
        responded_at,
        created_at,
        updated_at,
        teacher:profiles!teacher_id(id, full_name, email),
        academic_year:academic_years!academic_year_id(id, name),
        semester:semesters!semester_id(id, name),
        subject:subjects!subject_id(id, name_vietnamese, code),
        class:classes!class_id(id, name),
        admin:profiles!admin_id(id, full_name)
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Không thể lấy danh sách đơn thay đổi lịch dạy')
    }

    return {
      success: true,
      data: (requests || []) as unknown as ScheduleChangeRequest[]
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }
  }
}

/**
 * Get all schedule change requests for admin
 */
export async function getAdminScheduleChangeRequestsAction() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Không thể xác thực người dùng')
    }

    // Validate user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Chỉ admin mới có thể xem tất cả đơn thay đổi lịch dạy')
    }

    const { data: requests, error } = await supabase
      .from('schedule_change_requests')
      .select(`
        id,
        teacher_id,
        academic_year_id,
        semester_id,
        week_number,
        change_date,
        subject_id,
        class_id,
        original_period,
        reason,
        status,
        admin_response,
        responded_at,
        created_at,
        updated_at,
        teacher:profiles!teacher_id(id, full_name, email),
        academic_year:academic_years!academic_year_id(id, name),
        semester:semesters!semester_id(id, name),
        subject:subjects!subject_id(id, name_vietnamese, code),
        class:classes!class_id(id, name),
        admin:profiles!admin_id(id, full_name)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Không thể lấy danh sách đơn thay đổi lịch dạy')
    }

    return {
      success: true,
      data: (requests || []) as unknown as ScheduleChangeRequest[]
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }
  }
}

/**
 * Admin respond to schedule change request
 */
export async function adminRespondToScheduleChangeRequestAction(data: AdminResponseFormData) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new Error('Không thể xác thực người dùng')
    }

    // Validate user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      throw new Error('Chỉ admin mới có thể phản hồi đơn thay đổi lịch dạy')
    }

    const validatedData = adminResponseSchema.parse(data)

    const { data: request, error } = await supabase
      .from('schedule_change_requests')
      .update({
        status: validatedData.status,
        admin_response: validatedData.admin_response,
        admin_id: user.id,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.request_id)
      .eq('status', 'pending') // Only update pending requests
      .select()
      .single()

    if (error) {
      throw new Error('Không thể cập nhật đơn thay đổi lịch dạy')
    }

    if (!request) {
      throw new Error('Đơn thay đổi lịch dạy không tồn tại hoặc đã được xử lý')
    }

    revalidatePath('/dashboard/teacher/schedule-change')
    revalidatePath('/dashboard/admin/schedule-change')

    return {
      success: true,
      data: request
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }
  }
}
