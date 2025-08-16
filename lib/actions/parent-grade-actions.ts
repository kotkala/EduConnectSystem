'use server'

import { createClient } from '@/utils/supabase/server'
import { checkParentPermissions, checkParentStudentAccess } from '@/lib/utils/permission-utils'

// Get children's grade reports that have been sent to parents by homeroom teachers
export async function getChildrenGradeReportsAction() {
  try {
    console.log('🔍 [PARENT GRADES] Starting getChildrenGradeReportsAction')
    const { userId } = await checkParentPermissions()
    console.log('🔍 [PARENT GRADES] Parent ID:', userId)
    const supabase = await createClient()

    // Get all children of this parent
    console.log('🔍 [PARENT GRADES] Fetching children for parent:', userId)
    const { data: children, error: childrenError } = await supabase
      .from('parent_student_relationships')
      .select(`
        student:profiles!student_id(
          id,
          full_name,
          student_id,
          email
        )
      `)
      .eq('parent_id', userId)

    console.log('🔍 [PARENT GRADES] Children query result:', {
      children: children?.length || 0,
      error: childrenError?.message || null
    })

    if (childrenError) {
      console.error('❌ [PARENT GRADES] Error fetching children:', childrenError)
      return {
        success: false,
        error: childrenError.message
      }
    }

    if (!children || children.length === 0) {
      console.log('⚠️ [PARENT GRADES] No children found for parent')
      return {
        success: true,
        data: []
      }
    }

    const studentIds = children.map(c => (c.student as { id?: string })?.id).filter(Boolean)
    console.log('🔍 [PARENT GRADES] Student IDs:', studentIds)

    // Get grade submissions that have been sent to parents by homeroom teachers
    // This uses the NEW homeroom teacher grade submission system
    console.log('🔍 [PARENT GRADES] Fetching grade submissions from NEW homeroom teacher system')
    const { data: gradeSubmissions, error: gradeSubmissionsError } = await supabase
      .from('grade_submissions')
      .select(`
        id,
        period_id,
        class_id,
        homeroom_teacher_id,
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
        ),
        class:classes(
          id,
          name,
          homeroom_teacher:profiles(full_name)
        )
      `)
      .not('sent_to_parents_at', 'is', null)
      .order('sent_to_parents_at', { ascending: false })

    console.log('🔍 [PARENT GRADES] Grade submissions query result:', {
      submissions: gradeSubmissions?.length || 0,
      error: gradeSubmissionsError?.message || null
    })

    if (gradeSubmissionsError) {
      console.error('❌ [PARENT GRADES] Error fetching grade submissions:', gradeSubmissionsError)
      return {
        success: false,
        error: gradeSubmissionsError.message
      }
    }

    if (!gradeSubmissions || gradeSubmissions.length === 0) {
      console.log('⚠️ [PARENT GRADES] No grade submissions found that have been sent to parents')
      return {
        success: true,
        data: []
      }
    }

    // For each grade submission, get the student grade submissions for our children
    console.log('🔍 [PARENT GRADES] Processing grade submissions to find student data')
    const allSubmissions = []

    for (const gradeSubmission of gradeSubmissions) {
      console.log('🔍 [PARENT GRADES] Processing grade submission:', {
        id: gradeSubmission.id,
        class_id: gradeSubmission.class_id,
        status: gradeSubmission.status,
        sent_to_parents_at: gradeSubmission.sent_to_parents_at
      })

      const { data: studentSubmissions, error: studentSubmissionsError } = await supabase
        .from('student_grade_submissions')
        .select(`
          *,
          student:profiles!student_id(
            id,
            full_name,
            student_id
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
        .eq('class_id', gradeSubmission.class_id)
        .in('student_id', studentIds)
        .eq('status', 'sent_to_teacher')

      console.log('🔍 [PARENT GRADES] Student submissions query result:', {
        submissions: studentSubmissions?.length || 0,
        error: studentSubmissionsError?.message || null
      })

      if (!studentSubmissionsError && studentSubmissions) {
        // Add grade submission context to each student submission
        const enrichedSubmissions = studentSubmissions.map(studentSubmission => {
          const period = Array.isArray(gradeSubmission.period) ? gradeSubmission.period[0] : gradeSubmission.period

          let academicYear = null
          if (period?.academic_year) {
            academicYear = Array.isArray(period.academic_year) ? period.academic_year[0] : period.academic_year
          }

          let semester = null
          if (period?.semester) {
            semester = Array.isArray(period.semester) ? period.semester[0] : period.semester
          }

          return {
            ...studentSubmission,
            submission_name: `${period?.name || 'Kỳ báo cáo'} - ${academicYear?.name || 'Năm học'}`,
            class: gradeSubmission.class,
            academic_year: academicYear,
            semester: semester,
            ai_feedback: gradeSubmission.ai_feedback ? {
              text: gradeSubmission.ai_feedback,
              created_at: gradeSubmission.sent_to_parents_at,
              rating: null
            } : null,
            teacher_notes: gradeSubmission.teacher_notes,
            sent_to_parents_at: gradeSubmission.sent_to_parents_at
          }
        })

        allSubmissions.push(...enrichedSubmissions)
        console.log('✅ [PARENT GRADES] Added', enrichedSubmissions.length, 'enriched submissions')
      }
    }

    console.log('✅ [PARENT GRADES] Final result:', {
      total_submissions: allSubmissions.length,
      using_new_homeroom_teacher_system: true,
      old_database_not_used: true
    })

    return {
      success: true,
      data: allSubmissions
    }
  } catch (error) {
    console.error('❌ [PARENT GRADES] Error fetching children grade reports:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách bảng điểm"
    }
  }
}

// Get detailed grades for a specific submission
export async function getStudentGradeDetailAction(submissionId: string) {
  try {
    const { userId } = await checkParentPermissions()
    const supabase = await createClient()

    // First verify parent has access to this submission
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
      .single()

    if (submissionError || !submission) {
      return {
        success: false,
        error: "Không tìm thấy bảng điểm"
      }
    }

    // Check if parent has access to this student
    try {
      await checkParentStudentAccess(userId, submission.student_id)
    } catch {
      return {
        success: false,
        error: "Bạn không có quyền xem bảng điểm này"
      }
    }

    // Verify that this submission has been sent to parents by checking grade_submissions
    const { data: gradeSubmission } = await supabase
      .from('grade_submissions')
      .select(`
        id,
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
      .single()

    if (!gradeSubmission) {
      return {
        success: false,
        error: "Bảng điểm này chưa được giáo viên gửi cho phụ huynh"
      }
    }

    // Get detailed submission with grades
    const { data: detailedSubmission, error: detailError } = await supabase
      .from('student_grade_submissions')
      .select(`
        *,
        student:profiles!student_id(
          id,
          full_name,
          student_id,
          email
        ),
        class:classes!class_id(
          name,
          homeroom_teacher:profiles!homeroom_teacher_id(
            full_name,
            email
          )
        ),
        grades:individual_subject_grades(
          *,
          subject:subjects(
            id,
            code,
            name_vietnamese,
            name_english,
            category
          )
        )
      `)
      .eq('id', submissionId)
      .single()

    if (detailError) {
      return {
        success: false,
        error: detailError.message
      }
    }

    // Add grade submission context and AI feedback to the response
    const period = Array.isArray(gradeSubmission.period) ? gradeSubmission.period[0] : gradeSubmission.period

    let academicYear = null
    if (period?.academic_year) {
      academicYear = Array.isArray(period.academic_year) ? period.academic_year[0] : period.academic_year
    }

    let semester = null
    if (period?.semester) {
      semester = Array.isArray(period.semester) ? period.semester[0] : period.semester
    }

    const responseData = {
      ...detailedSubmission,
      submission_name: `${period?.name || 'Kỳ báo cáo'} - ${academicYear?.name || 'Năm học'}`,
      academic_year: academicYear,
      semester: semester,
      ai_feedback: gradeSubmission.ai_feedback ? {
        text: gradeSubmission.ai_feedback,
        created_at: gradeSubmission.sent_to_parents_at,
        rating: null
      } : null,
      teacher_notes: gradeSubmission.teacher_notes,
      sent_to_parents_at: gradeSubmission.sent_to_parents_at
    }

    return {
      success: true,
      data: responseData
    }
  } catch (error) {
    console.error('Error fetching student grade detail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy chi tiết bảng điểm"
    }
  }
}

// Get grade statistics for a student
export async function getStudentGradeStatsAction(submissionId: string) {
  try {
    await checkParentPermissions()

    // Get submission details first
    const detailResult = await getStudentGradeDetailAction(submissionId)
    if (!detailResult.success || !detailResult.data) {
      return detailResult
    }

    const submission = detailResult.data
    const grades = submission.grades || []

    // Calculate statistics
    const validGrades = grades.filter((g: { average_grade?: number | null }) => g.average_grade !== null && g.average_grade !== undefined)
    
    if (validGrades.length === 0) {
      return {
        success: true,
        data: {
          totalSubjects: grades.length,
          gradedSubjects: 0,
          averageGrade: null,
          highestGrade: null,
          lowestGrade: null,
          excellentCount: 0,
          goodCount: 0,
          averageCount: 0,
          belowAverageCount: 0
        }
      }
    }

    const gradeValues = validGrades.map((g: { average_grade: number }) => g.average_grade)
    const averageGrade = Math.round((gradeValues.reduce((sum: number, grade: number) => sum + grade, 0) / gradeValues.length) * 10) / 10
    const highestGrade = Math.max(...gradeValues)
    const lowestGrade = Math.min(...gradeValues)

    // Count grade categories
    const excellentCount = gradeValues.filter((g: number) => g >= 8.5).length
    const goodCount = gradeValues.filter((g: number) => g >= 7.0 && g < 8.5).length
    const averageCount = gradeValues.filter((g: number) => g >= 5.0 && g < 7.0).length
    const belowAverageCount = gradeValues.filter((g: number) => g < 5.0).length

    return {
      success: true,
      data: {
        totalSubjects: grades.length,
        gradedSubjects: validGrades.length,
        averageGrade,
        highestGrade,
        lowestGrade,
        excellentCount,
        goodCount,
        averageCount,
        belowAverageCount
      }
    }
  } catch (error) {
    console.error('Error calculating grade statistics:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể tính toán thống kê điểm"
    }
  }
}
