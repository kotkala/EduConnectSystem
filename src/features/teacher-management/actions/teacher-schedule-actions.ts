'use server'

import { createClient } from '@/lib/supabase/server'

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
  student_count?: number // Optional field for feedback functionality
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

// Get teacher's schedule based on filters using Context7 RPC pattern
export async function getTeacherScheduleAction(
  filters: TeacherScheduleFilters = {}
): Promise<{ success: boolean; data?: TeacherScheduleEvent[]; error?: string }> {
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

    // Build parameters object following Context7 pattern - only include defined values
    const rpcParams: Record<string, unknown> = {
      p_teacher_id: user.id
    }

    // Add optional parameters only if they have values - Context7 best practice
    if (filters.semester_id) {
      rpcParams.p_semester_id = filters.semester_id
    }
    if (filters.week_number) {
      rpcParams.p_week_number = filters.week_number
    }
    if (filters.day_of_week !== undefined) {
      rpcParams.p_day_of_week = filters.day_of_week
    }

    // Use optimized RPC function following Context7 pattern for complex queries
    const { data: events, error } = await supabase
      .rpc('get_teacher_schedule_with_students', rpcParams)

    if (error) {
      throw new Error(error.message)
    }

    // Transform the data to match the expected interface
    const formattedEvents: TeacherScheduleEvent[] = events?.map((event: {
      id: string;
      class_id: string;
      subject_id: string;
      teacher_id: string;
      classroom_id: string;
      semester_id: string;
      day_of_week: number;
      start_time: string;
      end_time: string;
      week_number: number;
      notes: string | null;
      created_at: string;
      updated_at: string;
      class_name: string;
      subject_code: string;
      subject_name: string;
      teacher_name: string;
      classroom_name: string;
      building: string | null;
      floor: number | null;
      room_type: string;
      semester_name: string;
      academic_year_name: string;
      student_count: number;
    }) => ({
      id: event.id,
      class_id: event.class_id,
      subject_id: event.subject_id,
      teacher_id: event.teacher_id,
      classroom_id: event.classroom_id,
      semester_id: event.semester_id,
      day_of_week: event.day_of_week,
      start_time: event.start_time,
      end_time: event.end_time,
      week_number: event.week_number,
      notes: event.notes,
      created_at: event.created_at,
      updated_at: event.updated_at,
      class_name: event.class_name,
      subject_code: event.subject_code,
      subject_name: event.subject_name,
      teacher_name: event.teacher_name,
      classroom_name: event.classroom_name,
      building: event.building,
      floor: event.floor,
      room_type: event.room_type,
      semester_name: event.semester_name,
      academic_year_name: event.academic_year_name,
      student_count: event.student_count
    })) || []

    return { success: true, data: formattedEvents }
  } catch (error: unknown) {
    console.error("Get teacher schedule error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy thời khóa biểu của giáo viên"
    }
  }
}

// Get filter options for teacher schedule using simplified queries
export async function getTeacherScheduleFiltersAction(): Promise<{
  success: boolean;
  data?: TeacherScheduleFilterOptions;
  error?: string
}> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Get unique semester IDs where teacher has classes
    const { data: semesterIds, error: semesterIdsError } = await supabase
      .from('timetable_events')
      .select('semester_id')
      .eq('teacher_id', user.id)

    if (semesterIdsError) {
      throw new Error(semesterIdsError.message)
    }

    const uniqueSemesterIds = Array.from(
      new Set(semesterIds?.map(item => item.semester_id) || [])
    )

    // Get semester details separately to avoid complex joins
    const { data: semesterDetails, error: semesterDetailsError } = await supabase
      .from('semesters')
      .select(`
        id,
        name,
        academic_years!inner(name)
      `)
      .in('id', uniqueSemesterIds)

    if (semesterDetailsError) {
      throw new Error(semesterDetailsError.message)
    }

    // Format semester data
    const formattedSemesters = semesterDetails?.map(semester => ({
      id: semester.id,
      name: semester.name,
      academic_year_name: Array.isArray(semester.academic_years)
        ? semester.academic_years[0]?.name || ''
        : (semester.academic_years as { name: string })?.name || ''
    })) || []

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
        semesters: formattedSemesters,
        weeks: uniqueWeeks
      }
    }
  } catch (error: unknown) {
    console.error("Get teacher schedule filters error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy tùy chọn bộ lọc"
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
      throw new Error("Yêu cầu xác thực")
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
      error: error instanceof Error ? error.message : "Không thể lấy thông tin giáo viên chủ nhiệm"
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
      throw new Error("Yêu cầu xác thực")
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
      error: error instanceof Error ? error.message : "Không thể lấy phân công môn học"
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

    // Get unique semester IDs where teacher has timetable events
    const { data: semesterIds, error: semesterIdsError } = await supabase
      .from('timetable_events')
      .select('semester_id')
      .eq('teacher_id', user.id)

    if (semesterIdsError) {
      throw new Error(semesterIdsError.message)
    }

    const uniqueSemesterIds = Array.from(
      new Set(semesterIds?.map(item => item.semester_id) || [])
    )

    // Get academic year IDs from semesters
    const { data: semesterData, error: semesterError } = await supabase
      .from('semesters')
      .select('academic_year_id')
      .in('id', uniqueSemesterIds)

    if (semesterError) {
      throw new Error(semesterError.message)
    }

    const uniqueAcademicYearIds = Array.from(
      new Set(semesterData?.map(item => item.academic_year_id) || [])
    )

    // Get academic year details separately
    const { data: academicYears, error } = await supabase
      .from('academic_years')
      .select('id, name, start_date, end_date')
      .in('id', uniqueAcademicYearIds)

    if (error) {
      throw new Error(error.message)
    }

    const uniqueYears = academicYears || []

    return { success: true, data: uniqueYears }
  } catch (error: unknown) {
    console.error("Get teacher academic years error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách niên khóa"
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
      throw new Error("Yêu cầu xác thực")
    }

    // Get unique semester IDs where teacher has timetable events
    const { data: semesterIds, error: semesterIdsError } = await supabase
      .from('timetable_events')
      .select('semester_id')
      .eq('teacher_id', user.id)

    if (semesterIdsError) {
      throw new Error(semesterIdsError.message)
    }

    const uniqueSemesterIds = Array.from(
      new Set(semesterIds?.map(item => item.semester_id) || [])
    )

    // Get semester details for the specific academic year
    const { data: semesters, error } = await supabase
      .from('semesters')
      .select('id, name, start_date, end_date, academic_year_id')
      .in('id', uniqueSemesterIds)
      .eq('academic_year_id', academicYearId)

    if (error) {
      throw new Error(error.message)
    }

    const uniqueSemesters = semesters || []

    return { success: true, data: uniqueSemesters }
  } catch (error: unknown) {
    console.error("Get teacher semesters error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách học kỳ"
    }
  }
}
