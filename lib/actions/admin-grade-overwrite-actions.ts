"use server"

import { createClient } from "@/utils/supabase/server"
import { checkAdminPermissions } from "@/lib/utils/permission-utils"

export interface GradeOverwriteRequest {
  id: string
  grade_id: string
  old_value: number
  new_value: number
  change_reason: string
  changed_by: string
  changed_at: string
  status: 'pending' | 'approved' | 'rejected'
  admin_reason?: string
  processed_at?: string
  processed_by?: string
  // Joined data
  student_name: string
  subject_name: string
  class_name: string
  teacher_name: string
  component_type: string
}

export interface GradeOverwriteActionResult {
  success: boolean
  message: string
  data?: GradeOverwriteRequest[]
}

export async function getGradeOverwriteRequestsAction(): Promise<GradeOverwriteActionResult> {
  try {
    const supabase = await createClient()

    // Check admin permissions
    try {
      await checkAdminPermissions()
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Không có quyền truy cập' }
    }

    // Get all grade overwrite requests that need approval
    const { data: requests, error } = await supabase
      .from('grade_audit_logs')
      .select(`
        id,
        grade_id,
        old_value,
        new_value,
        change_reason,
        changed_by,
        changed_at,
        status,
        admin_reason,
        processed_at,
        processed_by,
        student_detailed_grades!inner(
          student_id,
          subject_id,
          class_id,
          component_type,
          profiles!student_detailed_grades_student_id_fkey(full_name),
          subjects!student_detailed_grades_subject_id_fkey(name_vietnamese),
          classes!student_detailed_grades_class_id_fkey(name)
        ),
        profiles!grade_audit_logs_changed_by_fkey(full_name)
      `)
      .or('status.is.null,status.eq.pending')
      .order('changed_at', { ascending: false })

    if (error) {
      console.error('Error fetching overwrite requests:', error)
      return { success: false, message: 'Không thể tải danh sách yêu cầu ghi đè' }
    }

    // Transform the data to match our interface
    const transformedRequests: GradeOverwriteRequest[] = []

    if (requests) {
      for (const request of requests) {
        const gradeData = Array.isArray(request.student_detailed_grades)
          ? request.student_detailed_grades[0]
          : request.student_detailed_grades

        const teacherData = Array.isArray(request.profiles)
          ? request.profiles[0]
          : request.profiles

        transformedRequests.push({
          id: request.id,
          grade_id: request.grade_id,
          old_value: request.old_value,
          new_value: request.new_value,
          change_reason: request.change_reason,
          changed_by: request.changed_by,
          changed_at: request.changed_at,
          status: (request.status as 'pending' | 'approved' | 'rejected') || 'pending',
          admin_reason: request.admin_reason,
          processed_at: request.processed_at,
          processed_by: request.processed_by,
          // Extract joined data safely
          student_name: gradeData?.profiles?.[0]?.full_name || 'Unknown',
          subject_name: gradeData?.subjects?.[0]?.name_vietnamese || 'Unknown',
          class_name: gradeData?.classes?.[0]?.name || 'Unknown',
          teacher_name: teacherData?.full_name || 'Unknown',
          component_type: gradeData?.component_type || 'unknown'
        })
      }
    }

    return {
      success: true,
      message: 'Tải danh sách yêu cầu thành công',
      data: transformedRequests
    }
  } catch (error) {
    console.error('Error in getGradeOverwriteRequestsAction:', error)
    return { success: false, message: 'Có lỗi xảy ra khi tải danh sách yêu cầu' }
  }
}

export async function approveGradeOverwriteAction(
  requestId: string,
  adminReason?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()

    // Check admin permissions
    try {
      await checkAdminPermissions()
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Không có quyền truy cập' }
    }

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, message: 'Không thể xác thực người dùng' }
    }

    // Update the audit log with approval
    const { error: updateError } = await supabase
      .from('grade_audit_logs')
      .update({
        status: 'approved',
        admin_reason: adminReason || 'Đã phê duyệt',
        processed_at: new Date().toISOString(),
        processed_by: user.user.id
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error approving overwrite request:', updateError)
      return { success: false, message: 'Không thể phê duyệt yêu cầu' }
    }

    return {
      success: true,
      message: 'Đã phê duyệt yêu cầu ghi đè điểm thành công'
    }
  } catch (error) {
    console.error('Error in approveGradeOverwriteAction:', error)
    return { success: false, message: 'Có lỗi xảy ra khi phê duyệt yêu cầu' }
  }
}

export async function rejectGradeOverwriteAction(
  requestId: string,
  adminReason: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = await createClient()

    // Check admin permissions
    try {
      await checkAdminPermissions()
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Không có quyền truy cập' }
    }

    const { data: user } = await supabase.auth.getUser()
    if (!user.user) {
      return { success: false, message: 'Không thể xác thực người dùng' }
    }

    if (!adminReason.trim()) {
      return { success: false, message: 'Vui lòng nhập lý do từ chối' }
    }

    // Get the original grade data to revert the change
    const { data: auditLog, error: auditError } = await supabase
      .from('grade_audit_logs')
      .select('grade_id, old_value')
      .eq('id', requestId)
      .single()

    if (auditError || !auditLog) {
      console.error('Error fetching audit log:', auditError)
      return { success: false, message: 'Không thể tìm thấy yêu cầu ghi đè' }
    }

    // Start transaction to revert grade and update audit log
    const { error: revertError } = await supabase
      .from('student_detailed_grades')
      .update({
        grade_value: auditLog.old_value,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditLog.grade_id)

    if (revertError) {
      console.error('Error reverting grade:', revertError)
      return { success: false, message: 'Không thể hoàn tác điểm số' }
    }

    // Update the audit log with rejection
    const { error: updateError } = await supabase
      .from('grade_audit_logs')
      .update({
        status: 'rejected',
        admin_reason: adminReason,
        processed_at: new Date().toISOString(),
        processed_by: user.user.id
      })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating audit log:', updateError)
      return { success: false, message: 'Không thể cập nhật trạng thái yêu cầu' }
    }

    return {
      success: true,
      message: 'Đã từ chối yêu cầu và hoàn tác điểm số thành công'
    }
  } catch (error) {
    console.error('Error in rejectGradeOverwriteAction:', error)
    return { success: false, message: 'Có lỗi xảy ra khi từ chối yêu cầu' }
  }
}
