"use server"

import { createClient } from "@/utils/supabase/server"
import { checkHomeroomTeacherPermissions } from "@/lib/utils/permission-utils"
import { sendGradeNotificationEmail } from "@/lib/services/email-service"

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
        error: 'Không có điểm số để tạo phản hồi'
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
        feedback += `Chào bạn ${studentData.student_name}! `
        break
      case 'serious':
        feedback += `Học sinh ${studentData.student_name}, `
        break
      case 'encouraging':
        feedback += `${studentData.student_name} thân mến, `
        break
      case 'understanding':
        feedback += `Cô/thầy hiểu rằng ${studentData.student_name} `
        break
    }

    // Performance assessment
    if (overallAverage >= 8) {
      switch (style.style) {
        case 'friendly':
          feedback += `Bạn đã có một kết quả học tập xuất sắc với điểm trung bình ${overallAverage.toFixed(1)}! `
          break
        case 'serious':
          feedback += `kết quả học tập của em đạt mức xuất sắc với điểm trung bình ${overallAverage.toFixed(1)}. `
          break
        case 'encouraging':
          feedback += `em đã thể hiện năng lực học tập tuyệt vời với điểm trung bình ${overallAverage.toFixed(1)}! `
          break
        case 'understanding':
          feedback += `đã nỗ lực rất nhiều và đạt được kết quả xuất sắc ${overallAverage.toFixed(1)} điểm. `
          break
      }
    } else if (overallAverage >= 6.5) {
      switch (style.style) {
        case 'friendly':
          feedback += `Bạn đã có kết quả học tập khá tốt với điểm trung bình ${overallAverage.toFixed(1)}. `
          break
        case 'serious':
          feedback += `kết quả học tập của em ở mức khá với điểm trung bình ${overallAverage.toFixed(1)}. `
          break
        case 'encouraging':
          feedback += `em đã có những tiến bộ đáng khen với điểm trung bình ${overallAverage.toFixed(1)}! `
          break
        case 'understanding':
          feedback += `đã cố gắng và đạt được kết quả khá tốt ${overallAverage.toFixed(1)} điểm. `
          break
      }
    } else if (overallAverage >= 5) {
      switch (style.style) {
        case 'friendly':
          feedback += `Kết quả học tập của bạn ở mức trung bình với ${overallAverage.toFixed(1)} điểm. `
          break
        case 'serious':
          feedback += `kết quả học tập của em cần được cải thiện, hiện tại đạt ${overallAverage.toFixed(1)} điểm. `
          break
        case 'encouraging':
          feedback += `em đã cố gắng và đạt ${overallAverage.toFixed(1)} điểm, đây là nền tảng để em tiến bộ hơn! `
          break
        case 'understanding':
          feedback += `đang gặp một số khó khăn trong học tập với kết quả ${overallAverage.toFixed(1)} điểm. `
          break
      }
    } else {
      switch (style.style) {
        case 'friendly':
          feedback += `Bạn cần nỗ lực hơn nữa để cải thiện kết quả học tập hiện tại ${overallAverage.toFixed(1)} điểm. `
          break
        case 'serious':
          feedback += `kết quả học tập của em cần được cải thiện nghiêm túc, hiện tại chỉ đạt ${overallAverage.toFixed(1)} điểm. `
          break
        case 'encouraging':
          feedback += `mặc dù kết quả hiện tại là ${overallAverage.toFixed(1)} điểm nhưng cô/thầy tin em có thể làm tốt hơn! `
          break
        case 'understanding':
          feedback += `đang gặp nhiều khó khăn trong học tập với kết quả ${overallAverage.toFixed(1)} điểm. `
          break
      }
    }

    // Add detailed analysis for medium and long feedback
    if (style.length !== 'short') {
      if (excellentSubjects > 0) {
        feedback += `Em đã xuất sắc ở ${excellentSubjects} môn học. `
      }
      if (poorSubjects > 0) {
        feedback += `Cần tập trung cải thiện ${poorSubjects} môn học còn yếu. `
      }

      if (style.length === 'long') {
        // Add specific subject recommendations
        const weakSubjects = studentData.subjects.filter(s => s.average_grade && s.average_grade < 5)
        if (weakSubjects.length > 0) {
          feedback += `Đặc biệt cần chú ý các môn: ${weakSubjects.map(s => s.subject_name).join(', ')}. `
        }

        const strongSubjects = studentData.subjects.filter(s => s.average_grade && s.average_grade >= 8)
        if (strongSubjects.length > 0) {
          feedback += `Tiếp tục phát huy thế mạnh ở các môn: ${strongSubjects.map(s => s.subject_name).join(', ')}. `
        }
      }
    }

    // Style-based closing
    switch (style.style) {
      case 'friendly':
        feedback += style.length === 'short' ? 'Chúc bạn học tốt!' : 'Hãy tiếp tục cố gắng nhé!'
        break
      case 'serious':
        feedback += style.length === 'short' ? 'Cần nỗ lực hơn nữa.' : 'Hy vọng em sẽ có kế hoạch học tập cụ thể để cải thiện.'
        break
      case 'encouraging':
        feedback += style.length === 'short' ? 'Em làm được!' : 'Cô/thầy tin tưởng em sẽ đạt được nhiều thành công hơn nữa!'
        break
      case 'understanding':
        feedback += style.length === 'short' ? 'Cô/thầy luôn ủng hộ em.' : 'Hãy nhớ rằng cô/thầy luôn sẵn sàng hỗ trợ em khi cần thiết.'
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

    // Send email notifications to parents
    await sendEmailNotificationsToParents(supabase, periodId, classId, studentSubmissions, user.id)

    return {
      success: true,
      message: `Đã gửi bảng điểm cho ${studentSubmissions.length} học sinh thành công`
    }

  } catch (error) {
    console.error('Error submitting grades to parents:', error)
    return {
      success: false,
      message: 'Lỗi gửi bảng điểm cho phụ huynh',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper function to send email notifications to parents
async function sendEmailNotificationsToParents(
  supabase: Awaited<ReturnType<typeof createClient>>,
  periodId: string,
  classId: string,
  studentSubmissions: Array<{ studentId: string }>,
  teacherId: string
) {
  try {
    // Get period and class information
    const { data: periodData } = await supabase
      .from('grade_periods')
      .select('name')
      .eq('id', periodId)
      .single()

    const { data: classData } = await supabase
      .from('classes')
      .select('name')
      .eq('id', classId)
      .single()

    const { data: teacherData } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', teacherId)
      .single()

    // Get student and parent information
    for (const submission of studentSubmissions) {
      // Get student info
      const { data: studentData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', submission.studentId)
        .single()

      // Get parent emails
      const { data: parentRelationships } = await supabase
        .from('parent_student_relationships')
        .select(`
          parent:profiles!parent_id(
            full_name,
            email
          )
        `)
        .eq('student_id', submission.studentId)

      // Send email to each parent
      if (parentRelationships && parentRelationships.length > 0) {
        for (const relationship of parentRelationships) {
          const parent = relationship.parent as unknown as { full_name: string; email: string }

          if (parent?.email) {
            await sendGradeNotificationEmail({
              parentEmail: parent.email,
              parentName: parent.full_name,
              studentName: studentData?.full_name || 'Unknown Student',
              className: classData?.name || 'Unknown Class',
              periodName: periodData?.name || 'Unknown Period',
              teacherName: teacherData?.full_name || 'Unknown Teacher'
            })
          }
        }
      }
    }
  } catch (error) {
    console.error('Error sending email notifications:', error)
    // Don't fail the entire operation if email fails
  }
}
