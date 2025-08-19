"use server"

import { createClient } from "@/shared/utils/supabase/server"
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
    const { data: auditLogs, error } = await supabase
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
        student_detailed_grades!grade_audit_logs_grade_id_fkey(
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

    // Get teacher assignments for all classes and subjects in the audit logs
    const classSubjectPairs = auditLogs?.map(log => {
      const gradeData = Array.isArray(log.student_detailed_grades)
        ? log.student_detailed_grades[0]
        : log.student_detailed_grades
      return {
        class_id: gradeData?.class_id,
        subject_id: gradeData?.subject_id
      }
    }).filter(pair => pair.class_id && pair.subject_id) || []

    const { data: teacherAssignments, error: teacherError } = await supabase
      .from('teacher_class_assignments')
      .select(`
        class_id,
        subject_id,
        teacher_id,
        profiles!teacher_class_assignments_teacher_id_fkey(full_name)
      `)
      .in('class_id', [...new Set(classSubjectPairs.map(p => p.class_id))])
      .in('subject_id', [...new Set(classSubjectPairs.map(p => p.subject_id))])
      .eq('is_active', true)

    if (teacherError) {
      console.error('Error fetching teacher assignments:', teacherError)
    }

    // Create teacher lookup map
    const teacherMap = new Map<string, string>()
    teacherAssignments?.forEach(assignment => {
      const key = `${assignment.class_id}_${assignment.subject_id}`
      const teacherProfile = Array.isArray(assignment.profiles)
        ? assignment.profiles[0]
        : assignment.profiles
      const teacherName = teacherProfile?.full_name || 'Unknown'
      teacherMap.set(key, teacherName)
    })

    // Transform the data to match our interface
    const transformedRequests: GradeOverwriteRequest[] = []

    if (auditLogs) {
      for (const request of auditLogs) {
        const gradeData = Array.isArray(request.student_detailed_grades)
          ? request.student_detailed_grades[0]
          : request.student_detailed_grades

        // Get teacher name from the teacher map
        const teacherKey = `${gradeData?.class_id}_${gradeData?.subject_id}`
        const teacherName = teacherMap.get(teacherKey) || 'Unknown'

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
          // Extract joined data safely - handle both array and object cases
          student_name: (() => {
            const profiles = gradeData?.profiles
            if (Array.isArray(profiles)) {
              return profiles[0]?.full_name || 'Unknown'
            }
            return (profiles as { full_name: string })?.full_name || 'Unknown'
          })(),
          subject_name: (() => {
            const subjects = gradeData?.subjects
            if (Array.isArray(subjects)) {
              return subjects[0]?.name_vietnamese || 'Unknown'
            }
            return (subjects as { name_vietnamese: string })?.name_vietnamese || 'Unknown'
          })(),
          class_name: (() => {
            const classes = gradeData?.classes
            if (Array.isArray(classes)) {
              return classes[0]?.name || 'Unknown'
            }
            return (classes as { name: string })?.name || 'Unknown'
          })(),
          teacher_name: teacherName,
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

    // Get the audit log details to apply the grade change
    const { data: auditLog, error: auditError } = await supabase
      .from('grade_audit_logs')
      .select('grade_id, new_value')
      .eq('id', requestId)
      .single()

    if (auditError || !auditLog) {
      console.error('Error fetching audit log:', auditError)
      return { success: false, message: 'Không thể tìm thấy yêu cầu ghi đè' }
    }

    // Apply the grade change to the actual grade record
    const { error: gradeUpdateError } = await supabase
      .from('student_detailed_grades')
      .update({
        grade_value: auditLog.new_value,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditLog.grade_id)

    if (gradeUpdateError) {
      console.error('Error updating grade:', gradeUpdateError)
      return { success: false, message: 'Không thể cập nhật điểm số' }
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
