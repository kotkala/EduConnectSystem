'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface LeaveApplicationFormData {
  student_id: string
  leave_type: 'sick' | 'family' | 'emergency' | 'vacation' | 'other'
  start_date: string
  end_date: string
  reason: string
  attachment_url?: string
}

export interface LeaveApplication {
  id: string
  student_id: string
  parent_id: string
  homeroom_teacher_id?: string
  class_id?: string
  academic_year_id?: string
  leave_type: string
  start_date: string
  end_date: string
  reason: string
  attachment_url?: string
  status: 'pending' | 'approved' | 'rejected'
  teacher_response?: string
  responded_at?: string
  created_at: string
  updated_at: string
  student?: {
    full_name: string
    student_id: string
  }
  homeroom_teacher?: {
    full_name: string
  }
  class?: {
    name: string
  }
}

// Create a new leave application
export async function createLeaveApplicationAction(data: LeaveApplicationFormData): Promise<{ success: boolean; data?: LeaveApplication; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // Verify user is a parent and has relationship with the student
    const { data: relationship } = await supabase
      .from('parent_student_relationships')
      .select('id')
      .eq('parent_id', user.id)
      .eq('student_id', data.student_id)
      .single()

    if (!relationship) {
      throw new Error("You don't have permission to create leave applications for this student")
    }

    // Get student's current class and homeroom teacher
    const { data: currentAssignment } = await supabase
      .from('student_class_assignments')
      .select(`
        class_id,
        academic_year_id,
        classes!inner(
          id,
          homeroom_teacher_id
        )
      `)
      .eq('student_id', data.student_id)
      .eq('is_active', true)
      .single()

    if (!currentAssignment) {
      throw new Error("Student is not currently assigned to any class")
    }

    // Create the leave application
    const { data: leaveApplication, error } = await supabase
      .from('leave_applications')
      .insert({
        student_id: data.student_id,
        parent_id: user.id,
        homeroom_teacher_id: (currentAssignment.classes as unknown as { homeroom_teacher_id: string }).homeroom_teacher_id,
        class_id: currentAssignment.class_id,
        academic_year_id: currentAssignment.academic_year_id,
        leave_type: data.leave_type,
        start_date: data.start_date,
        end_date: data.end_date,
        reason: data.reason,
        attachment_url: data.attachment_url
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/parent')
    return { success: true, data: leaveApplication }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

// Get leave applications for a parent
export async function getParentLeaveApplicationsAction(): Promise<{ success: boolean; data?: LeaveApplication[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    const { data: applications, error } = await supabase
      .from('leave_applications')
      .select(`
        *,
        student:profiles!leave_applications_student_id_fkey(full_name, student_id),
        homeroom_teacher:profiles!leave_applications_homeroom_teacher_id_fkey(full_name),
        class:classes!leave_applications_class_id_fkey(name)
      `)
      .eq('parent_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data: applications || [] }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

// Get leave applications for a teacher (homeroom teacher)
export async function getTeacherLeaveApplicationsAction(): Promise<{ success: boolean; data?: LeaveApplication[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    const { data: applications, error } = await supabase
      .from('leave_applications')
      .select(`
        *,
        student:profiles!leave_applications_student_id_fkey(full_name, student_id),
        class:classes!leave_applications_class_id_fkey(name)
      `)
      .eq('homeroom_teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data: applications || [] }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

// Respond to leave application (teacher only)
export async function respondToLeaveApplicationAction(
  applicationId: string, 
  status: 'approved' | 'rejected', 
  response?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // Verify the teacher is the homeroom teacher for this application
    const { data: application } = await supabase
      .from('leave_applications')
      .select('homeroom_teacher_id')
      .eq('id', applicationId)
      .single()

    if (!application || application.homeroom_teacher_id !== user.id) {
      throw new Error("You don't have permission to respond to this leave application")
    }

    const { error } = await supabase
      .from('leave_applications')
      .update({
        status,
        teacher_response: response,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', applicationId)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/teacher')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

// Upload leave application attachment
export async function uploadLeaveAttachmentAction(file: File): Promise<{ success: boolean; data?: { url: string; path: string }; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase.storage
      .from('leave-applications')
      .upload(filePath, file)

    if (error) {
      throw new Error(error.message)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('leave-applications')
      .getPublicUrl(filePath)

    return { success: true, data: { url: publicUrl, path: filePath } }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

// Update leave application status (for teachers) - alias for respondToLeaveApplicationAction
export async function updateLeaveApplicationStatusAction(data: {
  applicationId: string
  status: 'approved' | 'rejected'
  teacherResponse?: string
}): Promise<{ success: boolean; error?: string }> {
  return respondToLeaveApplicationAction(data.applicationId, data.status, data.teacherResponse)
}
