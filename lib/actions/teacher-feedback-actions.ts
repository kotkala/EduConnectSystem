'use server'

import { createClient } from '@/utils/supabase/server'

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
      group_id: feedback.group_id
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
