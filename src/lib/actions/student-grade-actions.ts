'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/shared/utils/supabase/admin'
import { checkStudentPermissions } from '@/lib/utils/permission-utils'

// Helper function to process detailed grades into aggregated format
function processDetailedGradesToAggregated(detailedGrades: Array<{
  subject_id: string
  grade_value: number
  component_type: string
  subject?: {
    code?: string
    name_vietnamese?: string
    category?: string
  }
}>) {
  const subjectMap = new Map()

  detailedGrades.forEach(grade => {
    const subjectId = grade.subject_id
    const subject = Array.isArray(grade.subject) ? grade.subject[0] : grade.subject

    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        subject: {
          id: subjectId,
          code: subject?.code || '',
          name_vietnamese: subject?.name_vietnamese || '',
          category: subject?.category || ''
        },
        grades: []
      })
    }

    const subjectData = subjectMap.get(subjectId)
    subjectData.grades.push({
      value: grade.grade_value,
      component_type: grade.component_type,
      weight: 1 // Default weight
    })
  })

  // Calculate averages for each subject
  return Array.from(subjectMap.values()).map(subjectData => ({
    ...subjectData,
    average: subjectData.grades.reduce((sum: number, grade: { value: number }) => sum + grade.value, 0) / subjectData.grades.length
  }))
}

// Get student's own grade submissions that have been sent to parents by homeroom teachers
export async function getStudentGradeSubmissionsAction() {
  try {
    console.log('🔍 [STUDENT GRADES] Starting student grade submissions query')
    const { userId } = await checkStudentPermissions()
    console.log('🔍 [STUDENT GRADES] Student ID:', userId)
    const supabase = await createClient()

    // Get student's grade submissions that have been sent to parents
    console.log('🔍 [STUDENT GRADES] Fetching student grade submissions')
    const { data: studentSubmissions, error: studentSubmissionsError } = await supabase
      .from('student_grade_submissions')
      .select(`
        id,
        student_id,
        class_id,
        status,
        created_at,
        updated_at,
        student:profiles!student_id(
          id,
          full_name,
          student_id
        ),
        class:classes!class_id(
          id,
          name,
          homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(
            id,
            full_name
          )
        )
      `)
      .eq('student_id', userId)
      .eq('status', 'sent_to_parent')
      .order('updated_at', { ascending: false })

    console.log('🔍 [STUDENT GRADES] Student submissions query result:', {
      submissions: studentSubmissions?.length || 0,
      error: studentSubmissionsError?.message || null
    })

    if (studentSubmissionsError) {
      console.error('❌ [STUDENT GRADES] Error fetching student submissions:', studentSubmissionsError)
      return {
        success: false,
        error: studentSubmissionsError.message
      }
    }

    if (!studentSubmissions || studentSubmissions.length === 0) {
      console.log('⚠️ [STUDENT GRADES] No student submissions found')
      return {
        success: true,
        data: []
      }
    }

    // Process each submission to get detailed grade information
    console.log('🔍 [STUDENT GRADES] Processing submissions for detailed grades')
    const finalSubmissions = []

    for (const studentSubmission of studentSubmissions) {
      // Ensure studentSubmission has required fields
      if (!studentSubmission.class_id || !studentSubmission.student_id) {
        console.warn('⚠️ [STUDENT GRADES] Skipping submission with missing class_id or student_id:', studentSubmission.id)
        continue
      }

      // Check if there's a grade_submission for this class that has been sent to parents
      const adminSupabase = createAdminClient()
      const { data: gradeSubmission, error: gradeSubmissionError } = await adminSupabase
        .from('grade_submissions')
        .select(`
          id,
          period_id,
          class_id,
          status,
          ai_feedback,
          teacher_notes,
          sent_at,
          sent_to_parents_at,
          period:grade_reporting_periods(
            id,
            name,
            academic_year:academic_years(name),
            semester:semesters(name)
          )
        `)
        .eq('class_id', studentSubmission.class_id)
        .not('sent_to_parents_at', 'is', null)
        .order('sent_to_parents_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!gradeSubmissionError && gradeSubmission) {
        // This student's grades have been sent to parents by homeroom teacher
        const period = Array.isArray(gradeSubmission.period) ? gradeSubmission.period[0] : gradeSubmission.period

        let academicYear = null
        if (period?.academic_year) {
          academicYear = Array.isArray(period.academic_year) ? period.academic_year[0] : period.academic_year
        }

        let semester = null
        if (period?.semester) {
          semester = Array.isArray(period.semester) ? period.semester[0] : period.semester
        }

        // Fix data structure to match expected types
        const student = Array.isArray(studentSubmission.student)
          ? studentSubmission.student[0]
          : studentSubmission.student

        const classInfo = Array.isArray(studentSubmission.class)
          ? studentSubmission.class[0]
          : studentSubmission.class

        const homeroomTeacher = classInfo?.homeroom_teacher
        const teacher = Array.isArray(homeroomTeacher)
          ? homeroomTeacher[0]
          : homeroomTeacher

        // Get detailed grades for this student and period
        const { data: detailedGrades } = await adminSupabase
          .from('student_detailed_grades')
          .select(`
            id,
            subject_id,
            component_type,
            grade_value,
            subject:subjects(
              id,
              code,
              name_vietnamese,
              category
            )
          `)
          .eq('student_id', studentSubmission.student_id)
          .eq('class_id', studentSubmission.class_id)
          .eq('period_id', gradeSubmission.period_id)

        // Fix subject data structure and process detailed grades into aggregated format
        const fixedDetailedGrades = (detailedGrades || []).map(grade => ({
          ...grade,
          subject: Array.isArray(grade.subject) ? grade.subject[0] : grade.subject
        }))
        const processedGrades = processDetailedGradesToAggregated(fixedDetailedGrades)

        const enrichedSubmission = {
          id: studentSubmission.id,
          submission_name: `${period?.name || 'Kỳ báo cáo'} - ${academicYear?.name || 'Năm học'}`,
          student_id: studentSubmission.student_id,
          created_at: studentSubmission.created_at,
          student: {
            id: student?.id || '',
            full_name: student?.full_name || '',
            student_id: student?.student_id || ''
          },
          class: {
            name: classInfo?.name || '',
            homeroom_teacher: {
              full_name: teacher?.full_name || ''
            }
          },
          semester: {
            name: semester?.name || 'Học kỳ'
          },
          academic_year: {
            name: academicYear?.name || 'Năm học'
          },
          grades: processedGrades,
          ai_feedback: gradeSubmission.ai_feedback,
          teacher_notes: gradeSubmission.teacher_notes,
          sent_to_parents_at: gradeSubmission.sent_to_parents_at
        }

        finalSubmissions.push(enrichedSubmission)
      }
    }

    console.log('✅ [STUDENT GRADES] Successfully processed submissions:', finalSubmissions.length)

    return {
      success: true,
      data: finalSubmissions
    }

  } catch (error) {
    console.error('❌ [STUDENT GRADES] Error in getStudentGradeSubmissionsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

// Get detailed grades for a specific student submission
export async function getStudentGradeSubmissionDetailAction(submissionId: string) {
  try {
    const { userId } = await checkStudentPermissions()
    const supabase = await createClient()

    // First verify student has access to this submission
    const { data: submission, error: submissionError } = await supabase
      .from('student_grade_submissions')
      .select(`
        *,
        student:profiles!student_id(
          id,
          full_name,
          student_id
        )
      `)
      .eq('id', submissionId)
      .eq('student_id', userId) // Ensure student can only access their own submissions
      .single()

    if (submissionError || !submission) {
      return {
        success: false,
        error: "Không tìm thấy bảng điểm"
      }
    }

    // Verify that this submission has been sent to parents
    const adminSupabase = createAdminClient()
    const { data: gradeSubmission } = await adminSupabase
      .from('grade_submissions')
      .select(`
        id,
        period_id,
        ai_feedback,
        teacher_notes,
        sent_to_parents_at,
        period:grade_reporting_periods!period_id(
          name,
          academic_year:academic_years!academic_year_id(name),
          semester:semesters!semester_id(name)
        )
      `)
      .eq('class_id', submission.class_id)
      .not('sent_to_parents_at', 'is', null)
      .order('sent_to_parents_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!gradeSubmission) {
      return {
        success: false,
        error: "Bảng điểm này chưa được giáo viên gửi"
      }
    }

    // Get detailed grades for this submission
    const { data: detailedGrades } = await adminSupabase
      .from('student_detailed_grades')
      .select(`
        id,
        subject_id,
        component_type,
        grade_value,
        subject:subjects(
          id,
          code,
          name_vietnamese,
          category
        )
      `)
      .eq('student_id', submission.student_id)
      .eq('class_id', submission.class_id)
      .eq('period_id', gradeSubmission.period_id)

    // Fix subject data structure and process detailed grades
    const fixedDetailedGrades = (detailedGrades || []).map(grade => ({
      ...grade,
      subject: Array.isArray(grade.subject) ? grade.subject[0] : grade.subject
    }))
    const processedGrades = processDetailedGradesToAggregated(fixedDetailedGrades)

    return {
      success: true,
      data: {
        ...submission,
        grades: processedGrades,
        ai_feedback: gradeSubmission.ai_feedback,
        teacher_notes: gradeSubmission.teacher_notes,
        period: gradeSubmission.period
      }
    }

  } catch (error) {
    console.error('Error in getStudentGradeSubmissionDetailAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}
