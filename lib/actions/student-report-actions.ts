'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const studentReportSchema = z.object({
  report_period_id: z.string().uuid('Invalid report period ID'),
  student_id: z.string().uuid('Invalid student ID'),
  strengths: z.string().min(1, 'Strengths field is required'),
  weaknesses: z.string().min(1, 'Weaknesses field is required')
})



// Types
export type StudentReportFormData = z.infer<typeof studentReportSchema>

export interface StudentReport {
  id: string
  report_period_id: string
  student_id: string
  class_id: string
  homeroom_teacher_id: string
  strengths: string | null
  weaknesses: string | null
  academic_performance: string | null
  discipline_status: string | null
  status: 'draft' | 'sent'
  sent_at: string | null
  created_at: string
  updated_at: string
  student?: {
    full_name: string
    student_id: string
    email: string
  }
  class?: {
    name: string
  }
}

export interface StudentForReport {
  id: string
  full_name: string
  student_id: string
  email: string
  class_id: string
  class_name: string
  report?: StudentReport
}

// Helper function to check homeroom teacher permissions
async function checkHomeroomTeacherPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['teacher', 'admin'].includes(profile.role)) {
    throw new Error('Teacher permissions required')
  }

  return { userId: user.id, profile }
}

// Generate AI summary for academic performance
async function generateAcademicPerformanceSummary(studentId: string, reportPeriodId: string): Promise<string> {
  try {
    const supabase = await createClient()
    
    // Get report period dates
    const { data: reportPeriod } = await supabase
      .from('report_periods')
      .select('start_date, end_date')
      .eq('id', reportPeriodId)
      .single()

    if (!reportPeriod) {
      return 'Không có dữ liệu phản hồi trong kỳ báo cáo này.'
    }

    // Get feedback within the report period (4 weeks)
    const { data: feedback } = await supabase
      .from('feedback_notifications')
      .select(`
        rating,
        comment,
        subject:subjects(name_vietnamese),
        teacher:profiles!teacher_id(full_name)
      `)
      .eq('student_id', studentId)
      .gte('created_at', reportPeriod.start_date)
      .lte('created_at', reportPeriod.end_date)

    if (!feedback || feedback.length === 0) {
      return 'Chưa có phản hồi từ giáo viên trong kỳ báo cáo này.'
    }

    // Generate summary based on feedback
    const subjectSummaries = feedback.reduce((acc: Record<string, { ratings: number[]; comments: string[] }>, item) => {
      const subjectData = Array.isArray(item.subject) ? item.subject[0] : item.subject
      const subject = subjectData?.name_vietnamese || 'Môn học'
      if (!acc[subject]) {
        acc[subject] = { ratings: [], comments: [] }
      }
      if (item.rating) acc[subject].ratings.push(item.rating)
      if (item.comment) acc[subject].comments.push(item.comment)
      return acc
    }, {})

    let summary = 'Tình hình học tập trong kỳ báo cáo:\n\n'
    
    Object.entries(subjectSummaries).forEach(([subject, data]) => {
      const avgRating = data.ratings.length > 0
        ? (data.ratings.reduce((a: number, b: number) => a + b, 0) / data.ratings.length).toFixed(1)
        : 'N/A'

      summary += `• ${subject}: Điểm trung bình ${avgRating}/5`
      if (data.comments.length > 0) {
        summary += ` - ${data.comments.slice(0, 2).join('; ')}`
      }
      summary += '\n'
    })

    return summary
  } catch (error) {
    console.error('Error generating academic performance summary:', error)
    return 'Không thể tạo tóm tắt tình hình học tập.'
  }
}

// Generate discipline status summary
async function generateDisciplineStatus(studentId: string, reportPeriodId: string): Promise<string> {
  try {
    const supabase = await createClient()
    
    // Get report period dates
    const { data: reportPeriod } = await supabase
      .from('report_periods')
      .select('start_date, end_date')
      .eq('id', reportPeriodId)
      .single()

    if (!reportPeriod) {
      return 'Không có dữ liệu vi phạm trong kỳ báo cáo này.'
    }

    // Get violations within the report period
    const { data: violations } = await supabase
      .from('student_violations')
      .select(`
        violation_date,
        description,
        penalty_points,
        violation_type:violation_types(name)
      `)
      .eq('student_id', studentId)
      .gte('violation_date', reportPeriod.start_date)
      .lte('violation_date', reportPeriod.end_date)
      .order('violation_date', { ascending: false })

    if (!violations || violations.length === 0) {
      return 'Học sinh tuân thủ tốt nội quy nhà trường trong kỳ báo cáo này.'
    }

    let disciplineStatus = `Có ${violations.length} vi phạm trong kỳ báo cáo:\n\n`
    
    violations.forEach((violation, index) => {
      const violationType = Array.isArray(violation.violation_type)
        ? violation.violation_type[0]
        : violation.violation_type

      disciplineStatus += `${index + 1}. ${violationType?.name || 'Vi phạm'} (${violation.violation_date})`
      if (violation.description) {
        disciplineStatus += `: ${violation.description}`
      }
      if (violation.penalty_points) {
        disciplineStatus += ` - ${violation.penalty_points} điểm`
      }
      disciplineStatus += '\n'
    })

    return disciplineStatus
  } catch (error) {
    console.error('Error generating discipline status:', error)
    return 'Không thể tạo tóm tắt tình hình kỷ luật.'
  }
}

// Get students for homeroom teacher's report period
export async function getStudentsForReportAction(reportPeriodId: string) {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // Get classes where user is homeroom teacher
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('homeroom_teacher_id', userId)
      .eq('is_active', true)

    if (classError) {
      throw new Error(classError.message)
    }

    if (!classes || classes.length === 0) {
      return { success: true, data: [] }
    }

    const classIds = classes.map(c => c.id)

    // Get students in these classes
    const { data: students, error: studentError } = await supabase
      .from('student_class_assignments')
      .select(`
        student:profiles!student_id(
          id,
          full_name,
          student_id,
          email
        ),
        class:classes!class_id(
          id,
          name
        )
      `)
      .in('class_id', classIds)
      .eq('is_active', true)

    if (studentError) {
      throw new Error(studentError.message)
    }

    // Get existing reports for this period
    const { data: existingReports, error: reportsError } = await supabase
      .from('student_reports')
      .select('*')
      .eq('report_period_id', reportPeriodId)
      .eq('homeroom_teacher_id', userId)

    if (reportsError) {
      throw new Error(reportsError.message)
    }

    // Combine student data with report data
    const studentsWithReports: StudentForReport[] = (students || []).map((item: {
      student: { id: string; full_name: string; student_id: string; email: string }[] | { id: string; full_name: string; student_id: string; email: string };
      class: { id: string; name: string }[] | { id: string; name: string };
    }) => {
      const student = Array.isArray(item.student) ? item.student[0] : item.student
      const classData = Array.isArray(item.class) ? item.class[0] : item.class

      return {
        id: student.id,
        full_name: student.full_name,
        student_id: student.student_id,
        email: student.email,
        class_id: classData.id,
        class_name: classData.name,
        report: existingReports?.find(r => r.student_id === student.id)
      }
    })

    return { success: true, data: studentsWithReports }
  } catch (error) {
    console.error('Error in getStudentsForReportAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch students' 
    }
  }
}

// Create or update student report (draft)
export async function saveStudentReportAction(formData: StudentReportFormData) {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const validatedData = studentReportSchema.parse(formData)
    
    const supabase = await createClient()

    // Get student's class
    const { data: studentClass, error: classError } = await supabase
      .from('student_class_assignments')
      .select('class_id')
      .eq('student_id', validatedData.student_id)
      .eq('is_active', true)
      .single()

    if (classError || !studentClass) {
      throw new Error('Student class not found')
    }

    // Generate AI summaries
    const academicPerformance = await generateAcademicPerformanceSummary(
      validatedData.student_id, 
      validatedData.report_period_id
    )
    
    const disciplineStatus = await generateDisciplineStatus(
      validatedData.student_id, 
      validatedData.report_period_id
    )

    const reportData = {
      ...validatedData,
      class_id: studentClass.class_id,
      homeroom_teacher_id: userId,
      academic_performance: academicPerformance,
      discipline_status: disciplineStatus,
      status: 'draft' as const
    }

    const { data: report, error } = await supabase
      .from('student_reports')
      .upsert(reportData, {
        onConflict: 'report_period_id,student_id'
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/teacher/reports')
    return { success: true, data: report }
  } catch (error) {
    console.error('Error in saveStudentReportAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save report'
    }
  }
}

// Send student report to parents
export async function sendStudentReportAction(reportId: string) {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // Get the report
    const { data: report, error: reportError } = await supabase
      .from('student_reports')
      .select(`
        *,
        student:profiles!student_id(full_name, student_id)
      `)
      .eq('id', reportId)
      .eq('homeroom_teacher_id', userId)
      .single()

    if (reportError || !report) {
      throw new Error('Report not found')
    }

    // Update report status to sent
    const { error: updateError } = await supabase
      .from('student_reports')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    // Get parents for this student
    const { data: parents, error: parentsError } = await supabase
      .from('parent_student_relationships')
      .select('parent_id')
      .eq('student_id', report.student_id)

    if (parentsError) {
      throw new Error(parentsError.message)
    }

    if (parents && parents.length > 0) {
      // Create notifications for parents
      const notifications = parents.map(parent => ({
        student_report_id: reportId,
        parent_id: parent.parent_id,
        homeroom_teacher_id: userId
      }))

      const { error: notificationError } = await adminSupabase
        .from('report_notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error creating notifications:', notificationError)
      }

      // Create parent responses records
      const responses = parents.map(parent => ({
        student_report_id: reportId,
        parent_id: parent.parent_id
      }))

      const { error: responseError } = await adminSupabase
        .from('parent_report_responses')
        .insert(responses)

      if (responseError) {
        console.error('Error creating response records:', responseError)
      }
    }

    revalidatePath('/dashboard/teacher/reports')
    return { success: true, message: `Đã gửi báo cáo cho ${parents?.length || 0} phụ huynh` }
  } catch (error) {
    console.error('Error in sendStudentReportAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send report'
    }
  }
}

// Get report for viewing
export async function getStudentReportAction(reportId: string) {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    const { data: report, error } = await supabase
      .from('student_reports')
      .select(`
        *,
        student:profiles!student_id(full_name, student_id),
        class:classes!class_id(name),
        report_period:report_periods!report_period_id(name, start_date, end_date)
      `)
      .eq('id', reportId)
      .eq('homeroom_teacher_id', userId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data: report }
  } catch (error) {
    console.error('Error in getStudentReportAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch report'
    }
  }
}

// Get parent responses for a report
export async function getParentResponsesAction(reportId: string) {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // Verify teacher owns this report
    const { data: report, error: reportError } = await supabase
      .from('student_reports')
      .select('id')
      .eq('id', reportId)
      .eq('homeroom_teacher_id', userId)
      .single()

    if (reportError || !report) {
      throw new Error('Report not found')
    }

    const { data: responses, error } = await supabase
      .from('parent_report_responses')
      .select(`
        *,
        parent:profiles!parent_id(full_name, email)
      `)
      .eq('student_report_id', reportId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data: responses }
  } catch (error) {
    console.error('Error in getParentResponsesAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch responses'
    }
  }
}
