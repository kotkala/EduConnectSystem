"use server"

import { createClient } from "@/utils/supabase/server"

export interface ParentFeedbackFilters {
  academic_year_id: string
  week_number: number
  student_id?: string // Optional - if not provided, shows all children
}

export interface StudentFeedbackForParent {
  student_id: string
  student_name: string
  student_code: string
  student_avatar_url: string | null
  class_name: string
  daily_feedback: Record<string, Array<{
    feedback_id: string
    timetable_event_id: string
    start_time: string
    end_time: string
    subject_name: string
    subject_code: string
    teacher_name: string
    rating: number
    comment: string | null
    created_at: string
    sent_at: string
    is_read: boolean
  }>>
}

interface FeedbackNotification {
  student_id: string
  student_name: string
  student_code: string
  student_avatar_url: string | null
  class_name: string
  feedback_id: string
  timetable_event_id: string
  start_time: string
  end_time: string
  subject_name: string
  subject_code: string
  teacher_name: string
  rating: number
  feedback_text: string | null
  created_at: string
  sent_at: string
  is_read: boolean
  day_of_week: number
}

// Check if user is a parent
async function checkParentPermissions() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Authentication required")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'parent') {
    throw new Error("Access denied. Parent role required.")
  }

  return { userId: user.id }
}

// Get list of children for parent dropdown
export async function getParentChildrenAction(): Promise<{
  success: boolean;
  data?: Array<{id: string, name: string, student_code: string, avatar_url: string | null, class_name: string}>;
  error?: string
}> {
  try {
    const { userId } = await checkParentPermissions()
    const supabase = await createClient()

    // First get the student relationships
    const { data: relationships, error: relationshipsError } = await supabase
      .from('parent_student_relationships')
      .select(`
        student_id,
        profiles!parent_student_relationships_student_id_fkey(
          id,
          full_name,
          student_id,
          avatar_url
        )
      `)
      .eq('parent_id', userId)

    if (relationshipsError) {
      throw new Error(relationshipsError.message)
    }

    if (!relationships || relationships.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    // Get student IDs
    const studentIds = relationships.map(rel => rel.student_id)

    // Get class assignments for these students
    const { data: classAssignments, error: classError } = await supabase
      .from('student_class_assignments')
      .select(`
        student_id,
        classes!inner(
          name
        )
      `)
      .in('student_id', studentIds)
      .eq('is_active', true)

    if (classError) {
      throw new Error(classError.message)
    }

    // Combine the data
    const childrenList = relationships.map(rel => {
      const profile = rel.profiles as unknown as { id: string; full_name: string; student_id: string; avatar_url: string | null }
      const classAssignment = classAssignments?.find(ca => ca.student_id === rel.student_id)
      const classInfo = classAssignment?.classes as unknown as { name: string }

      return {
        id: profile.id,
        name: profile.full_name,
        student_code: profile.student_id,
        avatar_url: profile.avatar_url,
        class_name: classInfo?.name || 'Unknown Class'
      }
    })

    return {
      success: true,
      data: childrenList
    }

  } catch (error) {
    console.error("Get parent children error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch children list"
    }
  }
}

// Get available academic years for parent
export async function getParentAcademicYearsAction(): Promise<{ success: boolean; data?: Array<{id: string, name: string}>; error?: string }> {
  try {
    await checkParentPermissions()
    const supabase = await createClient()

    // Get academic years
    const { data: academicYears, error } = await supabase
      .from('academic_years')
      .select(`
        id,
        name
      `)
      .order('start_date', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: academicYears || []
    }

  } catch (error) {
    console.error("Get parent academic years error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch academic years"
    }
  }
}

// Get student feedback for parent by academic year and week
export async function getStudentFeedbackForParentAction(
  filters: ParentFeedbackFilters
): Promise<{ success: boolean; data?: StudentFeedbackForParent[]; error?: string }> {
  try {
    const { userId } = await checkParentPermissions()
    const supabase = await createClient()

    // Get all students for this parent
    const { data: studentRelationships, error: studentsError } = await supabase
      .from('parent_student_relationships')
      .select(`
        student_id,
        profiles!parent_student_relationships_student_id_fkey(
          id,
          full_name,
          student_id,
          avatar_url
        )
      `)
      .eq('parent_id', userId)

    if (studentsError) {
      throw new Error(studentsError.message)
    }

    if (!studentRelationships || studentRelationships.length === 0) {
      return {
        success: true,
        data: []
      }
    }



    // Get feedback notifications for these students in the specified week using RPC
    const { data: feedbackData, error: feedbackError } = await supabase.rpc(
      'get_parent_feedback_notifications',
      {
        p_parent_id: userId,
        p_academic_year_id: filters.academic_year_id,
        p_week_number: filters.week_number
      }
    )

    if (feedbackError) {
      throw new Error(feedbackError.message)
    }

    // Filter by selected student if provided
    const filteredFeedbackData = filters.student_id
      ? (feedbackData || []).filter((notification: FeedbackNotification) => notification.student_id === filters.student_id)
      : (feedbackData || [])

    // Group feedback by student and day
    const studentFeedbackMap = new Map<string, StudentFeedbackForParent>()

    for (const notification of filteredFeedbackData) {
      if (!studentFeedbackMap.has(notification.student_id)) {
        studentFeedbackMap.set(notification.student_id, {
          student_id: notification.student_id,
          student_name: notification.student_name,
          student_code: notification.student_code,
          student_avatar_url: notification.student_avatar_url,
          class_name: notification.class_name,
          daily_feedback: {}
        })
      }

      const studentFeedback = studentFeedbackMap.get(notification.student_id)!
      const dayKey = notification.day_of_week.toString()

      if (!studentFeedback.daily_feedback[dayKey]) {
        studentFeedback.daily_feedback[dayKey] = []
      }

      studentFeedback.daily_feedback[dayKey].push({
        feedback_id: notification.feedback_id,
        timetable_event_id: notification.timetable_event_id,
        start_time: notification.start_time,
        end_time: notification.end_time,
        subject_name: notification.subject_name,
        subject_code: notification.subject_code,
        teacher_name: notification.teacher_name,
        rating: notification.rating,
        comment: notification.feedback_text,
        created_at: notification.created_at,
        sent_at: notification.sent_at,
        is_read: notification.is_read
      })
    }

    // Sort feedback within each day by start time
    for (const studentFeedback of studentFeedbackMap.values()) {
      for (const dayFeedback of Object.values(studentFeedback.daily_feedback)) {
        dayFeedback.sort((a, b) => a.start_time.localeCompare(b.start_time))
      }
    }

    return {
      success: true,
      data: Array.from(studentFeedbackMap.values()).sort((a, b) => a.student_name.localeCompare(b.student_name))
    }

  } catch (error) {
    console.error("Get student feedback for parent error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch student feedback"
    }
  }
}

// Mark feedback as read
export async function markFeedbackAsReadAction(
  feedbackId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await checkParentPermissions()
    const supabase = await createClient()

    const { error } = await supabase
      .from('feedback_notifications')
      .update({ is_read: true })
      .eq('student_feedback_id', feedbackId)
      .eq('parent_id', userId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }

  } catch (error) {
    console.error("Mark feedback as read error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark feedback as read"
    }
  }
}
