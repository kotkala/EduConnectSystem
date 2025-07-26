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
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    throw new Error("Profile not found")
  }

  // Only admins and teachers can create notifications
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

    if (profile.role === 'admin') {
      // Admins can target all roles
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
      // Get teacher's class assignments to determine what they can target
      const { data: assignments } = await supabase
        .from('teacher_class_assignments')
        .select(`
          class_id,
          classes!inner(id, name, homeroom_teacher_id)
        `)
        .eq('teacher_id', userId)
        .eq('is_active', true)

      // Also check if teacher is a homeroom teacher for any class
      const { data: homeroomClasses } = await supabase
        .from('classes')
        .select('id, name')
        .eq('homeroom_teacher_id', userId)

      if (assignments || homeroomClasses) {
        const allClasses = new Map<string, { id: string; name: string; grade: string }>()

        // Add assigned classes (subject teacher)
        if (assignments) {
          assignments.forEach((a: unknown) => {
            const assignment = a as { class_id: string; classes: { id: string; name: string; homeroom_teacher_id: string | null } }
            allClasses.set(assignment.classes.id, {
              id: assignment.classes.id,
              name: assignment.classes.name,
              grade: assignment.classes.name // Use class name as grade for now
            })
          })
        }

        // Add homeroom classes
        if (homeroomClasses) {
          homeroomClasses.forEach((cls: { id: string; name: string }) => {
            allClasses.set(cls.id, {
              id: cls.id,
              name: cls.name,
              grade: cls.name // Use class name as grade for now
            })
          })
        }

        options.classes = Array.from(allClasses.values())
        options.roles = ['student'] // All teachers can notify students

        // If teacher is a homeroom teacher, they can also notify parents
        if (homeroomClasses && homeroomClasses.length > 0) {
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
