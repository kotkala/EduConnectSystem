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
    regular_grades: number[] // **ADDED**: Regular grades (điểm miệng)
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

    // Get grade submissions for these students from the actual grade submission system
    // Use admin client to bypass RLS restrictions for period and class data
    console.log('🔍 [PARENT GRADES] Fetching grade submissions from grade_period_submissions')
    const adminSupabase = createAdminClient()
    const { data: gradeSubmissions, error: gradeError } = await adminSupabase
      .from('grade_period_submissions')
      .select(`
        id,
        period_id,
        class_id,
        subject_id,
        status,
        submitted_at,
        submission_name,
        grade_data,
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
      .eq('status', 'submitted')
      .order('submitted_at', { ascending: false })

    console.log('🔍 [PARENT GRADES] Grade submissions query result:', {
      submissions: gradeSubmissions?.length || 0,
      error: gradeError?.message || null
    })

    if (gradeError) {
      console.error('❌ [PARENT GRADES] Error fetching grade submissions:', gradeError)
      return {
        success: false,
        error: gradeError.message
      }
    }

    if (!gradeSubmissions || gradeSubmissions.length === 0) {
      console.log('⚠️ [PARENT GRADES] No grade submissions found')
      return {
        success: true,
        data: []
      }
    }

    // Filter submissions that contain data for our students
    const relevantSubmissions = gradeSubmissions.filter(submission => {
      if (!submission.grade_data) return false
      try {
        const gradeData = JSON.parse(submission.grade_data)
        return Array.isArray(gradeData) && gradeData.some(student => studentIds.includes(student.id))
      } catch {
        return false
      }
    })

    console.log('🔍 [PARENT GRADES] Processing grade submissions:', relevantSubmissions.length)

    // **CONSOLIDATION LOGIC**: Group submissions by period_id + student_id to create consolidated reports
    const consolidatedSubmissions = new Map<string, {
      representativeSubmissionId: string // Store the first submission ID for proper 73-char format
      period: {
        id: string
        name: string
        period_type: string
        academic_year?: { name: string }
        semester?: { name: string }
      } | null
      student: {
        id: string
        full_name: string
        student_id: string
      }
      class: {
        id: string
        name: string
        homeroom_teacher?: { full_name: string }
      } | null
      academic_year: { name: string } | null
      semester: { name: string } | null
      grades: Array<{
        subject_id: string
        regular_grades: number[] // **ADDED**: Regular grades (điểm miệng)
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
      submitted_at: string
      submission_name: string
    }>()

    for (const submission of relevantSubmissions) {
      // Parse grade data to find students
      let gradeData: Array<{
        id: string
        studentId: string
        studentName: string
        regularGrades: number[] // **ADDED**: Regular grades (điểm miệng)
        midtermGrade: number | null
        finalGrade: number | null
        summaryGrade: number | null
      }> = []
      try {
        gradeData = JSON.parse(submission.grade_data)
      } catch {
        continue
      }

      // Process each student in this submission
      for (const studentGrade of gradeData) {
        if (!studentIds.includes(studentGrade.id)) continue

        // Find the student profile
        const childRecord = children.find(child => {
          const student = Array.isArray(child.student) ? child.student[0] : child.student
          return student?.id === studentGrade.id
        })
        const studentProfile = Array.isArray(childRecord?.student) ? childRecord.student[0] : childRecord?.student
        if (!studentProfile) continue

        // Get subject information for this submission
        const adminSupabase = createAdminClient()
        const { data: subjectInfo } = await adminSupabase
          .from('subjects')
          .select('id, code, name_vietnamese, category')
          .eq('id', submission.subject_id)
          .single()

        if (!subjectInfo) continue

        // Create grade entry from the submission data
        const gradeEntry = {
          subject_id: subjectInfo.id,
          regular_grades: studentGrade.regularGrades || [], // **ADDED**: Regular grades (điểm miệng)
          midterm_grade: studentGrade.midtermGrade,
          final_grade: studentGrade.finalGrade,
          average_grade: studentGrade.summaryGrade,
          subject: {
            id: subjectInfo.id,
            code: subjectInfo.code,
            name_vietnamese: subjectInfo.name_vietnamese,
            category: subjectInfo.category
          }
        }

        // Fix data structure to match expected types
        const classInfo = Array.isArray(submission.class)
          ? submission.class[0]
          : submission.class

        const period = Array.isArray(submission.period)
          ? submission.period[0]
          : submission.period

        const academicYear = period?.academic_year
        const academicYearData = Array.isArray(academicYear)
          ? academicYear[0]
          : academicYear

        const semester = period?.semester
        const semesterData = Array.isArray(semester)
          ? semester[0]
          : semester

        // **CONSOLIDATION KEY**: Use period_id + student_id to group all subjects together
        const consolidationKey = `${period?.id || 'unknown'}-${studentGrade.id}`

        if (!consolidatedSubmissions.has(consolidationKey)) {
          // Create new consolidated submission with properly typed period data
          const consolidatedPeriod = period ? {
            id: period.id || '',
            name: period.name || '',
            period_type: period.period_type || '',
            academic_year: academicYearData,
            semester: semesterData
          } : null

          // Fix class data structure to handle array cases
          const consolidatedClass = classInfo ? {
            id: classInfo.id || '',
            name: classInfo.name || '',
            homeroom_teacher: classInfo.homeroom_teacher ? {
              full_name: Array.isArray(classInfo.homeroom_teacher)
                ? (classInfo.homeroom_teacher[0] as { full_name: string })?.full_name || ''
                : (classInfo.homeroom_teacher as { full_name: string }).full_name || ''
            } : undefined
          } : null

          consolidatedSubmissions.set(consolidationKey, {
            representativeSubmissionId: submission.id, // Store first submission ID for proper 73-char format
            period: consolidatedPeriod,
            student: studentProfile,
            class: consolidatedClass,
            academic_year: academicYearData,
            semester: semesterData,
            grades: [],
            submitted_at: submission.submitted_at,
            submission_name: submission.submission_name || `${period?.name || 'Kỳ báo cáo'} - ${academicYearData?.name || 'Năm học'}`
          })
        }

        // Add this subject's grade to the consolidated submission
        const consolidated = consolidatedSubmissions.get(consolidationKey)!
        consolidated.grades.push(gradeEntry)

        console.log('✅ [PARENT GRADES] Added subject to consolidated submission:', {
          student: studentProfile.full_name,
          period: period?.name,
          subject: subjectInfo.name_vietnamese,
          totalSubjects: consolidated.grades.length
        })
      }
    }

    // Convert consolidated submissions to final format
    const finalSubmissions: GradeSubmission[] = []
    for (const [, consolidated] of consolidatedSubmissions.entries()) {
      // **FIX**: Create proper 73-character submission ID using representative submission ID + student ID
      const properSubmissionId = `${consolidated.representativeSubmissionId}-${consolidated.student.id}`

      const enrichedSubmission: GradeSubmission = {
        id: properSubmissionId, // Use proper 73-character format: {36-char-uuid}-{36-char-uuid}
        submission_name: consolidated.submission_name,
        student_id: consolidated.student.id,
        created_at: consolidated.submitted_at,
        student: {
          id: consolidated.student.id,
          full_name: consolidated.student.full_name,
          student_id: consolidated.student.student_id
        },
        class: {
          name: consolidated.class?.name || '',
          homeroom_teacher: {
            full_name: consolidated.class?.homeroom_teacher?.full_name || ''
          }
        },
        academic_year: {
          name: consolidated.academic_year?.name || ''
        },
        semester: {
          name: consolidated.semester?.name || ''
        },
        period: {
          id: consolidated.period?.id || '',
          name: consolidated.period?.name || '',
          period_type: consolidated.period?.period_type || ''
        },
        grades: consolidated.grades, // ALL subjects in one grades array
        ai_feedback: null // No AI feedback in grade_period_submissions
      }

      finalSubmissions.push(enrichedSubmission)
      console.log('✅ [PARENT GRADES] Created consolidated submission:', {
        student: consolidated.student.full_name,
        period: consolidated.period?.name,
        totalSubjects: consolidated.grades.length,
        submissionId: properSubmissionId,
        idLength: properSubmissionId.length
      })
    }

    console.log('✅ [PARENT GRADES] Final result:', {
      total_submissions: finalSubmissions.length,
      using_grade_period_submissions: true,
      fixed_parent_grade_display_bug: true
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
      subject: {
        id: string
        code: string
        name_vietnamese: string
        category: string
      } | {
        id: string
        code: string
        name_vietnamese: string
        category: string
      }[]
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

    console.log('🔍 [GRADE PROCESSING] Processing grade:', subjectData?.code, grade.component_type, grade.grade_value)

    if (grade.component_type.startsWith('regular')) {
      // Handle regular_1, regular_2, regular_3, regular_4, etc.
      subjectGrades.regular_grades.push(parseFloat(grade.grade_value))
      console.log('✅ [GRADE PROCESSING] Added regular grade:', grade.grade_value, 'to', subjectData?.code)
    } else if (grade.component_type === 'midterm') {
      subjectGrades.midterm_grade = parseFloat(grade.grade_value)
      console.log('✅ [GRADE PROCESSING] Added midterm grade:', grade.grade_value, 'to', subjectData?.code)
    } else if (grade.component_type === 'final') {
      subjectGrades.final_grade = parseFloat(grade.grade_value)
      console.log('✅ [GRADE PROCESSING] Added final grade:', grade.grade_value, 'to', subjectData?.code)
    } else if (grade.component_type === 'summary' || grade.component_type.includes('summary') || grade.component_type.includes('semester')) {
      // Handle summary, semester_1, semester_2, etc.
      subjectGrades.average_grade = parseFloat(grade.grade_value)
      console.log('✅ [GRADE PROCESSING] Added average grade:', grade.grade_value, 'to', subjectData?.code)
    }
  }

  return Array.from(gradesBySubject.values())
}

// Get detailed grade information using UNIFIED data source (student_detailed_grades)
export async function getStudentGradeDetailAction(submissionId: string) {
  try {
    console.log('🔍 [PARENT GRADE DETAIL UNIFIED] Starting query for submission:', submissionId)
    const { userId } = await checkParentPermissions()
    const supabase = await createClient()

    // Parse composite ID (format: "grade_submission_uuid-student_uuid")
    if (submissionId.length !== 73) {
      return {
        success: false,
        error: 'Invalid submission ID format - incorrect length'
      }
    }

    const gradeSubmissionId = submissionId.substring(0, 36)
    const studentId = submissionId.substring(37, 73)

    console.log('🔍 [PARENT GRADE DETAIL UNIFIED] Parsed IDs:', { gradeSubmissionId, studentId })

    // Verify parent has access to this student
    const { data: parentAccessCheck } = await supabase
      .from('parent_student_relationships')
      .select('id')
      .eq('parent_id', userId)
      .eq('student_id', studentId)
      .single()

    if (!parentAccessCheck) {
      console.error('❌ [PARENT GRADE DETAIL UNIFIED] Parent does not have access to this student')
      return {
        success: false,
        error: 'Access denied'
      }
    }

    // Get basic submission information
    const { data: submissionInfo } = await supabase
      .from('grade_period_submissions')
      .select(`
        period_id,
        class_id,
        submission_name,
        submitted_at
      `)
      .eq('id', gradeSubmissionId)
      .single()

    if (!submissionInfo) {
      return {
        success: false,
        error: 'Grade submission not found'
      }
    }

    // Get detailed period information using admin client to bypass RLS
    console.log('🔍 [PARENT GRADE DETAIL] Fetching period info for:', submissionInfo.period_id)
    const adminSupabase = createAdminClient()
    const { data: periodInfo, error: periodError } = await adminSupabase
      .from('grade_reporting_periods')
      .select(`
        id,
        name,
        period_type,
        academic_year_id,
        semester_id
      `)
      .eq('id', submissionInfo.period_id)
      .single()

    console.log('🔍 [PARENT GRADE DETAIL] Period info result:', { periodInfo, periodError })

    // Get academic year and semester information separately to ensure proper data retrieval
    let academicYearInfo = null
    let semesterInfo = null

    if (periodInfo?.academic_year_id) {
      console.log('🔍 [PARENT GRADE DETAIL] Fetching academic year:', periodInfo.academic_year_id)
      const { data: academicYear, error: ayError } = await adminSupabase
        .from('academic_years')
        .select('id, name')
        .eq('id', periodInfo.academic_year_id)
        .single()
      console.log('🔍 [PARENT GRADE DETAIL] Academic year result:', { academicYear, ayError })
      academicYearInfo = academicYear
    }

    if (periodInfo?.semester_id) {
      console.log('🔍 [PARENT GRADE DETAIL] Fetching semester:', periodInfo.semester_id)
      const { data: semester, error: semesterError } = await adminSupabase
        .from('semesters')
        .select('id, name')
        .eq('id', periodInfo.semester_id)
        .single()
      console.log('🔍 [PARENT GRADE DETAIL] Semester result:', { semester, semesterError })
      semesterInfo = semester
    }

    // Get class information
    const { data: classInfo } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(
          id,
          full_name
        )
      `)
      .eq('id', submissionInfo.class_id)
      .single()

    // Get student profile information
    const { data: studentProfileData } = await supabase
      .from('profiles')
      .select('id, full_name, student_id')
      .eq('id', studentId)
      .single()

    if (!studentProfileData) {
      return {
        success: false,
        error: 'Student not found'
      }
    }

    // **UNIFIED DATA SOURCE**: Get ALL grades from student_detailed_grades (same as admin/teacher views)
    console.log('🔍 [PARENT GRADE DETAIL UNIFIED] Fetching ALL grades from student_detailed_grades')
    const { data: allGrades, error: gradesError } = await supabase
      .from('student_detailed_grades')
      .select(`
        subject_id,
        component_type,
        grade_value,
        period_id,
        subject:subjects(id, code, name_vietnamese, category)
      `)
      .eq('student_id', studentId)
      .eq('period_id', submissionInfo.period_id)

    if (gradesError) {
      console.error('❌ [PARENT GRADE DETAIL UNIFIED] Grades error:', gradesError)
      return {
        success: false,
        error: gradesError.message
      }
    }

    // Group grades by subject (same logic as admin/teacher views)
    interface SubjectGradeData {
      subject: {
        id: string
        code: string
        name_vietnamese: string
        category: string
      }
      regular_grades: number[]
      midterm_grade: number | null
      final_grade: number | null
      average_grade: number | null
    }

    const gradesBySubject = (allGrades || []).reduce((acc, grade) => {
      if (!acc[grade.subject_id]) {
        // Handle case where subject might be an array (Supabase join result)
        const subjectData = Array.isArray(grade.subject) ? grade.subject[0] : grade.subject
        acc[grade.subject_id] = {
          subject: {
            id: subjectData.id,
            code: subjectData.code,
            name_vietnamese: subjectData.name_vietnamese,
            category: subjectData.category
          },
          regular_grades: [],
          midterm_grade: null,
          final_grade: null,
          average_grade: null
        }
      }

      const gradeValue = parseFloat(grade.grade_value)
      if (grade.component_type.startsWith('regular_')) {
        acc[grade.subject_id].regular_grades.push(gradeValue)
      } else if (grade.component_type === 'midterm') {
        acc[grade.subject_id].midterm_grade = gradeValue
      } else if (grade.component_type === 'final') {
        acc[grade.subject_id].final_grade = gradeValue
      } else if (grade.component_type === 'summary') {
        acc[grade.subject_id].average_grade = gradeValue
      }

      return acc
    }, {} as Record<string, SubjectGradeData>)

    // Convert to consolidated grades format
    const consolidatedGrades = Object.entries(gradesBySubject).map(([subjectId, gradeData]) => ({
      subject_id: subjectId,
      regular_grades: gradeData.regular_grades,
      midterm_grade: gradeData.midterm_grade,
      final_grade: gradeData.final_grade,
      average_grade: gradeData.average_grade,
      subject: {
        id: gradeData.subject.id,
        code: gradeData.subject.code,
        name_vietnamese: gradeData.subject.name_vietnamese,
        category: gradeData.subject.category
      }
    }))

    console.log('✅ [PARENT GRADE DETAIL UNIFIED] Created consolidated grades for', consolidatedGrades.length, 'subjects')

    // Get AI feedback for this student and period
    let aiFeedbackData = null
    const submissionPeriodId = submissionInfo.period_id
    const submissionClassId = submissionInfo.class_id

    if (submissionPeriodId && submissionClassId) {
      console.log('🔍 [PARENT GRADE DETAIL UNIFIED] Fetching AI feedback for:', {
        student_id: studentId,
        period_id: submissionPeriodId,
        class_id: submissionClassId
      })

      const { data: feedbackData, error: feedbackError } = await supabase
        .from('ai_grade_feedback')
        .select('feedback_content, created_at, version_number, status')
        .eq('student_id', studentId)
        .eq('period_id', submissionPeriodId)
        .eq('class_id', submissionClassId)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (feedbackError) {
        console.error('❌ [PARENT GRADE DETAIL UNIFIED] AI feedback error:', feedbackError)
      }

      if (feedbackData) {
        console.log('✅ [PARENT GRADE DETAIL UNIFIED] Found AI feedback:', {
          content_length: feedbackData.feedback_content?.length,
          status: feedbackData.status,
          version: feedbackData.version_number
        })
        aiFeedbackData = {
          text: feedbackData.feedback_content,
          created_at: feedbackData.created_at,
          rating: null // Rating not used in current system
        }
      } else {
        console.log('⚠️ [PARENT GRADE DETAIL UNIFIED] No AI feedback found')
      }
    }

    // Handle homeroom teacher data (might be array from Supabase join)
    const teacher = Array.isArray(classInfo?.homeroom_teacher) ? classInfo.homeroom_teacher[0] : classInfo?.homeroom_teacher

    // Build result using unified data structure with separate query results
    const unifiedResult = {
      id: submissionId,
      submission_name: submissionInfo.submission_name || `${periodInfo?.name || 'Kỳ báo cáo'} - ${academicYearInfo?.name || 'Năm học'}`,
      student_id: studentId,
      created_at: submissionInfo.submitted_at,
      student: {
        id: studentProfileData.id,
        full_name: studentProfileData.full_name,
        student_id: studentProfileData.student_id
      },
      class: {
        name: classInfo?.name || '',
        homeroom_teacher: {
          full_name: teacher?.full_name || ''
        }
      },
      academic_year: {
        name: academicYearInfo?.name || ''
      },
      semester: {
        name: semesterInfo?.name || ''
      },
      period: {
        id: periodInfo?.id || '',
        name: periodInfo?.name || '',
        period_type: periodInfo?.period_type || ''
      },
      grades: consolidatedGrades, // **UNIFIED**: All subjects from student_detailed_grades
      ai_feedback: aiFeedbackData, // **UNIFIED**: AI feedback from ai_grade_feedback table
      sent_to_parents_at: submissionInfo.submitted_at
    }

    console.log('✅ [PARENT GRADE DETAIL UNIFIED] Successfully created unified grade detail')
    console.log('🔍 [DEBUG] Final result data:', {
      academic_year: unifiedResult.academic_year,
      semester: unifiedResult.semester,
      period: unifiedResult.period,
      academicYearInfo,
      semesterInfo,
      periodInfo
    })
    return {
      success: true,
      data: unifiedResult
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
export async function getStudentGradeStatsAction(submissionId: string) {
  try {
    console.log('🔍 [PARENT GRADE STATS] Starting query for submission:', submissionId)
    const { userId } = await checkParentPermissions()
    const supabase = await createClient()

    // Parse composite ID (format: "grade_submission_uuid-student_uuid")
    // Each UUID is exactly 36 characters, so total should be 73 (36 + 1 + 36)
    if (submissionId.length !== 73) {
      return {
        success: false,
        error: 'Invalid submission ID format - incorrect length'
      }
    }

    const studentId = submissionId.substring(37, 73) // Characters 37-73 (skip the dash at position 36)

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

// Get all available periods for a specific student (for dropdown)
export async function getStudentAvailablePeriodsAction(studentId: string) {
  try {
    console.log('🔍 [PARENT PERIODS] Getting available periods for student:', studentId)
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

    // Get all periods where this student has grades
    const { data: periods, error } = await supabase
      .from('student_detailed_grades')
      .select(`
        period_id,
        period:grade_reporting_periods(
          id,
          name,
          period_type,
          academic_year_id,
          semester_id
        )
      `)
      .eq('student_id', studentId)

    if (error) {
      console.error('❌ [PARENT PERIODS] Error:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Get unique periods and fetch academic year/semester info
    const periodMap = new Map()
    periods?.forEach(p => {
      if (p.period && Array.isArray(p.period) && p.period.length > 0) {
        periodMap.set(p.period_id, p.period[0])
      } else if (p.period && !Array.isArray(p.period)) {
        periodMap.set(p.period_id, p.period)
      }
    })

    const uniquePeriods = Array.from(periodMap.values()).filter(Boolean)

    const periodsWithDetails = await Promise.all(
      uniquePeriods.map(async (period: {
        id: string
        name: string
        period_type: string
        academic_year_id: string
        semester_id: string
      }) => {
        let academicYearName = ''
        let semesterName = ''

        if (period?.academic_year_id) {
          const { data: academicYear } = await supabase
            .from('academic_years')
            .select('name')
            .eq('id', period.academic_year_id)
            .single()
          academicYearName = academicYear?.name || ''
        }

        if (period?.semester_id) {
          const { data: semester } = await supabase
            .from('semesters')
            .select('name')
            .eq('id', period.semester_id)
            .single()
          semesterName = semester?.name || ''
        }

        return {
          id: period.id,
          name: period.name,
          period_type: period.period_type,
          academic_year_name: academicYearName,
          semester_name: semesterName,
          display_name: `${period.name} - ${academicYearName} - ${semesterName}`
        }
      })
    )

    return {
      success: true,
      data: periodsWithDetails
    }

  } catch (error) {
    console.error('❌ [PARENT PERIODS] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
