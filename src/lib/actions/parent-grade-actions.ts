'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkParentPermissions } from "@/lib/utils/permission-utils"

interface GradeSubmission {
  id: string
  submission_name: string
  student_id: string
  created_at: string
  student: {
    id: string
    full_name: string
    student_id: string
  }
  class: {
    name: string
    homeroom_teacher: { full_name: string }
  }
  academic_year: { name: string }
  semester: { name: string }
  period: {
    id: string
    name: string
    period_type: string
  }
  grades: Array<{
    subject_id: string
    midterm_grade: number | null
    final_grade: number | null
    average_grade: number | null
    subject: {
      id: string
      code: string
      name_vietnamese: string
      category: string
    }
  }>
  ai_feedback?: {
    text: string
    created_at: string
    rating: number | null
  } | null
}

// Get all grade reporting periods (for dropdown display)
export async function getAllGradeReportingPeriodsAction() {
  try {
    console.log('🔍 [PARENT GRADES] Fetching all grade reporting periods')
    await checkParentPermissions()

    // Use admin client to bypass RLS restrictions for reading periods
    const adminSupabase = createAdminClient()
    const { data: periods, error } = await adminSupabase
      .from('grade_reporting_periods')
      .select(`
        id,
        name,
        period_type,
        academic_year:academic_years(name),
        semester:semesters(name)
      `)
      .eq('is_active', true)

    if (error) {
      console.error('❌ [PARENT GRADES] Error fetching periods:', error)
      throw error
    }

    // Sort periods in chronological order
    const order = {
      'midterm_1': 1,
      'final_1': 2,
      'semester_1_summary': 3,
      'midterm_2': 4,
      'final_2': 5,
      'semester_2_summary': 6,
      'yearly_summary': 7
    }

    const sortedPeriods = periods ? [...periods].sort((a, b) => {
      return (order[a.period_type as keyof typeof order] || 999) - (order[b.period_type as keyof typeof order] || 999)
    }) : []

    console.log('✅ [PARENT GRADES] Found periods:', sortedPeriods.length)

    return {
      success: true,
      data: sortedPeriods.map(period => {
        const academicYear = Array.isArray(period.academic_year) ? period.academic_year[0] : period.academic_year
        const semester = Array.isArray(period.semester) ? period.semester[0] : period.semester

        return {
          id: period.id,
          name: period.name,
          academic_year: academicYear,
          semester: semester
        }
      })
    }

  } catch (error) {
    console.error('❌ [PARENT GRADES] Error in getAllGradeReportingPeriodsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get children's grade reports using the NEW homeroom teacher system
export async function getChildrenGradeReportsAction() {
  try {
    console.log('🔍 [PARENT GRADES] Starting NEW homeroom teacher system query')
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

    // Get homeroom submissions for these students
    console.log('🔍 [PARENT GRADES] Fetching homeroom submissions from NEW system')
    const { data: homeroomSubmissions, error: homeroomError } = await supabase
      .from('homeroom_parent_submissions')
      .select(`
        id,
        period_id,
        class_id,
        student_id,
        status,
        ai_feedback,
        submitted_at,
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
        ),
        period:grade_reporting_periods!period_id(
          id,
          name,
          period_type,
          academic_year:academic_years(name),
          semester:semesters(name)
        )
      `)
      .in('student_id', studentIds)
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })

    console.log('🔍 [PARENT GRADES] Homeroom submissions query result:', {
      submissions: homeroomSubmissions?.length || 0,
      error: homeroomError?.message || null
    })

    if (homeroomError) {
      console.error('❌ [PARENT GRADES] Error fetching homeroom submissions:', homeroomError)
      return {
        success: false,
        error: homeroomError.message
      }
    }

    if (!homeroomSubmissions || homeroomSubmissions.length === 0) {
      console.log('⚠️ [PARENT GRADES] No homeroom submissions found')
      return {
        success: true,
        data: []
      }
    }

    // Process homeroom submissions into the expected format
    console.log('🔍 [PARENT GRADES] Processing homeroom submissions')
    const finalSubmissions: GradeSubmission[] = []

    for (const submission of homeroomSubmissions) {
      // Get detailed grades for this student and period
      const adminSupabase = createAdminClient()
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
        .eq('period_id', submission.period_id)

      // Process detailed grades into aggregated format
      const processedGrades = processDetailedGradesToAggregated(detailedGrades || [])

      // Fix data structure to match expected types
      const student = Array.isArray(submission.student)
        ? submission.student[0]
        : submission.student

      const classInfo = Array.isArray(submission.class)
        ? submission.class[0]
        : submission.class

      const period = Array.isArray(submission.period)
        ? submission.period[0]
        : submission.period

      const homeroomTeacher = classInfo?.homeroom_teacher
      const teacher = Array.isArray(homeroomTeacher)
        ? homeroomTeacher[0]
        : homeroomTeacher

      const academicYear = period?.academic_year
      const academicYearData = Array.isArray(academicYear)
        ? academicYear[0]
        : academicYear

      const semester = period?.semester
      const semesterData = Array.isArray(semester)
        ? semester[0]
        : semester

      const enrichedSubmission: GradeSubmission = {
        id: submission.id,
        submission_name: `${period?.name || 'Kỳ báo cáo'} - ${academicYearData?.name || 'Năm học'}`,
        student_id: submission.student_id,
        created_at: submission.submitted_at,
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
        academic_year: {
          name: academicYearData?.name || ''
        },
        semester: {
          name: semesterData?.name || ''
        },
        period: {
          id: period?.id || '',
          name: period?.name || '',
          period_type: period?.period_type || ''
        },
        grades: processedGrades,
        ai_feedback: submission.ai_feedback ? {
          text: submission.ai_feedback,
          created_at: submission.submitted_at,
          rating: null
        } : null
      }

      finalSubmissions.push(enrichedSubmission)
      console.log('✅ [PARENT GRADES] Added submission for student:', student?.full_name)
    }

    console.log('✅ [PARENT GRADES] Final result:', {
      total_submissions: finalSubmissions.length,
      using_new_homeroom_teacher_system: true,
      old_database_completely_removed: true
    })

    return {
      success: true,
      data: finalSubmissions
    }

  } catch (error) {
    console.error('❌ [PARENT GRADES] Error in getChildrenGradeReportsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper function to process detailed grades into aggregated format
function processDetailedGradesToAggregated(detailedGrades: unknown[]) {
  console.log('🔍 [GRADE PROCESSING] Starting with', detailedGrades.length, 'detailed grades')

  const gradesBySubject = new Map()

  // Group grades by subject
  for (const gradeItem of detailedGrades) {
    const grade = gradeItem as {
      subject_id: string
      component_type: string
      grade_value: string
      subject: unknown
    }
    const subjectId = grade.subject_id
    const subjectData = Array.isArray(grade.subject) ? grade.subject[0] : grade.subject

    if (!gradesBySubject.has(subjectId)) {
      gradesBySubject.set(subjectId, {
        subject_id: subjectId,
        subject: subjectData,
        regular_grades: [],
        midterm_grade: null,
        final_grade: null,
        average_grade: null
      })
    }

    const subjectGrades = gradesBySubject.get(subjectId)

    console.log('🔍 [GRADE PROCESSING] Processing grade:', (grade.subject as any)?.code, grade.component_type, grade.grade_value)

    if (grade.component_type.startsWith('regular')) {
      // Handle regular_1, regular_2, regular_3, regular_4, etc.
      subjectGrades.regular_grades.push(parseFloat(grade.grade_value))
      console.log('✅ [GRADE PROCESSING] Added regular grade:', grade.grade_value, 'to', (grade.subject as any)?.code)
    } else if (grade.component_type === 'midterm') {
      subjectGrades.midterm_grade = parseFloat(grade.grade_value)
      console.log('✅ [GRADE PROCESSING] Added midterm grade:', grade.grade_value, 'to', (grade.subject as any)?.code)
    } else if (grade.component_type === 'final') {
      subjectGrades.final_grade = parseFloat(grade.grade_value)
      console.log('✅ [GRADE PROCESSING] Added final grade:', grade.grade_value, 'to', (grade.subject as any)?.code)
    } else if (grade.component_type === 'summary' || grade.component_type.includes('summary') || grade.component_type.includes('semester')) {
      // Handle summary, semester_1, semester_2, etc.
      subjectGrades.average_grade = parseFloat(grade.grade_value)
      console.log('✅ [GRADE PROCESSING] Added average grade:', grade.grade_value, 'to', (grade.subject as any)?.code)
    }
  }

  return Array.from(gradesBySubject.values())
}

// Get detailed grade information for a specific submission
export async function getStudentGradeDetailAction(submissionId: string) {
  try {
    console.log('🔍 [PARENT GRADE DETAIL] Starting query for submission:', submissionId)
    const { userId } = await checkParentPermissions()
    const supabase = await createClient()

    // Get the homeroom submission
    const { data: submission, error: submissionError } = await supabase
      .from('homeroom_parent_submissions')
      .select(`
        id,
        period_id,
        class_id,
        student_id,
        status,
        ai_feedback,
        submitted_at,
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
        ),
        period:grade_reporting_periods!period_id(
          id,
          name,
          period_type,
          academic_year:academic_years(name),
          semester:semesters(name)
        )
      `)
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      console.error('❌ [PARENT GRADE DETAIL] Error fetching submission:', submissionError)
      return {
        success: false,
        error: submissionError?.message || 'Submission not found'
      }
    }

    // Verify parent has access to this student
    const { data: parentAccess } = await supabase
      .from('parent_student_relationships')
      .select('id')
      .eq('parent_id', userId)
      .eq('student_id', submission.student_id)
      .single()

    if (!parentAccess) {
      console.error('❌ [PARENT GRADE DETAIL] Parent does not have access to this student')
      return {
        success: false,
        error: 'Access denied'
      }
    }

    // Get detailed grades for this submission
    const adminSupabase = createAdminClient()
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
      .eq('period_id', submission.period_id)

    // Process detailed grades
    console.log('🔍 [PARENT GRADE DETAIL] Processing', (detailedGrades || []).length, 'detailed grades')
    const processedGrades = processDetailedGradesToAggregated(detailedGrades || [])
    console.log('🔍 [PARENT GRADE DETAIL] Processed grades result:', processedGrades.length, 'subjects')

    // Fix data structure
    const student = Array.isArray(submission.student) ? submission.student[0] : submission.student
    const classInfo = Array.isArray(submission.class) ? submission.class[0] : submission.class
    const period = Array.isArray(submission.period) ? submission.period[0] : submission.period
    const teacher = Array.isArray(classInfo?.homeroom_teacher) ? classInfo.homeroom_teacher[0] : classInfo?.homeroom_teacher
    const academicYear = Array.isArray(period?.academic_year) ? period.academic_year[0] : period?.academic_year
    const semester = Array.isArray(period?.semester) ? period.semester[0] : period?.semester

    const result = {
      id: submission.id,
      submission_name: `${period?.name || 'Kỳ báo cáo'} - ${academicYear?.name || 'Năm học'} - ${semester?.name || 'Học kỳ'}`,
      student_id: submission.student_id,
      created_at: submission.submitted_at,
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
      academic_year: {
        name: academicYear?.name || ''
      },
      semester: {
        name: semester?.name || ''
      },
      grades: processedGrades,
      ai_feedback: submission.ai_feedback ? {
        text: submission.ai_feedback,
        created_at: submission.submitted_at,
        rating: null
      } : null,
      sent_to_parents_at: submission.submitted_at
    }

    console.log('✅ [PARENT GRADE DETAIL] Successfully processed submission')
    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('❌ [PARENT GRADE DETAIL] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Get grade statistics for a student
export async function getStudentGradeStatsAction(studentId: string) {
  try {
    console.log('🔍 [PARENT GRADE STATS] Starting query for student:', studentId)
    const { userId } = await checkParentPermissions()
    const supabase = await createClient()

    // Verify parent has access to this student
    const { data: parentAccess } = await supabase
      .from('parent_student_relationships')
      .select('id')
      .eq('parent_id', userId)
      .eq('student_id', studentId)
      .single()

    if (!parentAccess) {
      return {
        success: false,
        error: 'Access denied'
      }
    }

    // Get all detailed grades for this student
    const adminSupabase = createAdminClient()
    const { data: allGrades } = await adminSupabase
      .from('student_detailed_grades')
      .select(`
        grade_value,
        component_type,
        subject:subjects(name_vietnamese)
      `)
      .eq('student_id', studentId)
      .eq('component_type', 'summary')

    if (!allGrades || allGrades.length === 0) {
      return {
        success: true,
        data: {
          totalSubjects: 0,
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

    const grades = allGrades.map(g => parseFloat(g.grade_value)).filter(g => !isNaN(g))
    const totalSubjects = grades.length
    const averageGrade = grades.reduce((sum, grade) => sum + grade, 0) / totalSubjects
    const highestGrade = Math.max(...grades)
    const lowestGrade = Math.min(...grades)

    const gradeDistribution = {
      excellent: grades.filter(g => g >= 8).length,
      good: grades.filter(g => g >= 6.5 && g < 8).length,
      average: grades.filter(g => g >= 5 && g < 6.5).length,
      belowAverage: grades.filter(g => g < 5).length
    }

    return {
      success: true,
      data: {
        totalSubjects,
        gradedSubjects: totalSubjects,
        averageGrade: Math.round(averageGrade * 100) / 100,
        highestGrade,
        lowestGrade,
        excellentCount: gradeDistribution.excellent,
        goodCount: gradeDistribution.good,
        averageCount: gradeDistribution.average,
        belowAverageCount: gradeDistribution.belowAverage
      }
    }

  } catch (error) {
    console.error('❌ [PARENT GRADE STATS] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
