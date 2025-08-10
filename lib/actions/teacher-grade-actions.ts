'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper function to check teacher permissions
async function checkTeacherPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("Yêu cầu xác thực")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, homeroom_enabled')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    throw new Error("Yêu cầu quyền giáo viên")
  }

  return { user, profile }
}

// Get class grade summaries for homeroom teacher
export async function getClassGradeSummariesAction() {
  try {
    const { user } = await checkTeacherPermissions()
    const supabase = await createClient()

    const { data: summaries, error } = await supabase
      .from('class_grade_summaries')
      .select(`
        *,
        academic_year:academic_years(name),
        semester:semesters(name),
        class:classes!class_grade_summaries_class_id_fkey(
          id,
          name,
          homeroom_teacher_id
        ),
        sent_by_profile:profiles!class_grade_summaries_sent_by_fkey(full_name)
      `)
      .eq('class.homeroom_teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: summaries || []
    }
  } catch (error) {
    console.error('Error fetching class grade summaries:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách bảng điểm"
    }
  }
}

// Get detailed grades for a class summary
export async function getClassGradeDetailsAction(summaryId: string) {
  try {
    const { user } = await checkTeacherPermissions()
    const supabase = await createClient()

    // First verify teacher has access to this summary
    const { data: summary, error: summaryError } = await supabase
      .from('class_grade_summaries')
      .select(`
        *,
        class:classes!class_grade_summaries_class_id_fkey(homeroom_teacher_id)
      `)
      .eq('id', summaryId)
      .single()

    if (summaryError || !summary) {
      return {
        success: false,
        error: "Không tìm thấy bảng điểm"
      }
    }

    if (summary.class?.homeroom_teacher_id !== user.id) {
      return {
        success: false,
        error: "Bạn không có quyền truy cập bảng điểm này"
      }
    }

    // Get all student submissions for this class/semester
    const { data: submissions, error: submissionsError } = await supabase
      .from('student_grade_submissions')
      .select(`
        *,
        student:profiles!student_grade_submissions_student_id_fkey(
          id,
          full_name,
          student_id,
          email
        ),
        grades:individual_subject_grades(
          *,
          subject:subjects(
            id,
            code,
            name_vietnamese,
            category
          )
        )
      `)
      .eq('class_id', summary.class_id)
      .eq('academic_year_id', summary.academic_year_id)
      .eq('semester_id', summary.semester_id)
      .eq('status', 'sent_to_teacher')

    if (submissionsError) {
      return {
        success: false,
        error: submissionsError.message
      }
    }

    return {
      success: true,
      data: {
        summary,
        submissions: submissions || []
      }
    }
  } catch (error) {
    console.error('Error fetching class grade details:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy chi tiết bảng điểm"
    }
  }
}

// Send individual student grades to parent
export async function sendGradesToParentAction(submissionId: string, parentIds: string[]) {
  try {
    const { user } = await checkTeacherPermissions()
    const supabase = await createClient()

    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('student_grade_submissions')
      .select(`
        *,
        student:profiles!student_grade_submissions_student_id_fkey(
          id,
          full_name,
          student_id
        ),
        class:classes!student_grade_submissions_class_id_fkey(
          name,
          homeroom_teacher_id
        ),
        academic_year:academic_years(name),
        semester:semesters(name)
      `)
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      return {
        success: false,
        error: "Không tìm thấy bảng điểm học sinh"
      }
    }

    // Verify teacher has access
    if (submission.class?.homeroom_teacher_id !== user.id) {
      return {
        success: false,
        error: "Bạn không có quyền gửi bảng điểm này"
      }
    }

    // Check for existing AI feedback for this submission
    let aiFeedbackText = ''
    const { data: aiFeedback } = await supabase
      .from('student_feedback')
      .select('feedback_text')
      .eq('student_id', submission.student_id)
      .eq('teacher_id', user.id)
      .like('feedback_text', `[AI_GENERATED:${submissionId}]%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (aiFeedback) {
      // Remove the AI marker from feedback text
      aiFeedbackText = aiFeedback.feedback_text.replace(/^\[AI_GENERATED:[^\]]+\]\s*/, '')
    }

    // Create notifications for parents
    const baseMessage = `Bảng điểm ${submission.semester?.name} của con bạn ${submission.student?.full_name} (${submission.student?.student_id}) đã sẵn sàng. Vui lòng kiểm tra chi tiết.`
    const fullMessage = aiFeedbackText
      ? `${baseMessage}\n\nNhận xét của giáo viên chủ nhiệm:\n${aiFeedbackText}`
      : baseMessage

    const notifications = parentIds.map(parentId => ({
      recipient_id: parentId,
      sender_id: user.id,
      title: `Bảng điểm ${submission.semester?.name} của ${submission.student?.full_name}`,
      content: fullMessage,
      message: fullMessage,
      type: 'student_grade',
      target_roles: ['parent'],
      metadata: {
        submission_id: submissionId,
        student_id: submission.student_id,
        class_id: submission.class_id,
        academic_year_id: submission.academic_year_id,
        semester_id: submission.semester_id,
        has_ai_feedback: Boolean(aiFeedbackText)
      }
    }))

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (notificationError) {
      return {
        success: false,
        error: notificationError.message
      }
    }

    revalidatePath('/dashboard/teacher/grade-reports')
    return {
      success: true,
      message: `Đã gửi bảng điểm của ${submission.student?.full_name} cho ${parentIds.length} phụ huynh`
    }
  } catch (error) {
    console.error('Error sending grades to parent:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể gửi bảng điểm cho phụ huynh"
    }
  }
}

// Get parents of a student
export async function getStudentParentsAction(studentId: string) {
  try {
    await checkTeacherPermissions()
    const supabase = await createClient()

    const { data: parents, error } = await supabase
      .from('parent_student_relationships')
      .select(`
        parent:profiles!parent_student_relationships_parent_id_fkey(
          id,
          full_name,
          email,
          phone_number
        )
      `)
      .eq('student_id', studentId)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: parents?.map(p => p.parent).filter(Boolean) || []
    }
  } catch (error) {
    console.error('Error fetching student parents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách phụ huynh của học sinh"
    }
  }
}

// Helper function to process a single student's grade submission
async function processStudentGradeSubmission(submission: { id: string; student_id: string }): Promise<{ success: boolean }> {
  try {
    // Get parents for this student
    const parentsResult = await getStudentParentsAction(submission.student_id)
    if (parentsResult.success && parentsResult.data && parentsResult.data.length > 0) {
      const parentIds = (parentsResult.data as unknown as Array<{ id: string }>).map(p => p.id)
      const sendResult = await sendGradesToParentAction(submission.id, parentIds)
      return { success: sendResult.success }
    }
    return { success: false }
  } catch {
    return { success: false }
  }
}

// Helper function to process all submissions and count results
async function processAllSubmissions(submissions: Array<{ id: string; student_id: string }>): Promise<{ successCount: number; errorCount: number }> {
  let successCount = 0
  let errorCount = 0

  for (const submission of submissions) {
    const result = await processStudentGradeSubmission(submission)
    if (result.success) {
      successCount++
    } else {
      errorCount++
    }
  }

  return { successCount, errorCount }
}

// Send grades to all parents in class
export async function sendAllGradesToParentsAction(summaryId: string) {
  try {
    await checkTeacherPermissions()

    // Get class grade details
    const detailsResult = await getClassGradeDetailsAction(summaryId)
    if (!detailsResult.success || !detailsResult.data) {
      return {
        success: false,
        error: detailsResult.error || "Không thể lấy thông tin bảng điểm"
      }
    }

    const { submissions } = detailsResult.data
    const { successCount, errorCount } = await processAllSubmissions(submissions)

    revalidatePath('/dashboard/teacher/grade-reports')
    const errorMessage = errorCount > 0 ? ` ${errorCount} bảng điểm gặp lỗi.` : ''
    return {
      success: true,
      message: `Đã gửi thành công ${successCount} bảng điểm.${errorMessage}`
    }
  } catch (error) {
    console.error('Error sending all grades to parents:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send grades to parents"
    }
  }
}
