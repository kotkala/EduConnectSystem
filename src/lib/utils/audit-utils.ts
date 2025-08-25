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

export interface GradeUpdateAuditData {
  gradeId: string
  userId: string
  oldValue: number | null
  newValue: number | null
  reason: string
  componentType: string
  studentName?: string
  subjectName?: string
}

/**
 * Helper function to create audit log for grade updates
 */
export async function logGradeUpdateAudit(data: GradeUpdateAuditData): Promise<void> {
  const studentPart = data.studentName ? ` cho ${data.studentName}` : ''
  const subjectPart = data.subjectName ? ` môn ${data.subjectName}` : ''
  const changes_summary = data.reason || `Cập nhật điểm ${data.componentType}${studentPart}${subjectPart}`

  await logGradeAuditAction({
    record_id: data.gradeId,
    action: 'UPDATE',
    user_id: data.userId,
    old_values: { grade_value: data.oldValue },
    new_values: { grade_value: data.newValue },
    changes_summary
  })
}

/**
 * Helper function to create audit log for grade updates that require admin approval
 */
export async function logGradeUpdateAuditPending(data: GradeUpdateAuditData): Promise<void> {
  const studentPart = data.studentName ? ` cho ${data.studentName}` : ''
  const subjectPart = data.subjectName ? ` môn ${data.subjectName}` : ''
  const changes_summary = data.reason || `Cập nhật điểm ${data.componentType}${studentPart}${subjectPart}`

  await logGradeAuditAction({
    record_id: data.gradeId,
    action: 'UPDATE',
    user_id: data.userId,
    old_values: {
      old_value: data.oldValue,
      status: 'pending'
    },
    new_values: {
      new_value: data.newValue,
      processed_at: null,
      processed_by: null
    },
    changes_summary
  })
}

export interface GradeCreateAuditData {
  gradeId: string
  userId: string
  gradeValue: number | null
  reason: string
  componentType: string
  studentName?: string
  subjectName?: string
}

/**
 * Helper function to create audit log for new grade creation
 */
export async function logGradeCreateAudit(data: GradeCreateAuditData): Promise<void> {
  const studentPart = data.studentName ? ` cho ${data.studentName}` : ''
  const subjectPart = data.subjectName ? ` môn ${data.subjectName}` : ''
  const changes_summary = data.reason || `Tạo điểm ${data.componentType}${studentPart}${subjectPart}`

  await logGradeAuditAction({
    record_id: data.gradeId,
    action: 'INSERT',
    user_id: data.userId,
    old_values: undefined,
    new_values: { grade_value: data.gradeValue },
    changes_summary
  })
}
