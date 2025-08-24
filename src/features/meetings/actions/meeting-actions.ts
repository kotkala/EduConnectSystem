'use server'

import { createClient } from '@/lib/supabase/server'
import { sendMeetingNotificationEmail } from '@/lib/services/email-service'

// Types for meeting schedule system
export interface MeetingScheduleData {
  title: string
  description?: string
  meeting_date: string
  meeting_location?: string
  duration_minutes?: number
  meeting_type?: 'parent_meeting' | 'class_meeting' | 'individual_meeting'
}

export interface CreateMeetingScheduleRequest {
  meeting_data: MeetingScheduleData
  student_ids: string[]
  class_id: string
}

export interface MeetingScheduleInfo {
  id: string
  title: string
  description?: string
  meeting_date: string
  meeting_location?: string
  duration_minutes: number
  meeting_type: string
  teacher_name: string
  class_name: string
  is_read: boolean
  read_at?: string | null
  created_at: string
}

// Get homeroom classes for a teacher
export async function getTeacherHomeroomClassesAction(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    name: string
    academic_year_name: string
    student_count: number
  }>
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

    // Get homeroom classes where teacher is the homeroom teacher
    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        academic_years(name),
        class_assignments!inner(count)
      `)
      .eq('homeroom_teacher_id', user.id)
      .eq('class_assignments.assignment_type', 'student')
      .eq('class_assignments.is_active', true)

    if (error) {
      throw new Error(error.message)
    }

    // Process the data
    const classList = classes?.map(classItem => ({
      id: classItem.id,
      name: classItem.name,
      academic_year_name: (classItem.academic_years as unknown as { name: string }).name,
      student_count: (classItem.class_assignments as unknown as Array<unknown>).length || 0
    })) || []

    return { success: true, data: classList }
  } catch (error: unknown) {
    console.error("Get teacher homeroom classes error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách lớp chủ nhiệm"
    }
  }
}

// Get students in a homeroom class with their parents
export async function getHomeroomStudentsWithParentsAction(classId: string): Promise<{
  success: boolean
  data?: Array<{
    id: string
    full_name: string
    email: string
    student_id: string
    parents: Array<{
      id: string
      full_name: string
      email: string
    }>
  }>
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Verify user is the homeroom teacher for this class
    const { data: classInfo } = await supabase
      .from('classes')
      .select('homeroom_teacher_id')
      .eq('id', classId)
      .single()

    if (!classInfo || classInfo.homeroom_teacher_id !== user.id) {
      throw new Error("Từ chối truy cập. Bạn không phải là giáo viên chủ nhiệm của lớp này.")
    }

    // Get students with their parents - need to fix the relationship join
    const { data: students, error } = await supabase
      .from('class_assignments')
      .select(`
        students:profiles!class_assignments_user_id_fkey(
          id,
          full_name,
          email,
          student_id
        )
      `)
      .eq('class_id', classId)
      .eq('assignment_type', 'student')
      .eq('is_active', true)

    if (error) {
      throw new Error(error.message)
    }

    // Get all student UUIDs to fetch their parents
    const studentUUIDs = students?.map(enrollment => {
      const student = enrollment.students as unknown as {
        id: string
        student_id: string
      }
      return student.id
    }).filter(Boolean) || []

    // Fetch parents for these students using the correct join on student UUID
    const { data: parentRelationships, error: parentsError } = await supabase
      .from('parent_student_relationships')
      .select(`
        student_id,
        parents:profiles!parent_student_relationships_parent_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .in('student_id', studentUUIDs)

    if (parentsError) {
      throw new Error(parentsError.message)
    }

    // Create a map of student UUID to parents
    const parentsMap = new Map<string, Array<{ id: string; full_name: string; email: string }>>()
    parentRelationships?.forEach(rel => {
      const parent = rel.parents as unknown as { id: string; full_name: string; email: string }
      if (!parentsMap.has(rel.student_id)) {
        parentsMap.set(rel.student_id, [])
      }
      parentsMap.get(rel.student_id)?.push(parent)
    })

    // Process the data to flatten the structure
    const studentList = students?.map(enrollment => {
      const student = enrollment.students as unknown as {
        id: string
        full_name: string
        email: string
        student_id: string
      }

      const parents = parentsMap.get(student.id) || []

      return {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        student_id: student.student_id,
        parents: parents
      }
    }) || []

    return { success: true, data: studentList }
  } catch (error: unknown) {
    console.error("Get homeroom students with parents error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách học sinh và phụ huynh"
    }
  }
}

// Create meeting schedule and send to parents
export async function createMeetingScheduleAction(request: CreateMeetingScheduleRequest): Promise<{
  success: boolean
  data?: { meeting_id: string; recipients_count: number }
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Verify user is the homeroom teacher for this class
    const { data: classInfo } = await supabase
      .from('classes')
      .select('homeroom_teacher_id, name')
      .eq('id', request.class_id)
      .single()

    if (!classInfo || classInfo.homeroom_teacher_id !== user.id) {
      throw new Error("Từ chối truy cập. Bạn không phải là giáo viên chủ nhiệm của lớp này.")
    }

    // Create the meeting schedule using unified_meetings table
    const { data: meetingSchedule, error: meetingError } = await supabase
      .from('unified_meetings')
      .insert({
        organizer_id: user.id,
        meeting_class_id: request.class_id,
        title: request.meeting_data.title,
        description: request.meeting_data.description,
        scheduled_at: request.meeting_data.meeting_date,
        location: request.meeting_data.meeting_location,
        duration_minutes: request.meeting_data.duration_minutes || 60,
        meeting_type: request.meeting_data.meeting_type || 'parent_meeting',
        status: 'scheduled'
      })
      .select('id')
      .single()

    if (meetingError || !meetingSchedule) {
      throw new Error(meetingError?.message || "Không thể tạo lịch hẹn")
    }

    // Get parents for the selected students using student UUIDs directly
    const { data: studentParents, error: parentsError } = await supabase
      .from('parent_student_relationships')
      .select('parent_id, student_id')
      .in('student_id', request.student_ids)

    if (parentsError) {
      throw new Error(parentsError.message)
    }

    // Create recipients data for JSONB storage
    const recipients = studentParents?.map(rel => ({
      student_id: rel.student_id,
      parent_id: rel.parent_id,
      is_read: false,
      read_at: null
    })) || []

    // Update the meeting with recipients data
    if (recipients.length > 0) {
      const { error: recipientsError } = await supabase
        .from('unified_meetings')
        .update({ recipients: recipients })
        .eq('id', meetingSchedule.id)

      if (recipientsError) {
        throw new Error(recipientsError.message)
      }
    }

    // Send email notifications to parents
    if (recipients.length > 0) {
      try {
        // Get teacher info for email
        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        // Get parent and student details for email
        const { data: parentDetails } = await supabase
          .from('parent_student_relationships')
          .select('parent_id, student_id')
          .in('student_id', request.student_ids)

        if (parentDetails && teacherProfile) {
          // Get unique parent IDs
          const parentIds = [...new Set(parentDetails.map(p => p.parent_id))]

          // Get parent profiles
          const { data: parentProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', parentIds)

          // Get student profiles
          const { data: studentProfiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', request.student_ids)

          if (parentProfiles && studentProfiles) {
            // Send email to each parent
            for (const parentDetail of parentDetails) {
              const parent = parentProfiles.find(p => p.id === parentDetail.parent_id)
              const student = studentProfiles.find(s => s.id === parentDetail.student_id)

              if (parent?.email && student) {
                await sendMeetingNotificationEmail({
                  parentEmail: parent.email,
                  parentName: parent.full_name || 'Phụ huynh',
                  studentName: student.full_name || 'Học sinh',
                  meetingTitle: request.meeting_data.title,
                  meetingDescription: request.meeting_data.description,
                  meetingDate: request.meeting_data.meeting_date,
                  meetingLocation: request.meeting_data.meeting_location,
                  durationMinutes: request.meeting_data.duration_minutes || 60,
                  teacherName: teacherProfile.full_name || 'Giáo viên',
                  className: classInfo.name
                })
              }
            }
          }
          console.log(`✅ Sent meeting notification emails to ${parentDetails.length} parents`)
        }
      } catch (emailError) {
        console.error('❌ Failed to send meeting notification emails:', emailError)
        // Don't fail the entire operation if email fails
      }
    }

    return {
      success: true,
      data: {
        meeting_id: meetingSchedule.id,
        recipients_count: recipients.length
      }
    }
  } catch (error: unknown) {
    console.error("Create meeting schedule error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể tạo lịch hẹn"
    }
  }
}

// Get meeting schedules for a parent
export async function getParentMeetingSchedulesAction(): Promise<{
  success: boolean
  data?: MeetingScheduleInfo[]
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Verify user is a parent
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'parent') {
      throw new Error("Từ chối truy cập. Yêu cầu vai trò phụ huynh.")
    }

    // Get all meetings and filter in JavaScript (more reliable than complex JSONB queries)
    const { data: allMeetings, error } = await supabase
      .from('unified_meetings')
      .select(`
        id,
        title,
        description,
        scheduled_at,
        location,
        duration_minutes,
        meeting_type,
        recipients,
        created_at,
        organizer_id,
        meeting_class_id
      `)
      .not('recipients', 'is', null)
      .order('created_at', { ascending: false })

    // Filter meetings where this parent is in the recipients array
    const meetingSchedules = allMeetings?.filter(meeting => {
      const recipients = meeting.recipients as Array<{ parent_id: string }>
      return recipients?.some(recipient => recipient.parent_id === user.id)
    }) || []

    if (error) {
      throw new Error(error.message)
    }

    // Get organizer and class names
    const organizerIds = meetingSchedules?.map(m => m.organizer_id).filter(Boolean) || []
    const classIds = meetingSchedules?.map(m => m.meeting_class_id).filter(Boolean) || []

    const organizerMap = new Map<string, string>()
    const classMap = new Map<string, string>()

    if (organizerIds.length > 0) {
      const { data: organizers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', organizerIds)

      organizers?.forEach(org => {
        organizerMap.set(org.id, org.full_name)
      })
    }

    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds)

      classes?.forEach(cls => {
        classMap.set(cls.id, cls.name)
      })
    }

    // Process the data
    const scheduleList = meetingSchedules?.map(schedule => {
      const recipients = schedule.recipients as unknown as Array<{ parent_id: string; is_read?: boolean; read_at?: string }>

      // Find this parent's recipient data
      const parentRecipient = recipients?.find(r => r.parent_id === user.id)

      return {
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        meeting_date: schedule.scheduled_at,
        meeting_location: schedule.location,
        duration_minutes: schedule.duration_minutes,
        meeting_type: schedule.meeting_type,
        teacher_name: organizerMap.get(schedule.organizer_id) || 'Unknown Teacher',
        class_name: classMap.get(schedule.meeting_class_id) || 'Unknown Class',
        is_read: parentRecipient?.is_read || false,
        read_at: parentRecipient?.read_at || null,
        created_at: schedule.created_at
      }
    }) || []

    return { success: true, data: scheduleList }
  } catch (error: unknown) {
    console.error("Get parent meeting schedules error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách lịch hẹn"
    }
  }
}

// Mark meeting schedule as read
export async function markMeetingScheduleAsReadAction(meetingScheduleId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Get the meeting and update the recipient data
    const { data: meeting, error: fetchError } = await supabase
      .from('unified_meetings')
      .select('recipients')
      .eq('id', meetingScheduleId)
      .single()

    if (fetchError || !meeting) {
      throw new Error(fetchError?.message || "Meeting not found")
    }

    // Update the recipients array to mark this parent as read
    const recipients = meeting.recipients as Array<{ parent_id: string; is_read?: boolean; read_at?: string }>
    const updatedRecipients = recipients.map(recipient =>
      recipient.parent_id === user.id
        ? { ...recipient, is_read: true, read_at: new Date().toISOString() }
        : recipient
    )

    const { error } = await supabase
      .from('unified_meetings')
      .update({ recipients: updatedRecipients })
      .eq('id', meetingScheduleId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error: unknown) {
    console.error("Mark meeting schedule as read error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể đánh dấu đã đọc"
    }
  }
}

// Get unread meeting schedule count for a parent
export async function getUnreadMeetingScheduleCountAction(): Promise<{
  success: boolean
  data?: { count: number }
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Get all meetings and filter for this parent
    const { data: allMeetings, error } = await supabase
      .from('unified_meetings')
      .select('recipients')
      .not('recipients', 'is', null)

    if (error) {
      throw new Error(error.message)
    }

    // Filter meetings for this parent and count unread ones
    let unreadCount = 0
    allMeetings?.forEach(meeting => {
      const recipients = meeting.recipients as Array<{ parent_id: string; is_read?: boolean }>
      const parentRecipient = recipients?.find(r => r.parent_id === user.id)
      if (parentRecipient && !parentRecipient.is_read) {
        unreadCount++
      }
    })

    return { success: true, data: { count: unreadCount } }
  } catch (error: unknown) {
    console.error("Get unread meeting schedule count error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy số lượng chưa đọc"
    }
  }
}

// Get meeting schedules created by a teacher
export async function getTeacherMeetingSchedulesAction(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    title: string
    description?: string
    meeting_date: string
    meeting_location?: string
    duration_minutes: number
    meeting_type: string
    class_name: string
    recipients_count: number
    created_at: string
  }>
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

    // Get meeting schedules created by this teacher with manual join
    const { data: meetingSchedules, error } = await supabase
      .from('unified_meetings')
      .select(`
        id,
        title,
        description,
        scheduled_at,
        location,
        duration_minutes,
        meeting_type,
        recipients,
        created_at,
        meeting_class_id
      `)
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    // Get class names for the meetings
    const classIds = meetingSchedules?.map(m => m.meeting_class_id).filter(Boolean) || []
    const classMap = new Map<string, string>()

    if (classIds.length > 0) {
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds)

      classes?.forEach(cls => {
        classMap.set(cls.id, cls.name)
      })
    }

    // Process the data
    const scheduleList = meetingSchedules?.map(schedule => {
      const recipients = schedule.recipients as unknown as Array<unknown> || []

      return {
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        meeting_date: schedule.scheduled_at,
        meeting_location: schedule.location,
        duration_minutes: schedule.duration_minutes,
        meeting_type: schedule.meeting_type,
        class_name: classMap.get(schedule.meeting_class_id) || 'Unknown Class',
        recipients_count: recipients.length,
        created_at: schedule.created_at
      }
    }) || []

    return { success: true, data: scheduleList }
  } catch (error: unknown) {
    console.error("Get teacher meeting schedules error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách lịch hẹn"
    }
  }
}
