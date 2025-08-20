"use server"

import { createClient } from "@/shared/utils/supabase/server"
import { createAdminClient } from "@/shared/utils/supabase/admin"
import { checkAdminPermissions } from "@/lib/utils/permission-utils"
import { sendTeacherGradeNotificationEmail } from "@/lib/services/email-service"

// Helper function to store calculated summary grade in database
async function storeSummaryGradeInDatabase(
  studentId: string,
  subjectId: string,
  periodId: string,
  summaryGrade: number
) {
  try {
    const supabase = await createClient()

    // Find the class_id for this student
    const { data: classAssignment } = await supabase
      .from('student_class_assignments')
      .select('class_id')
      .eq('student_id', studentId)
      .single()

    if (!classAssignment) return

    // Get period information to determine correct component type
    const { data: periodInfo } = await supabase
      .from('grade_reporting_periods')
      .select('period_type')
      .eq('id', periodId)
      .single()

    let componentType = 'semester_1' // default
    if (periodInfo?.period_type) {
      if (periodInfo.period_type.includes('final_2') || periodInfo.period_type.includes('semester_2')) {
        componentType = 'semester_2'
      } else if (periodInfo.period_type.includes('yearly') || periodInfo.period_type.includes('annual')) {
        componentType = 'yearly'
      }
    }

    // Insert or update the summary grade
    await supabase
      .from('student_detailed_grades')
      .upsert({
        period_id: periodId,
        student_id: studentId,
        subject_id: subjectId,
        class_id: classAssignment.class_id,
        component_type: componentType,
        grade_value: Math.round(summaryGrade * 100) / 100,
        summary_grade: Math.round(summaryGrade * 100) / 100,
        created_by: null
      }, {
        onConflict: 'period_id,student_id,subject_id,class_id,component_type'
      })
  } catch (error) {
    console.error('Error storing summary grade:', error)
  }
}

// Types
export interface GradePeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  period_type: string
  status: string
  academic_years?: { name: string }[]
  semesters?: { name: string }[]
}

export interface StudentGradeData {
  student_id: string
  student_name: string
  student_number: string
  class_id: string
  class_name: string
  total_subjects: number
  subjects_with_grades: number
  completion_rate: number
  overall_average: number | null
  last_updated: string
  submission_count: number
  submission_status: 'not_submitted' | 'submitted' | 'resubmitted'
  submission_reason?: string
  grade_distribution: {
    excellent: number
    good: number
    average: number
    poor: number
  }
  subjects: Array<{
    subject_id: string
    subject_name: string
    teacher_name: string
    average_grade: number | null
    has_grades: boolean
  }>
}

export interface StudentDetailedGrades {
  student_id: string
  student_name: string
  student_number: string
  class_id: string
  class_name: string
  subjects: Array<{
    subject_id: string
    subject_name: string
    teacher_name: string
    grade_components: {
      regular_grades: number[]
      midterm_grade: number | null
      final_grade: number | null
      summary_grade: number | null
    }
    average_grade: number | null
  }>
}

export interface AdminGradeStats {
  total_classes: number
  total_students: number
  total_subjects: number
  overall_completion_rate: number
  overall_average_grade: number | null
  total_submissions: number
  pending_submissions: number
}

export interface GradeSubmissionData {
  id: string
  period_id: string
  class_id: string
  subject_id: string
  teacher_id: string
  submission_count: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submitted_at: string | null
  approved_at: string | null
  submission_reason?: string
  created_at: string
  updated_at: string
}

// Get all grade periods for dropdown
export async function getGradePeriodsAction(): Promise<{
  success: boolean
  data?: GradePeriod[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    await checkAdminPermissions()

    const { data, error } = await supabase
      .from('grade_reporting_periods')
      .select(`
        id,
        name,
        start_date,
        end_date,
        is_active,
        period_type,
        status,
        academic_years!academic_year_id(name),
        semesters!semester_id(name)
      `)
      .order('start_date', { ascending: false })

    if (error) throw error

    return {
      success: true,
      data: data || []
    }

  } catch (error) {
    // Comprehensive error logging
    console.error('=== ERROR FETCHING GRADE PERIODS ===')
    console.error('Error type:', typeof error)
    console.error('Error instance:', error instanceof Error)
    console.error('Full error object:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('=====================================')

    let errorMessage = 'Lỗi không xác định khi tải danh sách kỳ báo cáo'
    if (error instanceof Error) {
      errorMessage = `Lỗi tải kỳ báo cáo: ${error.message}`
      if (error.message.includes('permission')) {
        errorMessage = 'Không có quyền truy cập danh sách kỳ báo cáo'
      } else if (error.message.includes('network')) {
        errorMessage = 'Lỗi kết nối mạng khi tải kỳ báo cáo'
      }
    } else {
      errorMessage = `Lỗi không xác định: ${JSON.stringify(error)}`
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

// Get student-centric grade tracking data for a specific period
export async function getStudentGradeTrackingDataAction(periodId: string): Promise<{
  success: boolean
  data?: StudentGradeData[]
  stats?: AdminGradeStats
  error?: string
}> {
  try {
    // Validate input parameters
    if (!periodId || typeof periodId !== 'string') {
      return {
        success: false,
        error: 'ID kỳ báo cáo không hợp lệ'
      }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(periodId)) {
      return {
        success: false,
        error: 'Định dạng ID kỳ báo cáo không hợp lệ'
      }
    }

    const supabase = await createClient()
    await checkAdminPermissions()

    // Get grade data with proper joins - specify the correct foreign key relationship
    const { data: gradeData, error: gradeError } = await supabase
      .from('student_detailed_grades')
      .select(`
        period_id,
        class_id,
        subject_id,
        student_id,
        component_type,
        grade_value,
        created_at,
        updated_at,
        classes(id, name),
        subjects(id, name_vietnamese),
        profiles!student_detailed_grades_student_id_fkey(id, full_name, student_id)
      `)
      .eq('period_id', periodId)

    if (gradeError) {
      console.error('Supabase grade data query error:', gradeError)
      throw new Error(`Database query failed: ${gradeError.message || gradeError.code || 'Unknown database error'}`)
    }

    // Get teacher information for subjects
    const { data: teacherData, error: teacherError } = await supabase
      .from('teachers_for_subjects')
      .select(`
        subject_id,
        teacher_name
      `)

    if (teacherError) throw teacherError

    // Get teacher submission data for this period
    const { data: teacherSubmissionData, error: teacherSubmissionError } = await supabase
      .from('grade_period_submissions')
      .select(`
        id,
        period_id,
        class_id,
        subject_id,
        teacher_id,
        submission_count,
        status,
        submitted_at,
        created_at,
        updated_at
      `)
      .eq('period_id', periodId)
      .eq('status', 'submitted')

    if (teacherSubmissionError) throw teacherSubmissionError

    // Get submission data for students (admin to parent submissions)
    const { data: submissionData, error: submissionError } = await supabase
      .from('homeroom_parent_submissions')
      .select(`
        id,
        period_id,
        class_id,
        student_id,
        submission_count,
        status,
        submitted_at,
        submission_reason,
        created_at,
        updated_at
      `)
      .eq('period_id', periodId)

    if (submissionError) throw submissionError

    // Process and aggregate data by student
    const studentMap = new Map<string, StudentGradeData>()

    // Initialize students and their subjects
    if (gradeData) {
      for (const grade of gradeData) {
        const studentId = grade.student_id
        if (!studentMap.has(studentId)) {
          const submission = submissionData?.find(s =>
            s.student_id === studentId && s.class_id === grade.class_id
          )

          // Handle Supabase joined data safely - Supabase returns arrays for joins
          const classData = Array.isArray(grade.classes) ? grade.classes[0] : grade.classes
          const studentData = Array.isArray(grade.profiles) ? grade.profiles[0] : grade.profiles

          studentMap.set(studentId, {
            student_id: studentId,
            student_name: studentData?.full_name || 'Unknown',
            student_number: studentData?.student_id || 'Unknown',
            class_id: grade.class_id,
            class_name: classData?.name || 'Unknown',
            total_subjects: 0,
            subjects_with_grades: 0,
            completion_rate: 0,
            overall_average: null,
            last_updated: grade.updated_at || grade.created_at,
            submission_count: submission?.submission_count || 0,
            submission_status: submission?.status === 'submitted' ? 'submitted' :
                             submission?.submission_count > 1 ? 'resubmitted' : 'not_submitted',
            submission_reason: submission?.submission_reason,
            grade_distribution: {
              excellent: 0,
              good: 0,
              average: 0,
              poor: 0
            },
            subjects: []
          })
        }
      }

      // Group grades by student and subject
      const studentSubjectGrades = new Map<string, Map<string, Array<{
        student_id: string
        subject_id: string
        component_type: string
        grade_value: number | null
        subjects: unknown
      }>>>()
      for (const grade of gradeData) {
        const studentId = grade.student_id
        const subjectId = grade.subject_id

        if (!studentSubjectGrades.has(studentId)) {
          studentSubjectGrades.set(studentId, new Map())
        }

        const studentGrades = studentSubjectGrades.get(studentId)!
        if (!studentGrades.has(subjectId)) {
          studentGrades.set(subjectId, [])
        }

        studentGrades.get(subjectId)!.push(grade)
      }

      // Calculate subject averages and populate student data
      for (const [studentId, student] of studentMap) {
        const studentGrades = studentSubjectGrades.get(studentId)
        if (!studentGrades) continue

        const subjectAverages: number[] = []

        for (const [subjectId, grades] of studentGrades) {
          const subjectData = Array.isArray(grades[0].subjects) ? grades[0].subjects[0] : grades[0].subjects
          const teacherInfo = teacherData?.find(t => t.subject_id === subjectId)

          // Calculate average for this subject
          const summaryGrades = grades.filter(g => g.component_type === 'summary' && g.grade_value !== null)
          let subjectAverage: number | null = null

          if (summaryGrades.length > 0) {
            subjectAverage = summaryGrades.reduce((sum, g) => sum + (g.grade_value || 0), 0) / summaryGrades.length
            subjectAverages.push(subjectAverage)
          }

          student.subjects.push({
            subject_id: subjectId,
            subject_name: subjectData?.name_vietnamese || 'Unknown',
            teacher_name: teacherInfo?.teacher_name || 'Unknown',
            average_grade: subjectAverage ? Math.round(subjectAverage * 10) / 10 : null,
            has_grades: summaryGrades.length > 0
          })
        }

        // Calculate student statistics
        student.total_subjects = student.subjects.length
        student.subjects_with_grades = student.subjects.filter(s => s.has_grades).length
        student.completion_rate = student.total_subjects > 0
          ? Math.round((student.subjects_with_grades / student.total_subjects) * 100 * 10) / 10
          : 0

        // Calculate overall average
        if (subjectAverages.length > 0) {
          student.overall_average = Math.round((subjectAverages.reduce((sum, avg) => sum + avg, 0) / subjectAverages.length) * 10) / 10

          // Calculate grade distribution
          subjectAverages.forEach(avg => {
            if (avg >= 8) student.grade_distribution.excellent++
            else if (avg >= 6.5) student.grade_distribution.good++
            else if (avg >= 5) student.grade_distribution.average++
            else student.grade_distribution.poor++
          })
        }
      }
    }

    const processedData = Array.from(studentMap.values())

    // Calculate overall statistics
    const totalClasses = new Set(processedData.map(d => d.class_id)).size
    const totalStudents = processedData.length
    const totalSubjects = processedData.reduce((sum, d) => sum + d.total_subjects, 0) / (processedData.length || 1)
    const totalStudentsWithGrades = processedData.reduce((sum, d) => sum + d.subjects_with_grades, 0)
    const overallCompletionRate = totalStudents > 0 ? (totalStudentsWithGrades / (totalStudents * totalSubjects)) * 100 : 0
    const validGrades = processedData.filter(d => d.overall_average !== null)
    const overallAverageGrade = validGrades.length > 0
      ? validGrades.reduce((sum, d) => sum + (d.overall_average || 0), 0) / validGrades.length
      : null

    const stats: AdminGradeStats = {
      total_classes: totalClasses,
      total_students: totalStudents,
      total_subjects: Math.round(totalSubjects),
      overall_completion_rate: Math.round(overallCompletionRate * 10) / 10,
      overall_average_grade: overallAverageGrade ? Math.round(overallAverageGrade * 10) / 10 : null,
      total_submissions: (submissionData?.length || 0) + (teacherSubmissionData?.length || 0),
      pending_submissions: (submissionData?.filter(s => s.status === 'draft').length || 0) + (teacherSubmissionData?.filter(s => s.status === 'submitted').length || 0)
    }

    return {
      success: true,
      data: processedData,
      stats
    }



  } catch (error) {
    // Comprehensive error logging for debugging
    console.error('=== ERROR FETCHING GRADE TRACKING DATA ===')
    console.error('Period ID:', periodId)
    console.error('Error type:', typeof error)
    console.error('Error instance:', error instanceof Error)
    console.error('Full error object:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error name:', error instanceof Error ? error.name : 'No name')
    console.error('Error message:', error instanceof Error ? error.message : 'No message')

    // Log additional context
    console.error('Function context:')
    console.error('- Period ID validation passed:', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(periodId))
    console.error('- Current timestamp:', new Date().toISOString())
    console.error('==========================================')

    // Provide detailed error messages based on error type
    let errorMessage = 'Lỗi không xác định khi tải dữ liệu điểm số'

    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        errorMessage = 'Không có quyền truy cập dữ liệu điểm số'
      } else if (error.message.includes('Database query failed')) {
        errorMessage = `Lỗi truy vấn cơ sở dữ liệu: ${error.message.replace('Database query failed: ', '')}`
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Dữ liệu không hợp lệ'
      } else if (error.message.includes('PGRST')) {
        errorMessage = `Lỗi PostgREST: ${error.message}`
      } else if (error.message.includes('JWT')) {
        errorMessage = 'Lỗi xác thực - vui lòng đăng nhập lại'
      } else if (error.message.includes('network')) {
        errorMessage = 'Lỗi kết nối mạng'
      } else {
        errorMessage = `Lỗi hệ thống: ${error.message}`
      }
    } else {
      errorMessage = `Lỗi không xác định: ${JSON.stringify(error)}`
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

// Get detailed grades for a specific student
export async function getStudentDetailedGradesAction(
  periodId: string,
  studentId: string
): Promise<{
  success: boolean
  data?: StudentDetailedGrades
  error?: string
}> {
  try {
    // Validate input parameters
    if (!periodId || !studentId) {
      return {
        success: false,
        error: 'Thiếu thông tin kỳ báo cáo hoặc học sinh'
      }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(periodId) || !uuidRegex.test(studentId)) {
      return {
        success: false,
        error: 'Định dạng ID không hợp lệ'
      }
    }

    const supabase = await createClient()
    await checkAdminPermissions()

    // Get period information to check if it's a summary period
    const { data: periodInfo, error: periodError } = await supabase
      .from('grade_reporting_periods')
      .select('name, period_type, academic_year_id, semester_id')
      .eq('id', periodId)
      .single()

    if (periodError) throw periodError

    // Check if this is a summary period
    const isSummaryPeriod = periodInfo.period_type?.includes('summary') || periodInfo.name.includes('Tổng kết')

    // Get student basic info
    const { data: studentInfo, error: studentError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        student_id,
        student_class_assignments!student_class_assignments_student_id_fkey(
          class_id,
          classes!inner(id, name)
        )
      `)
      .eq('id', studentId)
      .single()

    if (studentError) throw studentError

    // Get class assignments for teacher lookup
    const classAssignments = studentInfo.student_class_assignments as Array<{
      class_id: string;
      classes: Array<{ id: string; name: string }>
    }>

    let gradeData = null
    let gradeError = null

    if (isSummaryPeriod) {
      // For summary periods, get grades from all component periods in the same semester
      const { data: componentPeriods, error: componentError } = await supabase
        .from('grade_reporting_periods')
        .select('id')
        .eq('academic_year_id', periodInfo.academic_year_id)
        .eq('semester_id', periodInfo.semester_id)
        .not('period_type', 'like', '%summary%')

      if (componentError) throw componentError

      const componentPeriodIds = componentPeriods?.map(p => p.id) || []

      // Get grades from component periods AND summary period
      const allPeriodIds = [...componentPeriodIds, periodId]

      const { data: allGrades, error: allGradesError } = await supabase
        .from('student_detailed_grades')
        .select(`
          subject_id,
          class_id,
          component_type,
          grade_value,
          created_at,
          updated_at,
          subjects!student_detailed_grades_subject_id_fkey(id, name_vietnamese)
        `)
        .in('period_id', allPeriodIds)
        .eq('student_id', studentId)
        .order('subject_id')
        .order('component_type')
        .order('updated_at', { ascending: false })

      gradeData = allGrades
      gradeError = allGradesError
    } else {
      // For regular periods, get grades from the specific period only
      const { data: regularGrades, error: regularGradeError } = await supabase
        .from('student_detailed_grades')
        .select(`
          subject_id,
          class_id,
          component_type,
          grade_value,
          created_at,
          updated_at,
          subjects!student_detailed_grades_subject_id_fkey(id, name_vietnamese)
        `)
        .eq('period_id', periodId)
        .eq('student_id', studentId)
        .order('subject_id')
        .order('component_type')
        .order('updated_at', { ascending: false })

      gradeData = regularGrades
      gradeError = regularGradeError
    }

    if (gradeError) throw gradeError

    // Get teacher assignments for this student's classes
    const { data: teacherAssignments, error: teacherAssignmentError } = await supabase
      .from('teacher_class_assignments')
      .select(`
        subject_id,
        teacher_id,
        class_id
      `)
      .in('class_id', classAssignments?.map(ca => ca.class_id) || [])
      .eq('academic_year_id', periodInfo.academic_year_id)
      .eq('is_active', true)

    if (teacherAssignmentError) throw teacherAssignmentError

    // Get teacher names separately to avoid relationship conflicts
    const teacherIds = [...new Set(teacherAssignments?.map(ta => ta.teacher_id) || [])]
    const { data: teacherProfiles, error: teacherProfileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', teacherIds)

    if (teacherProfileError) throw teacherProfileError

    // Create teacher lookup map
    const teacherMap = new Map()
    teacherProfiles?.forEach(teacher => {
      teacherMap.set(teacher.id, teacher.full_name)
    })

    // Create subject-teacher mapping
    const subjectTeacherMap = new Map()
    teacherAssignments?.forEach(assignment => {
      const teacherName = teacherMap.get(assignment.teacher_id)
      if (teacherName) {
        subjectTeacherMap.set(`${assignment.subject_id}_${assignment.class_id}`, teacherName)
      }
    })

    // Process grades by subject
    const subjectMap = new Map<string, {
      subject_id: string
      subject_name: string
      teacher_name: string
      grade_components: {
        regular_grades: number[]
        midterm_grade: number | null
        final_grade: number | null
        summary_grade: number | null
      }
    }>()

    if (gradeData) {
      for (const grade of gradeData) {
        const subjectId = grade.subject_id

        if (!subjectMap.has(subjectId)) {
          // Access subject data from the foreign key relationship - handle both array and object cases
          const subjectData = (() => {
            const subjects = grade.subjects
            if (Array.isArray(subjects)) {
              return subjects[0]
            }
            return subjects as { id: string; name_vietnamese: string }
          })()

          // Get teacher name using the subject-teacher mapping
          // Use the class_id from the actual grade record, not just the first class assignment
          const gradeClassId = grade.class_id || classAssignments?.[0]?.class_id || ''
          const teacherName = subjectTeacherMap.get(`${subjectId}_${gradeClassId}`) || 'Unknown'

          subjectMap.set(subjectId, {
            subject_id: subjectId,
            subject_name: subjectData?.name_vietnamese || 'Unknown',
            teacher_name: teacherName,
            grade_components: {
              regular_grades: [],
              midterm_grade: null,
              final_grade: null,
              summary_grade: null
            }
          })
        }

        const subject = subjectMap.get(subjectId)
        if (subject && grade.grade_value !== null) {
          if (grade.component_type.startsWith('regular_')) {
            // For regular grades, only add if not already present (since we ordered by updated_at desc, first one is most recent)
            const existingRegularIndex = subject.grade_components.regular_grades.findIndex((_, index) => {
              const expectedType = `regular_${index + 1}`
              return expectedType === grade.component_type
            })
            if (existingRegularIndex === -1) {
              subject.grade_components.regular_grades.push(grade.grade_value)
            }
          } else if (grade.component_type === 'midterm') {
            // Only set if not already set (first one is most recent due to ordering)
            if (subject.grade_components.midterm_grade === null) {
              subject.grade_components.midterm_grade = grade.grade_value
            }
          } else if (grade.component_type === 'final') {
            // Only set if not already set (first one is most recent due to ordering)
            if (subject.grade_components.final_grade === null) {
              subject.grade_components.final_grade = grade.grade_value
            }
          } else if (grade.component_type === 'semester_1' || grade.component_type === 'semester_2' || grade.component_type === 'yearly') {
            // Only set if not already set (first one is most recent due to ordering)
            if (subject.grade_components.summary_grade === null) {
              subject.grade_components.summary_grade = grade.grade_value
            }
          }
        }
      }
    }

    // Calculate averages for each subject
    const subjects = Array.from(subjectMap.values()).map(subject => {
      let average_grade = subject.grade_components.summary_grade

      // If no summary grade, calculate using Vietnamese formula
      if (average_grade === null) {
        const { regular_grades, midterm_grade, final_grade } = subject.grade_components

        if (regular_grades.length > 0 || midterm_grade !== null || final_grade !== null) {
          const regularSum = regular_grades.length > 0
            ? regular_grades.reduce((sum, g) => sum + g, 0)
            : 0
          const regularCount = regular_grades.length
          const midterm = midterm_grade || 0
          const final = final_grade || 0

          // Vietnamese grading formula: ĐTBmhk = (Tổng điểm thường xuyên + 2 × Điểm giữa kỳ + 3 × Điểm cuối kỳ) / (Số bài thường xuyên + 5)
          average_grade = (regularSum + (2 * midterm) + (3 * final)) / (regularCount + 5)
        }
      }

      // Store calculated summary grade in database if it was calculated
      if (average_grade !== null && subject.grade_components.summary_grade === null) {
        // Store the calculated summary grade in the database (fire and forget)
        storeSummaryGradeInDatabase(studentId, subject.subject_id, periodId, average_grade).catch(console.error)
      }

      return {
        subject_id: subject.subject_id,
        subject_name: subject.subject_name,
        teacher_name: subject.teacher_name,
        grade_components: subject.grade_components,
        average_grade: average_grade ? Math.round(average_grade * 10) / 10 : null
      }
    })

    // Determine class name from the actual grade records or fallback to class assignments
    let className = 'Unknown'
    let classId = ''

    if (gradeData && gradeData.length > 0) {
      // Use the class_id from the first grade record
      classId = gradeData[0].class_id
      // Find the corresponding class name from class assignments
      const matchingClass = classAssignments?.find(ca => ca.class_id === classId)
      className = matchingClass?.classes?.[0]?.name || 'Unknown'
    } else {
      // Fallback to first class assignment if no grade data
      const classData = classAssignments?.[0]
      className = classData?.classes?.[0]?.name || 'Unknown'
      classId = classData?.class_id || ''
    }

    const result: StudentDetailedGrades = {
      student_id: studentId,
      student_name: studentInfo.full_name || 'Unknown',
      student_number: studentInfo.student_id || 'Unknown',
      class_id: classId,
      class_name: className,
      subjects
    }

    return {
      success: true,
      data: result
    }

  } catch (error) {
    // Comprehensive error logging for debugging
    console.error('=== ERROR FETCHING STUDENT DETAILED GRADES ===')
    console.error('Period ID:', periodId)
    console.error('Student ID:', studentId)
    console.error('Error type:', typeof error)
    console.error('Error instance:', error instanceof Error)
    console.error('Full error object:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('===============================================')

    // Provide detailed error messages
    let errorMessage = 'Lỗi không xác định khi tải chi tiết điểm học sinh'
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        errorMessage = 'Không có quyền truy cập dữ liệu học sinh'
      } else if (error.message.includes('not found')) {
        errorMessage = 'Không tìm thấy thông tin học sinh'
      } else if (error.message.includes('invalid')) {
        errorMessage = 'ID học sinh không hợp lệ'
      } else if (error.message.includes('PGRST')) {
        errorMessage = `Lỗi PostgREST: ${error.message}`
      } else {
        errorMessage = `Lỗi hệ thống: ${error.message}`
      }
    } else {
      errorMessage = `Lỗi không xác định: ${JSON.stringify(error)}`
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}

// Submit grades to homeroom teachers (updated for student-centric approach)
export async function submitStudentGradesToHomeroomAction(
  periodId: string,
  studentIds: string[],
  submissionReason?: string
): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  try {
    const { user } = await checkAdminPermissions()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient()

    // Get current academic year
    const { data: currentAcademicYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('is_current', true)
      .single()

    if (!currentAcademicYear) {
      throw new Error('Không tìm thấy năm học hiện tại')
    }

    // Get student class information for current academic year
    const { data: studentData, error: studentError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        student_class_assignments!student_class_assignments_student_id_fkey(
          class_id,
          classes!inner(
            id,
            name,
            homeroom_teacher_id,
            academic_year_id
          )
        )
      `)
      .in('id', studentIds)

    if (studentError) throw studentError

    // Group students by class - prioritize classes with homeroom teachers from current academic year
    const classesByStudent = new Map<string, { classId: string; homeroomTeacherId: string }>()

    for (const student of studentData || []) {
      const classAssignments = student.student_class_assignments as unknown as Array<{
        class_id: string
        classes: { id: string; name: string; homeroom_teacher_id: string; academic_year_id: string }
      }>

      // Filter assignments to current academic year only
      const currentYearAssignments = classAssignments?.filter(assignment =>
        assignment.classes?.academic_year_id === currentAcademicYear.id
      )

      // Find a class assignment from current year that has a homeroom teacher
      const classWithHomeroom = currentYearAssignments?.find(assignment =>
        assignment.classes?.homeroom_teacher_id !== null &&
        assignment.classes?.homeroom_teacher_id !== undefined &&
        assignment.classes?.homeroom_teacher_id !== ''
      )

      if (classWithHomeroom?.classes?.homeroom_teacher_id) {
        classesByStudent.set(student.id, {
          classId: classWithHomeroom.class_id,
          homeroomTeacherId: classWithHomeroom.classes.homeroom_teacher_id
        })
      }
    }

    // Process each student submission
    for (const studentId of studentIds) {
      const classInfo = classesByStudent.get(studentId)
      if (!classInfo?.homeroomTeacherId) {
        // Get student name for better error message
        const studentName = studentData?.find(s => s.id === studentId)?.full_name || studentId
        throw new Error(`Không tìm thấy giáo viên chủ nhiệm cho học sinh ${studentName}. Vui lòng kiểm tra lại phân công lớp chủ nhiệm trong năm học hiện tại.`)
      }

      // Check if submission already exists
      const { data: existingSubmission } = await supabase
        .from('admin_student_submissions')
        .select('id, submission_count')
        .eq('period_id', periodId)
        .eq('student_id', studentId)
        .single()

      const submissionCount = (existingSubmission?.submission_count || 0) + 1

      // Upsert submission record
      const { error: submissionError } = await supabase
        .from('admin_student_submissions')
        .upsert({
          period_id: periodId,
          student_id: studentId,
          class_id: classInfo.classId,
          admin_id: user.id,
          homeroom_teacher_id: classInfo.homeroomTeacherId,
          submission_count: submissionCount,
          status: 'submitted',
          submission_reason: submissionCount > 1 ? submissionReason : null,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'period_id,student_id'
        })

      if (submissionError) throw submissionError
    }

    // Send email notification to homeroom teacher
    try {
      // Get homeroom teacher email
      const { data: teacherData } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', Object.values(classesByStudent)[0]?.homeroomTeacherId)
        .single()

      if (teacherData?.email) {
        // Get the submission count for the first student (they should all be the same)
        const { data: firstSubmission } = await supabase
          .from('admin_student_submissions')
          .select('submission_count')
          .eq('period_id', periodId)
          .eq('student_id', studentIds[0])
          .single()

        const currentSubmissionCount = firstSubmission?.submission_count || 1

        // Get period and class information for email
        const { data: periodData } = await supabase
          .from('grade_reporting_periods')
          .select('name')
          .eq('id', periodId)
          .single()

        const { data: classData } = await supabase
          .from('classes')
          .select('name')
          .eq('id', Object.values(classesByStudent)[0]?.classId)
          .single()

        // Send email notification
        await sendTeacherGradeNotificationEmail({
          teacherEmail: teacherData.email,
          teacherName: teacherData.full_name || 'Giáo viên',
          className: classData?.name || 'Lớp',
          periodName: periodData?.name || 'Kỳ báo cáo',
          studentCount: studentIds.length,
          submissionCount: currentSubmissionCount,
          isResubmission: currentSubmissionCount > 1
        })
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError)
      // Don't fail the entire operation if email fails
    }

    return {
      success: true,
      message: `Đã gửi bảng điểm cho ${studentIds.length} học sinh thành công`
    }

  } catch (error) {
    // Comprehensive error logging for debugging
    console.error('=== ERROR SUBMITTING GRADES TO HOMEROOM ===')
    console.error('Period ID:', periodId)
    console.error('Student IDs:', studentIds)
    console.error('Submission Reason:', submissionReason)
    console.error('Error type:', typeof error)
    console.error('Error instance:', error instanceof Error)
    console.error('Full error object:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('===========================================')

    let errorMessage = 'Lỗi không xác định khi gửi bảng điểm'
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        errorMessage = 'Không có quyền gửi bảng điểm'
      } else if (error.message.includes('not found')) {
        errorMessage = 'Không tìm thấy thông tin học sinh hoặc giáo viên'
      } else if (error.message.includes('PGRST')) {
        errorMessage = `Lỗi PostgREST: ${error.message}`
      } else {
        errorMessage = `Lỗi hệ thống: ${error.message}`
      }
    } else {
      errorMessage = `Lỗi không xác định: ${JSON.stringify(error)}`
    }

    return {
      success: false,
      message: 'Lỗi gửi bảng điểm',
      error: errorMessage
    }
  }
}

// Get grade history for a student
export async function getStudentGradeHistoryAction(
  studentId: string,
  periodId?: string
): Promise<{
  success: boolean
  data?: Array<{
    id: string
    grade_id: string
    old_value: number | null
    new_value: number | null
    change_reason: string
    changed_at: string
    changed_by: string
    status: string
    admin_reason?: string
    processed_at?: string
    processed_by?: string
    subject_name: string
    component_type: string
    teacher_name: string
    admin_name?: string
  }>
  error?: string
}> {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    let query = supabase
      .from('grade_audit_logs')
      .select(`
        id,
        grade_id,
        old_value,
        new_value,
        change_reason,
        changed_at,
        changed_by,
        status,
        admin_reason,
        processed_at,
        processed_by,
        student_detailed_grades!grade_audit_logs_grade_id_fkey(
          student_id,
          subject_id,
          component_type,
          subjects!student_detailed_grades_subject_id_fkey(name_vietnamese)
        ),
        profiles!grade_audit_logs_changed_by_fkey(full_name),
        admin:profiles!grade_audit_logs_processed_by_fkey(full_name)
      `)
      .eq('student_detailed_grades.student_id', studentId)
      .order('changed_at', { ascending: false })

    if (periodId) {
      // Add period filter if provided
      query = query.eq('student_detailed_grades.period_id', periodId)
    }

    const { data: auditLogs, error } = await query

    if (error) {
      console.error('Error fetching grade history:', error)
      return {
        success: false,
        error: 'Không thể tải lịch sử thay đổi điểm'
      }
    }

    const formattedHistory = auditLogs?.map(log => ({
      id: log.id,
      grade_id: log.grade_id,
      old_value: log.old_value,
      new_value: log.new_value,
      change_reason: log.change_reason,
      changed_at: log.changed_at,
      changed_by: log.changed_by,
      status: log.status || 'pending',
      admin_reason: log.admin_reason,
      processed_at: log.processed_at,
      processed_by: log.processed_by,
      subject_name: (log.student_detailed_grades as unknown as { subjects: { name_vietnamese: string } })?.subjects?.name_vietnamese || 'Unknown Subject',
      component_type: (log.student_detailed_grades as unknown as { component_type: string })?.component_type || 'unknown',
      teacher_name: (log.profiles as unknown as { full_name: string })?.full_name || 'Unknown Teacher',
      admin_name: (log.admin as unknown as { full_name: string })?.full_name || undefined
    })) || []

    return {
      success: true,
      data: formattedHistory
    }

  } catch (error) {
    console.error('Error in getStudentGradeHistoryAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }
  }
}