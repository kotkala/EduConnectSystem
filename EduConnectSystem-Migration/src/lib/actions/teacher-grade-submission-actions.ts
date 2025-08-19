'use server'

import { createClient } from '@/shared/utils/supabase/server'
import { checkTeacherPermissions } from '@/lib/utils/permission-utils'
import { revalidatePath } from 'next/cache'

export interface TeacherGradeSubmissionData {
  periodId: string
  classId: string
  subjectId: string
  className: string
  subjectName: string
  periodName: string
  gradeData: Array<{
    studentId: string
    studentName: string
    regularGrades: (number | null)[]
    midtermGrade?: number | null
    finalGrade?: number | null
    summaryGrade?: number | null
    lastModified?: string
    modifiedBy?: string
  }>
  submissionReason: string
}

export interface TeacherGradeSubmissionResult {
  success: boolean
  message?: string
  error?: string
  submissionId?: string
}

// Submit teacher grades to admin for approval
export async function submitTeacherGradesToAdminAction(
  data: TeacherGradeSubmissionData
): Promise<TeacherGradeSubmissionResult> {
  try {
    const { userId } = await checkTeacherPermissions()
    const supabase = await createClient()

    // Validate input data
    if (!data.periodId || !data.classId || !data.subjectId) {
      return {
        success: false,
        error: 'Thiếu thông tin kỳ báo cáo, lớp học hoặc môn học'
      }
    }

    if (!data.gradeData || data.gradeData.length === 0) {
      return {
        success: false,
        error: 'Không có dữ liệu điểm để gửi'
      }
    }

    // Check if submission already exists using grade_period_submissions table
    const { data: existingSubmission, error: checkError } = await supabase
      .from('grade_period_submissions')
      .select('id, status, created_at, submission_count')
      .eq('period_id', data.periodId)
      .eq('class_id', data.classId)
      .eq('subject_id', data.subjectId)
      .eq('teacher_id', userId)
      .maybeSingle()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing submission:', checkError)
      return {
        success: false,
        error: 'Lỗi kiểm tra bảng điểm đã gửi'
      }
    }

    // Create submission record
    const submissionData = {
      period_id: data.periodId,
      class_id: data.classId,
      subject_id: data.subjectId,
      teacher_id: userId,
      submission_name: `Bảng điểm ${data.subjectName} - ${data.className}`,
      grade_data: JSON.stringify(data.gradeData),
      status: 'submitted',
      submission_count: existingSubmission ? (existingSubmission.submission_count || 0) + 1 : 1,
      reason_for_resubmission: existingSubmission ? data.submissionReason : null
    }

    let result
    if (existingSubmission) {
      // Update existing submission
      const { data: updatedSubmission, error: updateError } = await supabase
        .from('grade_period_submissions')
        .update({
          ...submissionData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubmission.id)
        .select('id')
        .single()

      if (updateError) {
        console.error('Error updating submission:', updateError)
        return {
          success: false,
          error: 'Lỗi cập nhật bảng điểm đã gửi'
        }
      }
      result = updatedSubmission
    } else {
      // Create new submission
      const { data: newSubmission, error: createError } = await supabase
        .from('grade_period_submissions')
        .insert(submissionData)
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating submission:', createError)
        return {
          success: false,
          error: 'Lỗi tạo bảng điểm gửi admin'
        }
      }
      result = newSubmission
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard/teacher/grade-management')
    revalidatePath('/dashboard/admin/grade-tracking')

    return {
      success: true,
      message: existingSubmission 
        ? 'Cập nhật và gửi lại bảng điểm cho admin thành công!'
        : 'Gửi bảng điểm cho admin thành công!',
      submissionId: result.id
    }

  } catch (error) {
    console.error('Error in submitTeacherGradesToAdminAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }
  }
}

// Get teacher grade submissions
export async function getTeacherGradeSubmissionsAction(
  periodId?: string,
  classId?: string,
  subjectId?: string
): Promise<{
  success: boolean
  data?: Array<{
    id: string
    submission_name: string
    status: string
    // total_students: number // Column doesn't exist in table
    // students_with_grades: number // Column doesn't exist in table
    submission_count: number
    created_at: string
    updated_at: string
    reason_for_resubmission?: string
  }>
  error?: string
}> {
  try {
    const { userId } = await checkTeacherPermissions()
    const supabase = await createClient()

    let query = supabase
      .from('grade_period_submissions')
      .select(`
        id,
        submission_name,
        status,
        submission_count,
        created_at,
        updated_at,
        reason_for_resubmission
      `)
      .eq('teacher_id', userId)
      .order('created_at', { ascending: false })

    if (periodId) {
      query = query.eq('period_id', periodId)
    }
    if (classId) {
      query = query.eq('class_id', classId)
    }
    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }

    const { data: submissions, error } = await query

    if (error) {
      console.error('Error fetching teacher submissions:', error)
      return {
        success: false,
        error: 'Lỗi tải danh sách bảng điểm đã gửi'
      }
    }

    return {
      success: true,
      data: submissions || []
    }

  } catch (error) {
    console.error('Error in getTeacherGradeSubmissionsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }
  }
}
