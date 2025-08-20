'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Validation schemas
const classroomSchema = z.object({
  name: z.string().min(1, 'Classroom name is required').max(50),
  building: z.string().optional(),
  floor: z.number().int().min(1).max(20).optional(),
  capacity: z.number().int().min(1).max(200).default(40),
  room_type: z.enum(['standard', 'lab', 'computer', 'auditorium', 'gym', 'library']).default('standard'),
  equipment: z.array(z.string()).default([]),
  is_active: z.boolean().default(true)
})

const updateClassroomSchema = classroomSchema.partial().extend({
  id: z.string().uuid()
})

const classroomFiltersSchema = z.object({
  search: z.string().optional(),
  building: z.string().optional(),
  room_type: z.string().optional(),
  is_active: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

// Types
export type ClassroomFormData = z.infer<typeof classroomSchema>
export type UpdateClassroomFormData = z.infer<typeof updateClassroomSchema>
export type ClassroomFilters = z.infer<typeof classroomFiltersSchema>

export interface Classroom {
  id: string
  name: string
  building: string | null
  floor: number | null
  capacity: number
  room_type: string
  equipment: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

// Server Actions
export async function getClassroomsAction(filters: Partial<ClassroomFilters> = {}) {
  try {
    const validatedFilters = classroomFiltersSchema.parse({
      page: 1,
      limit: 10,
      ...filters
    })
    const supabase = await createClient()

    let query = supabase
      .from('classrooms')
      .select('*', { count: 'exact' })

    // Apply filters
    if (validatedFilters.search) {
      query = query.ilike('name', `%${validatedFilters.search}%`)
    }

    if (validatedFilters.building) {
      query = query.eq('building', validatedFilters.building)
    }

    if (validatedFilters.room_type) {
      query = query.eq('room_type', validatedFilters.room_type)
    }

    if (validatedFilters.is_active !== undefined) {
      query = query.eq('is_active', validatedFilters.is_active)
    }

    // Apply pagination
    const from = (validatedFilters.page - 1) * validatedFilters.limit
    const to = from + validatedFilters.limit - 1

    const { data, error, count } = await query
      .order('name')
      .range(from, to)

    if (error) {
      console.error('Error fetching classrooms:', error)
      return { success: false, error: error.message, data: [], total: 0 }
    }

    return { 
      success: true, 
      data: data as Classroom[], 
      total: count || 0 
    }
  } catch (error) {
    console.error('Error in getClassroomsAction:', error)
    return { 
      success: false, 
      error: 'Không thể lấy danh sách phòng học',
      data: [], 
      total: 0 
    }
  }
}

export async function createClassroomAction(formData: ClassroomFormData) {
  try {
    const validatedData = classroomSchema.parse(formData)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('classrooms')
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error('Error creating classroom:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/timetable')
    return { success: true, data }
  } catch (error) {
    console.error('Error in createClassroomAction:', error)
    return { success: false, error: 'Không thể tạo phòng học' }
  }
}

export async function updateClassroomAction(formData: UpdateClassroomFormData) {
  try {
    const validatedData = updateClassroomSchema.parse(formData)
    const { id, ...updateData } = validatedData
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('classrooms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating classroom:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/timetable')
    return { success: true, data }
  } catch (error) {
    console.error('Error in updateClassroomAction:', error)
    return { success: false, error: 'Không thể cập nhật phòng học' }
  }
}

export async function deleteClassroomAction(id: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('classrooms')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting classroom:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/admin/timetable')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteClassroomAction:', error)
    return { success: false, error: 'Không thể xóa phòng học' }
  }
}

export async function getAvailableClassroomsAction(
  dayOfWeek: number,
  startTime: string,
  weekNumber: number,
  semesterId: string,
  excludeEventId?: string
) {
  try {
    const supabase = await createClient()

    // Get all active classrooms
    const classroomsQuery = supabase
      .from('classrooms')
      .select('*')
      .eq('is_active', true)

    const { data: allClassrooms, error: classroomsError } = await classroomsQuery

    if (classroomsError) {
      return { success: false, error: classroomsError.message, data: [] }
    }

    // Get conflicting events
    let conflictsQuery = supabase
      .from('timetable_events')
      .select('classroom_id')
      .eq('day_of_week', dayOfWeek)
      .eq('start_time', startTime)
      .eq('week_number', weekNumber)
      .eq('semester_id', semesterId)

    if (excludeEventId) {
      conflictsQuery = conflictsQuery.neq('id', excludeEventId)
    }

    const { data: conflicts, error: conflictsError } = await conflictsQuery

    if (conflictsError) {
      return { success: false, error: conflictsError.message, data: [] }
    }

    // Filter out conflicting classrooms
    const conflictingClassroomIds = conflicts?.map(c => c.classroom_id) || []
    const availableClassrooms = allClassrooms?.filter(
      classroom => !conflictingClassroomIds.includes(classroom.id)
    ) || []

    return { success: true, data: availableClassrooms }
  } catch (error) {
    console.error('Error in getAvailableClassroomsAction:', error)
    return { success: false, error: 'Không thể lấy danh sách phòng học khả dụng', data: [] }
  }
}
