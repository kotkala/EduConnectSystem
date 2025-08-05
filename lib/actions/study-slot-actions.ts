'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { z } from 'zod'

// Validation schema for study slots
const studySlotSchema = z.object({
  class_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
  subject_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
  teacher_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
  classroom_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
  semester_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([0-1]?\d|2[0-3]):[0-5]\d$/),
  end_time: z.string().regex(/^([0-1]?\d|2[0-3]):[0-5]\d$/),
  week_number: z.number().int().min(1).max(52),
  notes: z.string().optional()
})

const updateStudySlotSchema = studySlotSchema.partial().extend({
  id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
})

// Types
export type StudySlotFormData = z.infer<typeof studySlotSchema>
export type UpdateStudySlotFormData = z.infer<typeof updateStudySlotSchema>

export interface StudySlotDetailed {
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
}

// Get dropdown data for study slot creation
export async function getStudySlotDropdownData() {
  try {
    const supabase = await createClient()

    // Get subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('id, code, name_vietnamese, category')
      .eq('is_active', true)
      .order('code')

    if (subjectsError) {
      console.error('Error fetching subjects:', subjectsError)
      return { success: false, error: subjectsError.message }
    }

    // Get teachers
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'teacher')
      .order('full_name')

    if (teachersError) {
      console.error('Error fetching teachers:', teachersError)
      return { success: false, error: teachersError.message }
    }

    // Get classrooms
    const { data: classrooms, error: classroomsError } = await supabase
      .from('classrooms')
      .select('id, name, building, floor, room_type')
      .eq('is_active', true)
      .order('name')

    if (classroomsError) {
      console.error('Error fetching classrooms:', classroomsError)
      return { success: false, error: classroomsError.message }
    }

    // Get teacher assignments for auto-population
    const { data: teacherAssignments, error: assignmentsError } = await supabase
      .from('teacher_class_assignments')
      .select(`
        teacher_id,
        subject_id,
        class_id,
        profiles!teacher_class_assignments_teacher_id_fkey(full_name)
      `)

    if (assignmentsError) {
      console.error('Error fetching teacher assignments:', assignmentsError)
      return { success: false, error: assignmentsError.message }
    }

    return {
      success: true,
      data: {
        subjects: subjects || [],
        teachers: teachers || [],
        classrooms: classrooms || [],
        teacherAssignments: teacherAssignments?.map(ta => ({
          teacher_id: ta.teacher_id,
          teacher_name: ta.profiles && typeof ta.profiles === 'object' && !Array.isArray(ta.profiles) && Object.prototype.hasOwnProperty.call(ta.profiles, 'full_name')
            ? (ta.profiles as { full_name: string }).full_name
            : '',
          subject_id: ta.subject_id,
          class_id: ta.class_id,
        })) || [],
      }
    }
  } catch (error) {
    console.error('Error in getStudySlotDropdownData:', error)
    return { 
      success: false, 
      error: 'Failed to fetch dropdown data' 
    }
  }
}

// Create a new study slot
export async function createStudySlotAction(formData: StudySlotFormData) {
  try {
    const validatedData = studySlotSchema.parse(formData)
    const supabase = await createClient()

    // Check for conflicts before creating
    const conflictCheck = await checkStudySlotConflictsAction(
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
      console.error('Error creating study slot:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/timetable')
    return { success: true, data }
  } catch (error) {
    console.error('Error in createStudySlotAction:', error)
    return { 
      success: false, 
      error: 'Failed to create study slot' 
    }
  }
}

// Update an existing study slot
export async function updateStudySlotAction(formData: UpdateStudySlotFormData) {
  try {
    const validatedData = updateStudySlotSchema.parse(formData)
    const { id, ...updateData } = validatedData
    const supabase = await createClient()

    // Check for conflicts before updating (excluding current slot)
    if (updateData.classroom_id && updateData.teacher_id && 
        updateData.day_of_week !== undefined && updateData.start_time && 
        updateData.week_number && updateData.semester_id) {
      const conflictCheck = await checkStudySlotConflictsAction(
        updateData.classroom_id,
        updateData.teacher_id,
        updateData.day_of_week,
        updateData.start_time,
        updateData.week_number,
        updateData.semester_id,
        id
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

    const { data, error } = await supabase
      .from('timetable_events')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating study slot:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/timetable')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateStudySlotAction:', error)
    return { 
      success: false, 
      error: 'Failed to update study slot' 
    }
  }
}

// Delete a study slot
export async function deleteStudySlotAction(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('timetable_events')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting study slot:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/timetable')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteStudySlotAction:', error)
    return { 
      success: false, 
      error: 'Failed to delete study slot' 
    }
  }
}

// Check for conflicts (classroom and teacher availability)
export async function checkStudySlotConflictsAction(
  classroomId: string,
  teacherId: string,
  dayOfWeek: number,
  startTime: string,
  weekNumber: number,
  semesterId: string,
  excludeSlotId?: string
) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('timetable_events')
      .select('id, classroom_id, teacher_id, class_id')
      .eq('day_of_week', dayOfWeek)
      .eq('start_time', startTime)
      .eq('week_number', weekNumber)
      .eq('semester_id', semesterId)

    if (excludeSlotId) {
      query = query.neq('id', excludeSlotId)
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
        conflictType: 'Teacher is already assigned to another class at this time'
      }
    }

    return { success: true, hasConflict: false }
  } catch (error) {
    console.error('Error in checkStudySlotConflictsAction:', error)
    return { 
      success: false, 
      error: 'Failed to check conflicts', 
      hasConflict: false 
    }
  }
}
