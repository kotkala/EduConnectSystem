"use server"

import { createClient } from "@/utils/supabase/server"
import { checkTeacherPermissions } from "@/lib/utils/permission-utils"
import { revalidateTag } from "next/cache"

export interface GradeOverwriteData {
  periodId: string
  classId: string
  subjectId: string
  studentId: string
  componentType: string
  newGradeValue: number
  overwriteReason?: string
}

export interface GradeOverwriteResult {
  success: boolean
  message?: string
  error?: string
  requiresComment?: boolean
}

// Validate if grade overwrite is allowed based on semester rules
export async function validateGradeOverwriteAction(
  data: GradeOverwriteData
): Promise<GradeOverwriteResult> {
  try {
    const supabase = await createClient()
    await checkTeacherPermissions()

    // Get period information to check semester
    const { data: periodInfo, error: periodError } = await supabase
      .from('grade_reporting_periods')
      .select(`
        id,
        name,
        semester_id,
        academic_year_id,
        semesters!inner(name)
      `)
      .eq('id', data.periodId)
      .single()

    if (periodError) {
      return {
        success: false,
        error: `Lỗi tải thông tin kỳ báo cáo: ${periodError.message}`
      }
    }

    // Get existing grade if any
    const { data: existingGrade, error: gradeError } = await supabase
      .from('student_detailed_grades')
      .select('grade_value, created_at, period_id')
      .eq('period_id', data.periodId)
      .eq('student_id', data.studentId)
      .eq('subject_id', data.subjectId)
      .eq('class_id', data.classId)
      .eq('component_type', data.componentType)
      .single()

    if (gradeError && gradeError.code !== 'PGRST116') {
      return {
        success: false,
        error: `Lỗi kiểm tra điểm hiện tại: ${gradeError.message}`
      }
    }

    // If no existing grade, this is a new entry, not an overwrite
    if (!existingGrade) {
      return {
        success: true,
        message: 'Điểm mới, không cần ghi chú'
      }
    }

    // Check if this is actually an overwrite (different value)
    if (existingGrade.grade_value === data.newGradeValue) {
      return {
        success: true,
        message: 'Điểm không thay đổi'
      }
    }

    // Get the semester of the existing grade
    const { data: existingPeriodInfo, error: existingPeriodError } = await supabase
      .from('grade_reporting_periods')
      .select('semester_id')
      .eq('id', existingGrade.period_id)
      .single()

    if (existingPeriodError) {
      return {
        success: false,
        error: `Lỗi kiểm tra kỳ hiện tại: ${existingPeriodError.message}`
      }
    }

    // Rule: Can only overwrite grades within the same semester
    if (existingPeriodInfo.semester_id !== periodInfo.semester_id) {
      return {
        success: false,
        error: `Không thể ghi đè điểm từ học kỳ khác. Điểm hiện tại thuộc học kỳ khác`
      }
    }

    // Rule: Midterm and final grades require comments when overwritten
    const requiresComment = data.componentType === 'midterm' || data.componentType === 'final'
    
    if (requiresComment && (!data.overwriteReason || data.overwriteReason.trim().length === 0)) {
      return {
        success: false,
        requiresComment: true,
        error: 'Ghi đè điểm giữa kỳ/cuối kỳ bắt buộc phải có ghi chú'
      }
    }

    return {
      success: true,
      message: requiresComment ? 'Ghi đè hợp lệ với ghi chú' : 'Ghi đè hợp lệ'
    }

  } catch (error) {
    console.error('Error validating grade overwrite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }
  }
}

// Execute grade overwrite with proper tracking
export async function executeGradeOverwriteAction(
  data: GradeOverwriteData
): Promise<GradeOverwriteResult> {
  try {
    const supabase = await createClient()
    const { userId } = await checkTeacherPermissions()

    // First validate the overwrite
    const validation = await validateGradeOverwriteAction(data)
    if (!validation.success) {
      return validation
    }

    // Get existing grade for history tracking
    const { data: existingGrade } = await supabase
      .from('student_detailed_grades')
      .select('id, grade_value')
      .eq('period_id', data.periodId)
      .eq('student_id', data.studentId)
      .eq('subject_id', data.subjectId)
      .eq('class_id', data.classId)
      .eq('component_type', data.componentType)
      .single()

    // Update or insert the grade
    const { data: updatedGrade, error: updateError } = await supabase
      .from('student_detailed_grades')
      .upsert({
        period_id: data.periodId,
        student_id: data.studentId,
        subject_id: data.subjectId,
        class_id: data.classId,
        component_type: data.componentType,
        grade_value: data.newGradeValue,
        previous_grade_value: existingGrade?.grade_value || null,
        overwrite_reason: data.overwriteReason,
        is_overwrite: existingGrade ? true : false,
        created_by: userId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'period_id,student_id,subject_id,class_id,component_type'
      })
      .select('id')
      .single()

    if (updateError) {
      return {
        success: false,
        error: `Lỗi cập nhật điểm: ${updateError.message}`
      }
    }

    // Record in grade history
    if (existingGrade) {
      await supabase
        .from('grade_history')
        .insert({
          student_detailed_grade_id: updatedGrade.id,
          grade_value: data.newGradeValue,
          previous_grade_value: existingGrade.grade_value,
          change_reason: data.overwriteReason,
          changed_by: userId,
          change_type: 'overwrite'
        })
    }

    // Revalidate cache
    revalidateTag(`grades-${data.periodId}-${data.classId}-${data.subjectId}`)
    revalidateTag(`grade-overview-${data.periodId}-${data.classId}-${data.subjectId}`)

    return {
      success: true,
      message: existingGrade ? 'Ghi đè điểm thành công' : 'Nhập điểm thành công'
    }

  } catch (error) {
    console.error('Error executing grade overwrite:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }
  }
}
