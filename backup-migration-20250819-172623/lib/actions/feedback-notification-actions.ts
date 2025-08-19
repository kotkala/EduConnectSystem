"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"

// Send all daily feedback to parents
export async function sendDailyFeedbackToParentsAction(
  studentId: string,
  dayOfWeek: number,
  academicYearId: string,
  semesterId: string,
  weekNumber: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: "Yêu cầu xác thực"
      }
    }

    // Verify user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return {
        success: false,
        error: "Yêu cầu quyền giáo viên"
      }
    }

    // Get all feedback for this student on this day
    const { data: dailyFeedback, error: feedbackError } = await supabase
      .from('student_feedback')
      .select(`
        id,
        timetable_events!inner(
          day_of_week,
          week_number,
          semester_id,
          semesters!inner(academic_year_id)
        )
      `)
      .eq('student_id', studentId)
      .eq('teacher_id', user.id)
      .eq('timetable_events.day_of_week', dayOfWeek)
      .eq('timetable_events.week_number', weekNumber)
      .eq('timetable_events.semester_id', semesterId)
      .eq('timetable_events.semesters.academic_year_id', academicYearId)

    if (feedbackError) {
      throw new Error(feedbackError.message)
    }

    if (!dailyFeedback || dailyFeedback.length === 0) {
      return {
        success: false,
        error: "Không có phản hồi nào trong ngày này"
      }
    }

    // Get all parents for this student
    const { data: parents, error: parentsError } = await supabase
      .from('parent_student_relationships')
      .select(`
        parent_id,
        profiles!parent_student_relationships_parent_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('student_id', studentId)

    if (parentsError) {
      throw new Error(parentsError.message)
    }

    if (!parents || parents.length === 0) {
      return {
        success: false,
        error: "Không tìm thấy phụ huynh cho học sinh này"
      }
    }

    // Create notifications for all feedback and all parents
    const notifications = []
    for (const feedback of dailyFeedback) {
      for (const parent of parents) {
        notifications.push({
          student_feedback_id: feedback.id,
          parent_id: parent.parent_id,
          student_id: studentId,
          teacher_id: user.id
        })
      }
    }

    // Use upsert to handle duplicates - update sent_at if already exists
    // Use admin client to bypass RLS since we've already verified teacher permissions
    const adminSupabase = createAdminClient()
    const { error: insertError } = await adminSupabase
      .from('feedback_notifications')
      .upsert(notifications, {
        onConflict: 'student_feedback_id,parent_id',
        ignoreDuplicates: false
      })

    if (insertError) {
      throw new Error(insertError.message)
    }

    return {
      success: true,
      message: `Đã gửi toàn bộ phản hồi trong ngày (${dailyFeedback.length} mục) đến ${parents.length} phụ huynh thành công`
    }

  } catch (error) {
    console.error("Send daily feedback to parents error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể gửi phản hồi trong ngày cho phụ huynh"
    }
  }
}

// Send individual feedback notification to parents (legacy function)
export async function sendFeedbackToParentsAction(
  studentFeedbackId: string,
  studentId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: "Yêu cầu xác thực"
      }
    }

    // Verify user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return {
        success: false,
        error: "Yêu cầu quyền giáo viên"
      }
    }

    // Verify the feedback exists and belongs to the teacher
    const { data: feedback } = await supabase
      .from('student_feedback')
      .select('id, student_id, teacher_id')
      .eq('id', studentFeedbackId)
      .eq('teacher_id', user.id)
      .eq('student_id', studentId)
      .single()

    if (!feedback) {
      return {
        success: false,
        error: "Không tìm thấy phản hồi hoặc bị từ chối truy cập"
      }
    }

    // Get all parents for this student
    const { data: parents, error: parentsError } = await supabase
      .from('parent_student_relationships')
      .select(`
        parent_id,
        profiles!parent_student_relationships_parent_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('student_id', studentId)

    if (parentsError) {
      throw new Error(parentsError.message)
    }

    if (!parents || parents.length === 0) {
      return {
        success: false,
        error: "Không tìm thấy phụ huynh cho học sinh này"
      }
    }

    // Create notifications for all parents
    const notifications = parents.map(parent => ({
      student_feedback_id: studentFeedbackId,
      parent_id: parent.parent_id,
      student_id: studentId,
      teacher_id: user.id
    }))

    // Use upsert to handle duplicates - update sent_at if already exists
    // Use admin client to bypass RLS since we've already verified teacher permissions
    const adminSupabase = createAdminClient()
    const { error: insertError } = await adminSupabase
      .from('feedback_notifications')
      .upsert(notifications, {
        onConflict: 'student_feedback_id,parent_id',
        ignoreDuplicates: false
      })

    if (insertError) {
      throw new Error(insertError.message)
    }

    return {
      success: true,
      message: `Đã gửi phản hồi thành công đến ${parents.length} phụ huynh`
    }

  } catch (error) {
    console.error("Send feedback to parents error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể gửi phản hồi cho phụ huynh"
    }
  }
}

// Check if daily feedback has been sent to parents
export async function checkDailyFeedbackSentStatusAction(
  studentId: string,
  dayOfWeek: number,
  academicYearId: string,
  semesterId: string,
  weekNumber: number
): Promise<{ success: boolean; data?: { sent: boolean; sentAt?: string; feedbackCount?: number; parentCount?: number }; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: "Yêu cầu xác thực"
      }
    }

    // Get all feedback for this day
    const { data: dailyFeedback, error: feedbackError } = await supabase
      .from('student_feedback')
      .select(`
        id,
        timetable_events!inner(
          day_of_week,
          week_number,
          semester_id,
          semesters!inner(academic_year_id)
        )
      `)
      .eq('student_id', studentId)
      .eq('teacher_id', user.id)
      .eq('timetable_events.day_of_week', dayOfWeek)
      .eq('timetable_events.week_number', weekNumber)
      .eq('timetable_events.semester_id', semesterId)
      .eq('timetable_events.semesters.academic_year_id', academicYearId)

    if (feedbackError) {
      throw new Error(feedbackError.message)
    }

    if (!dailyFeedback || dailyFeedback.length === 0) {
      return {
        success: true,
        data: { sent: false, feedbackCount: 0, parentCount: 0 }
      }
    }

    const feedbackIds = dailyFeedback.map(f => f.id)

    // Check if notifications exist for any of this feedback
    const { data: notifications, error } = await supabase
      .from('feedback_notifications')
      .select('sent_at, parent_id, student_feedback_id')
      .in('student_feedback_id', feedbackIds)
      .eq('teacher_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    const sent = notifications && notifications.length > 0
    const sentAt = sent ? notifications[0].sent_at : undefined
    const uniqueParents = sent ? new Set(notifications.map(n => n.parent_id)).size : 0

    return {
      success: true,
      data: {
        sent,
        sentAt,
        feedbackCount: dailyFeedback.length,
        parentCount: uniqueParents
      }
    }

  } catch (error) {
    console.error("Check daily feedback sent status error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể kiểm tra trạng thái phản hồi trong ngày"
    }
  }
}

// Check if individual feedback has been sent to parents (legacy function)
export async function checkFeedbackSentStatusAction(
  studentFeedbackId: string
): Promise<{ success: boolean; data?: { sent: boolean; sentAt?: string; parentCount?: number }; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return {
        success: false,
        error: "Yêu cầu xác thực"
      }
    }

    // Check if notifications exist for this feedback
    const { data: notifications, error } = await supabase
      .from('feedback_notifications')
      .select('sent_at, parent_id')
      .eq('student_feedback_id', studentFeedbackId)
      .eq('teacher_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    const sent = notifications && notifications.length > 0
    const sentAt = sent ? notifications[0].sent_at : undefined
    const parentCount = sent ? notifications.length : 0

    return {
      success: true,
      data: {
        sent,
        sentAt,
        parentCount
      }
    }

  } catch (error) {
    console.error("Check feedback sent status error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể kiểm tra trạng thái phản hồi"
    }
  }
}
