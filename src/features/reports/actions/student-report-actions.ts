'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/shared/utils/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { generateAIAcademicSummary, generateAIDisciplineSummary, generateAIStrengthsSummary, generateAIWeaknessesSummary } from '@/lib/services/ai-report-service'

// Validation schemas
const studentReportSchema = z.object({
  report_period_id: z.string().uuid('Invalid report period ID'),
  student_id: z.string().uuid('Invalid student ID'),
  strengths: z.string().min(1, 'Strengths field is required'),
  weaknesses: z.string().min(1, 'Weaknesses field is required'),
  academic_performance: z.string().optional(),
  discipline_status: z.string().optional()
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



// Get students for homeroom teacher's report period (OPTIMIZED)
export async function getStudentsForReportAction(reportPeriodId: string) {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // PERFORMANCE OPTIMIZATION: Single optimized query with proper joins
    // Eliminates N+1 queries by combining 3 separate queries into 1
    // Uses proper column selection to reduce over-fetching
    // Adds pagination to prevent loading too much data
    const { data: studentsData, error } = await supabase
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
          name,
          homeroom_teacher_id
        )
      `)
      .eq('is_active', true)
      .eq('classes.homeroom_teacher_id', userId)
      .limit(100) // Pagination: Limit to 100 students max for performance

    if (error) {
      throw new Error(error.message)
    }

    if (!studentsData || studentsData.length === 0) {
      return { success: true, data: [] }
    }

    // PERFORMANCE OPTIMIZATION: Get existing reports for this period in a separate optimized query
    const studentIds = studentsData.map(item => {
      const student = Array.isArray(item.student) ? item.student[0] : item.student
      return student.id
    }).filter(Boolean)

    const { data: existingReports } = await supabase
      .from('student_reports')
      .select('*')
      .eq('report_period_id', reportPeriodId)
      .eq('homeroom_teacher_id', userId)
      .in('student_id', studentIds)

    // PERFORMANCE OPTIMIZATION: Efficient data transformation with minimal processing
    const studentsWithReports: StudentForReport[] = studentsData
      .filter(item => item.student && item.class) // Filter out invalid records
      .sort((a, b) => {
        // Sort by student full name for consistent ordering
        const studentA = Array.isArray(a.student) ? a.student[0] : a.student
        const studentB = Array.isArray(b.student) ? b.student[0] : b.student
        const nameA = studentA?.full_name || ''
        const nameB = studentB?.full_name || ''
        return nameA.localeCompare(nameB)
      })
      .map(item => {
        const student = Array.isArray(item.student) ? item.student[0] : item.student
        const classData = Array.isArray(item.class) ? item.class[0] : item.class
        const report = existingReports?.find(r => r.student_id === student.id)

        return {
          id: student.id,
          full_name: student.full_name,
          student_id: student.student_id,
          email: student.email,
          class_id: classData.id,
          class_name: classData.name,
          report: report
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

// Regenerate academic summary using AI
export async function regenerateAcademicSummaryAction(
  studentId: string,
  reportPeriodId: string,
  style: string = 'friendly',
  length: string = 'medium'
) {
  try {
    await checkHomeroomTeacherPermissions()

    const summary = await generateAIAcademicSummary(studentId, reportPeriodId, style, length)

    return { success: true, data: summary }
  } catch (error) {
    console.error('Error in regenerateAcademicSummaryAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate academic summary'
    }
  }
}

// Regenerate discipline summary using AI
export async function regenerateDisciplineSummaryAction(
  studentId: string,
  reportPeriodId: string,
  style: string = 'friendly',
  length: string = 'medium'
) {
  try {
    await checkHomeroomTeacherPermissions()

    const summary = await generateAIDisciplineSummary(studentId, reportPeriodId, style, length)

    return { success: true, data: summary }
  } catch (error) {
    console.error('Error in regenerateDisciplineSummaryAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to regenerate discipline summary'
    }
  }
}

// Generate strengths summary using AI
export async function generateStrengthsSummaryAction(
  studentId: string,
  reportPeriodId: string,
  style: string = 'friendly',
  length: string = 'medium'
) {
  try {
    await checkHomeroomTeacherPermissions()

    const summary = await generateAIStrengthsSummary(studentId, reportPeriodId, style, length)

    return { success: true, data: summary }
  } catch (error) {
    console.error('Error in generateStrengthsSummaryAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate strengths summary'
    }
  }
}

// Generate weaknesses summary using AI
export async function generateWeaknessesSummaryAction(
  studentId: string,
  reportPeriodId: string,
  style: string = 'friendly',
  length: string = 'medium'
) {
  try {
    await checkHomeroomTeacherPermissions()

    const summary = await generateAIWeaknessesSummary(studentId, reportPeriodId, style, length)

    return { success: true, data: summary }
  } catch (error) {
    console.error('Error in generateWeaknessesSummaryAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate weaknesses summary'
    }
  }
}

// Get student data for report editing
export async function getStudentForReportAction(studentId: string, reportPeriodId: string) {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // Get student with class assignment data (following same pattern as getStudentsForReportAction)
    const { data: studentData, error: studentError } = await supabase
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
          name,
          homeroom_teacher_id
        )
      `)
      .eq('is_active', true)
      .eq('student_id', studentId)
      .eq('classes.homeroom_teacher_id', userId)
      .single()

    if (studentError) {
      return {
        success: false,
        error: 'Không tìm thấy học sinh hoặc bạn không có quyền truy cập'
      }
    }

    if (!studentData || !studentData.student || !studentData.class) {
      return {
        success: false,
        error: 'Không tìm thấy thông tin học sinh'
      }
    }

    // Get existing report for this student and period
    const { data: existingReport } = await supabase
      .from('student_reports')
      .select('*')
      .eq('report_period_id', reportPeriodId)
      .eq('student_id', studentId)
      .eq('homeroom_teacher_id', userId)
      .single()

    // Format the response to match StudentForReport type
    const student = Array.isArray(studentData.student) ? studentData.student[0] : studentData.student
    const classData = Array.isArray(studentData.class) ? studentData.class[0] : studentData.class

    const formattedStudent: StudentForReport = {
      id: student.id,
      student_id: student.student_id,
      full_name: student.full_name,
      email: student.email || '',
      class_id: classData.id,
      class_name: classData.name,
      report: existingReport || undefined
    }

    return { success: true, data: formattedStudent }
  } catch (error) {
    console.error('Error in getStudentForReportAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get student data'
    }
  }
}

// Bulk send reports to parents with email notifications
export async function bulkSendReportsAction(reportPeriodId: string, reportIds: string[]) {
  try {
    await checkHomeroomTeacherPermissions()

    const supabase = await createClient()

    // Get report period details for email
    const { data: reportPeriod } = await supabase
      .from('report_periods')
      .select('name, start_date, end_date')
      .eq('id', reportPeriodId)
      .single()

    if (!reportPeriod) {
      return { success: false, error: 'Report period not found' }
    }

    // Update all reports to sent status
    const { error: updateError } = await supabase
      .from('student_reports')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .in('id', reportIds)

    if (updateError) {
      console.error('Error updating reports:', updateError)
      return { success: false, error: 'Failed to update report status' }
    }

    // Get student and parent information for email notifications
    const { data: reports } = await supabase
      .from('student_reports')
      .select(`
        id,
        student:students(
          id,
          full_name,
          student_id,
          parent:profiles!students_parent_id_fkey(
            id,
            full_name,
            email
          )
        )
      `)
      .in('id', reportIds)

    if (reports && reports.length > 0) {
      // Send email notifications to parents
      const emailPromises = reports.map(async (report) => {
        const student = Array.isArray(report.student) ? report.student[0] : report.student
        const parent = Array.isArray(student?.parent) ? student.parent[0] : student?.parent

        if (parent?.email) {
          try {
            // Import email service
            const { sendReportNotificationEmail } = await import('@/lib/services/email-service')

            await sendReportNotificationEmail({
              parentEmail: parent.email,
              parentName: parent.full_name,
              studentName: student.full_name,
              reportPeriodName: reportPeriod.name,
              startDate: reportPeriod.start_date,
              endDate: reportPeriod.end_date
            })

            console.log(`Email sent successfully to ${parent.email} for student ${student.full_name}`)
          } catch (emailError) {
            console.error(`Failed to send email to ${parent.email}:`, emailError)
            // Don't fail the entire operation if email fails
          }
        }
      })

      await Promise.allSettled(emailPromises)
    }

    return {
      success: true,
      data: {
        sentCount: reportIds.length,
        reportPeriodName: reportPeriod.name
      }
    }
  } catch (error) {
    console.error('Error in bulkSendReportsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reports'
    }
  }
}

// Resend report with reason and email notification
export async function resendStudentReportAction(reportId: string, resendReason: string) {
  try {
    await checkHomeroomTeacherPermissions()

    const supabase = await createClient()

    // Get report details with student and parent info
    const { data: report } = await supabase
      .from('student_reports')
      .select(`
        id,
        report_period_id,
        student_id,
        student:profiles!student_reports_student_id_fkey(
          id,
          full_name,
          student_id
        ),
        report_period:report_periods(
          name,
          start_date,
          end_date
        )
      `)
      .eq('id', reportId)
      .single()

    if (!report) {
      return { success: false, error: 'Report not found' }
    }

    // Update report with resend timestamp
    const { error: updateError } = await supabase
      .from('student_reports')
      .update({
        sent_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('Error updating report:', updateError)
      return { success: false, error: 'Failed to update report' }
    }

    // Send email notification to parents
    const student = Array.isArray(report.student) ? report.student[0] : report.student
    const reportPeriod = Array.isArray(report.report_period) ? report.report_period[0] : report.report_period

    // Get parents for this student with their profile information
    const { data: parents } = await supabase
      .from('parent_student_relationships')
      .select(`
        parent_id,
        parent:profiles!parent_student_relationships_parent_id_fkey(
          full_name,
          email
        )
      `)
      .eq('student_id', report.student_id)

    if (parents && parents.length > 0 && reportPeriod) {
      const emailPromises = parents.map(async (parentRelation) => {
        const parent = Array.isArray(parentRelation.parent) ? parentRelation.parent[0] : parentRelation.parent

        if (parent?.email) {
          try {
            const { sendResendNotificationEmail } = await import('@/lib/services/email-service')

            await sendResendNotificationEmail({
              parentEmail: parent.email,
              parentName: parent.full_name,
              studentName: student.full_name,
              reportPeriodName: reportPeriod.name,
              startDate: reportPeriod.start_date,
              endDate: reportPeriod.end_date,
              resendReason: resendReason
            })

            console.log(`Resend email sent successfully to ${parent.email} for student ${student.full_name}`)
          } catch (emailError) {
            console.error('Failed to send resend email:', emailError)
            // Don't fail the operation if email fails
          }
        }
      })

      await Promise.allSettled(emailPromises)
    }

    return {
      success: true,
      data: {
        reportId,
        studentName: student.full_name,
        resendReason
      }
    }
  } catch (error) {
    console.error('Error in resendStudentReportAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend report'
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

    // Generate AI summaries using Google Generative AI if not provided
    const academicPerformance = validatedData.academic_performance ||
      await generateAIAcademicSummary(validatedData.student_id, validatedData.report_period_id)

    const disciplineStatus = validatedData.discipline_status ||
      await generateAIDisciplineSummary(validatedData.student_id, validatedData.report_period_id)

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

    // Get parents for this student with their profile information
    const { data: parents, error: parentsError } = await supabase
      .from('parent_student_relationships')
      .select(`
        parent_id,
        parent:profiles!parent_student_relationships_parent_id_fkey(
          full_name,
          email
        )
      `)
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

      // Send email notifications to parents
      const emailPromises = parents.map(async (parentRelation) => {
        const parent = Array.isArray(parentRelation.parent) ? parentRelation.parent[0] : parentRelation.parent

        if (parent?.email) {
          try {
            const { sendReportNotificationEmail } = await import('@/lib/services/email-service')

            const student = Array.isArray(report.student) ? report.student[0] : report.student
            const reportPeriod = Array.isArray(report.report_period) ? report.report_period[0] : report.report_period

            await sendReportNotificationEmail({
              parentEmail: parent.email,
              parentName: parent.full_name,
              studentName: student.full_name,
              reportPeriodName: reportPeriod.name,
              startDate: reportPeriod.start_date,
              endDate: reportPeriod.end_date
            })

            console.log(`Email sent successfully to ${parent.email} for student ${student.full_name}`)
          } catch (emailError) {
            console.error(`Failed to send email to ${parent.email}:`, emailError)
            // Don't fail the entire operation if email fails
          }
        }
      })

      await Promise.allSettled(emailPromises)

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
