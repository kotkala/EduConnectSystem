'use server'

import { createClient } from '@/utils/supabase/server'

// Types for homeroom feedback system
export interface HomeroomFeedbackFilters {
  academic_year_id: string
  semester_id: string
  week_number: number
}

export interface StudentWeeklySchedule {
  student_id: string
  student_name: string
  student_code: string
  student_email: string
  student_avatar_url: string | null
  class_id: string
  class_name: string
  daily_schedules: {
    [day: string]: LessonWithFeedback[]
  }
}

export interface LessonWithFeedback {
  timetable_event_id: string
  start_time: string
  end_time: string
  subject_name: string
  subject_code: string
  teacher_name: string
  feedback?: StudentFeedback
}

export interface StudentFeedback {
  id: string
  rating: number
  comment: string | null
  created_at: string
  teacher_name: string
}

export interface StudentDaySchedule {
  student_id: string
  student_name: string
  student_code: string
  day_of_week: number
  lessons: LessonWithFeedback[]
}

// Check if user is a homeroom teacher
async function checkHomeroomTeacherPermissions() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error("Authentication required")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, homeroom_enabled')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    throw new Error("Access denied. Teacher role required.")
  }

  if (!profile.homeroom_enabled) {
    throw new Error("Access denied. Homeroom teacher permissions required.")
  }

  return { userId: user.id }
}

// Get homeroom students with their weekly schedule and feedback
export async function getHomeroomStudentsWeeklyFeedbackAction(
  filters: HomeroomFeedbackFilters
): Promise<{ success: boolean; data?: StudentWeeklySchedule[]; error?: string }> {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // Build parameters object following Context7 pattern - only include defined values
    const rpcParams: Record<string, unknown> = {
      p_teacher_id: userId,
      p_academic_year_id: filters.academic_year_id,
      p_semester_id: filters.semester_id,
      p_week_number: filters.week_number
    }

    // Use optimized RPC function following Context7 pattern for complex queries
    const { data: studentsData, error } = await supabase
      .rpc('get_homeroom_students_weekly_feedback', rpcParams)

    if (error) {
      console.error('Error fetching students weekly feedback:', error)
      throw new Error(error.message)
    }

    return {
      success: true,
      data: studentsData || []
    }

  } catch (error) {
    console.error("Get homeroom students weekly feedback error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch students weekly feedback"
    }
  }
}

// Get student schedule for a specific day with feedback
export async function getStudentDayScheduleWithFeedbackAction(
  student_id: string,
  day_of_week: number,
  filters: HomeroomFeedbackFilters
): Promise<{ success: boolean; data?: StudentDaySchedule; error?: string }> {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // Build parameters object following Context7 pattern
    const rpcParams: Record<string, unknown> = {
      p_teacher_id: userId,
      p_student_id: student_id,
      p_day_of_week: day_of_week,
      p_academic_year_id: filters.academic_year_id,
      p_semester_id: filters.semester_id,
      p_week_number: filters.week_number
    }

    // Use optimized RPC function following Context7 pattern for complex queries
    const { data: daySchedule, error } = await supabase
      .rpc('get_student_day_schedule_with_feedback', rpcParams)

    if (error) {
      console.error('Error fetching student day schedule:', error)
      throw new Error(error.message)
    }

    return {
      success: true,
      data: daySchedule?.[0] || null
    }

  } catch (error) {
    console.error("Get student day schedule error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch student day schedule"
    }
  }
}

// Get available academic years for homeroom teacher
export async function getHomeroomAcademicYearsAction(): Promise<{ success: boolean; data?: Array<{id: string, name: string}>; error?: string }> {
  try {
    await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // Get academic years where teacher has a homeroom class
    const { data: academicYears, error } = await supabase
      .from('academic_years')
      .select(`
        id,
        name
      `)
      .order('start_date', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: academicYears || []
    }

  } catch (error) {
    console.error("Get homeroom academic years error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch academic years"
    }
  }
}

// Get available semesters for homeroom teacher
export async function getHomeroomSemestersAction(academic_year_id: string): Promise<{ success: boolean; data?: Array<{id: string, name: string, start_date: string, end_date: string}>; error?: string }> {
  try {
    await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // Get semesters for the academic year where teacher has a homeroom class
    const { data: semesters, error } = await supabase
      .from('semesters')
      .select(`
        id,
        name,
        start_date,
        end_date
      `)
      .eq('academic_year_id', academic_year_id)
      .order('start_date', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: semesters || []
    }

  } catch (error) {
    console.error("Get homeroom semesters error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch semesters"
    }
  }
}
