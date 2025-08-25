'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const parentResponseSchema = z.object({
  student_report_id: z.string().uuid(),
  agreement_status: z.enum(['agree', 'disagree']),
  comments: z.string().optional()
})

// Types
export type ParentResponseFormData = z.infer<typeof parentResponseSchema>



// Processed interface for client use
export interface ParentReportNotification {
  id: string
  student_report_id: string
  parent_id: string
  homeroom_teacher_id: string
  is_read: boolean
  read_at: string | null
  created_at: string
  student_report?: {
    id: string
    strengths: string
    weaknesses: string
    academic_performance: string
    discipline_status: string
    status: string
    sent_at: string
    report_period_id: string
    student: {
      full_name: string
      student_id: string
    }
    class: {
      name: string
    }
    report_period: {
      id: string
      name: string
      start_date: string
      end_date: string
      period_type?: string
    } | null
    homeroom_teacher: {
      full_name: string
    }
  } | null
  parent_response?: {
    student_report_id: string
    agreement_status: string | null
    comments: string | null
    is_read: boolean
    responded_at: string | null
  } | null
}

// Helper function to check parent permissions
async function checkParentPermissions() {
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

  if (!profile || profile.role !== 'parent') {
    throw new Error('Parent permissions required')
  }

  return { userId: user.id, profile }
}

// Get unread report notifications count for parent
export async function getUnreadReportCountAction() {
  try {
    const { userId } = await checkParentPermissions()
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('report_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', userId)
      .eq('is_read', false)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data: count || 0 }
  } catch (error) {
    console.error('Error in getUnreadReportCountAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch unread count' 
    }
  }
}

// Get all report notifications for parent with pagination and performance optimization
export async function getParentReportNotificationsAction(page: number = 1, limit: number = 20) {
  try {
    const { userId } = await checkParentPermissions()
    const supabase = await createClient()

    // PERFORMANCE OPTIMIZATION: Add pagination and limit data fetching
    const offset = (page - 1) * limit

    // PERFORMANCE OPTIMIZATION: Fetch notifications without problematic join
    const { data: rawNotifications, error } = await supabase
      .from('report_notifications')
      .select(`
        id,
        student_report_id,
        parent_id,
        homeroom_teacher_id,
        is_read,
        read_at,
        created_at,
        student_report:student_reports!student_report_id(
          id,
          strengths,
          weaknesses,
          academic_performance,
          discipline_status,
          status,
          sent_at,
          report_period_id,
          student:profiles!student_id(full_name, student_id),
          class:classes!class_id(name),
          homeroom_teacher:profiles!homeroom_teacher_id(full_name)
        )
      `)
      .eq('parent_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1) // Add pagination

    if (error) {
      console.error('Supabase query error:', error)
      throw new Error(error.message)
    }



    // Handle the raw notifications with proper type safety
    const notifications = rawNotifications as unknown as Array<{
      id: string
      student_report_id: string
      parent_id: string
      homeroom_teacher_id: string
      is_read: boolean
      read_at: string | null
      created_at: string
      student_report?: {
        id: string
        strengths: string
        weaknesses: string
        academic_performance: string
        discipline_status: string
        status: string
        sent_at: string
        report_period_id: string
        student: { full_name: string; student_id: string }[] | { full_name: string; student_id: string }
        class: { name: string }[] | { name: string }
        homeroom_teacher: { full_name: string }[] | { full_name: string }
      } | null
    }> | null

    // PERFORMANCE OPTIMIZATION: Fetch parent responses separately to avoid relationship issues
    let notificationsWithResponses: ParentReportNotification[] = []

    if (notifications && notifications.length > 0) {
      const reportIds = notifications
        .map(n => n.student_report_id)
        .filter(Boolean)

      if (reportIds.length > 0) {
        const { data: responses } = await supabase
          .from('parent_report_responses')
          .select(`
            student_report_id,
            agreement_status,
            comments,
            is_read,
            responded_at
          `)
          .eq('parent_id', userId)
          .in('student_report_id', reportIds)

        // Fetch report periods for all reports
        const reportPeriodIds = notifications
          .map(n => n.student_report?.report_period_id)
          .filter(Boolean)

        const { data: reportPeriods } = await supabase
          .from('grade_reporting_periods')
          .select('id, name, start_date, end_date, period_type')
          .in('id', reportPeriodIds)



        // Map responses and report periods to notifications
        const responseMap = new Map(
          (responses || []).map(r => [r.student_report_id, r])
        )
        const reportPeriodMap = new Map(
          (reportPeriods || []).map(rp => [rp.id, rp])
        )



        notificationsWithResponses = notifications.map(notification => {
          const result = {
            ...notification,
            parent_response: responseMap.get(notification.student_report_id) || null,
            student_report: notification.student_report ? {
              ...notification.student_report,
              student: Array.isArray(notification.student_report.student)
                ? notification.student_report.student[0] || { full_name: '', student_id: '' }
                : notification.student_report.student || { full_name: '', student_id: '' },
              class: Array.isArray(notification.student_report.class)
                ? notification.student_report.class[0] || { name: '' }
                : notification.student_report.class || { name: '' },
              homeroom_teacher: Array.isArray(notification.student_report.homeroom_teacher)
                ? notification.student_report.homeroom_teacher[0] || { full_name: '' }
                : notification.student_report.homeroom_teacher || { full_name: '' },
              report_period: reportPeriodMap.get(notification.student_report.report_period_id) || null
            } : null
          }



          return result
        })
      }
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('report_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', userId)

    if (countError) {
      console.error('Error getting count:', countError)
    }

    return {
      success: true,
      data: notificationsWithResponses,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    }
  } catch (error) {
    console.error('Error in getParentReportNotificationsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch notifications'
    }
  }
}

// Mark report as read
export async function markReportAsReadAction(notificationId: string) {
  try {
    const { userId } = await checkParentPermissions()
    const supabase = await createClient()

    const { error } = await supabase
      .from('report_notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .eq('parent_id', userId)

    if (error) {
      throw new Error(error.message)
    }

    // Also mark the parent response as read
    const { data: notification } = await supabase
      .from('report_notifications')
      .select('student_report_id')
      .eq('id', notificationId)
      .maybeSingle()

    if (notification) {
      await supabase
        .from('parent_report_responses')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('student_report_id', notification.student_report_id)
        .eq('parent_id', userId)
    }

    revalidatePath('/dashboard/parent/reports')
    return { success: true }
  } catch (error) {
    console.error('Error in markReportAsReadAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to mark as read' 
    }
  }
}

// Submit parent response
export async function submitParentResponseAction(formData: ParentResponseFormData) {
  try {
    const { userId } = await checkParentPermissions()
    const validatedData = parentResponseSchema.parse(formData)
    const supabase = await createClient()

    const { data: response, error } = await supabase
      .from('parent_report_responses')
      .upsert({
        student_report_id: validatedData.student_report_id,
        parent_id: userId,
        agreement_status: validatedData.agreement_status,
        comments: validatedData.comments,
        responded_at: new Date().toISOString(),
        is_read: true
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/parent/reports')
    return { success: true, data: response }
  } catch (error) {
    console.error('Error in submitParentResponseAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to submit response' 
    }
  }
}

// Get specific report for parent viewing
export async function getParentReportAction(reportId: string) {
  try {
    const { userId } = await checkParentPermissions()
    const supabase = await createClient()

    // First get the report to check student ID
    const { data: report, error: reportError } = await supabase
      .from('student_reports')
      .select(`
        *,
        student:profiles!student_id(full_name, student_id),
        class:classes!class_id(name),
        report_period:report_periods!report_period_id(name, start_date, end_date),
        homeroom_teacher:profiles!homeroom_teacher_id(full_name, email)
      `)
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      throw new Error('Report not found')
    }

    // Verify parent has access to this student
    const { data: parentRelation, error: relationError } = await supabase
      .from('parent_student_relationships')
      .select('id')
      .eq('parent_id', userId)
      .eq('student_id', report.student_id)
      .maybeSingle()

    if (relationError || !parentRelation) {
      throw new Error('Access denied - you do not have permission to view this report')
    }

    // Get notification record
    const { data: notification, error: notificationError } = await supabase
      .from('report_notifications')
      .select('id')
      .eq('student_report_id', reportId)
      .eq('parent_id', userId)
      .maybeSingle()

    if (notificationError || !notification) {
      throw new Error('Notification record not found')
    }

    // Get parent's response if exists
    const { data: response } = await supabase
      .from('parent_report_responses')
      .select('*')
      .eq('student_report_id', reportId)
      .eq('parent_id', userId)
      .maybeSingle()

    return {
      success: true,
      data: {
        report,
        response,
        notification_id: notification.id
      }
    }
  } catch (error) {
    console.error('Error in getParentReportAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch report'
    }
  }
}
