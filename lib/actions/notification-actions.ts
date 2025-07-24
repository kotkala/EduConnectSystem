'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface NotificationFormData {
  title: string
  content: string
  image_url?: string
  target_roles: string[]
  target_classes?: string[]
}



export interface Notification {
  id: string
  title: string
  content: string
  image_url?: string
  sender_id: string
  target_roles: string[]
  target_classes?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
  sender?: {
    full_name: string
    role: string
  }
  is_read?: boolean
  unread_count?: number
}

// Helper function to check notification permissions
async function checkNotificationPermissions() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Authentication required")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, admin_type")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    throw new Error("Profile not found")
  }

  // Only admins (school_admin type) and teachers can create notifications
  if (profile.role !== 'admin' && profile.role !== 'teacher') {
    throw new Error("Only administrators and teachers can create notifications")
  }

  return { userId: user.id, profile }
}

// Get available target options based on user role
export async function getNotificationTargetOptions(): Promise<{ success: boolean; data?: { roles: string[]; classes: { id: string; name: string; grade: string }[] }; error?: string }> {
  try {
    const { userId, profile } = await checkNotificationPermissions()
    const supabase = await createClient()

    const options = {
      roles: [] as string[],
      classes: [] as { id: string; name: string; grade: string }[]
    }

    if (profile.role === 'admin' && profile.admin_type === 'school_admin') {
      // School admins can target all roles
      options.roles = ['teacher', 'student', 'parent']
      
      // Get all classes for potential targeting
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name, grade')
        .eq('is_active', true)
        .order('grade', { ascending: true })
        .order('name', { ascending: true })
      
      options.classes = classes || []
    } else if (profile.role === 'teacher') {
      // Get teacher's assignments to determine what they can target
      const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select(`
          class_id,
          classes!inner(id, name, grade, homeroom_teacher_id)
        `)
        .eq('teacher_id', userId)
        .eq('is_active', true)

      if (assignments) {
        // Subject teacher can notify their assigned classes
        const assignedClasses = assignments.map((a: unknown) => {
          const assignment = a as { classes: { id: string; name: string; grade: string; homeroom_teacher_id: string } }
          return {
            id: assignment.classes.id,
            name: assignment.classes.name,
            grade: assignment.classes.grade
          }
        })
        options.classes = assignedClasses
        options.roles = ['student'] // Can only notify students in their classes

        // Check if they are also a homeroom teacher
        const homeroomClasses = assignments.filter((a: unknown) => {
          const assignment = a as { classes: { homeroom_teacher_id: string } }
          return assignment.classes.homeroom_teacher_id === userId
        })
        if (homeroomClasses.length > 0) {
          // Homeroom teachers can also notify parents
          options.roles.push('parent')
        }
      }
    }

    return { success: true, data: options }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

// Create a new notification
export async function createNotificationAction(data: NotificationFormData) {
  try {
    const { userId } = await checkNotificationPermissions()
    const supabase = await createClient()

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        title: data.title,
        content: data.content,
        image_url: data.image_url,
        sender_id: userId,
        target_roles: data.target_roles,
        target_classes: data.target_classes || []
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    return { success: true, data: notification }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

// Get notifications for current user
export async function getUserNotificationsAction(): Promise<{ success: boolean; data?: Notification[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!notifications_sender_id_fkey(full_name, role),
        notification_reads!left(user_id, read_at)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    // Add read status to each notification
    const notificationsWithReadStatus = notifications?.map(notification => ({
      ...notification,
      is_read: notification.notification_reads.some((read: { user_id: string }) => read.user_id === user.id)
    })) || []

    return { success: true, data: notificationsWithReadStatus }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

// Get unread notification count
export async function getUnreadNotificationCountAction(): Promise<{ success: boolean; data?: number; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: true, data: 0 }
    }

    // Get all notifications for user
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        id,
        notification_reads!left(user_id)
      `)
      .eq('is_active', true)

    if (error) {
      throw new Error(error.message)
    }

    // Count unread notifications
    const unreadCount = notifications?.filter(notification => 
      !notification.notification_reads.some((read: { user_id: string }) => read.user_id === user.id)
    ).length || 0

    return { success: true, data: unreadCount }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

// Mark notification as read
export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    const { error } = await supabase
      .from('notification_reads')
      .upsert({
        notification_id: notificationId,
        user_id: user.id
      })

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

// Upload notification image
export async function uploadNotificationImageAction(file: File): Promise<{ success: boolean; data?: { url: string; path: string }; error?: string }> {
  try {
    const { userId } = await checkNotificationPermissions()
    const supabase = await createClient()

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase.storage
      .from('notifications')
      .upload(filePath, file)

    if (error) {
      throw new Error(error.message)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('notifications')
      .getPublicUrl(filePath)

    return { success: true, data: { url: publicUrl, path: filePath } }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}
