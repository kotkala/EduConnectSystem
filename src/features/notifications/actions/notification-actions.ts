'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/shared/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface NotificationFormData {
  title: string
  content: string
  image_url?: string
  target_roles: string[]
  target_classes?: string[]
  attachments?: File[]
}

export interface NotificationAttachment {
  id: string
  notification_id: string
  file_name: string
  file_type: string
  file_size: number
  storage_path: string
  public_url: string
  mime_type: string
  created_at: string
  updated_at: string
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
  edited_at?: string
  sender?: {
    full_name: string
    role: string
  }
  is_read?: boolean
  unread_count?: number
  attachments?: NotificationAttachment[]
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
export async function createNotificationAction(data: NotificationFormData, attachments?: NotificationAttachment[]) {
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

    // Save attachments if provided
    if (attachments && attachments.length > 0) {
      const attachmentRecords = attachments.map(attachment => ({
        notification_id: notification.id,
        file_name: attachment.file_name,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        storage_path: attachment.storage_path,
        public_url: attachment.public_url,
        mime_type: attachment.mime_type
      }))

      const { error: attachmentError } = await supabase
        .from('notification_attachments')
        .insert(attachmentRecords)

      if (attachmentError) {
        // If attachment save fails, we should clean up the notification
        await supabase.from('notifications').delete().eq('id', notification.id)
        throw new Error(`Failed to save attachments: ${attachmentError.message}`)
      }
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
        id,
        title,
        content,
        image_url,
        sender_id,
        target_roles,
        target_classes,
        is_active,
        created_at,
        updated_at,
        edited_at,
        sender:profiles!notifications_sender_id_fkey(full_name, role),
        notification_reads!left(user_id, read_at),
        attachments:notification_attachments(id, notification_id, file_name, file_type, file_size, storage_path, public_url, mime_type, created_at, updated_at)
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

    // Add read status to each notification and fix sender type
    const notificationsWithReadStatus = notifications?.map(notification => ({
      ...notification,
      sender: Array.isArray(notification.sender) ? notification.sender[0] : notification.sender,
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

    // Check if already marked as read
    const { data: existingRead } = await supabase
      .from('notification_reads')
      .select('id')
      .eq('notification_id', notificationId)
      .eq('user_id', user.id)
      .single()

    if (existingRead) {
      // Already marked as read
      return { success: true }
    }

    // Insert new read record
    const { error } = await supabase
      .from('notification_reads')
      .insert({
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

// Upload notification image (legacy function - kept for backward compatibility)
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

// Upload notification attachments (supports multiple files and types)
export async function uploadNotificationAttachmentsAction(
  files: File[]
): Promise<{ success: boolean; data?: NotificationAttachment[]; error?: string }> {
  try {
    const { userId } = await checkNotificationPermissions()
    const supabase = await createClient()
    const uploadedAttachments: NotificationAttachment[] = []

    for (const file of files) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`)
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ]

      if (!allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not supported for ${file.name}`)
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `attachments/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('notifications')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`)
      }

      const { data: { publicUrl } } = supabase.storage
        .from('notifications')
        .getPublicUrl(filePath)

      // Create attachment record (will be saved to DB when notification is created)
      const attachment: Partial<NotificationAttachment> = {
        file_name: file.name,
        file_type: file.type.startsWith('image/') ? 'image' : 'document',
        file_size: file.size,
        storage_path: filePath,
        public_url: publicUrl,
        mime_type: file.type
      }

      uploadedAttachments.push(attachment as NotificationAttachment)
    }

    return { success: true, data: uploadedAttachments }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Edit notification
export async function editNotificationAction(
  notificationId: string,
  data: NotificationFormData,
  newAttachments?: NotificationAttachment[]
) {
  try {
    const { userId } = await checkNotificationPermissions()
    const supabase = await createClient()

    // Check if user can edit this notification (must be sender or admin)
    const { data: existingNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('sender_id')
      .eq('id', notificationId)
      .single()

    if (fetchError) {
      throw new Error('Notification not found')
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profile) {
      throw new Error('User profile not found')
    }

    // Check permissions: must be sender or admin
    if (existingNotification.sender_id !== userId && profile.role !== 'admin') {
      throw new Error('You do not have permission to edit this notification')
    }

    // Update notification with edited_at timestamp
    const { data: notification, error } = await supabase
      .from('notifications')
      .update({
        title: data.title,
        content: data.content,
        image_url: data.image_url,
        target_roles: data.target_roles,
        target_classes: data.target_classes || [],
        edited_at: new Date().toISOString()
      })
      .eq('id', notificationId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Add new attachments if provided
    if (newAttachments && newAttachments.length > 0) {
      const attachmentRecords = newAttachments.map(attachment => ({
        notification_id: notificationId,
        file_name: attachment.file_name,
        file_type: attachment.file_type,
        file_size: attachment.file_size,
        storage_path: attachment.storage_path,
        public_url: attachment.public_url,
        mime_type: attachment.mime_type
      }))

      const { error: attachmentError } = await supabase
        .from('notification_attachments')
        .insert(attachmentRecords)

      if (attachmentError) {
        throw new Error(`Failed to save new attachments: ${attachmentError.message}`)
      }
    }

    revalidatePath('/dashboard')
    return { success: true, data: notification }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Delete notification attachment
export async function deleteNotificationAttachmentAction(attachmentId: string) {
  try {
    const { userId } = await checkNotificationPermissions()
    const supabase = await createClient()

    // Get attachment details and check permissions
    const { data: attachment, error: fetchError } = await supabase
      .from('notification_attachments')
      .select(`
        *,
        notification:notifications!inner(sender_id)
      `)
      .eq('id', attachmentId)
      .single()

    if (fetchError) {
      throw new Error('Attachment not found')
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profile) {
      throw new Error('User profile not found')
    }

    // Check permissions: must be sender or admin
    if (attachment.notification.sender_id !== userId && profile.role !== 'admin') {
      throw new Error('You do not have permission to delete this attachment')
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('notifications')
      .remove([attachment.storage_path])

    if (storageError) {
      console.error('Failed to delete file from storage:', storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('notification_attachments')
      .delete()
      .eq('id', attachmentId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Get single notification for viewing (no permission check - handled by RLS)
export async function getNotificationForViewAction(notificationId: string) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!notifications_sender_id_fkey(full_name, role),
        attachments:notification_attachments(*),
        notification_reads!left(user_id, read_at)
      `)
      .eq('id', notificationId)
      .eq('is_active', true)
      .single()

    if (error) {
      throw new Error('Không tìm thấy thông báo')
    }

    // Add read status
    const notificationWithReadStatus = {
      ...notification,
      is_read: notification.notification_reads.some((read: { user_id: string }) => read.user_id === user.id)
    }

    return { success: true, data: notificationWithReadStatus }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Get single notification for editing (with permission check)
export async function getNotificationForEditAction(notificationId: string) {
  try {
    const { userId } = await checkNotificationPermissions()
    const supabase = await createClient()

    const { data: notification, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!notifications_sender_id_fkey(full_name, role),
        attachments:notification_attachments(*)
      `)
      .eq('id', notificationId)
      .eq('is_active', true)
      .single()

    if (error) {
      throw new Error('Không tìm thấy thông báo')
    }

    // Get user profile to check role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (!profile) {
      throw new Error('Không tìm thấy hồ sơ người dùng')
    }

    // Check permissions: must be sender or admin
    if (notification.sender_id !== userId && profile.role !== 'admin') {
      throw new Error('Bạn không có quyền chỉnh sửa thông báo này')
    }

    return { success: true, data: notification }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// GRADE NOTIFICATION FUNCTIONS

// Send grade notification to parent
export async function sendGradeNotificationAction(gradeId: string, notificationType: 'grade_added' | 'grade_updated' | 'grade_locked') {
  try {
    const supabase = createAdminClient()

    // Get grade information with student and parent details
    const { data: gradeInfo, error: gradeError } = await supabase
      .from('student_grades')
      .select(`
        id,
        grade_value,
        grade_type,
        notes,
        student:profiles!student_grades_student_id_fkey!inner(
          id,
          full_name,
          student_id
        ),
        subject:subjects!student_grades_subject_id_fkey!inner(
          name_vietnamese,
          code
        ),
        class:classes!student_grades_class_id_fkey!inner(
          name
        ),
        period:grade_reporting_periods!student_grades_period_id_fkey!inner(
          name
        )
      `)
      .eq('id', gradeId)
      .single()

    if (gradeError || !gradeInfo) {
      return {
        success: false,
        error: 'Không tìm thấy thông tin điểm số'
      }
    }

    // Get parent information separately to avoid type issues
    const studentData = Array.isArray(gradeInfo.student) ? gradeInfo.student[0] : gradeInfo.student

    const { data: parentInfo, error: parentError } = await supabase
      .from('profiles')
      .select('parent_id')
      .eq('id', studentData.id)
      .single()

    if (parentError || !parentInfo?.parent_id) {
      return {
        success: false,
        error: 'Học sinh chưa có phụ huynh được liên kết'
      }
    }

    // Create notification message
    const subjectData = Array.isArray(gradeInfo.subject) ? gradeInfo.subject[0] : gradeInfo.subject

    const messageMap = {
      'grade_added': `Điểm số mới đã được thêm cho ${studentData.full_name} - Môn: ${subjectData.name_vietnamese}, Điểm: ${gradeInfo.grade_value}`,
      'grade_updated': `Điểm số đã được cập nhật cho ${studentData.full_name} - Môn: ${subjectData.name_vietnamese}, Điểm mới: ${gradeInfo.grade_value}`,
      'grade_locked': `Điểm số đã được khóa cho ${studentData.full_name} - Môn: ${subjectData.name_vietnamese}, Điểm: ${gradeInfo.grade_value}`
    }

    const message = messageMap[notificationType]

    // Insert notification using the existing notification system
    const notificationData = {
      title: 'Thông báo điểm số',
      content: message,
      target_roles: ['parent'],
      target_classes: [],
      is_active: true
    }

    // Create notification for the specific parent
    const result = await createNotificationAction(notificationData)

    if (result.success) {
      revalidatePath('/dashboard/parent/notifications')
      return {
        success: true,
        message: 'Đã gửi thông báo cho phụ huynh'
      }
    } else {
      return result
    }

  } catch (error) {
    console.error('Error sending grade notification:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể gửi thông báo'
    }
  }
}
