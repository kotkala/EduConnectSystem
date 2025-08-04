'use server'

import { createClient } from '@/utils/supabase/server'

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
  read_at?: string
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

    // Get homeroom classes where teacher is the homeroom teacher
    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        academic_years!inner(name),
        student_class_assignments!inner(count)
      `)
      .eq('homeroom_teacher_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    // Process the data
    const classList = classes?.map(classItem => ({
      id: classItem.id,
      name: classItem.name,
      academic_year_name: (classItem.academic_years as unknown as { name: string }).name,
      student_count: (classItem.student_class_assignments as unknown as Array<unknown>).length || 0
    })) || []

    return { success: true, data: classList }
  } catch (error: unknown) {
    console.error("Get teacher homeroom classes error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch homeroom classes"
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
      throw new Error("Authentication required")
    }

    // Verify user is the homeroom teacher for this class
    const { data: classInfo } = await supabase
      .from('classes')
      .select('homeroom_teacher_id')
      .eq('id', classId)
      .single()

    if (!classInfo || classInfo.homeroom_teacher_id !== user.id) {
      throw new Error("Access denied. You are not the homeroom teacher for this class.")
    }

    // Get students with their parents - need to fix the relationship join
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
      error: error instanceof Error ? error.message : "Failed to fetch students and parents"
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
      throw new Error("Authentication required")
    }

    // Verify user is the homeroom teacher for this class
    const { data: classInfo } = await supabase
      .from('classes')
      .select('homeroom_teacher_id')
      .eq('id', request.class_id)
      .single()

    if (!classInfo || classInfo.homeroom_teacher_id !== user.id) {
      throw new Error("Access denied. You are not the homeroom teacher for this class.")
    }

    // Create the meeting schedule
    const { data: meetingSchedule, error: meetingError } = await supabase
      .from('meeting_schedules')
      .insert({
        teacher_id: user.id,
        class_id: request.class_id,
        title: request.meeting_data.title,
        description: request.meeting_data.description,
        meeting_date: request.meeting_data.meeting_date,
        meeting_location: request.meeting_data.meeting_location,
        duration_minutes: request.meeting_data.duration_minutes || 60,
        meeting_type: request.meeting_data.meeting_type || 'parent_meeting'
      })
      .select('id')
      .single()

    if (meetingError || !meetingSchedule) {
      throw new Error(meetingError?.message || "Failed to create meeting schedule")
    }

    // Get parents for the selected students using student UUIDs directly
    const { data: studentParents, error: parentsError } = await supabase
      .from('parent_student_relationships')
      .select('parent_id, student_id')
      .in('student_id', request.student_ids)

    if (parentsError) {
      throw new Error(parentsError.message)
    }

    // Create recipients records using student UUIDs directly
    const recipients: Array<{
      meeting_schedule_id: string
      student_id: string
      parent_id: string
    }> = []

    studentParents?.forEach(rel => {
      recipients.push({
        meeting_schedule_id: meetingSchedule.id,
        student_id: rel.student_id,
        parent_id: rel.parent_id
      })
    })

    if (recipients.length > 0) {
      const { error: recipientsError } = await supabase
        .from('meeting_schedule_recipients')
        .insert(recipients)

      if (recipientsError) {
        throw new Error(recipientsError.message)
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
      error: error instanceof Error ? error.message : "Failed to create meeting schedule"
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
      throw new Error("Authentication required")
    }

    // Verify user is a parent
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'parent') {
      throw new Error("Access denied. Parent role required.")
    }

    // Get meeting schedules for this parent
    const { data: meetingSchedules, error } = await supabase
      .from('meeting_schedule_recipients')
      .select(`
        is_read,
        read_at,
        created_at,
        meeting_schedules!inner(
          id,
          title,
          description,
          meeting_date,
          meeting_location,
          duration_minutes,
          meeting_type,
          teachers:profiles!meeting_schedules_teacher_id_fkey(
            full_name
          ),
          classes(
            name
          )
        )
      `)
      .eq('parent_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    // Process the data
    const scheduleList = meetingSchedules?.map(item => {
      const schedule = item.meeting_schedules as unknown as {
        id: string
        title: string
        description?: string
        meeting_date: string
        meeting_location?: string
        duration_minutes: number
        meeting_type: string
        teachers: { full_name: string }
        classes: { name: string }
      }

      return {
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        meeting_date: schedule.meeting_date,
        meeting_location: schedule.meeting_location,
        duration_minutes: schedule.duration_minutes,
        meeting_type: schedule.meeting_type,
        teacher_name: schedule.teachers.full_name,
        class_name: schedule.classes.name,
        is_read: item.is_read,
        read_at: item.read_at,
        created_at: item.created_at
      }
    }) || []

    return { success: true, data: scheduleList }
  } catch (error: unknown) {
    console.error("Get parent meeting schedules error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch meeting schedules"
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
      throw new Error("Authentication required")
    }

    // Update the recipient record to mark as read
    const { error } = await supabase
      .from('meeting_schedule_recipients')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('meeting_schedule_id', meetingScheduleId)
      .eq('parent_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error: unknown) {
    console.error("Mark meeting schedule as read error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark as read"
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
      throw new Error("Authentication required")
    }

    // Count unread meeting schedules
    const { count, error } = await supabase
      .from('meeting_schedule_recipients')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', user.id)
      .eq('is_read', false)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data: { count: count || 0 } }
  } catch (error: unknown) {
    console.error("Get unread meeting schedule count error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get unread count"
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

    // Get meeting schedules created by this teacher
    const { data: meetingSchedules, error } = await supabase
      .from('meeting_schedules')
      .select(`
        id,
        title,
        description,
        meeting_date,
        meeting_location,
        duration_minutes,
        meeting_type,
        created_at,
        classes(
          name
        ),
        meeting_schedule_recipients(count)
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    // Process the data
    const scheduleList = meetingSchedules?.map(schedule => {
      const classInfo = schedule.classes as unknown as { name: string }
      const recipients = schedule.meeting_schedule_recipients as unknown as Array<unknown>

      return {
        id: schedule.id,
        title: schedule.title,
        description: schedule.description,
        meeting_date: schedule.meeting_date,
        meeting_location: schedule.meeting_location,
        duration_minutes: schedule.duration_minutes,
        meeting_type: schedule.meeting_type,
        class_name: classInfo.name,
        recipients_count: recipients.length,
        created_at: schedule.created_at
      }
    }) || []

    return { success: true, data: scheduleList }
  } catch (error: unknown) {
    console.error("Get teacher meeting schedules error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch meeting schedules"
    }
  }
}
