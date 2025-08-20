"use server"

import { createClient } from "@/lib/supabase/server"
import { checkHomeroomTeacherPermissions } from "@/lib/utils/permission-utils"

// Types
export interface HomeroomGradeData {
  student_id: string
  student_name: string
  student_number: string
  subjects: Array<{
    subject_id: string
    subject_name: string
    average_grade: number | null
    grade_components: {
      regular_grades: number[]
      midterm_grade: number | null
      final_grade: number | null
      summary_grade: number | null
    }
  }>
}

export interface AIFeedbackStyle {
  style: 'friendly' | 'serious' | 'encouraging' | 'understanding'
  length: 'short' | 'medium' | 'long'
}

export interface ParentSubmissionData {
  id: string
  period_id: string
  class_id: string
  student_id: string
  submission_count: number
  status: 'draft' | 'submitted'
  ai_feedback: string
  feedback_style: string
  feedback_length: string
  submission_reason?: string
  submitted_at: string | null
  created_at: string
  updated_at: string
}

// Get homeroom class grade data for a period
export async function getHomeroomGradeDataAction(
  periodId: string,
  classId: string
): Promise<{
  success: boolean
  data?: HomeroomGradeData[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { user } = await checkHomeroomTeacherPermissions()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Check if admin has submitted grades for this period and class
    const { data: adminSubmissions, error: submissionError } = await supabase
      .from('admin_student_submissions')
      .select(`
        student_id,
        submission_count,
        status,
        submission_reason,
        submitted_at
      `)
      .eq('period_id', periodId)
      .eq('class_id', classId)
      .eq('homeroom_teacher_id', user.id)

    if (submissionError) throw submissionError

    // Get all students in the homeroom class
    const { data: students, error: studentsError } = await supabase
      .from('student_class_assignments')
      .select(`
        student_id,
        students!inner(
          id,
          student_number,
          full_name
        )
      `)
      .eq('class_id', classId)

    if (studentsError) throw studentsError

    // Only get students that have been submitted by admin
    const submittedStudentIds = adminSubmissions?.map(s => s.student_id) || []

    if (submittedStudentIds.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    // Get all grade data for submitted students in this period
    const { data: gradeData, error: gradeError } = await supabase
      .from('student_detailed_grades')
      .select(`
        student_id,
        subject_id,
        component_type,
        grade_value,
        subjects!inner(id, name_vietnamese)
      `)
      .eq('period_id', periodId)
      .eq('class_id', classId)
      .in('student_id', submittedStudentIds)

    if (gradeError) throw gradeError

    // Process data into the required format
    const processedData: HomeroomGradeData[] = []

    for (const student of students || []) {
      const studentGrades = gradeData?.filter(g => g.student_id === student.student_id) || []
      
      // Group grades by subject
      const subjectMap = new Map<string, {
        subject_id: string
        subject_name: string
        grade_components: {
          regular_grades: number[]
          midterm_grade: number | null
          final_grade: number | null
          summary_grade: number | null
        }
      }>()
      
      for (const grade of studentGrades) {
        const subjectId = grade.subject_id
        if (!subjectMap.has(subjectId)) {
          const subjectData = (grade.subjects as Array<{ id: string; name_vietnamese: string }>)?.[0]
          subjectMap.set(subjectId, {
            subject_id: subjectId,
            subject_name: subjectData?.name_vietnamese || 'Unknown',
            grade_components: {
              regular_grades: [],
              midterm_grade: null,
              final_grade: null,
              summary_grade: null
            }
          })
        }

        const subject = subjectMap.get(subjectId)

        if (subject) {
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

      // Calculate average grades for each subject
      const subjects = Array.from(subjectMap.values()).map(subject => {
        let average_grade = subject.grade_components.summary_grade

        // If no summary grade, calculate using Vietnamese formula
        if (average_grade === null) {
          const regular = subject.grade_components.regular_grades.filter((g: number) => g !== null)
          const midterm = subject.grade_components.midterm_grade
          const final = subject.grade_components.final_grade

          if (regular.length > 0 || midterm !== null || final !== null) {
            const regularSum = regular.reduce((sum: number, g: number) => sum + g, 0)
            const regularCount = regular.length
            const midtermScore = midterm ? midterm * 2 : 0
            const finalScore = final ? final * 3 : 0

            const totalScore = regularSum + midtermScore + finalScore
            const totalWeight = regularCount + (midterm ? 2 : 0) + (final ? 3 : 0)

            if (totalWeight > 0) {
              average_grade = Math.round((totalScore / totalWeight) * 10) / 10
            }
          }
        }

        return {
          ...subject,
          average_grade
        }
      })

      const studentData = (student.students as Array<{ id: string; student_number: string; full_name: string }>)?.[0]

      processedData.push({
        student_id: student.student_id,
        student_name: studentData?.full_name || 'Unknown',
        student_number: studentData?.student_number || 'Unknown',
        subjects
      })
    }

    return {
      success: true,
      data: processedData
    }

  } catch (error) {
    console.error('Error fetching homeroom grade data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Generate AI feedback for student grades
export async function generateAIFeedbackAction(
  studentData: HomeroomGradeData,
  style: AIFeedbackStyle
): Promise<{
  success: boolean
  feedback?: string
  error?: string
}> {
  try {
    // Calculate overall performance
    const validGrades = studentData.subjects
      .map(s => s.average_grade)
      .filter(g => g !== null) as number[]

    if (validGrades.length === 0) {
      return {
        success: false,
        error: 'Không có Ä‘iá»ƒm sá»‘ Ä‘á»ƒ tạo pháº£n hồ“i'
      }
    }

    const overallAverage = validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length
    const excellentSubjects = validGrades.filter(g => g >= 8).length
    const poorSubjects = validGrades.filter(g => g < 5).length

    // Create feedback based on style and length
    let feedback = ''

    // Style-based opening
    switch (style.style) {
      case 'friendly':
        feedback += `ChÃ o báº¡n ${studentData.student_name}! `
        break
      case 'serious':
        feedback += `Hồc sinh ${studentData.student_name}, `
        break
      case 'encouraging':
        feedback += `${studentData.student_name} thÃ¢n máº¿n, `
        break
      case 'understanding':
        feedback += `CÃ´/tháº§y hiá»ƒu ráº±ng ${studentData.student_name} `
        break
    }

    // Performance assessment
    if (overallAverage >= 8) {
      switch (style.style) {
        case 'friendly':
          feedback += `Báº¡n Ä‘Ã£ có một káº¿t quáº£ hồc tập xuất sáº¯c về›i Ä‘iá»ƒm trung bÃ¬nh ${overallAverage.toFixed(1)}! `
          break
        case 'serious':
          feedback += `káº¿t quáº£ hồc tập của em Ä‘áº¡t mức xuất sáº¯c về›i Ä‘iá»ƒm trung bÃ¬nh ${overallAverage.toFixed(1)}. `
          break
        case 'encouraging':
          feedback += `em Ä‘Ã£ thể hiá»‡n nÄƒng lá»±c hồc tập tuyá»‡t vềi về›i Ä‘iá»ƒm trung bÃ¬nh ${overallAverage.toFixed(1)}! `
          break
        case 'understanding':
          feedback += `Ä‘Ã£ ná»— lá»±c ráº¥t nhiá»u vÃ  Ä‘áº¡t Ä‘Æ°á»£c káº¿t quáº£ xuất sáº¯c ${overallAverage.toFixed(1)} Ä‘iá»ƒm. `
          break
      }
    } else if (overallAverage >= 6.5) {
      switch (style.style) {
        case 'friendly':
          feedback += `Báº¡n Ä‘Ã£ có káº¿t quáº£ hồc tập khÃ¡ tá»‘t về›i Ä‘iá»ƒm trung bÃ¬nh ${overallAverage.toFixed(1)}. `
          break
        case 'serious':
          feedback += `káº¿t quáº£ hồc tập của em á»Ÿ mức khÃ¡ về›i Ä‘iá»ƒm trung bÃ¬nh ${overallAverage.toFixed(1)}. `
          break
        case 'encouraging':
          feedback += `em Ä‘Ã£ có nhồ¯ng tiáº¿n bộ Ä‘Ã¡ng khen về›i Ä‘iá»ƒm trung bÃ¬nh ${overallAverage.toFixed(1)}! `
          break
        case 'understanding':
          feedback += `Ä‘Ã£ cá»‘ gáº¯ng vÃ  Ä‘áº¡t Ä‘Æ°á»£c káº¿t quáº£ khÃ¡ tá»‘t ${overallAverage.toFixed(1)} Ä‘iá»ƒm. `
          break
      }
    } else if (overallAverage >= 5) {
      switch (style.style) {
        case 'friendly':
          feedback += `Káº¿t quáº£ hồc tập của báº¡n á»Ÿ mức trung bÃ¬nh về›i ${overallAverage.toFixed(1)} Ä‘iá»ƒm. `
          break
        case 'serious':
          feedback += `káº¿t quáº£ hồc tập của em cáº§n Ä‘Æ°á»£c cải thiện, hiá»‡n táº¡i Ä‘áº¡t ${overallAverage.toFixed(1)} Ä‘iá»ƒm. `
          break
        case 'encouraging':
          feedback += `em Ä‘Ã£ cá»‘ gáº¯ng vÃ  Ä‘áº¡t ${overallAverage.toFixed(1)} Ä‘iá»ƒm, Ä‘Ã¢y lÃ  ná»n tảng Ä‘á»ƒ em tiáº¿n bộ hÆ¡n! `
          break
        case 'understanding':
          feedback += `Ä‘ang gáº·p một sá»‘ khÃ³ khÄƒn trong hồc tập về›i káº¿t quáº£ ${overallAverage.toFixed(1)} Ä‘iá»ƒm. `
          break
      }
    } else {
      switch (style.style) {
        case 'friendly':
          feedback += `Báº¡n cáº§n ná»— lá»±c hÆ¡n ná»¯a Ä‘á»ƒ cải thiện káº¿t quáº£ hồc tập hiá»‡n táº¡i ${overallAverage.toFixed(1)} Ä‘iá»ƒm. `
          break
        case 'serious':
          feedback += `káº¿t quáº£ hồc tập của em cáº§n Ä‘Æ°á»£c cải thiện nghiÃªm tÃºc, hiá»‡n táº¡i chồ‰ Ä‘áº¡t ${overallAverage.toFixed(1)} Ä‘iá»ƒm. `
          break
        case 'encouraging':
          feedback += `mặc dÃ¹ káº¿t quáº£ hiá»‡n táº¡i lÃ  ${overallAverage.toFixed(1)} Ä‘iá»ƒm nhÆ°ng cÃ´/tháº§y tin em có thể lÃ m tá»‘t hÆ¡n! `
          break
        case 'understanding':
          feedback += `Ä‘ang gáº·p nhiá»u khÃ³ khÄƒn trong hồc tập về›i káº¿t quáº£ ${overallAverage.toFixed(1)} Ä‘iá»ƒm. `
          break
      }
    }

    // Add detailed analysis for medium and long feedback
    if (style.length !== 'short') {
      if (excellentSubjects > 0) {
        feedback += `Em Ä‘Ã£ xuất sáº¯c á»Ÿ ${excellentSubjects} mÃ´n hồc. `
      }
      if (poorSubjects > 0) {
        feedback += `Cáº§n tập trung cải thiện ${poorSubjects} mÃ´n hồc cÃ²n yáº¿u. `
      }

      if (style.length === 'long') {
        // Add specific subject recommendations
        const weakSubjects = studentData.subjects.filter(s => s.average_grade && s.average_grade < 5)
        if (weakSubjects.length > 0) {
          feedback += `Äáº·c biá»‡t cáº§n chÃº Ã½ các mÃ´n: ${weakSubjects.map(s => s.subject_name).join(', ')}. `
        }

        const strongSubjects = studentData.subjects.filter(s => s.average_grade && s.average_grade >= 8)
        if (strongSubjects.length > 0) {
          feedback += `Tiáº¿p tá»¥c phÃ¡t huy thế máº¡nh á»Ÿ các mÃ´n: ${strongSubjects.map(s => s.subject_name).join(', ')}. `
        }
      }
    }

    // Style-based closing
    switch (style.style) {
      case 'friendly':
        feedback += style.length === 'short' ? 'ChÃºc báº¡n hồc tá»‘t!' : 'HÃ£y tiáº¿p tá»¥c cá»‘ gáº¯ng nhÃ©!'
        break
      case 'serious':
        feedback += style.length === 'short' ? 'Cáº§n ná»— lá»±c hÆ¡n ná»¯a.' : 'Hy vềng em sẽ có káº¿ hoáº¡ch hồc tập cụ thể Ä‘á»ƒ cải thiện.'
        break
      case 'encouraging':
        feedback += style.length === 'short' ? 'Em lÃ m Ä‘Æ°á»£c!' : 'CÃ´/tháº§y tin tÆ°á»Ÿng em sẽ Ä‘áº¡t Ä‘Æ°á»£c nhiá»u thÃ nh công hÆ¡n ná»¯a!'
        break
      case 'understanding':
        feedback += style.length === 'short' ? 'CÃ´/tháº§y luôn á»§ng hồ™ em.' : 'HÃ£y nhồ› ráº±ng cÃ´/tháº§y luôn sáºµn sÃ ng hồ— trá»£ em khi cáº§n thiáº¿t.'
        break
    }

    return {
      success: true,
      feedback
    }

  } catch (error) {
    console.error('Error generating AI feedback:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Submit grades to parents with AI feedback
export async function submitGradesToParentsAction(
  periodId: string,
  classId: string,
  studentSubmissions: Array<{
    studentId: string
    aiFeedback: string
    feedbackStyle: string
    feedbackLength: string
  }>,
  submissionReason?: string
): Promise<{
  success: boolean
  message: string
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { user } = await checkHomeroomTeacherPermissions()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Process each student submission
    for (const submission of studentSubmissions) {
      // Check if submission already exists
      const { data: existingSubmission } = await supabase
        .from('homeroom_parent_submissions')
        .select('id, submission_count')
        .eq('period_id', periodId)
        .eq('class_id', classId)
        .eq('student_id', submission.studentId)
        .single()

      const submissionCount = (existingSubmission?.submission_count || 0) + 1

      // Upsert parent submission record
      const { error: submissionError } = await supabase
        .from('homeroom_parent_submissions')
        .upsert({
          period_id: periodId,
          class_id: classId,
          student_id: submission.studentId,
          homeroom_teacher_id: user.id,
          submission_count: submissionCount,
          status: 'submitted',
          ai_feedback: submission.aiFeedback,
          feedback_style: submission.feedbackStyle,
          feedback_length: submission.feedbackLength,
          submission_reason: submissionCount > 1 ? submissionReason : null,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'period_id,class_id,student_id'
        })

      if (submissionError) throw submissionError
    }

    return {
      success: true,
      message: `ÄÃ£ gá»­i báº£ng Ä‘iá»ƒm cho ${studentSubmissions.length} hồc sinh thÃ nh công`
    }

  } catch (error) {
    console.error('Error submitting grades to parents:', error)
    return {
      success: false,
      message: 'Lỗi gá»­i báº£ng Ä‘iá»ƒm cho phụ huynh',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
