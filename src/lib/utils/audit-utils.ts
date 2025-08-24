"use server"

import { createAdminClient } from "@/shared/utils/supabase/admin"

export interface GradeAuditLogData {
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  user_id: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  changes_summary: string
  ip_address?: string
  user_agent?: string
}

/**
 * Log grade changes to unified_audit_logs table
 * This ensures all grade modifications are tracked in a centralized audit system
 */
export async function logGradeAuditAction(data: GradeAuditLogData): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = createAdminClient()

    const { error } = await supabase
      .from('unified_audit_logs')
      .insert({
        audit_type: 'grade',
        table_name: 'student_detailed_grades',
        record_id: data.record_id,
        action: data.action,
        user_id: data.user_id,
        old_values: data.old_values || undefined,
        new_values: data.new_values || undefined,
        changes_summary: data.changes_summary,
        ip_address: data.ip_address || undefined,
        user_agent: data.user_agent || undefined,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error logging grade audit:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true
    }

  } catch (error) {
    console.error('Error in logGradeAuditAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Helper function to create audit log for grade updates
 */
export async function logGradeUpdateAudit(
  gradeId: string,
  userId: string,
  oldValue: number | null,
  newValue: number | null,
  reason: string,
  componentType: string,
  studentName?: string,
  subjectName?: string
): Promise<void> {
  const changes_summary = reason || `Cập nhật điểm ${componentType}${studentName ? ` cho ${studentName}` : ''}${subjectName ? ` môn ${subjectName}` : ''}`
  
  await logGradeAuditAction({
    record_id: gradeId,
    action: 'UPDATE',
    user_id: userId,
    old_values: { grade_value: oldValue },
    new_values: { grade_value: newValue },
    changes_summary
  })
}

/**
 * Helper function to create audit log for new grade creation
 */
export async function logGradeCreateAudit(
  gradeId: string,
  userId: string,
  gradeValue: number | null,
  reason: string,
  componentType: string,
  studentName?: string,
  subjectName?: string
): Promise<void> {
  const changes_summary = reason || `Tạo điểm ${componentType}${studentName ? ` cho ${studentName}` : ''}${subjectName ? ` môn ${subjectName}` : ''}`
  
  await logGradeAuditAction({
    record_id: gradeId,
    action: 'INSERT',
    user_id: userId,
    old_values: undefined,
    new_values: { grade_value: gradeValue },
    changes_summary
  })
}
