'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Validation schemas
const timetableEventSchema = z.object({
  class_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  classroom_id: z.string().uuid(),
  semester_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  week_number: z.number().int().min(1).max(52),
  notes: z.string().optional()
})

const updateTimetableEventSchema = timetableEventSchema.partial().extend({
  id: z.string().uuid()
})

const timetableFiltersSchema = z.object({
  class_id: z.string().uuid().optional(),
  semester_id: z.string().uuid().optional(),
  week_number: z.number().int().min(1).max(52).optional(),
  teacher_id: z.string().uuid().optional(),
  classroom_id: z.string().uuid().optional(),
  day_of_week: z.number().int().min(0).max(6).optional()
})

// Types
export type TimetableEventFormData = z.infer<typeof timetableEventSchema>
export type UpdateTimetableEventFormData = z.infer<typeof updateTimetableEventSchema>
export type TimetableFilters = z.infer<typeof timetableFiltersSchema>

export interface TimetableEvent {
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
}

export interface TimetableEventDetailed extends TimetableEvent {
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

// Dropdown data types
export interface TimetableClass {
  id: string
  name: string
  academic_year: { name: string }[] | null
  semester: { name: string }[] | null
  class_block: { display_name: string }[] | null
}

export interface TimetableSubject {
  id: string
  code: string
  name_vietnamese: string
  category: string
}

export interface TimetableTeacher {
  id: string
  full_name: string
  employee_id: string | null
}

export interface TimetableClassroom {
  id: string
  name: string
  building: string | null
  floor: number | null
  room_type: string
}

export interface TimetableSemester {
  id: string
  name: string
  start_date: string
  end_date: string
  academic_year: { name: string }[] | null
}

export interface TimetableDropdownData {
  classes: TimetableClass[]
  subjects: TimetableSubject[]
  teachers: TimetableTeacher[]
  classrooms: TimetableClassroom[]
  semesters: TimetableSemester[]
}

// Server Actions
export async function getTimetableEventsAction(filters: TimetableFilters = {}) {
  try {
    const validatedFilters = timetableFiltersSchema.parse(filters)
    const supabase = await createClient()

    let query = supabase
      .from('timetable_events_detailed')
      .select('*')

    // Apply filters
    if (validatedFilters.class_id) {
      query = query.eq('class_id', validatedFilters.class_id)
    }

    if (validatedFilters.semester_id) {
      query = query.eq('semester_id', validatedFilters.semester_id)
    }

    if (validatedFilters.week_number) {
      query = query.eq('week_number', validatedFilters.week_number)
    }

    if (validatedFilters.teacher_id) {
      query = query.eq('teacher_id', validatedFilters.teacher_id)
    }

    if (validatedFilters.classroom_id) {
      query = query.eq('classroom_id', validatedFilters.classroom_id)
    }

    if (validatedFilters.day_of_week !== undefined) {
      query = query.eq('day_of_week', validatedFilters.day_of_week)
    }

    const { data, error } = await query
      .order('day_of_week')
      .order('start_time')

    if (error) {
      console.error('Error fetching timetable events:', error)
      return { success: false, error: error.message, data: [] }
    }

    return { 
      success: true, 
      data: data as TimetableEventDetailed[]
    }
  } catch (error) {
    console.error('Error in getTimetableEventsAction:', error)
    return { 
      success: false, 
      error: 'Failed to fetch timetable events', 
      data: [] 
    }
  }
}

export async function createTimetableEventAction(formData: TimetableEventFormData) {
  try {
    const validatedData = timetableEventSchema.parse(formData)
    const supabase = await createClient()

    // Check for conflicts before creating
    const conflictCheck = await checkTimetableConflictsAction(
      validatedData.classroom_id,
      validatedData.teacher_id,
      validatedData.day_of_week,
      validatedData.start_time,
      validatedData.week_number,
      validatedData.semester_id
    )

    if (!conflictCheck.success) {
      return conflictCheck
    }

    if (conflictCheck.hasConflict) {
      return { 
        success: false, 
        error: `Conflict detected: ${conflictCheck.conflictType}` 
      }
    }

    const { data, error } = await supabase
      .from('timetable_events')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating timetable event:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/timetable')
    return { success: true, data }
  } catch (error) {
    console.error('Error in createTimetableEventAction:', error)
    return { success: false, error: 'Failed to create timetable event' }
  }
}

export async function updateTimetableEventAction(formData: UpdateTimetableEventFormData) {
  try {
    const validatedData = updateTimetableEventSchema.parse(formData)
    const { id, ...updateData } = validatedData
    const supabase = await createClient()

    // Check for conflicts before updating (excluding current event)
    if (updateData.classroom_id || updateData.teacher_id || updateData.day_of_week || 
        updateData.start_time || updateData.week_number || updateData.semester_id) {
      
      // Get current event data to fill in missing fields
      const { data: currentEvent } = await supabase
        .from('timetable_events')
        .select('*')
        .eq('id', id)
        .single()

      if (currentEvent) {
        const conflictCheck = await checkTimetableConflictsAction(
          updateData.classroom_id || currentEvent.classroom_id,
          updateData.teacher_id || currentEvent.teacher_id,
          updateData.day_of_week ?? currentEvent.day_of_week,
          updateData.start_time || currentEvent.start_time,
          updateData.week_number ?? currentEvent.week_number,
          updateData.semester_id || currentEvent.semester_id,
          id // Exclude current event from conflict check
        )

        if (!conflictCheck.success) {
          return conflictCheck
        }

        if (conflictCheck.hasConflict) {
          return { 
            success: false, 
            error: `Conflict detected: ${conflictCheck.conflictType}` 
          }
        }
      }
    }

    const { data, error } = await supabase
      .from('timetable_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating timetable event:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/timetable')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateTimetableEventAction:', error)
    return { success: false, error: 'Failed to update timetable event' }
  }
}

export async function deleteTimetableEventAction(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('timetable_events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting timetable event:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/timetable')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteTimetableEventAction:', error)
    return { success: false, error: 'Failed to delete timetable event' }
  }
}

export async function checkTimetableConflictsAction(
  classroomId: string,
  teacherId: string,
  dayOfWeek: number,
  startTime: string,
  weekNumber: number,
  semesterId: string,
  excludeEventId?: string
) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('timetable_events')
      .select('id, classroom_id, teacher_id')
      .eq('day_of_week', dayOfWeek)
      .eq('start_time', startTime)
      .eq('week_number', weekNumber)
      .eq('semester_id', semesterId)

    if (excludeEventId) {
      query = query.neq('id', excludeEventId)
    }

    const { data: conflicts, error } = await query

    if (error) {
      return { success: false, error: error.message, hasConflict: false }
    }

    // Check for classroom conflicts
    const classroomConflict = conflicts?.find(c => c.classroom_id === classroomId)
    if (classroomConflict) {
      return {
        success: true,
        hasConflict: true,
        conflictType: 'Classroom is already booked at this time'
      }
    }

    // Check for teacher conflicts
    const teacherConflict = conflicts?.find(c => c.teacher_id === teacherId)
    if (teacherConflict) {
      return {
        success: true,
        hasConflict: true,
        conflictType: 'Teacher is already assigned at this time'
      }
    }

    return { success: true, hasConflict: false }
  } catch (error) {
    console.error('Error in checkTimetableConflictsAction:', error)
    return { success: false, error: 'Failed to check conflicts', hasConflict: false }
  }
}

// Dropdown data actions for timetable form
export async function getTimetableDropdownDataAction() {
  try {
    const supabase = await createClient()

    // Get all data in parallel for better performance
    const [classesResult, subjectsResult, teachersResult, classroomsResult, semestersResult] = await Promise.all([
      // Get active classes with academic year info
      supabase
        .from('classes')
        .select(`
          id,
          name,
          academic_year:academic_years(name),
          semester:semesters(name),
          class_block:class_blocks(display_name)
        `)
        .eq('is_active', true)
        .order('name'),

      // Get active subjects
      supabase
        .from('subjects')
        .select('id, code, name_vietnamese, category')
        .eq('is_active', true)
        .order('category')
        .order('name_vietnamese'),

      // Get teachers
      supabase
        .from('profiles')
        .select('id, full_name, employee_id')
        .eq('role', 'teacher')
        .order('full_name'),

      // Get active classrooms
      supabase
        .from('classrooms')
        .select('id, name, building, floor, room_type')
        .eq('is_active', true)
        .order('name'),

      // Get active semesters
      supabase
        .from('semesters')
        .select(`
          id,
          name,
          start_date,
          end_date,
          academic_year:academic_years(name)
        `)
        .eq('is_active', true)
        .order('start_date', { ascending: false })
    ])

    // Check for errors
    if (classesResult.error) {
      console.error('Error fetching classes:', classesResult.error)
      return { success: false, error: 'Failed to fetch classes' }
    }

    if (subjectsResult.error) {
      console.error('Error fetching subjects:', subjectsResult.error)
      return { success: false, error: 'Failed to fetch subjects' }
    }

    if (teachersResult.error) {
      console.error('Error fetching teachers:', teachersResult.error)
      return { success: false, error: 'Failed to fetch teachers' }
    }

    if (classroomsResult.error) {
      console.error('Error fetching classrooms:', classroomsResult.error)
      return { success: false, error: 'Failed to fetch classrooms' }
    }

    if (semestersResult.error) {
      console.error('Error fetching semesters:', semestersResult.error)
      return { success: false, error: 'Failed to fetch semesters' }
    }

    return {
      success: true,
      data: {
        classes: classesResult.data || [],
        subjects: subjectsResult.data || [],
        teachers: teachersResult.data || [],
        classrooms: classroomsResult.data || [],
        semesters: semestersResult.data || []
      }
    }
  } catch (error) {
    console.error('Error in getTimetableDropdownDataAction:', error)
    return { success: false, error: 'Failed to fetch dropdown data' }
  }
}
