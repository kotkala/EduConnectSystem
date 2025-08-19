﻿'use server'

import { createClient } from '@/lib/supabase/server'
import { checkParentPermissions, checkParentStudentAccess } from '@/lib/utils/permission-utils'

// Types for detailed grades processing
interface DetailedGrade {
  subject_id: string
  component_type: string
  grade_value: number
  subject?: {
    id?: string
    code?: string
    name_vietnamese?: string
    category?: string
  } | {
    id?: string
    code?: string
    name_vietnamese?: string
    category?: string
  }[]
}

interface SubjectGradeData {
  subject_id: string
  subject: {
    id?: string
    code?: string
    name_vietnamese?: string
    category?: string
  } | undefined
  midterm_grade: number | null
  final_grade: number | null
  average_grade: number | null
  grades: DetailedGrade[]
}

// Helper function to process detailed grades into aggregated format
function processDetailedGradesToAggregated(detailedGrades: DetailedGrade[]) {
  // Group grades by subject
  const gradesBySubject = new Map<string, SubjectGradeData>()

  detailedGrades.forEach((grade) => {
    const subjectId = grade.subject_id
    // Handle subject as array or single object
    const subject = Array.isArray(grade.subject) ? grade.subject[0] : grade.subject

    if (!gradesBySubject.has(subjectId)) {
      gradesBySubject.set(subjectId, {
        subject_id: subjectId,
        subject: subject,
        midterm_grade: null,
        final_grade: null,
        average_grade: null,
        grades: []
      })
    }
    gradesBySubject.get(subjectId)!.grades.push(grade)
  })

  // Process each subject's grades
  const result = []
  for (const [subjectId, subjectData] of gradesBySubject) {
    const grades = subjectData.grades

    // Find midterm and final grades
    const midtermGrade = grades.find((g) => g.component_type === 'midterm')
    const finalGrade = grades.find((g) => g.component_type === 'final')

    // Calculate average if both exist
    let averageGrade = null
    if (midtermGrade && finalGrade) {
      averageGrade = Math.round(((midtermGrade.grade_value + finalGrade.grade_value) / 2) * 10) / 10
    }

    result.push({
      subject_id: subjectId,
      midterm_grade: midtermGrade?.grade_value || null,
      final_grade: finalGrade?.grade_value || null,
      average_grade: averageGrade,
      subject: {
        id: subjectData.subject?.id || '',
        code: subjectData.subject?.code || '',
        name_vietnamese: subjectData.subject?.name_vietnamese || '',
        category: subjectData.subject?.category || ''
      }
    })
  }

  return result
}

// Get children's grade reports that have been sent to parents by homeroom teachers
// This uses the NEW homeroom teacher grade submission system
export async function getChildrenGradeReportsAction() {
  try {
    console.log('ðŸ” [PARENT GRADES] Starting NEW homeroom teacher system query')
    const { userId } = await checkParentPermissions()
    console.log('ðŸ” [PARENT GRADES] Parent ID:', userId)
    const supabase = await createClient()

    // Get all children of this parent
    console.log('ðŸ” [PARENT GRADES] Fetching children for parent:', userId)
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

    console.log('ðŸ” [PARENT GRADES] Children query result:', {
      children: children?.length || 0,
      error: childrenError?.message || null
    })

    if (childrenError) {
      console.error('âŒ [PARENT GRADES] Error fetching children:', childrenError)
      return {
        success: false,
        error: childrenError.message
      }
    }

    if (!children || children.length === 0) {
      console.log('âš ï¸ [PARENT GRADES] No children found for parent')
      return {
        success: true,
        data: []
      }
    }

    const studentIds = children.map(c => (c.student as { id?: string })?.id).filter(Boolean)
    console.log('ðŸ” [PARENT GRADES] Student IDs:', studentIds)

    // Get student grade submissions for our children that have been sent to homeroom teachers
    // and where the homeroom teacher has sent grades to parents
    console.log('ðŸ” [PARENT GRADES] Fetching student grade submissions from NEW system')
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
      .in('student_id', studentIds)
      .eq('status', 'sent_to_teacher')
      .order('updated_at', { ascending: false })

    console.log('ðŸ” [PARENT GRADES] Student submissions query result:', {
      submissions: studentSubmissions?.length || 0,
      error: studentSubmissionsError?.message || null
    })

    if (studentSubmissionsError) {
      console.error('âŒ [PARENT GRADES] Error fetching student submissions:', studentSubmissionsError)
      return {
        success: false,
        error: studentSubmissionsError.message
      }
    }

    if (!studentSubmissions || studentSubmissions.length === 0) {
      console.log('âš ï¸ [PARENT GRADES] No student submissions found')
      return {
        success: true,
        data: []
      }
    }

    // Now check which of these student submissions have been sent to parents by homeroom teachers
    console.log('ðŸ” [PARENT GRADES] Checking which submissions have been sent to parents')
    const finalSubmissions = []

    for (const studentSubmission of studentSubmissions) {
      // Ensure studentSubmission has required fields
      if (!studentSubmission.class_id || !studentSubmission.student_id) {
        console.warn('âš ï¸ [PARENT GRADES] Skipping submission with missing class_id or student_id:', studentSubmission.id)
        continue
      }

      // Check if there's a grade_submission for this class that has been sent to parents
      const { data: gradeSubmission, error: gradeSubmissionError } = await supabase
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
        const { data: detailedGrades } = await supabase
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

        // Process detailed grades into aggregated format
        const processedGrades = processDetailedGradesToAggregated(detailedGrades || [])

        const enrichedSubmission = {
          id: studentSubmission.id,
          submission_name: `${period?.name || 'Ká»³ bÃ¡o cÃ¡o'} - ${academicYear?.name || 'NÄƒm há»c'}`,
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
          academic_year: academicYear || { name: '' },
          semester: semester || { name: '' },
          grades: processedGrades,
          ai_feedback: gradeSubmission.ai_feedback ? {
            text: gradeSubmission.ai_feedback,
            created_at: gradeSubmission.sent_to_parents_at,
            rating: null
          } : null,
          teacher_notes: gradeSubmission.teacher_notes,
          sent_to_parents_at: gradeSubmission.sent_to_parents_at
        }

        finalSubmissions.push(enrichedSubmission)
        console.log('âœ… [PARENT GRADES] Added submission for student:', student?.full_name)
      }
    }

    console.log('âœ… [PARENT GRADES] Final result:', {
      total_submissions: finalSubmissions.length,
      using_new_homeroom_teacher_system: true,
      old_database_completely_removed: true
    })

    return {
      success: true,
      data: finalSubmissions
    }
  } catch (error) {
    console.error('âŒ [PARENT GRADES] Error fetching children grade reports:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "KhÃ´ng thá»ƒ láº¥y danh sÃ¡ch báº£ng Ä‘iá»ƒm"
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
        error: "KhÃ´ng tÃ¬m tháº¥y báº£ng Ä‘iá»ƒm"
      }
    }

    // Check if parent has access to this student
    try {
      await checkParentStudentAccess(userId, submission.student_id)
    } catch {
      return {
        success: false,
        error: "Báº¡n khÃ´ng cÃ³ quyá»n xem báº£ng Ä‘iá»ƒm nÃ y"
      }
    }

    // Verify that this submission has been sent to parents by checking grade_submissions
    const { data: gradeSubmission } = await supabase
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
      .single()

    if (!gradeSubmission) {
      return {
        success: false,
        error: "Báº£ng Ä‘iá»ƒm nÃ y chÆ°a Ä‘Æ°á»£c giÃ¡o viÃªn gá»­i cho phá»¥ huynh"
      }
    }

    // Get the period_id from the grade submission to filter detailed grades
    const periodId = gradeSubmission.period_id

    if (!periodId) {
      return {
        success: false,
        error: "KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin ká»³ bÃ¡o cÃ¡o"
      }
    }

    // Get detailed submission with grades for the specific period
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

    // Get detailed grades separately with proper filtering
    const { data: detailedGrades, error: gradesError } = await supabase
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
          name_english,
          category
        )
      `)
      .eq('student_id', detailedSubmission.student_id)
      .eq('class_id', detailedSubmission.class_id)
      .eq('period_id', periodId)

    if (gradesError) {
      console.error('Error fetching detailed grades:', gradesError)
      // Continue without grades rather than failing completely
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

    // Process detailed grades into aggregated format
    const processedGrades = processDetailedGradesToAggregated(detailedGrades || [])

    const responseData = {
      ...detailedSubmission,
      submission_name: `${period?.name || 'Ká»³ bÃ¡o cÃ¡o'} - ${academicYear?.name || 'NÄƒm há»c'}`,
      academic_year: academicYear,
      semester: semester,
      grades: processedGrades, // Replace detailed_grades with processed grades
      ai_feedback: gradeSubmission.ai_feedback ? {
        text: gradeSubmission.ai_feedback,
        created_at: gradeSubmission.sent_to_parents_at,
        rating: null
      } : null,
      teacher_notes: gradeSubmission.teacher_notes,
      sent_to_parents_at: gradeSubmission.sent_to_parents_at
    }

    // Remove the detailed_grades field to avoid confusion
    delete responseData.detailed_grades

    return {
      success: true,
      data: responseData
    }
  } catch (error) {
    console.error('Error fetching student grade detail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "KhÃ´ng thá»ƒ láº¥y chi tiáº¿t báº£ng Ä‘iá»ƒm"
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
      error: error instanceof Error ? error.message : "KhÃ´ng thá»ƒ tÃ­nh toÃ¡n thá»‘ng kÃª Ä‘iá»ƒm"
    }
  }
}
