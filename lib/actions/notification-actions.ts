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
    throw new Error("Yêu cầu xác thực")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    throw new Error("Không tìm thấy hồ sơ")
  }

  // Only admins and teachers can create notifications
  if (profile.role !== 'admin' && profile.role !== 'teacher') {
    throw new Error("Chỉ quản trị viên và giáo viên mới có thể tạo thông báo")
  }

  return { userId: user.id, profile }
}

// Helper function to get admin target options
async function getAdminTargetOptions(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{ roles: string[]; classes: { id: string; name: string; grade: string }[] }> {
  const options = {
    roles: ['teacher', 'student', 'parent'] as string[],
    classes: [] as { id: string; name: string; grade: string }[]
  }

  // Get all classes for potential targeting
  const { data: classes } = await supabase
    .from('classes')
    .select('id, name, grade')
    .eq('is_active', true)
    .order('grade', { ascending: true })
    .order('name', { ascending: true })

  options.classes = classes || []
  return options
}

// Helper function to get teacher's class assignments
async function getTeacherClassAssignments(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: assignments } = await supabase
    .from('teacher_class_assignments')
    .select(`
      class_id,
      classes!inner(id, name, homeroom_teacher_id)
    `)
    .eq('teacher_id', userId)
    .eq('is_active', true)

  return assignments || []
}

// Helper function to get teacher's homeroom classes
async function getTeacherHomeroomClasses(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: homeroomClasses } = await supabase
    .from('classes')
    .select('id, name')
    .eq('homeroom_teacher_id', userId)

  return homeroomClasses || []
}

// Helper function to build teacher target options
function buildTeacherTargetOptions(
  assignments: Array<{ class_id: string; classes: unknown }>,
  homeroomClasses: Array<{ id: string; name: string }>
): { roles: string[]; classes: { id: string; name: string; grade: string }[] } {
  const allClasses = new Map<string, { id: string; name: string; grade: string }>()

  // Add assigned classes (subject teacher)
  assignments.forEach((assignment) => {
    const classes = assignment.classes as { id: string; name: string; homeroom_teacher_id: string | null }
    allClasses.set(classes.id, {
      id: classes.id,
      name: classes.name,
      grade: classes.name // Use class name as grade for now
    })
  })

  // Add homeroom classes
  homeroomClasses.forEach((cls) => {
    allClasses.set(cls.id, {
      id: cls.id,
      name: cls.name,
      grade: cls.name // Use class name as grade for now
    })
  })

  const options = {
    classes: Array.from(allClasses.values()),
    roles: ['student'] as string[] // All teachers can notify students
  }

  // If teacher is a homeroom teacher, they can also notify parents
  if (homeroomClasses.length > 0) {
    options.roles.push('parent')
  }

  return options
}

// Get available target options based on user role
export async function getNotificationTargetOptions(): Promise<{ success: boolean; data?: { roles: string[]; classes: { id: string; name: string; grade: string }[] }; error?: string }> {
  try {
    const { userId, profile } = await checkNotificationPermissions()
    const supabase = await createClient()

    let options: { roles: string[]; classes: { id: string; name: string; grade: string }[] }

    if (profile.role === 'admin') {
      options = await getAdminTargetOptions(supabase)
    } else if (profile.role === 'teacher') {
      const assignments = await getTeacherClassAssignments(supabase, userId)
      const homeroomClasses = await getTeacherHomeroomClasses(supabase, userId)

      if (assignments.length > 0 || homeroomClasses.length > 0) {
        options = buildTeacherTargetOptions(assignments, homeroomClasses)
      } else {
        options = { roles: [], classes: [] }
      }
    } else {
      options = { roles: [], classes: [] }
    }

    return { success: true, data: options }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
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
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Get notifications for current user with server-side pagination
export async function getUserNotificationsAction(page?: number, limit?: number): Promise<{ success: boolean; data?: Notification[]; pagination?: { page: number; limit: number; total: number; totalPages: number }; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new Error("User profile not found")
    }

    // Build query with role-based filtering
    const effectivePage = Math.max(1, page ?? 1)
    const effectiveLimit = Math.max(1, Math.min(50, limit ?? 10))
    const offset = (effectivePage - 1) * effectiveLimit
    let query = supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!notifications_sender_id_fkey(full_name, role),
        notification_reads!left(user_id, read_at)
      `)
      .eq('is_active', true)

    // For admin role, show both received and sent notifications
    if (profile.role === 'admin') {
      query = query.or(`target_roles.cs.{${profile.role}},sender_id.eq.${user.id}`)
    } else {
      // Filter by target roles - notifications must include user's role in target_roles array
      query = query.contains('target_roles', [profile.role])
    }

    // For students and parents, also filter by class if target_classes is specified
    if (profile.role === 'student' || profile.role === 'parent') {
      // For now, show all notifications for the role (class filtering can be added later)
      // This ensures parents and students see notifications targeted to their role
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + effectiveLimit - 1)

    const { data: notifications, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    // Add read status to each notification
    const notificationsWithReadStatus = notifications?.map(notification => ({
      ...notification,
      is_read: notification.notification_reads.some((read: { user_id: string }) => read.user_id === user.id)
    })) || []

    // Get total count for pagination (head: true for count only) with same filters
    let countQuery = supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (profile.role === 'admin') {
      countQuery = countQuery.or(`target_roles.cs.{${profile.role}},sender_id.eq.${user.id}`)
    } else {
      countQuery = countQuery.contains('target_roles', [profile.role])
    }

    const { count, error: countError } = await countQuery
    if (countError) {
      // Fallback to current page length if count fails
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      null
    }

    const total = (count ?? notificationsWithReadStatus.length)
    const totalPages = Math.ceil(total / effectiveLimit) || 1

    return {
      success: true,
      data: notificationsWithReadStatus,
      pagination: { page: effectivePage, limit: effectiveLimit, total, totalPages }
    }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
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

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { success: true, data: 0 }
    }

    // Build query with role-based filtering
    let query = supabase
      .from('notifications')
      .select(`
        id,
        notification_reads!left(user_id)
      `)
      .eq('is_active', true)

    // For admin role, show both received and sent notifications
    if (profile.role === 'admin') {
      query = query.or(`target_roles.cs.{${profile.role}},sender_id.eq.${user.id}`)
    } else {
      // Filter by target roles - notifications must include user's role in target_roles array
      query = query.contains('target_roles', [profile.role])
    }

    // For students and parents, also filter by class if target_classes is specified
    if (profile.role === 'student' || profile.role === 'parent') {
      // For now, show all notifications for the role (class filtering can be added later)
      // This ensures parents and students see notifications targeted to their role
    }

    const { data: notifications, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    // Count unread notifications
    const unreadCount = notifications?.filter(notification =>
      !notification.notification_reads.some((read: { user_id: string }) => read.user_id === user.id)
    ).length || 0

    return { success: true, data: unreadCount }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Mark notification as read
export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
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
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
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
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}
