'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/shared/utils/supabase/admin'

export interface SaveAIFeedbackRequest {
  student_id: string
  submission_id: string
  feedback_text: string
  rating?: number
}

export interface SendFeedbackToParentsRequest {
  student_id: string
  feedback_id: string
}

// Save AI-generated feedback to database
export async function saveAIFeedbackAction(request: SaveAIFeedbackRequest): Promise<{
  success: boolean
  data?: { feedback_id: string }
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Verify user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      throw new Error("Từ chối truy cập. Yêu cầu vai trò giáo viên.")
    }

    // Get submission details to verify teacher access
    const { data: submission, error: submissionError } = await supabase
      .from('student_grade_submissions')
      .select(`
        id,
        student_id,
        class_id,
        academic_year_id,
        semester_id,
        classes!inner(
          homeroom_teacher_id
        )
      `)
      .eq('id', request.submission_id)
      .eq('student_id', request.student_id)
      .single()

    if (submissionError || !submission) {
      throw new Error("Không tìm thấy bài nộp hoặc bị từ chối truy cập")
    }

    // Verify teacher is the homeroom teacher for this class
    const classData = submission.classes as unknown as { homeroom_teacher_id: string }
    if (classData.homeroom_teacher_id !== user.id) {
      throw new Error("Từ chối truy cập. Bạn không phải là giáo viên chủ nhiệm của lớp này.")
    }

    // Find a timetable event for this teacher and class to satisfy the NOT NULL constraint
    const { data: timetableEvent, error: timetableError } = await supabase
      .from('timetable_events')
      .select('id, subject_id')
      .eq('teacher_id', user.id)
      .eq('class_id', submission.class_id)
      .eq('semester_id', submission.semester_id)
      .limit(1)
      .maybeSingle()

    if (timetableError) {
      throw new Error("Failed to find timetable event for feedback")
    }

    if (!timetableEvent) {
      throw new Error("No timetable event found for this teacher and class. Cannot create feedback.")
    }

    // Create a feedback record for the AI-generated feedback
    // We'll use a special marker in feedback_text to indicate this is AI-generated
    const feedbackRecord = {
      teacher_id: user.id,
      student_id: request.student_id,
      class_id: submission.class_id,
      timetable_event_id: timetableEvent.id, // Use existing timetable event
      subject_id: timetableEvent.subject_id, // Use subject from timetable event
      feedback_text: `[AI_GENERATED:${request.submission_id}] ${request.feedback_text}`,
      rating: request.rating || null,
      feedback_type: 'individual' as const,
      group_id: null
    }

    // First, delete any existing AI feedback for this submission
    await supabase
      .from('student_feedback')
      .delete()
      .eq('student_id', request.student_id)
      .eq('teacher_id', user.id)
      .like('feedback_text', `[AI_GENERATED:${request.submission_id}]%`)

    // Insert new feedback record
    const { data: insertedFeedback, error: insertError } = await supabase
      .from('student_feedback')
      .insert([feedbackRecord])
      .select('id')
      .single()

    if (insertError) {
      throw new Error(insertError.message)
    }

    return { 
      success: true, 
      data: { feedback_id: insertedFeedback.id }
    }
  } catch (error: unknown) {
    console.error("Save AI feedback error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save feedback"
    }
  }
}

// Send AI feedback to parents
export async function sendAIFeedbackToParentsAction(request: SendFeedbackToParentsRequest): Promise<{
  success: boolean
  message?: string
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Verify the feedback exists and belongs to the teacher
    const { data: feedback } = await supabase
      .from('student_feedback')
      .select('id, student_id, teacher_id, feedback_text')
      .eq('id', request.feedback_id)
      .eq('teacher_id', user.id)
      .eq('student_id', request.student_id)
      .single()

    if (!feedback) {
      return {
        success: false,
        error: "Không tìm thấy phản hồi hoặc bị từ chối truy cập"
      }
    }

    // Get student's string ID for parent relationships
    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('student_id')
      .eq('id', request.student_id)
      .single()

    if (!studentProfile?.student_id) {
      return {
        success: false,
        error: "Student profile not found"
      }
    }

    // Get all parents for this student using student_id string
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
      .eq('student_id', studentProfile.student_id)

    if (parentsError) {
      throw new Error(parentsError.message)
    }

    if (!parents || parents.length === 0) {
      return {
        success: false,
        error: "No parents found for this student"
      }
    }

    // Create notifications for all parents
    const notifications = parents.map(parent => ({
      student_feedback_id: request.feedback_id,
      parent_id: parent.parent_id,
      student_id: studentProfile.student_id, // Use string student ID, not UUID
      teacher_id: user.id
    }))

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
      message: `AI feedback sent to ${parents.length} parent(s) successfully`
    }
  } catch (error: unknown) {
    console.error("Send AI feedback to parents error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send feedback to parents"
    }
  }
}

// Get existing AI feedback for a student's grade submission
export async function getAIFeedbackAction(submissionId: string, studentId: string): Promise<{
  success: boolean
  data?: {
    id: string
    feedback_text: string
    rating?: number
    created_at: string
    sent_to_parents: boolean
  }
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Get existing AI feedback for this submission
    const { data: feedback, error } = await supabase
      .from('student_feedback')
      .select(`
        id,
        feedback_text,
        rating,
        created_at
      `)
      .eq('student_id', studentId)
      .eq('teacher_id', user.id)
      .like('feedback_text', `[AI_GENERATED:${submissionId}]%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!feedback) {
      return {
        success: true,
        data: undefined
      }
    }

    // Check if feedback has been sent to parents
    const { data: notifications } = await supabase
      .from('feedback_notifications')
      .select('id')
      .eq('student_feedback_id', feedback.id)
      .limit(1)

    // Remove the AI marker from feedback text for display
    const cleanFeedbackText = feedback.feedback_text.replace(/^\[AI_GENERATED:[^\]]+\]\s*/, '')

    return {
      success: true,
      data: {
        id: feedback.id,
        feedback_text: cleanFeedbackText,
        rating: feedback.rating,
        created_at: feedback.created_at,
        sent_to_parents: Boolean(notifications && notifications.length > 0)
      }
    }
  } catch (error: unknown) {
    console.error("Get AI feedback error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy phản hồi AI"
    }
  }
}
