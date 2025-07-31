'use server'

import { createClient } from '@/utils/supabase/server'

// Helper function to check parent permissions
async function checkParentPermissions() {
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

  if (!profile || profile.role !== 'parent') {
    throw new Error("Parent access required")
  }

  return { user, profile }
}

// Get children's grade reports for parent
export async function getChildrenGradeReportsAction() {
  try {
    const { user } = await checkParentPermissions()
    const supabase = await createClient()

    // Get all children of this parent
    const { data: children, error: childrenError } = await supabase
      .from('parent_student_relationships')
      .select(`
        student:profiles!parent_student_relationships_student_id_fkey(
          id,
          full_name,
          student_id,
          email
        )
      `)
      .eq('parent_id', user.id)

    if (childrenError) {
      return {
        success: false,
        error: childrenError.message
      }
    }

    if (!children || children.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    const studentIds = children.map(c => (c.student as { id?: string })?.id).filter(Boolean)

    // Get grade submissions for all children
    const { data: submissions, error: submissionsError } = await supabase
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
          homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(full_name)
        ),
        academic_year:academic_years(name),
        semester:semesters(name),
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
      .in('student_id', studentIds)
      .eq('status', 'sent_to_teacher')
      .order('created_at', { ascending: false })

    if (submissionsError) {
      return {
        success: false,
        error: submissionsError.message
      }
    }

    return {
      success: true,
      data: submissions || []
    }
  } catch (error) {
    console.error('Error fetching children grade reports:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch grade reports"
    }
  }
}

// Get detailed grades for a specific submission
export async function getStudentGradeDetailAction(submissionId: string) {
  try {
    const { user } = await checkParentPermissions()
    const supabase = await createClient()

    // First verify parent has access to this submission
    const { data: submission, error: submissionError } = await supabase
      .from('student_grade_submissions')
      .select(`
        *,
        student:profiles!student_grade_submissions_student_id_fkey(
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
    const { data: relationship, error: relationshipError } = await supabase
      .from('parent_student_relationships')
      .select('id')
      .eq('parent_id', user.id)
      .eq('student_id', submission.student_id)
      .single()

    if (relationshipError || !relationship) {
      return {
        success: false,
        error: "Bạn không có quyền xem bảng điểm này"
      }
    }

    // Get detailed submission with grades
    const { data: detailedSubmission, error: detailError } = await supabase
      .from('student_grade_submissions')
      .select(`
        *,
        student:profiles!student_grade_submissions_student_id_fkey(
          id,
          full_name,
          student_id,
          email
        ),
        class:classes!student_grade_submissions_class_id_fkey(
          name,
          homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(
            full_name,
            email,
            phone
          )
        ),
        academic_year:academic_years(name),
        semester:semesters(name),
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

    return {
      success: true,
      data: detailedSubmission
    }
  } catch (error) {
    console.error('Error fetching student grade detail:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch grade detail"
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
      error: error instanceof Error ? error.message : "Failed to calculate grade statistics"
    }
  }
}
