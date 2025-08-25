"use server"

import { createClient } from "@/lib/supabase/server"
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

    // Get all grade overwrite requests that need approval from unified_audit_logs
    const { data: auditLogs, error } = await supabase
      .from('unified_audit_logs')
      .select(`
        id,
        record_id,
        old_values,
        new_values,
        changes_summary,
        user_id,
        created_at
      `)
      .eq('audit_type', 'grade')
      .eq('table_name', 'student_detailed_grades')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching overwrite requests:', error)
      return { success: false, message: 'Không thể tải danh sách yêu cầu ghi đè' }
    }

    // Filter only pending requests
    const pendingLogs = auditLogs?.filter(log => {
      const oldValues = log.old_values as { status?: string } || {}
      return oldValues.status === 'pending'
    }) || []

    if (pendingLogs.length === 0) {
      return {
        success: true,
        message: 'Không có yêu cầu ghi đè nào cần phê duyệt',
        data: []
      }
    }

    // Get grade records for the audit logs
    const recordIds = pendingLogs.map(log => log.record_id)
    const { data: gradeRecords, error: gradeError } = await supabase
      .from('student_detailed_grades')
      .select(`
        id,
        student_id,
        subject_id,
        class_id,
        component_type
      `)
      .in('id', recordIds)

    // Get user names separately
    const userIds = pendingLogs.map(log => log.user_id).filter(Boolean)
    const { data: userProfiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    // Get student, subject, and class names separately
    const studentIds = gradeRecords?.map(g => g.student_id).filter(Boolean) || []
    const subjectIds = gradeRecords?.map(g => g.subject_id).filter(Boolean) || []
    const classIds = gradeRecords?.map(g => g.class_id).filter(Boolean) || []

    const [studentsData, subjectsData, classesData] = await Promise.all([
      supabase.from('profiles').select('id, full_name').in('id', studentIds),
      supabase.from('subjects').select('id, name_vietnamese').in('id', subjectIds),
      supabase.from('classes').select('id, name').in('id', classIds)
    ])

    if (gradeError) {
      console.error('Error fetching grade records:', gradeError)
      return { success: false, message: 'Không thể tải thông tin điểm' }
    }

    // Create lookup maps
    const gradeRecordMap = new Map(gradeRecords?.map(record => [record.id, record]) || [])
    const userProfileMap = new Map(userProfiles?.map(user => [user.id, user]) || [])
    const studentMap = new Map(studentsData.data?.map(student => [student.id, student]) || [])
    const subjectMap = new Map(subjectsData.data?.map(subject => [subject.id, subject]) || [])
    const classMap = new Map(classesData.data?.map(cls => [cls.id, cls]) || [])

    // Transform the data to match our interface
    const transformedRequests: GradeOverwriteRequest[] = []

    for (const request of pendingLogs) {
      const gradeRecord = gradeRecordMap.get(request.record_id)
      if (!gradeRecord) continue

      const oldValues = request.old_values as { old_value?: number; status?: string } || {}
      const newValues = request.new_values as { new_value?: number } || {}

      // Get related data
      const userProfile = userProfileMap.get(request.user_id)
      const student = studentMap.get(gradeRecord.student_id)
      const subject = subjectMap.get(gradeRecord.subject_id)
      const classInfo = classMap.get(gradeRecord.class_id)

      transformedRequests.push({
        id: request.id,
        grade_id: request.record_id,
        old_value: oldValues.old_value || 0,
        new_value: newValues.new_value || 0,
        change_reason: request.changes_summary || 'Không có lý do',
        changed_by: request.user_id,
        changed_at: request.created_at,
        status: 'pending',
        admin_reason: undefined,
        processed_at: undefined,
        processed_by: undefined,
        // Use lookup data
        student_name: student?.full_name || 'Unknown',
        subject_name: subject?.name_vietnamese || 'Unknown',
        class_name: classInfo?.name || 'Unknown',
        teacher_name: userProfile?.full_name || 'Unknown',
        component_type: gradeRecord.component_type || 'unknown'
      })
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
      .from('unified_audit_logs')
      .select('record_id, new_values')
      .eq('id', requestId)
      .single()

    if (auditError || !auditLog) {
      console.error('Error fetching audit log:', auditError)
      return { success: false, message: 'Không thể tìm thấy yêu cầu ghi đè' }
    }

    const newValues = auditLog.new_values as { new_value?: number } || {}
    const newGradeValue = newValues.new_value

    if (newGradeValue === undefined) {
      return { success: false, message: 'Không thể xác định điểm số mới' }
    }

    // Apply the grade change to the actual grade record
    const { error: gradeUpdateError } = await supabase
      .from('student_detailed_grades')
      .update({
        grade_value: newGradeValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditLog.record_id)

    if (gradeUpdateError) {
      console.error('Error updating grade:', gradeUpdateError)
      return { success: false, message: 'Không thể cập nhật điểm số' }
    }

    // Update the audit log with approval by updating old_values
    const { data: currentLog, error: fetchError } = await supabase
      .from('unified_audit_logs')
      .select('old_values')
      .eq('id', requestId)
      .single()

    if (fetchError || !currentLog) {
      console.error('Error fetching current audit log:', fetchError)
      return { success: false, message: 'Không thể cập nhật trạng thái yêu cầu' }
    }

    const updatedOldValues = {
      ...(currentLog.old_values as object || {}),
      status: 'approved',
      admin_reason: adminReason || 'Đã phê duyệt',
      processed_at: new Date().toISOString(),
      processed_by: user.user.id
    }

    const { error: updateError } = await supabase
      .from('unified_audit_logs')
      .update({
        old_values: updatedOldValues
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
      .from('unified_audit_logs')
      .select('record_id, old_values')
      .eq('id', requestId)
      .single()

    if (auditError || !auditLog) {
      console.error('Error fetching audit log:', auditError)
      return { success: false, message: 'Không thể tìm thấy yêu cầu ghi đè' }
    }

    const oldValues = auditLog.old_values as { old_value?: number } || {}
    const originalGradeValue = oldValues.old_value

    if (originalGradeValue === undefined) {
      return { success: false, message: 'Không thể xác định điểm số gốc' }
    }

    // Start transaction to revert grade and update audit log
    const { error: revertError } = await supabase
      .from('student_detailed_grades')
      .update({
        grade_value: originalGradeValue,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditLog.record_id)

    if (revertError) {
      console.error('Error reverting grade:', revertError)
      return { success: false, message: 'Không thể hoàn tác điểm số' }
    }

    // Update the audit log with rejection by updating old_values
    const updatedOldValues = {
      ...oldValues,
      status: 'rejected',
      admin_reason: adminReason,
      processed_at: new Date().toISOString(),
      processed_by: user.user.id
    }

    const { error: updateError } = await supabase
      .from('unified_audit_logs')
      .update({
        old_values: updatedOldValues
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