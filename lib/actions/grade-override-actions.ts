"use server"

import { createClient } from "@/utils/supabase/server"
import { checkTeacherPermissions } from "@/lib/utils/permission-utils"

export interface GradeOverrideData {
  gradeId: string
  studentId: string
  studentName: string
  componentType: 'midterm' | 'final'
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
    const supabase = await createClient()

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

    // Process each override - Create audit logs for admin approval, DO NOT update grades yet
    for (const override of overrides) {
      // Check if this is a midterm or final grade that requires admin approval
      const requiresApproval = override.componentType === 'midterm' || override.componentType === 'final'

      if (requiresApproval) {
        // For midterm/final grades: Create audit log with pending status, DO NOT update grade yet
        const { error: auditError } = await supabase
          .from('grade_audit_logs')
          .insert({
            grade_id: override.gradeId,
            old_value: override.oldValue,
            new_value: override.newValue,
            change_reason: override.reason || 'Không có lý do',
            changed_by: user.id,
            changed_at: new Date().toISOString(),
            status: 'pending'
          })

        if (auditError) {
          throw new Error(`Lỗi tạo yêu cầu phê duyệt cho ${override.studentName}: ${auditError.message}`)
        }
      } else {
        // For regular grades: Update immediately without requiring approval
        const { error: updateError } = await supabase
          .from('student_detailed_grades')
          .update({
            grade_value: override.newValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', override.gradeId)

        if (updateError) {
          throw new Error(`Lỗi cập nhật điểm cho ${override.studentName}: ${updateError.message}`)
        }

        // Create audit log for record keeping (approved status)
        const { error: auditError } = await supabase
          .from('grade_audit_logs')
          .insert({
            grade_id: override.gradeId,
            old_value: override.oldValue,
            new_value: override.newValue,
            change_reason: override.reason || 'Điểm thường xuyên - tự động phê duyệt',
            changed_by: user.id,
            changed_at: new Date().toISOString(),
            status: 'approved',
            processed_at: new Date().toISOString(),
            processed_by: user.id
          })

        if (auditError) {
          throw new Error(`Lỗi tạo nhật ký thay đổi cho ${override.studentName}: ${auditError.message}`)
        }
      }
    }

    // Count how many require approval vs immediate update
    const pendingApproval = overrides.filter(o => o.componentType === 'midterm' || o.componentType === 'final').length
    const immediateUpdate = overrides.length - pendingApproval

    let message = ''
    if (pendingApproval > 0 && immediateUpdate > 0) {
      message = `Đã cập nhật ${immediateUpdate} điểm thường xuyên và gửi ${pendingApproval} yêu cầu phê duyệt điểm giữa kì/cuối kì cho admin`
    } else if (pendingApproval > 0) {
      message = `Đã gửi ${pendingApproval} yêu cầu phê duyệt điểm giữa kì/cuối kì cho admin`
    } else {
      message = `Đã cập nhật ${immediateUpdate} điểm thường xuyên thành công`
    }

    return {
      success: true,
      message,
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

    // Get grade history with audit logs
    const { data, error } = await supabase
      .from('student_detailed_grades')
      .select(`
        id,
        component_type,
        grade_value,
        created_at,
        updated_at,
        student_id,
        students!inner(student_number, full_name),
        grade_audit_logs(
          id,
          old_value,
          new_value,
          change_reason,
          changed_at,
          changed_by,
          profiles!changed_by(full_name)
        )
      `)
      .eq('period_id', periodId)
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

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
