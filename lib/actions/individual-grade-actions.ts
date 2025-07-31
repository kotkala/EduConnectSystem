'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  studentGradeSubmissionSchema,
  bulkIndividualGradesSchema,
  type StudentGradeSubmissionFormData,
  type BulkIndividualGradesFormData
} from '@/lib/validations/individual-grade-validations'

// Helper function to check admin permissions
async function checkAdminPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("Authentication required")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error("Admin access required")
  }

  return { user, profile }
}

// Get students in a class for grade submission
export async function getStudentsForGradeSubmissionAction(classId: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

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
      return {
        success: false,
        error: studentsError.message
      }
    }

    // Get subjects for the class
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, code, name_vietnamese, name_english, category')
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name_vietnamese', { ascending: true })

    if (subjectsError) {
      return {
        success: false,
        error: subjectsError.message
      }
    }

    return {
      success: true,
      data: {
        students: students?.map(s => s.student).filter(Boolean) || [],
        subjects: subjects || []
      }
    }
  } catch (error) {
    console.error('Error fetching students for grade submission:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch students"
    }
  }
}

// Create student grade submission
export async function createStudentGradeSubmissionAction(data: StudentGradeSubmissionFormData) {
  try {
    const { user } = await checkAdminPermissions()
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
      return {
        success: false,
        error: "Grade submission already exists for this student"
      }
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
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      return {
        success: false,
        error: createError.message
      }
    }

    revalidatePath('/dashboard/admin/grade-reports')
    return {
      success: true,
      data: submission,
      message: "Grade submission created successfully"
    }
  } catch (error) {
    console.error('Error creating grade submission:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create grade submission"
    }
  }
}

// Get student grade submissions for a class
export async function getStudentGradeSubmissionsAction(classId: string, academicYearId: string, semesterId: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

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
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: submissions || []
    }
  } catch (error) {
    console.error('Error fetching grade submissions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch grade submissions"
    }
  }
}

// Submit grades for a student (bulk update)
export async function submitStudentGradesAction(data: BulkIndividualGradesFormData) {
  try {
    await checkAdminPermissions()
    const validatedData = bulkIndividualGradesSchema.parse(data)
    const supabase = await createClient()

    // Verify submission exists
    const { data: submission, error: submissionError } = await supabase
      .from('student_grade_submissions')
      .select('id, status')
      .eq('id', validatedData.submission_id)
      .single()

    if (submissionError || !submission) {
      return {
        success: false,
        error: "Grade submission not found"
      }
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
      return {
        success: false,
        error: gradesError.message
      }
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
      return {
        success: false,
        error: updateError.message
      }
    }

    revalidatePath('/dashboard/admin/grade-reports')
    return {
      success: true,
      message: `Successfully submitted grades for ${gradesToUpsert.length} subjects`
    }
  } catch (error) {
    console.error('Error submitting grades:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit grades"
    }
  }
}

// Get grades for a specific submission
export async function getSubmissionGradesAction(submissionId: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

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
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: grades || []
    }
  } catch (error) {
    console.error('Error fetching submission grades:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch submission grades"
    }
  }
}

// Send class grade summary to homeroom teacher
export async function sendGradesToHomeroomTeacherAction(classId: string, academicYearId: string, semesterId: string) {
  try {
    const { user } = await checkAdminPermissions()
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
      return {
        success: false,
        error: "Không tìm thấy thông tin lớp học"
      }
    }

    if (!classInfo.homeroom_teacher_id) {
      return {
        success: false,
        error: "Lớp học chưa có giáo viên chủ nhiệm"
      }
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
      return {
        success: false,
        error: submissionsError.message
      }
    }

    const totalStudents = submissions?.length || 0
    const submittedStudents = submissions?.filter(s => s.status === 'submitted').length || 0

    if (submittedStudents === 0) {
      return {
        success: false,
        error: "Chưa có học sinh nào được nhập điểm"
      }
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
        sent_by: user.id,
        sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (summaryError) {
      return {
        success: false,
        error: summaryError.message
      }
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
      return {
        success: false,
        error: updateError.message
      }
    }

    // Create notification for homeroom teacher
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        recipient_id: classInfo.homeroom_teacher_id,
        sender_id: user.id,
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

    revalidatePath('/dashboard/admin/grade-reports')
    return {
      success: true,
      message: `Đã gửi bảng điểm cho GVCN ${(classInfo.homeroom_teacher as { full_name?: string })?.full_name || 'N/A'}. Tổng cộng ${submittedStudents}/${totalStudents} học sinh.`
    }
  } catch (error) {
    console.error('Error sending grades to homeroom teacher:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send grades to homeroom teacher"
    }
  }
}
