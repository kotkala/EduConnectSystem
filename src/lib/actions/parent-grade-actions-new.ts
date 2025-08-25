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
function processDetailedGradesToAggregated(detailedGrades: Array<{
  subject_id: string
  component_type: string
  grade_value: string
  subject: {
    id: string
    code: string
    name_vietnamese: string
    category: string
  } | Array<{
    id: string
    code: string
    name_vietnamese: string
    category: string
  }>
}>) {
  const gradesBySubject = new Map()

  detailedGrades.forEach(grade => {
    const subjectId = grade.subject_id
    if (!gradesBySubject.has(subjectId)) {
      // Handle subject data that might be an array
      const subjectData = Array.isArray(grade.subject) ? grade.subject[0] : grade.subject

      gradesBySubject.set(subjectId, {
        subject_id: subjectId,
        subject: subjectData,
        midterm_grade: null,
        final_grade: null,
        average_grade: null
      })
    }

    const subjectGrades = gradesBySubject.get(subjectId)

    if (grade.component_type === 'midterm') {
      subjectGrades.midterm_grade = parseFloat(grade.grade_value)
    } else if (grade.component_type === 'final') {
      subjectGrades.final_grade = parseFloat(grade.grade_value)
    } else if (grade.component_type === 'summary' || grade.component_type.includes('summary')) {
      subjectGrades.average_grade = parseFloat(grade.grade_value)
    }
  })

  return Array.from(gradesBySubject.values())
}
