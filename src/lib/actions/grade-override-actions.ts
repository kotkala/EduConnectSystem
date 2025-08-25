"use server"

import { createClient } from "@/lib/supabase/server"
import { checkTeacherPermissions } from "@/lib/utils/permission-utils"
import { logGradeUpdateAuditPending } from "@/lib/utils/audit-utils"

export interface GradeOverrideData {
  gradeId: string
  studentId: string
  studentName: string
  componentType: 'midterm' | 'final' | 'semester_1' | 'semester_2' | 'yearly' | 'summary'
  oldValue: number
  newValue: number
  reason?: string
}

export interface GradeOverrideResult {
  success: boolean
  message: string
  overrideCount?: number
  error?: string
}

export interface GradeHistoryRecord {
  id: string
  component_type: string
  grade_value: number
  created_at: string
  updated_at: string
  student_id: string
  students?: Array<{
    student_number: string
    full_name: string
  }>
  grade_audit_logs?: Array<{
    id: string
    old_value: number
    new_value: number
    change_reason: string
    changed_at: string
    changed_by: string
    profiles?: Array<{
      full_name: string
    }>
  }>
}

export interface StudentGradeData {
  student_id: string
  studentName: string
  midtermGrade?: number | null
  finalGrade?: number | null
}

export async function processGradeOverridesAction(
  overrides: GradeOverrideData[]
): Promise<GradeOverrideResult> {
  try {
    // Check teacher permissions
    const { user } = await checkTeacherPermissions()

    if (!user) {
      throw new Error('User not authenticated')
    }

    if (overrides.length === 0) {
      return {
        success: false,
        message: 'Không có thay đổi nào để xử lý'
      }
    }

    // Process each override - CREATE PENDING AUDIT LOGS ONLY, DON'T UPDATE GRADES YET
    for (const override of overrides) {
      // Create pending audit log - grades will be updated only after admin approval
      await logGradeUpdateAuditPending({
        gradeId: override.gradeId,
        userId: user.id,
        oldValue: override.oldValue,
        newValue: override.newValue,
        reason: override.reason || 'Không có lý do',
        componentType: override.componentType,
        studentName: override.studentName
      })
    }

    return {
      success: true,
      message: `Đã gửi ${overrides.length} yêu cầu thay đổi điểm cho admin phê duyệt`,
      overrideCount: overrides.length
    }

  } catch (error) {
    console.error('Error processing grade overrides:', error)
    return {
      success: false,
      message: 'Lỗi xử lý thay đổi điểm',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function getGradeHistoryAction(
  periodId: string,
  classId: string,
  subjectId: string
): Promise<{
  success: boolean
  data?: GradeHistoryRecord[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Check teacher permissions
    await checkTeacherPermissions()

    // Get grade records first
    const { data: gradeRecords, error: gradeError } = await supabase
      .from('student_detailed_grades')
      .select(`
        id,
        component_type,
        grade_value,
        created_at,
        updated_at,
        student_id,
        students(student_number, full_name)
      `)
      .eq('period_id', periodId)
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })

    if (gradeError) {
      throw gradeError
    }

    // Get audit logs for these grade records from unified_audit_logs
    const gradeIds = gradeRecords?.map(record => record.id) || []
    const { data: auditLogs, error: auditError } = await supabase
      .from('unified_audit_logs')
      .select(`
        id,
        record_id,
        old_values,
        new_values,
        changes_summary,
        created_at,
        user_id,
        user:profiles!user_id(full_name)
      `)
      .eq('audit_type', 'grade')
      .eq('table_name', 'student_detailed_grades')
      .in('record_id', gradeIds)
      .order('created_at', { ascending: false })

    if (auditError) {
      throw auditError
    }

    // Combine grade records with their audit logs
    const data = gradeRecords?.map(record => ({
      ...record,
      grade_audit_logs: auditLogs?.filter(log => log.record_id === record.id).map(log => ({
        id: log.id,
        old_value: log.old_values?.grade_value || null,
        new_value: log.new_values?.grade_value || null,
        change_reason: log.changes_summary || '',
        changed_at: log.created_at,
        changed_by: log.user_id,
        profiles: Array.isArray(log.user) ? log.user : [log.user]
      })) || []
    })) || []

    return {
      success: true,
      data: data || []
    }

  } catch (error) {
    console.error('Error fetching grade history:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function detectGradeOverridesAction(
  periodId: string,
  classId: string,
  subjectId: string,
  gradeData: StudentGradeData[]
): Promise<{
  success: boolean
  overrides?: GradeOverrideData[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    // Check teacher permissions
    await checkTeacherPermissions()

    const overrides = []

    for (const studentData of gradeData) {
      // Check midterm grade override
      if (studentData.midtermGrade !== null && studentData.midtermGrade !== undefined) {
        const { data: existingGrade } = await supabase
          .from('student_detailed_grades')
          .select('id, grade_value')
          .eq('period_id', periodId)
          .eq('student_id', studentData.student_id)
          .eq('subject_id', subjectId)
          .eq('class_id', classId)
          .eq('component_type', 'midterm')
          .single()

        if (existingGrade && existingGrade.grade_value !== null && existingGrade.grade_value !== studentData.midtermGrade) {
          overrides.push({
            gradeId: existingGrade.id as string,
            studentId: studentData.student_id,
            studentName: studentData.studentName,
            componentType: 'midterm' as const,
            oldValue: existingGrade.grade_value as number,
            newValue: studentData.midtermGrade
          })
        }
      }

      // Check final grade override
      if (studentData.finalGrade !== null && studentData.finalGrade !== undefined) {
        const { data: existingGrade } = await supabase
          .from('student_detailed_grades')
          .select('id, grade_value')
          .eq('period_id', periodId)
          .eq('student_id', studentData.student_id)
          .eq('subject_id', subjectId)
          .eq('class_id', classId)
          .eq('component_type', 'final')
          .single()

        if (existingGrade && existingGrade.grade_value !== null && existingGrade.grade_value !== studentData.finalGrade) {
          overrides.push({
            gradeId: existingGrade.id as string,
            studentId: studentData.student_id,
            studentName: studentData.studentName,
            componentType: 'final' as const,
            oldValue: existingGrade.grade_value as number,
            newValue: studentData.finalGrade
          })
        }
      }
    }

    return {
      success: true,
      overrides
    }

  } catch (error) {
    console.error('Error detecting grade overrides:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
