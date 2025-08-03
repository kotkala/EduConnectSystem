'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkAdminPermissions } from '@/lib/utils/permission-utils'
import {
  studentGradeSubmissionSchema,
  bulkIndividualGradesSchema,
  type StudentGradeSubmissionFormData,
  type BulkIndividualGradesFormData
} from '@/lib/validations/individual-grade-validations'

// Data types for action responses
type StudentsForGradeSubmissionData = {
  students: Array<{
    id: string
    full_name: string
    student_id: string
    email: string
  }>
  subjects: Array<{
    id: string
    code: string
    name_vietnamese: string
    name_english: string
    category: string
  }>
}

// Common response types
type ActionResponse<T = unknown> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Helper function to create error response - eliminates duplication
function createErrorResponse<T = unknown>(error: unknown, defaultMessage: string): ActionResponse<T> {
  return {
    success: false,
    error: error instanceof Error ? error.message : defaultMessage
  }
}

// Helper function to create success response - eliminates duplication
function createSuccessResponse<T>(data?: T, message?: string): ActionResponse<T> {
  return {
    success: true,
    ...(data !== undefined && { data }),
    ...(message && { message })
  }
}

// Helper function to handle database errors - eliminates duplication
function handleDatabaseError<T = unknown>(error: { message: string } | null, defaultMessage: string): ActionResponse<T> {
  if (error) {
    return {
      success: false,
      error: error.message
    }
  }
  return createErrorResponse<T>(null, defaultMessage)
}

// Helper function to revalidate grade reports path - eliminates duplication
function revalidateGradeReports(): void {
  revalidatePath('/dashboard/admin/grade-reports')
}

// Helper function to get authenticated supabase client - eliminates duplication
async function getAuthenticatedSupabaseClient() {
  await checkAdminPermissions()
  return await createClient()
}



// Get students in a class for grade submission
export async function getStudentsForGradeSubmissionAction(classId: string): Promise<ActionResponse<StudentsForGradeSubmissionData>> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    // Get students in the class
    const { data: students, error: studentsError } = await supabase
      .from('student_class_assignments')
      .select(`
        student:profiles!student_class_assignments_student_id_fkey(
          id,
          full_name,
          student_id,
          email
        )
      `)
      .eq('class_id', classId)
      .eq('is_active', true)

    if (studentsError) {
      return handleDatabaseError<StudentsForGradeSubmissionData>(studentsError, "Failed to fetch students")
    }

    // Get subjects for the class
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, code, name_vietnamese, name_english, category')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name_vietnamese', { ascending: true })

    if (subjectsError) {
      return handleDatabaseError<StudentsForGradeSubmissionData>(subjectsError, "Failed to fetch subjects")
    }

    return createSuccessResponse({
      students: students?.map(s => s.student).filter(Boolean) as unknown as StudentsForGradeSubmissionData['students'] || [],
      subjects: subjects as unknown as StudentsForGradeSubmissionData['subjects'] || []
    })
  } catch (error) {
    console.error('Error fetching students for grade submission:', error)
    return createErrorResponse(error, "Failed to fetch students")
  }
}

// Create student grade submission
export async function createStudentGradeSubmissionAction(data: StudentGradeSubmissionFormData): Promise<ActionResponse<unknown>> {
  try {
    const { userId } = await checkAdminPermissions()
    const validatedData = studentGradeSubmissionSchema.parse(data)
    const supabase = await createClient()

    // Check if submission already exists
    const { data: existingSubmission } = await supabase
      .from('student_grade_submissions')
      .select('id')
      .eq('academic_year_id', validatedData.academic_year_id)
      .eq('semester_id', validatedData.semester_id)
      .eq('class_id', validatedData.class_id)
      .eq('student_id', validatedData.student_id)
      .single()

    if (existingSubmission) {
      return createErrorResponse(null, "Grade submission already exists for this student")
    }

    // Create submission
    const { data: submission, error: createError } = await supabase
      .from('student_grade_submissions')
      .insert({
        academic_year_id: validatedData.academic_year_id,
        semester_id: validatedData.semester_id,
        class_id: validatedData.class_id,
        student_id: validatedData.student_id,
        submission_name: validatedData.submission_name,
        notes: validatedData.notes,
        created_by: userId
      })
      .select()
      .single()

    if (createError) {
      return handleDatabaseError(createError, "Failed to create grade submission")
    }

    revalidateGradeReports()
    return createSuccessResponse(submission, "Grade submission created successfully")
  } catch (error) {
    console.error('Error creating grade submission:', error)
    return createErrorResponse(error, "Failed to create grade submission")
  }
}

// Get student grade submissions for a class
export async function getStudentGradeSubmissionsAction(classId: string, academicYearId: string, semesterId: string): Promise<ActionResponse<unknown[]>> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    const { data: submissions, error } = await supabase
      .from('student_grade_submissions')
      .select(`
        *,
        student:profiles!student_grade_submissions_student_id_fkey(
          id,
          full_name,
          student_id,
          email
        ),
        created_by_profile:profiles!student_grade_submissions_created_by_fkey(full_name)
      `)
      .eq('class_id', classId)
      .eq('academic_year_id', academicYearId)
      .eq('semester_id', semesterId)
      .order('created_at', { ascending: false })

    if (error) {
      return handleDatabaseError(error, "Failed to fetch grade submissions")
    }

    // Filter out invalid submissions and ensure data integrity
    const validSubmissions = (submissions || []).filter(submission =>
      submission?.id &&
      submission?.student_id &&
      submission?.class_id &&
      submission?.academic_year_id &&
      submission?.semester_id
    )

    return createSuccessResponse(validSubmissions)
  } catch (error) {
    console.error('Error fetching grade submissions:', error)
    return createErrorResponse(error, "Failed to fetch grade submissions")
  }
}

// Submit grades for a student (bulk update)
export async function submitStudentGradesAction(data: BulkIndividualGradesFormData): Promise<ActionResponse> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()
    const validatedData = bulkIndividualGradesSchema.parse(data)

    // Verify submission exists
    const { data: submission, error: submissionError } = await supabase
      .from('student_grade_submissions')
      .select('id, status')
      .eq('id', validatedData.submission_id)
      .single()

    if (submissionError || !submission) {
      return createErrorResponse(null, "Grade submission not found")
    }

    // Prepare grades for upsert
    const gradesToUpsert = validatedData.grades.map(grade => ({
      submission_id: validatedData.submission_id,
      subject_id: grade.subject_id,
      midterm_grade: grade.midterm_grade,
      final_grade: grade.final_grade,
      average_grade: grade.midterm_grade && grade.final_grade 
        ? Math.round(((grade.midterm_grade + grade.final_grade) / 2) * 10) / 10 
        : undefined,
      notes: grade.notes
    }))

    // Upsert grades
    const { error: gradesError } = await supabase
      .from('individual_subject_grades')
      .upsert(gradesToUpsert, {
        onConflict: 'submission_id,subject_id'
      })

    if (gradesError) {
      return handleDatabaseError(gradesError, "Failed to submit grades")
    }

    // Update submission status to submitted
    const { error: updateError } = await supabase
      .from('student_grade_submissions')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', validatedData.submission_id)

    if (updateError) {
      return handleDatabaseError(updateError, "Failed to update submission status")
    }

    revalidateGradeReports()
    return createSuccessResponse(undefined, `Successfully submitted grades for ${gradesToUpsert.length} subjects`)
  } catch (error) {
    console.error('Error submitting grades:', error)
    return createErrorResponse(error, "Failed to submit grades")
  }
}

// Get grades for a specific submission
export async function getSubmissionGradesAction(submissionId: string): Promise<ActionResponse<unknown[]>> {
  try {
    const supabase = await getAuthenticatedSupabaseClient()

    const { data: grades, error } = await supabase
      .from('individual_subject_grades')
      .select(`
        *,
        subject:subjects(
          id,
          code,
          name_vietnamese,
          name_english,
          category
        )
      `)
      .eq('submission_id', submissionId)
      .order('subject.category', { ascending: true })

    if (error) {
      return handleDatabaseError(error, "Failed to fetch submission grades")
    }

    return createSuccessResponse(grades || [])
  } catch (error) {
    console.error('Error fetching submission grades:', error)
    return createErrorResponse(error, "Failed to fetch submission grades")
  }
}

// Send class grade summary to homeroom teacher
export async function sendGradesToHomeroomTeacherAction(classId: string, academicYearId: string, semesterId: string): Promise<ActionResponse> {
  try {
    const { userId } = await checkAdminPermissions()
    const supabase = await createClient()

    // Get class info and homeroom teacher
    const { data: classInfo, error: classError } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        homeroom_teacher_id,
        homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('id', classId)
      .single()

    if (classError || !classInfo) {
      return createErrorResponse(null, "Không tìm thấy thông tin lớp học")
    }

    if (!classInfo.homeroom_teacher_id) {
      return createErrorResponse(null, "Lớp học chưa có giáo viên chủ nhiệm")
    }

    // Get academic year and semester info
    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('name')
      .eq('id', academicYearId)
      .single()

    const { data: semester } = await supabase
      .from('semesters')
      .select('name')
      .eq('id', semesterId)
      .single()

    // Count submitted students
    const { data: submissions, error: submissionsError } = await supabase
      .from('student_grade_submissions')
      .select('id, status')
      .eq('class_id', classId)
      .eq('academic_year_id', academicYearId)
      .eq('semester_id', semesterId)

    if (submissionsError) {
      return handleDatabaseError(submissionsError, "Failed to fetch submissions")
    }

    const totalStudents = submissions?.length || 0
    const submittedStudents = submissions?.filter(s => s.status === 'submitted').length || 0

    if (submittedStudents === 0) {
      return createErrorResponse(null, "Chưa có học sinh nào được nhập điểm")
    }

    // Create class grade summary
    const summaryName = `Bảng điểm ${classInfo.name} - ${semester?.name} - ${academicYear?.name}`

    const { data: summary, error: summaryError } = await supabase
      .from('class_grade_summaries')
      .insert({
        academic_year_id: academicYearId,
        semester_id: semesterId,
        class_id: classId,
        summary_name: summaryName,
        total_students: totalStudents,
        submitted_students: submittedStudents,
        sent_by: userId,
        sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (summaryError) {
      return handleDatabaseError(summaryError, "Failed to create grade summary")
    }

    // Update all submissions status to sent_to_teacher
    const { error: updateError } = await supabase
      .from('student_grade_submissions')
      .update({
        status: 'sent_to_teacher',
        sent_to_teacher_at: new Date().toISOString()
      })
      .eq('class_id', classId)
      .eq('academic_year_id', academicYearId)
      .eq('semester_id', semesterId)
      .eq('status', 'submitted')

    if (updateError) {
      return handleDatabaseError(updateError, "Failed to update submission status")
    }

    // Create notification for homeroom teacher
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: classInfo.homeroom_teacher_id,
        sender_id: userId,
        title: `Bảng điểm lớp ${classInfo.name} đã sẵn sàng`,
        content: `Bảng điểm ${semester?.name} của lớp ${classInfo.name} đã được hoàn thành với ${submittedStudents}/${totalStudents} học sinh. Vui lòng kiểm tra và gửi cho phụ huynh.`,
        message: `Bảng điểm ${semester?.name} của lớp ${classInfo.name} đã được hoàn thành với ${submittedStudents}/${totalStudents} học sinh. Vui lòng kiểm tra và gửi cho phụ huynh.`,
        type: 'grade_report',
        target_roles: ['teacher'],
        metadata: {
          class_id: classId,
          academic_year_id: academicYearId,
          semester_id: semesterId,
          summary_id: summary.id
        }
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail the whole operation if notification fails
    }

    revalidateGradeReports()
    return createSuccessResponse(
      undefined,
      `Đã gửi bảng điểm cho GVCN ${(classInfo.homeroom_teacher as { full_name?: string })?.full_name || 'N/A'}. Tổng cộng ${submittedStudents}/${totalStudents} học sinh.`
    )
  } catch (error) {
    console.error('Error sending grades to homeroom teacher:', error)
    return createErrorResponse(error, "Failed to send grades to homeroom teacher")
  }
}
