"use server"

import { createClient } from "@/lib/supabase/server"
import { checkAdminPermissions } from "@/lib/utils/permission-utils"

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

    // Insert or update the summary grade
    await supabase
      .from('student_detailed_grades')
      .upsert({
        period_id: periodId,
        student_id: studentId,
        subject_id: subjectId,
        class_id: classAssignment.class_id,
        component_type: 'summary',
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
        status
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

    let errorMessage = 'Lỗi không xác Ä‘á»‹nh khi tải danh sách kỳ báo cáo'
    if (error instanceof Error) {
      errorMessage = `Lỗi tải kỳ báo cáo: ${error.message}`
      if (error.message.includes('permission')) {
        errorMessage = 'Không có quyá»n truy cập danh sách kỳ báo cáo'
      } else if (error.message.includes('network')) {
        errorMessage = 'Lỗi káº¿t ná»‘i máº¡ng khi tải kỳ báo cáo'
      }
    } else {
      errorMessage = `Lỗi không xác Ä‘á»‹nh: ${JSON.stringify(error)}`
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
        error: 'ID kỳ báo cáo không hợp lá»‡'
      }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(periodId)) {
      return {
        success: false,
        error: 'Äá»‹nh dáº¡ng ID kỳ báo cáo không hợp lá»‡'
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
    let errorMessage = 'Lỗi không xác Ä‘á»‹nh khi tải dữ liệu Ä‘iá»ƒm sá»‘'

    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        errorMessage = 'Không có quyá»n truy cập dữ liệu Ä‘iá»ƒm sá»‘'
      } else if (error.message.includes('Database query failed')) {
        errorMessage = `Lỗi truy váº¥n cÆ¡ sá»Ÿ dữ liệu: ${error.message.replace('Database query failed: ', '')}`
      } else if (error.message.includes('invalid')) {
        errorMessage = 'Dá»¯ liệu không hợp lá»‡'
      } else if (error.message.includes('PGRST')) {
        errorMessage = `Lỗi PostgREST: ${error.message}`
      } else if (error.message.includes('JWT')) {
        errorMessage = 'Lỗi xác thực - vui lòng Ä‘Äƒng nháº­p láº¡i'
      } else if (error.message.includes('network')) {
        errorMessage = 'Lỗi káº¿t ná»‘i máº¡ng'
      } else {
        errorMessage = `Lỗi hồ‡ thồ‘ng: ${error.message}`
      }
    } else {
      errorMessage = `Lỗi không xác Ä‘á»‹nh: ${JSON.stringify(error)}`
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
        error: 'Thiáº¿u thông tin kỳ báo cáo hoặc hồc sinh'
      }
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(periodId) || !uuidRegex.test(studentId)) {
      return {
        success: false,
        error: 'Äá»‹nh dáº¡ng ID không hợp lá»‡'
      }
    }

    const supabase = await createClient()
    await checkAdminPermissions()

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

    // Get all grades for this student in this period
    const { data: gradeData, error: gradeError } = await supabase
      .from('student_detailed_grades')
      .select(`
        subject_id,
        component_type,
        grade_value,
        created_at,
        updated_at,
        subjects!inner(id, name_vietnamese)
      `)
      .eq('period_id', periodId)
      .eq('student_id', studentId)
      .order('subject_id')
      .order('component_type')

    if (gradeError) throw gradeError

    // Get teacher information from class assignments (specific to this student's classes)
    const { data: teacherData, error: teacherError } = await supabase
      .from('teacher_class_assignments')
      .select(`
        subject_id,
        teacher_id,
        class_id,
        profiles!teacher_class_assignments_teacher_id_fkey(full_name)
      `)
      .in('class_id', classAssignments?.map(ca => ca.class_id) || [])
      .eq('is_active', true)

    if (teacherError) throw teacherError

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
          const subjectData = (grade.subjects as Array<{ id: string; name_vietnamese: string }>)?.[0]
          const teacherInfo = teacherData?.find(t => t.subject_id === subjectId)
          const teacherName = teacherInfo?.profiles?.[0]?.full_name || 'Unknown'

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
            subject.grade_components.regular_grades.push(grade.grade_value)
          } else if (grade.component_type === 'midterm') {
            subject.grade_components.midterm_grade = grade.grade_value
          } else if (grade.component_type === 'final') {
            subject.grade_components.final_grade = grade.grade_value
          } else if (grade.component_type === 'summary') {
            subject.grade_components.summary_grade = grade.grade_value
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

          // Vietnamese grading formula: ÄTBmhk = (Tổng Ä‘iá»ƒm thÆ°á»ng xuyÃªn + 2 Ã— Äiá»ƒm giá»¯a kỳ + 3 Ã— Äiá»ƒm cuá»‘i kỳ) / (Sá»‘ bÃ i thÆ°á»ng xuyÃªn + 5)
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

    // Use the classAssignments already defined above
    const classData = classAssignments?.[0]
    const className = classData?.classes?.[0]?.name || 'Unknown'

    const result: StudentDetailedGrades = {
      student_id: studentId,
      student_name: studentInfo.full_name || 'Unknown',
      student_number: studentInfo.student_id || 'Unknown',
      class_id: classData?.class_id || '',
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
    let errorMessage = 'Lỗi không xác Ä‘á»‹nh khi tải chi tiết Ä‘iá»ƒm hồc sinh'
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        errorMessage = 'Không có quyá»n truy cập dữ liệu hồc sinh'
      } else if (error.message.includes('not found')) {
        errorMessage = 'Không tìm thấy thông tin hồc sinh'
      } else if (error.message.includes('invalid')) {
        errorMessage = 'ID hồc sinh không hợp lá»‡'
      } else if (error.message.includes('PGRST')) {
        errorMessage = `Lỗi PostgREST: ${error.message}`
      } else {
        errorMessage = `Lỗi hồ‡ thồ‘ng: ${error.message}`
      }
    } else {
      errorMessage = `Lỗi không xác Ä‘á»‹nh: ${JSON.stringify(error)}`
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
    const supabase = await createClient()
    const { user } = await checkAdminPermissions()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get student class information
    const { data: studentData, error: studentError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        student_class_assignments!student_class_assignments_student_id_fkey(
          class_id,
          classes!inner(id, name, homeroom_teacher_id)
        )
      `)
      .in('id', studentIds)

    if (studentError) throw studentError

    // Group students by class
    const classesByStudent = new Map<string, { classId: string; homeroomTeacherId: string }>()

    for (const student of studentData || []) {
      const classInfo = (student.student_class_assignments as Array<{
        class_id: string
        classes: Array<{ id: string; name: string; homeroom_teacher_id: string }>
      }>)?.[0]

      if (classInfo?.classes?.[0]) {
        classesByStudent.set(student.id, {
          classId: classInfo.class_id,
          homeroomTeacherId: classInfo.classes[0].homeroom_teacher_id
        })
      }
    }

    // Process each student submission
    for (const studentId of studentIds) {
      const classInfo = classesByStudent.get(studentId)
      if (!classInfo?.homeroomTeacherId) {
        throw new Error(`Không tìm thấy giáo viên chủ nhiệm cho hồc sinh ${studentId}`)
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

    return {
      success: true,
      message: `ÄÃ£ gá»­i báº£ng Ä‘iá»ƒm cho ${studentIds.length} hồc sinh thÃ nh công`
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

    let errorMessage = 'Lỗi không xác Ä‘á»‹nh khi gá»­i báº£ng Ä‘iá»ƒm'
    if (error instanceof Error) {
      if (error.message.includes('permission')) {
        errorMessage = 'Không có quyá»n gá»­i báº£ng Ä‘iá»ƒm'
      } else if (error.message.includes('not found')) {
        errorMessage = 'Không tìm thấy thông tin hồc sinh hoặc giáo viên'
      } else if (error.message.includes('PGRST')) {
        errorMessage = `Lỗi PostgREST: ${error.message}`
      } else {
        errorMessage = `Lỗi hồ‡ thồ‘ng: ${error.message}`
      }
    } else {
      errorMessage = `Lỗi không xác Ä‘á»‹nh: ${JSON.stringify(error)}`
    }

    return {
      success: false,
      message: 'Lỗi gá»­i báº£ng Ä‘iá»ƒm',
      error: errorMessage
    }
  }
}
