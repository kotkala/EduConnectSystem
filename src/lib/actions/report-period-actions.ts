'use server'

import { createClient } from '@/lib/supabase/server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const reportPeriodSchema = z.object({
  name: z.string().min(1, 'Report period name is required').max(100),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  academic_year_id: z.string().uuid('Invalid academic year ID'),
  semester_id: z.string().uuid('Invalid semester ID')
}).refine((data) => {
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  return endDate > startDate
}, {
  message: "End date must be after start date",
  path: ["end_date"]
})

const updateReportPeriodSchema = reportPeriodSchema.safeExtend({
  id: z.string().uuid('Invalid report period ID')
})

// Types
export type ReportPeriodFormData = z.infer<typeof reportPeriodSchema>
export type UpdateReportPeriodFormData = z.infer<typeof updateReportPeriodSchema>

export interface ReportPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  academic_year_id: string
  semester_id: string
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
  academic_year?: {
    name: string
  }
  semester?: {
    name: string
  }
}

export interface ClassProgress {
  class_id: string
  class_name: string
  homeroom_teacher_id: string
  homeroom_teacher_name: string
  total_students: number
  sent_reports: number
  status: 'incomplete' | 'complete'
  parent_responses: number
  parent_agreements: number
  agreement_percentage: number
}

// Helper function to check admin permissions
async function checkAdminPermissions() {
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

  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin permissions required')
  }

  return { userId: user.id, profile }
}

// Get all report periods
export async function getReportPeriodsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: reportPeriods, error } = await supabase
      .from('report_periods')
      .select(`
        id,
        name,
        start_date,
        end_date,
        academic_year_id,
        semester_id,
        created_by,
        is_active,
        created_at,
        updated_at,
        academic_year:academic_years(name),
        semester:semesters(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw new Error(error.message)
    }

    // Normalize potential array relations to single objects and assert type
    type ReportPeriodRow = Omit<ReportPeriod, 'academic_year' | 'semester'> & {
      academic_year: { name: string } | { name: string }[] | null
      semester: { name: string } | { name: string }[] | null
    }

    const normalized: ReportPeriod[] = ((reportPeriods || []) as ReportPeriodRow[]).map((r) => ({
      ...r,
      academic_year: Array.isArray(r.academic_year) ? r.academic_year[0] : r.academic_year || undefined,
      semester: Array.isArray(r.semester) ? r.semester[0] : r.semester || undefined
    }))

    return { success: true, data: normalized }
  } catch (error) {
    console.error('Error in getReportPeriodsAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch report periods' 
    }
  }
}

// Create new report period
export async function createReportPeriodAction(formData: ReportPeriodFormData) {
  try {
    const { userId } = await checkAdminPermissions()
    const validatedData = reportPeriodSchema.parse(formData)
    
    const supabase = await createClient()

    const { data: reportPeriod, error } = await supabase
      .from('report_periods')
      .insert({
        ...validatedData,
        created_by: userId
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/report-periods')
    return { success: true, data: reportPeriod }
  } catch (error) {
    console.error('Error in createReportPeriodAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create report period' 
    }
  }
}

// Update report period
export async function updateReportPeriodAction(formData: UpdateReportPeriodFormData) {
  try {
    await checkAdminPermissions()
    const validatedData = updateReportPeriodSchema.parse(formData)
    const { id, ...updateData } = validatedData
    
    const supabase = await createClient()

    const { data: reportPeriod, error } = await supabase
      .from('report_periods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/report-periods')
    return { success: true, data: reportPeriod }
  } catch (error) {
    console.error('Error in updateReportPeriodAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update report period' 
    }
  }
}

// Delete report period
export async function deleteReportPeriodAction(id: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { error } = await supabase
      .from('report_periods')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/report-periods')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteReportPeriodAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete report period' 
    }
  }
}

// Get class progress for a report period
export async function getClassProgressAction(reportPeriodId: string, classBlockId?: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Fetch the semester_id for the selected report period to scope the classes query
    const { data: period, error: periodError } = await supabase
      .from('report_periods')
      .select('semester_id')
      .eq('id', reportPeriodId)
      .single()

    if (periodError) {
      // Not fatal; continue without semester scoping if column or data is missing
      console.warn('Unable to load report period details for scoping:', periodError.message)
    }

    // Build the classes query with proper filtering (avoid columns that may not exist across envs)
    // Only include main classes (not combined classes) as they have homeroom teachers and need student reports
    let classesQuery = supabase
      .from('classes')
      .select(`
        id,
        name,
        homeroom_teacher_id,
        homeroom_teacher:profiles!homeroom_teacher_id(full_name)
      `)
      .eq('is_subject_combination', false) // Only main classes, not combined classes

    if (classBlockId) {
      classesQuery = classesQuery.eq('class_block_id', classBlockId)
    }

    if (period?.semester_id) {
      classesQuery = classesQuery.eq('semester_id', period.semester_id)
    }

    const { data: classes, error: classError } = await classesQuery

    if (classError) {
      throw new Error(classError.message)
    }

    if (!classes || classes.length === 0) {
      return { success: true, data: [] }
    }

    const classIds = classes.map(c => c.id)

    // Use optimized PostgreSQL function for server-side aggregation
    // This replaces 2 separate queries + client-side aggregation with 1 server call
    // Prefer RPC if available; fallback to safe client-side aggregation when function is missing
    let progressCounts: Array<{ class_id: string; total_students: number; sent_reports: number }> | null = null
    let countsError: { message: string } | null = null

    const rpcResult = await supabase
      .rpc('get_class_progress_counts', {
        report_period_id_param: reportPeriodId,
        class_ids_param: classIds
      })

    if (rpcResult.error?.message?.includes('Could not find the function')) {
      // Fallback: compute counts with two lightweight queries
      const [{ data: studentCounts }, { data: sentCounts }] = await Promise.all([
        supabase
          .from('class_assignments')
          .select('class_id, count:class_id', { head: false, count: 'exact' })
          .in('class_id', classIds)
          .eq('assignment_type', 'student')
          .eq('is_active', true),
        supabase
          .from('student_reports')
          .select('class_id', { head: false, count: undefined })
          .in('class_id', classIds)
          .eq('report_period_id', reportPeriodId)
          .eq('status', 'sent')
      ])

      type CountRow = { class_id: string }
      const totalByClass: Record<string, number> = {}
      ;((studentCounts || []) as CountRow[]).forEach((row) => {
        totalByClass[row.class_id] = (totalByClass[row.class_id] || 0) + 1
      })

      const sentByClass: Record<string, number> = {}
      ;((sentCounts || []) as CountRow[]).forEach((row) => {
        sentByClass[row.class_id] = (sentByClass[row.class_id] || 0) + 1
      })

      progressCounts = classIds.map(id => ({
        class_id: id,
        total_students: totalByClass[id] || 0,
        sent_reports: sentByClass[id] || 0
      }))
    } else if (rpcResult.error) {
      countsError = rpcResult.error
    } else {
      progressCounts = rpcResult.data || []
    }

    if (countsError) {
      throw new Error(countsError.message)
    }

    // Create lookup objects from aggregated server results
    interface ProgressCountRow {
      class_id: string
      total_students: number
      sent_reports: number
    }

    const countsByClass = (progressCounts || []).reduce((acc: Record<string, { total_students: number; sent_reports: number }>, row: ProgressCountRow) => {
      acc[row.class_id] = {
        total_students: row.total_students || 0,
        sent_reports: row.sent_reports || 0
      }
      return acc
    }, {})

    // Get parent response data for sent reports
    const { data: parentResponses } = await supabase
      .from('parent_report_responses')
      .select(`
        student_report_id,
        agreement_status,
        student_report:student_reports!student_report_id(class_id)
      `)
      .eq('student_report.report_period_id', reportPeriodId)
      .not('agreement_status', 'is', null)

    // Group parent responses by class
    const responsesByClass: Record<string, { total: number; agreements: number }> = {}

    if (parentResponses) {
      parentResponses.forEach(response => {
        const report = Array.isArray(response.student_report)
          ? response.student_report[0]
          : response.student_report

        if (report?.class_id) {
          const classId = report.class_id
          if (!responsesByClass[classId]) {
            responsesByClass[classId] = { total: 0, agreements: 0 }
          }
          responsesByClass[classId].total++
          if (response.agreement_status === 'agree') {
            responsesByClass[classId].agreements++
          }
        }
      })
    }

    // Build class progress data using optimized server-side aggregation
    const classProgress: ClassProgress[] = classes.map(classItem => {
      const homeroomTeacher = Array.isArray(classItem.homeroom_teacher)
        ? classItem.homeroom_teacher[0]
        : classItem.homeroom_teacher

      const counts = countsByClass[classItem.id] || { total_students: 0, sent_reports: 0 }
      const totalStudents = counts.total_students
      const sentReportsCount = counts.sent_reports

      const responses = responsesByClass[classItem.id] || { total: 0, agreements: 0 }
      const agreementPercentage = responses.total > 0
        ? Math.round((responses.agreements / responses.total) * 100)
        : 0

      return {
        class_id: classItem.id,
        class_name: classItem.name,
        homeroom_teacher_id: classItem.homeroom_teacher_id || '',
        homeroom_teacher_name: (homeroomTeacher as { full_name?: string } | null)?.full_name || 'Chưa phân công',
        total_students: totalStudents,
        sent_reports: sentReportsCount,
        status: sentReportsCount >= totalStudents && totalStudents > 0 ? 'complete' : 'incomplete',
        parent_responses: responses.total,
        parent_agreements: responses.agreements,
        agreement_percentage: agreementPercentage
      }
    })

    return { success: true, data: classProgress }
  } catch (error) {
    console.error('Error in getClassProgressAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch class progress'
    }
  }
}

// Admin bulk send all reports for a report period
export async function adminBulkSendReportsAction(reportPeriodId: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // First, check what reports exist for this period (for debugging)
    const { data: allReports } = await supabase
      .from('student_reports')
      .select('id, student_id, status')
      .eq('report_period_id', reportPeriodId)

    console.log(`ðŸ“Š Debug: Found ${allReports?.length || 0} total reports for period ${reportPeriodId}`)
    if (allReports && allReports.length > 0) {
      const statusCounts = allReports.reduce((acc, report) => {
        acc[report.status] = (acc[report.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      console.log('ðŸ“Š Report status breakdown:', statusCounts)
    }

    // Get all draft reports for this period
    const { data: reports, error: reportsError } = await supabase
      .from('student_reports')
      .select('id, student_id, class_id, homeroom_teacher_id')
      .eq('report_period_id', reportPeriodId)
      .eq('status', 'draft')

    if (reportsError) {
      throw new Error(reportsError.message)
    }

    if (!reports || reports.length === 0) {
      // More helpful error message
      const totalReports = allReports?.length || 0
      if (totalReports === 0) {
        return { success: false, error: 'No student reports found for this period. Please generate reports first using "Tạo báo cáo học sinh" button.' }
      } else {
        return { success: false, error: `Found ${totalReports} reports but none are in draft status. Reports have already been sent. Use "Reset báo cáo về Draft" button to reset them back to draft status if you want to resend.` }
      }
    }

    // Update all reports to sent status
    const { error: updateError } = await supabase
      .from('student_reports')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .in('id', reports.map(r => r.id))

    if (updateError) {
      throw new Error(updateError.message)
    }

    // Get report period info once (avoid N+1)
    const { data: reportPeriod } = await supabase
      .from('report_periods')
      .select('name, start_date, end_date')
      .eq('id', reportPeriodId)
      .single()

    if (!reportPeriod) {
      throw new Error('Report period not found')
    }

    // Batch fetch all parent and student data to avoid N+1 queries
    const studentIds = reports.map(r => r.student_id)

    // Get all students data in one query
    const { data: students } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', studentIds)

    // Get all parent relationships in one query
    const { data: parentRelationships } = await supabase
      .from('parent_student_relationships')
      .select(`
        student_id,
        parent_id,
        parent:profiles!parent_student_relationships_parent_id_fkey(email, full_name)
      `)
      .in('student_id', studentIds)

    // Create lookup maps for efficient access
    const studentMap = new Map(students?.map(s => [s.id, s]) || [])
    const parentsByStudent = new Map<string, Array<{ parent_id: string; parent: unknown }>>()

    parentRelationships?.forEach(rel => {
      if (!parentsByStudent.has(rel.student_id)) {
        parentsByStudent.set(rel.student_id, [])
      }
      parentsByStudent.get(rel.student_id)!.push({
        parent_id: rel.parent_id,
        parent: rel.parent
      })
    })

    // Create parent response records, notifications, and send email notifications
    const responsePromises = reports.map(async (report) => {
      const student = studentMap.get(report.student_id)
      const parents = parentsByStudent.get(report.student_id) || []

      if (parents.length > 0) {
        // Create response records
        const responses = parents.map(parent => ({
          student_report_id: report.id,
          parent_id: parent.parent_id
        }))

        await supabase
          .from('parent_report_responses')
          .insert(responses)

        // Create notifications for parents (this was missing!)
        const notifications = parents.map(parent => ({
          student_report_id: report.id,
          parent_id: parent.parent_id,
          homeroom_teacher_id: report.homeroom_teacher_id
        }))

        await supabase
          .from('report_notifications')
          .insert(notifications)

        // Send email notifications to parents using Resend
        const emailPromises = parents.map(async (parent) => {
          const parentProfile = Array.isArray(parent.parent) ? parent.parent[0] : parent.parent

          if (parentProfile?.email && student?.full_name) {
            try {
              const { sendParentReportEmail } = await import('@/lib/services/resend-email-service')

              const result = await sendParentReportEmail({
                parentEmail: parentProfile.email,
                parentName: parentProfile.full_name,
                studentName: student.full_name,
                reportPeriodName: reportPeriod.name,
                startDate: reportPeriod.start_date,
                endDate: reportPeriod.end_date
              })

              if (result.success) {
                console.log(`âœ… Email sent to parent ${parentProfile.email} for student ${student.full_name}`)
              } else {
                console.error(`âŒ Failed to send email to parent ${parentProfile.email}:`, result.error)
              }
            } catch (emailError) {
              console.error(`âŒ Failed to send email to parent ${parentProfile.email}:`, emailError)
              // Don't fail the entire operation if email fails
            }
          }
        })

        await Promise.allSettled(emailPromises)
      }
    })

    await Promise.allSettled(responsePromises)

    revalidatePath('/dashboard/admin/report-periods')
    return {
      success: true,
      data: {
        sentCount: reports.length,
        message: `Successfully sent ${reports.length} reports to parents`
      }
    }
  } catch (error) {
    console.error('Error in adminBulkSendReportsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send reports'
    }
  }
}

// Send teacher reminder emails and notifications
export async function sendTeacherRemindersAction(
  reportPeriodId: string,
  incompleteClasses: ClassProgress[]
) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Get report period info
    const { data: reportPeriod, error: periodError } = await supabase
      .from('report_periods')
      .select('name, end_date')
      .eq('id', reportPeriodId)
      .single()

    if (periodError) {
      console.error('Report period query error:', periodError)
      throw new Error(`Report period query failed: ${periodError.message}`)
    }

    if (!reportPeriod) {
      console.error('Report period not found for ID:', reportPeriodId)
      throw new Error(`Report period not found for ID: ${reportPeriodId}`)
    }

    // Group incomplete classes by teacher
    const teacherClassMap = new Map<string, { teacherId: string; teacherName: string; classes: string[] }>()

    incompleteClasses.forEach(classItem => {
      if (classItem.homeroom_teacher_id && classItem.homeroom_teacher_name) {
        const key = classItem.homeroom_teacher_id
        if (!teacherClassMap.has(key)) {
          teacherClassMap.set(key, {
            teacherId: classItem.homeroom_teacher_id,
            teacherName: classItem.homeroom_teacher_name,
            classes: []
          })
        }
        teacherClassMap.get(key)!.classes.push(classItem.class_name)
      }
    })

    if (teacherClassMap.size === 0) {
      return { success: false, error: 'No teachers found for incomplete classes' }
    }

    // Batch fetch all teacher emails to avoid N+1 queries
    const teacherIds = Array.from(teacherClassMap.keys())
    const { data: teacherProfiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', teacherIds)

    // Create lookup map for efficient access
    const teacherEmailMap = new Map(teacherProfiles?.map(t => [t.id, t.email]) || [])

    // Send notifications and emails
    const results = await Promise.allSettled(
      Array.from(teacherClassMap.values()).map(async (teacher) => {
        try {
          const teacherEmail = teacherEmailMap.get(teacher.teacherId)

          // Send email reminder if email exists
          if (teacherEmail) {
            const { sendTeacherReminderEmail } = await import('@/lib/services/resend-email-service')

            // Get detailed class info for the teacher
            const teacherIncompleteClasses = incompleteClasses
              .filter(cls => cls.homeroom_teacher_id === teacher.teacherId)
              .map(cls => ({
                className: cls.class_name,
                totalStudents: cls.total_students,
                completedReports: cls.sent_reports
              }))

            const result = await sendTeacherReminderEmail({
              teacherEmail: teacherEmail,
              teacherName: teacher.teacherName,
              reportPeriodName: reportPeriod.name,
              endDate: reportPeriod.end_date,
              incompleteClasses: teacherIncompleteClasses
            })

            if (!result.success) {
              throw new Error(result.error || 'Failed to send email')
            }
          }

          return { success: true, teacherName: teacher.teacherName }
        } catch (error) {
          console.error(`Error sending reminder to ${teacher.teacherName}:`, error)
          return { success: false, teacherName: teacher.teacherName, error }
        }
      })
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    revalidatePath('/dashboard/admin/report-periods')

    const failedMessage = failed > 0 ? `, ${failed} failed` : ''

    return {
      success: true,
      data: {
        successful,
        failed,
        total: results.length,
        message: `Sent reminders to ${successful} teachers${failedMessage}`
      }
    }
  } catch (error) {
    console.error('Error in sendTeacherRemindersAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send teacher reminders'
    }
  }
}

// Generate draft student reports for all students in a report period
export async function generateStudentReportsAction(reportPeriodId: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Get report period details
    const { data: reportPeriod, error: periodError } = await supabase
      .from('report_periods')
      .select('name, semester_id')
      .eq('id', reportPeriodId)
      .single()

    if (periodError || !reportPeriod) {
      throw new Error('Report period not found')
    }

    // Get all main classes (not combined classes) for this semester
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        homeroom_teacher_id,
        homeroom_teacher:profiles!homeroom_teacher_id(full_name)
      `)
      .eq('semester_id', reportPeriod.semester_id)
      .eq('is_subject_combination', false) // Only main classes
      .not('homeroom_teacher_id', 'is', null) // Must have homeroom teacher

    if (classError) {
      throw new Error(classError.message)
    }

    if (!classes || classes.length === 0) {
      return { success: false, error: 'No main classes found for this report period' }
    }

    // Get all students in these classes
    const classIds = classes.map(c => c.id)
    const { data: studentAssignments, error: studentError } = await supabase
      .from('class_assignments')
      .select(`
        user_id,
        class_id,
        assignment_type,
        student:profiles!class_assignments_user_id_fkey(full_name)
      `)
      .in('class_id', classIds)
      .eq('assignment_type', 'student') // Only student assignments
      .eq('is_active', true)

    if (studentError) {
      throw new Error(studentError.message)
    }

    if (!studentAssignments || studentAssignments.length === 0) {
      return { success: false, error: 'No students found in main classes' }
    }

    // Check for existing reports to avoid duplicates
    const studentIds = studentAssignments.map(sa => sa.user_id)
    const { data: existingReports } = await supabase
      .from('student_reports')
      .select('student_id')
      .eq('report_period_id', reportPeriodId)
      .in('student_id', studentIds)

    const existingStudentIds = new Set(existingReports?.map(r => r.student_id) || [])

    // Create draft reports for students who don't have reports yet
    const reportsToCreate = studentAssignments
      .filter(sa => !existingStudentIds.has(sa.user_id))
      .map(sa => {
        const classInfo = classes.find(c => c.id === sa.class_id)
        return {
          report_period_id: reportPeriodId,
          student_id: sa.user_id,
          class_id: sa.class_id,
          homeroom_teacher_id: classInfo?.homeroom_teacher_id,
          strengths: '', // Will be filled by teachers
          weaknesses: '', // Will be filled by teachers
          academic_performance: '', // Will be generated by AI when teacher saves
          discipline_status: '', // Will be generated by AI when teacher saves
          status: 'draft' as const
        }
      })

    if (reportsToCreate.length === 0) {
      return {
        success: true,
        data: {
          message: 'All students already have reports for this period',
          created: 0,
          existing: existingStudentIds.size
        }
      }
    }

    // Insert draft reports in batches to avoid timeout
    const batchSize = 100
    let totalCreated = 0

    for (let i = 0; i < reportsToCreate.length; i += batchSize) {
      const batch = reportsToCreate.slice(i, i + batchSize)

      const { error: insertError } = await supabase
        .from('student_reports')
        .insert(batch)

      if (insertError) {
        console.error('Error inserting batch:', insertError)
        throw new Error(`Failed to create reports: ${insertError.message}`)
      }

      totalCreated += batch.length
    }

    return {
      success: true,
      data: {
        message: `Successfully created ${totalCreated} draft student reports`,
        created: totalCreated,
        existing: existingStudentIds.size,
        total: studentAssignments.length
      }
    }
  } catch (error) {
    console.error('Error in generateStudentReportsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate student reports'
    }
  }
}

// Interface for parent data (currently unused but kept for future implementation)
// interface ParentProfile {
//   email: string
//   full_name: string
// }


export async function sendParentRemindersAction(reportPeriodId: string) {
  try {
    await checkAdminPermissions()

    // TODO: Implement parent reminder functionality using reportPeriodId
    // Temporarily disabled due to TypeScript issues
    console.log('Report period ID:', reportPeriodId)
    return {
      success: true,
      data: {
        message: 'Parent reminder function temporarily disabled',
        reportsCount: 0,
        emailsSent: 0
      }
    }

    // const supabase = await createClient()

    // // Get report period details
    // const { data: reportPeriod, error: periodError } = await supabase
    //   .from('report_periods')
    //   .select('name, start_date, end_date')
    //   .eq('id', reportPeriodId)
    //   .single()

    // if (periodError || !reportPeriod) {
    //   throw new Error('Report period not found')
    // }

    // // Get all sent reports for this period
    // const { data: reports, error: reportsError } = await supabase
    //   .from('student_reports')
    //   .select(`
    //     id,
    //     student_id,
    //     student:profiles!student_id(full_name)
    //   `)
    //   .eq('report_period_id', reportPeriodId)
    //   .eq('status', 'sent')

    // if (reportsError) {
    //   throw new Error(reportsError.message)
    // }

    // Temporarily commented out due to TypeScript issues
    // if (!reports || reports.length === 0) {
    //   return { success: false, error: 'No sent reports found for this period' }
    // }

    // // Get all parent relationships for these students
    // const studentIds = reports.map(r => r.student_id)
    // const { data: parentRelationships, error: parentError } = await supabase
    //   .from('parent_student_relationships')
    //   .select(`
    //     student_id,
    //     parent_id,
    //     parent:profiles!parent_student_relationships_parent_id_fkey(email, full_name)
    //   `)
    //   .in('student_id', studentIds)

    // if (parentError) {
    //   throw new Error(parentError.message)
    // }

    // if (!parentRelationships || parentRelationships.length === 0) {
    //   return { success: false, error: 'No parent relationships found' }
    // }

    // // Create lookup maps
    // const studentMap = new Map(reports.map(r => [r.student_id, r.student]))
    // const parentsByStudent = new Map<string, Array<{ parent_id: string; parent: unknown }>>()

    // parentRelationships.forEach(rel => {
    //   if (!parentsByStudent.has(rel.student_id)) {
    //     parentsByStudent.set(rel.student_id, [])
    //   }
    //   parentsByStudent.get(rel.student_id)!.push({
    //     parent_id: rel.parent_id,
    //     parent: rel.parent
    //   })
    // })

    // // Send reminder emails to parents
    // const emailPromises: Promise<void>[] = []

    // for (const report of reports) {
    //   const student = studentMap.get(report.student_id)
    //   const parents = parentsByStudent.get(report.student_id) || []

    //   for (const parentRel of parents) {
    //     const parent = Array.isArray(parentRel.parent)
    //       ? (parentRel.parent as ParentProfile[])[0]
    //       : parentRel.parent as ParentProfile

    //     if (parent?.email && parent?.full_name && student?.full_name) {
    //       emailPromises.push(
    //         (async () => {
    //           try {
    //             const { sendParentReminderEmail } = await import('@/lib/services/resend-email-service')

    //             const result = await sendParentReminderEmail({
    //               parentEmail: parent.email,
    //               parentName: parent.full_name,
    //               studentName: student.full_name,
    //               reportPeriodName: reportPeriod.name,
    //               endDate: reportPeriod.end_date
    //             })

    //             if (result.success) {
    //               console.log(`âœ… Reminder email sent to parent ${parent.email} for student ${student.full_name}`)
    //             } else {
    //               console.error(`âŒ Failed to send reminder to parent ${parent.email}:`, result.error)
    //             }
    //           } catch (error) {
    //             console.error(`âŒ Failed to send reminder to parent ${parent.email}:`, error)
    //           }
    //         })()
    //       )
    //     }
    //   }
    // }

    // await Promise.allSettled(emailPromises)

    // return {
    //   success: true,
    //   data: {
    //     message: `Sent reminders to parents for ${reports.length} student reports`,
    //     reportsCount: reports.length,
    //     emailsSent: emailPromises.length
    //   }
    // }
  } catch (error) {
    console.error('Error in sendParentRemindersAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send parent reminders'
    }
  }
}

// Reset sent reports back to draft status (for admin re-sending)
export async function resetReportsToDraftAction(reportPeriodId: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Get all sent reports for this period
    const { data: sentReports, error: reportsError } = await supabase
      .from('student_reports')
      .select('id, student_id, status')
      .eq('report_period_id', reportPeriodId)
      .eq('status', 'sent')

    if (reportsError) {
      throw new Error(reportsError.message)
    }

    if (!sentReports || sentReports.length === 0) {
      return { success: false, error: 'No sent reports found to reset' }
    }

    // Reset reports to draft status
    const { error: updateError } = await supabase
      .from('student_reports')
      .update({
        status: 'draft',
        sent_at: null
      })
      .in('id', sentReports.map(r => r.id))

    if (updateError) {
      throw new Error(updateError.message)
    }

    console.log(`âœ… Reset ${sentReports.length} reports from 'sent' to 'draft' status`)

    return {
      success: true,
      data: {
        resetCount: sentReports.length,
        message: `Successfully reset ${sentReports.length} reports to draft status`
      }
    }
  } catch (error) {
    console.error('Error in resetReportsToraftAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reset reports'
    }
  }
}

// Test email functionality
export async function testEmailAction() {
  try {
    await checkAdminPermissions()

    const { testEmailConnection } = await import('@/lib/services/resend-email-service')
    const result = await testEmailConnection()

    if (result.success) {
      return {
        success: true,
        data: { message: 'Email test successful! Check your inbox.' }
      }
    } else {
      return {
        success: false,
        error: result.error || 'Email test failed'
      }
    }
  } catch (error) {
    console.error('Error in testEmailAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test email'
    }
  }
}
