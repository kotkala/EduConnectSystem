'use server'

import { createClient } from '@/utils/supabase/server'

export interface TeacherScheduleEvent {
  id: string
  class_id: string
  subject_id: string
  teacher_id: string
  classroom_id: string
  semester_id: string
  day_of_week: number
  start_time: string
  end_time: string
  week_number: number
  notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  class_name: string
  subject_code: string
  subject_name: string
  teacher_name: string
  classroom_name: string
  building: string | null
  floor: number | null
  room_type: string
  semester_name: string
  academic_year_name: string
}

export interface TeacherScheduleFilters {
  semester_id?: string
  week_number?: number
  day_of_week?: number
}

export interface TeacherScheduleFilterOptions {
  semesters: Array<{
    id: string
    name: string
    academic_year_name: string
  }>
  weeks: number[]
}

// Get teacher's schedule based on filters
export async function getTeacherScheduleAction(
  filters: TeacherScheduleFilters = {}
): Promise<{ success: boolean; data?: TeacherScheduleEvent[]; error?: string }> {
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

    let query = supabase
      .from('timetable_events_detailed')
      .select('*')
      .eq('teacher_id', user.id)

    // Apply filters
    if (filters.semester_id) {
      query = query.eq('semester_id', filters.semester_id)
    }

    if (filters.week_number) {
      query = query.eq('week_number', filters.week_number)
    }

    if (filters.day_of_week !== undefined) {
      query = query.eq('day_of_week', filters.day_of_week)
    }

    const { data: events, error } = await query
      .order('day_of_week')
      .order('start_time')

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data: events || [] }
  } catch (error: unknown) {
    console.error("Get teacher schedule error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch teacher schedule"
    }
  }
}

// Get filter options for teacher schedule
export async function getTeacherScheduleFiltersAction(): Promise<{ 
  success: boolean; 
  data?: TeacherScheduleFilterOptions; 
  error?: string 
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // Get semesters where teacher has classes
    const { data: semesters, error: semestersError } = await supabase
      .from('timetable_events')
      .select(`
        semester_id,
        semesters(
          id,
          name,
          academic_years(name)
        )
      `)
      .eq('teacher_id', user.id)

    if (semestersError) {
      throw new Error(semestersError.message)
    }

    // Process semesters to remove duplicates and format
    const semesterEntries = semesters?.map(item => {
      const semester = item.semesters as unknown as { name: string; academic_years: { name: string } } | null
      if (!semester) return null
      return [
        item.semester_id,
        {
          id: item.semester_id,
          name: semester.name,
          academic_year_name: semester.academic_years.name
        }
      ] as const
    }).filter((entry): entry is [string, { id: string; name: string; academic_year_name: string }] => entry !== null) || []

    const uniqueSemesters = Array.from(
      new Map(semesterEntries).values()
    )

    // Get weeks where teacher has classes
    const { data: weeks, error: weeksError } = await supabase
      .from('timetable_events')
      .select('week_number')
      .eq('teacher_id', user.id)

    if (weeksError) {
      throw new Error(weeksError.message)
    }

    const uniqueWeeks = Array.from(
      new Set(weeks?.map(w => w.week_number) || [])
    ).sort((a, b) => a - b)

    return {
      success: true,
      data: {
        semesters: uniqueSemesters,
        weeks: uniqueWeeks
      }
    }
  } catch (error: unknown) {
    console.error("Get teacher schedule filters error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch filter options"
    }
  }
}

// Get teacher's homeroom class information
export async function getTeacherHomeroomInfoAction(): Promise<{ 
  success: boolean; 
  data?: {
    isHomeroomTeacher: boolean
    homeroomClass?: {
      id: string
      name: string
      academic_year_name: string
      student_count: number
    }
  }; 
  error?: string 
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // Check if teacher is enabled as homeroom teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('homeroom_enabled')
      .eq('id', user.id)
      .single()

    if (!profile?.homeroom_enabled) {
      return {
        success: true,
        data: { isHomeroomTeacher: false }
      }
    }

    // Get homeroom class information
    const { data: homeroomClass, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        academic_years!inner(name),
        student_class_assignments!inner(count)
      `)
      .eq('homeroom_teacher_id', user.id)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(error.message)
    }

    if (!homeroomClass) {
      return {
        success: true,
        data: { isHomeroomTeacher: true }
      }
    }

    // Get student count for the homeroom class
    const { count: studentCount } = await supabase
      .from('student_class_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('class_id', homeroomClass.id)
      .eq('is_active', true)

    return {
      success: true,
      data: {
        isHomeroomTeacher: true,
        homeroomClass: {
          id: homeroomClass.id,
          name: homeroomClass.name,
          academic_year_name: (homeroomClass.academic_years as unknown as { name: string }).name,
          student_count: studentCount || 0
        }
      }
    }
  } catch (error: unknown) {
    console.error("Get teacher homeroom info error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch homeroom information"
    }
  }
}

// Get teacher's subject assignments
export async function getTeacherSubjectAssignmentsAction(): Promise<{ 
  success: boolean; 
  data?: Array<{
    subject_id: string
    subject_code: string
    subject_name: string
    class_count: number
    classes: Array<{
      id: string
      name: string
    }>
  }>; 
  error?: string 
}> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // Get teacher's subject assignments
    const { data: assignments, error } = await supabase
      .from('teacher_assignments')
      .select(`
        subject_id,
        class_id,
        subjects!inner(
          id,
          code,
          name_vietnamese
        ),
        classes!inner(
          id,
          name
        )
      `)
      .eq('teacher_id', user.id)
      .eq('is_active', true)

    if (error) {
      throw new Error(error.message)
    }

    // Group by subject
    const subjectMap = new Map()
    
    assignments?.forEach(assignment => {
      const subject = assignment.subjects as unknown as { id: string; code: string; name_vietnamese: string }
      const classInfo = assignment.classes as unknown as { id: string; name: string }

      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, {
          subject_id: subject.id,
          subject_code: subject.code,
          subject_name: subject.name_vietnamese,
          class_count: 0,
          classes: []
        })
      }

      const subjectData = subjectMap.get(subject.id)
      subjectData.class_count++
      subjectData.classes.push({
        id: classInfo.id,
        name: classInfo.name
      })
    })

    return {
      success: true,
      data: Array.from(subjectMap.values())
    }
  } catch (error: unknown) {
    console.error("Get teacher subject assignments error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subject assignments"
    }
  }
}

// Get academic years that teacher has classes in (teacher-specific)
export async function getTeacherAcademicYearsAction(): Promise<{
  success: boolean;
  data?: Array<{
    id: string
    name: string
    start_date: string
    end_date: string
  }>;
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

    // Get academic years where teacher has timetable events
    const { data: academicYears, error } = await supabase
      .from('timetable_events')
      .select(`
        semesters!inner(
          academic_years!inner(
            id,
            name,
            start_date,
            end_date
          )
        )
      `)
      .eq('teacher_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    // Process and deduplicate academic years
    const uniqueYears = Array.from(
      new Map(
        academicYears?.map(item => {
          const academicYear = (item.semesters as unknown as { academic_years: { id: string; name: string; start_date: string; end_date: string } }).academic_years
          return [
            academicYear.id,
            {
              id: academicYear.id,
              name: academicYear.name,
              start_date: academicYear.start_date,
              end_date: academicYear.end_date
            }
          ]
        }) || []
      ).values()
    )

    return { success: true, data: uniqueYears }
  } catch (error: unknown) {
    console.error("Get teacher academic years error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch academic years"
    }
  }
}

// Get semesters for a specific academic year that teacher has classes in
export async function getTeacherSemestersAction(academicYearId: string): Promise<{
  success: boolean;
  data?: Array<{
    id: string
    name: string
    start_date: string
    end_date: string
    academic_year_id: string
  }>;
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // Get semesters where teacher has timetable events
    const { data: semesters, error } = await supabase
      .from('timetable_events')
      .select(`
        semesters!inner(
          id,
          name,
          start_date,
          end_date,
          academic_year_id
        )
      `)
      .eq('teacher_id', user.id)
      .eq('semesters.academic_year_id', academicYearId)

    if (error) {
      throw new Error(error.message)
    }

    // Process and deduplicate semesters
    const uniqueSemesters = Array.from(
      new Map(
        semesters?.map(item => {
          const semester = item.semesters as unknown as { id: string; name: string; start_date: string; end_date: string; academic_year_id: string }
          return [
            semester.id,
            {
              id: semester.id,
              name: semester.name,
              start_date: semester.start_date,
              end_date: semester.end_date,
              academic_year_id: semester.academic_year_id
            }
          ]
        }) || []
      ).values()
    )

    return { success: true, data: uniqueSemesters }
  } catch (error: unknown) {
    console.error("Get teacher semesters error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch semesters"
    }
  }
}
