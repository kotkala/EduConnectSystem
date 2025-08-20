'use server'

import { createClient } from '@/shared/utils/supabase/server'

// Types for feedback system
export interface StudentInfo {
  id: string
  full_name: string
  email: string
  student_id: string
}

export interface FeedbackData {
  student_id: string
  feedback_text: string
  rating?: number
  feedback_type: 'individual' | 'group' | 'class'
  group_id?: string
}

export interface CreateFeedbackRequest {
  timetable_event_id: string
  class_id: string
  subject_id: string
  feedback_data: FeedbackData[]
}

// Get students in a class for feedback
export async function getClassStudentsAction(classId: string): Promise<{
  success: boolean
  data?: StudentInfo[]
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // Verify user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      throw new Error("Access denied. Teacher role required.")
    }

    // Get students in the class
    const { data: students, error } = await supabase
      .from('student_class_assignments')
      .select(`
        students:profiles!student_class_assignments_student_id_fkey(
          id,
          full_name,
          email,
          student_id
        )
      `)
      .eq('class_id', classId)
      .eq('is_active', true)

    if (error) {
      throw new Error(error.message)
    }

    // Process the data to flatten the structure
    const studentList = students?.map(enrollment => {
      const student = enrollment.students as unknown as StudentInfo
      return {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        student_id: student.student_id
      }
    }) || []

    return { success: true, data: studentList }
  } catch (error: unknown) {
    console.error("Get class students error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch students"
    }
  }
}

// Create feedback for students
export async function createStudentFeedbackAction(request: CreateFeedbackRequest): Promise<{
  success: boolean
  data?: { created_count: number }
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // Verify user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      throw new Error("Access denied. Teacher role required.")
    }

    // Verify teacher is assigned to this timetable event
    const { data: timetableEvent } = await supabase
      .from('timetable_events')
      .select('teacher_id')
      .eq('id', request.timetable_event_id)
      .single()

    if (!timetableEvent || timetableEvent.teacher_id !== user.id) {
      throw new Error("Access denied. You are not assigned to this class.")
    }

    // Generate group_id on server-side for security if feedback_type is 'group'
    const groupId = request.feedback_data.some(f => f.feedback_type === 'group')
      ? crypto.randomUUID()
      : null

    // Prepare feedback records for insertion
    const feedbackRecords = request.feedback_data.map(feedback => ({
      teacher_id: user.id,
      student_id: feedback.student_id,
      class_id: request.class_id,
      timetable_event_id: request.timetable_event_id,
      subject_id: request.subject_id,
      feedback_text: feedback.feedback_text,
      rating: feedback.rating,
      feedback_type: feedback.feedback_type,
      group_id: feedback.feedback_type === 'group' ? groupId : null
    }))

    // Insert feedback records (upsert to handle updates)
    const { data: insertedFeedback, error } = await supabase
      .from('student_feedback')
      .upsert(feedbackRecords, {
        onConflict: 'student_id,timetable_event_id',
        ignoreDuplicates: false
      })
      .select('id')

    if (error) {
      throw new Error(error.message)
    }

    return { 
      success: true, 
      data: { created_count: insertedFeedback?.length || 0 }
    }
  } catch (error: unknown) {
    console.error("Create student feedback error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create feedback"
    }
  }
}

// Get existing feedback for a timetable event
export async function getEventFeedbackAction(timetableEventId: string): Promise<{
  success: boolean
  data?: Array<{
    id: string
    student_id: string
    student_name: string
    feedback_text: string
    rating?: number
    feedback_type: string
    group_id?: string
    created_at: string
  }>
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // Get feedback for this timetable event
    const { data: feedback, error } = await supabase
      .from('student_feedback')
      .select(`
        id,
        student_id,
        feedback_text,
        rating,
        feedback_type,
        group_id,
        created_at,
        students:profiles!student_feedback_student_id_fkey(
          full_name
        )
      `)
      .eq('timetable_event_id', timetableEventId)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    // Process the data
    const feedbackList = feedback?.map(item => ({
      id: item.id,
      student_id: item.student_id,
      student_name: (item.students as unknown as { full_name: string }).full_name,
      feedback_text: item.feedback_text,
      rating: item.rating,
      feedback_type: item.feedback_type,
      group_id: item.group_id,
      created_at: item.created_at
    })) || []

    return { success: true, data: feedbackList }
  } catch (error: unknown) {
    console.error("Get event feedback error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch feedback"
    }
  }
}

// Delete feedback
export async function deleteFeedbackAction(feedbackId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // Delete feedback (RLS will ensure only teacher's own feedback can be deleted)
    const { error } = await supabase
      .from('student_feedback')
      .delete()
      .eq('id', feedbackId)
      .eq('teacher_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error: unknown) {
    console.error("Delete feedback error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete feedback"
    }
  }
}

// Check if all students in a class have feedback for a timetable event
export async function checkClassFeedbackCompletionAction(timetableEventId: string): Promise<{
  success: boolean
  data?: { isComplete: boolean; totalStudents: number; feedbackCount: number }
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // Get the timetable event to get class_id
    const { data: timetableEvent } = await supabase
      .from('timetable_events')
      .select('class_id, teacher_id')
      .eq('id', timetableEventId)
      .single()

    if (!timetableEvent || timetableEvent.teacher_id !== user.id) {
      throw new Error("Access denied")
    }

    // Count total students in the class
    const { count: totalStudents } = await supabase
      .from('student_class_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', timetableEvent.class_id)
      .eq('is_active', true)

    // Count feedback given for this timetable event
    const { count: feedbackCount } = await supabase
      .from('student_feedback')
      .select('*', { count: 'exact', head: true })
      .eq('timetable_event_id', timetableEventId)
      .eq('teacher_id', user.id)

    const isComplete = (totalStudents || 0) > 0 && (feedbackCount || 0) >= (totalStudents || 0)

    return {
      success: true,
      data: {
        isComplete,
        totalStudents: totalStudents || 0,
        feedbackCount: feedbackCount || 0
      }
    }
  } catch (error: unknown) {
    console.error("Check feedback completion error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check feedback completion"
    }
  }
}

// Manually trigger daily feedback completion check (for testing)
export async function triggerDailyFeedbackCheckAction(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // Verify user is a teacher or admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      throw new Error("Access denied")
    }

    // Call the database function
    const { error } = await supabase.rpc('check_daily_feedback_completion')

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error: unknown) {
    console.error("Trigger daily feedback check error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to trigger feedback check"
    }
  }
}
