'use server'

import { createClient } from '@/lib/supabase/server'
import { checkAdminPermissions } from '@/lib/utils/permission-utils'

export interface TeacherSpecialization {
  id: string
  teacher_id: string
  specialization_type: 'natural_science_technology' | 'social_humanities' | 'arts_physical_special'
  subjects: string[]
  created_at: string
  updated_at: string
}

export interface SpecializationOption {
  value: 'natural_science_technology' | 'social_humanities' | 'arts_physical_special'
  label: string
  subjects: Array<{ id: string; name: string }>
}

/**
 * Get all available specialization options with their subjects
 */
export async function getSpecializationOptionsAction() {
  try {
    const supabase = await createClient()

    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('id, name_vietnamese, specialization_type')
      .eq('is_active', true)
      .not('specialization_type', 'is', null)
      .order('name_vietnamese')

    if (error) {
      return { success: false, error: error.message }
    }

    const options: SpecializationOption[] = [
      {
        value: 'natural_science_technology',
        label: 'Chuyên ngành Tự nhiên - Kỹ thuật',
        subjects: subjects
          ?.filter(s => s.specialization_type === 'natural_science_technology')
          .map(s => ({ id: s.id, name: s.name_vietnamese })) || []
      },
      {
        value: 'social_humanities',
        label: 'Chuyên ngành Xã hội - Nhân văn',
        subjects: subjects
          ?.filter(s => s.specialization_type === 'social_humanities')
          .map(s => ({ id: s.id, name: s.name_vietnamese })) || []
      },
      {
        value: 'arts_physical_special',
        label: 'Chuyên ngành Nghệ thuật - Thể chất, Môn học đặc thù',
        subjects: subjects
          ?.filter(s => s.specialization_type === 'arts_physical_special')
          .map(s => ({ id: s.id, name: s.name_vietnamese })) || []
      }
    ]

    return { success: true, data: options }
  } catch (error) {
    console.error('Error in getSpecializationOptionsAction:', error)
    return { success: false, error: 'Failed to load specialization options' }
  }
}

/**
 * Get teacher specializations
 */
export async function getTeacherSpecializationsAction(teacherId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('teacher_specializations')
      .select('*')
      .eq('teacher_id', teacherId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Error in getTeacherSpecializationsAction:', error)
    return { success: false, error: 'Failed to load teacher specializations' }
  }
}

/**
 * Add teacher specialization
 */
export async function addTeacherSpecializationAction(data: {
  teacher_id: string
  specialization_type: 'natural_science_technology' | 'social_humanities' | 'arts_physical_special'
  subjects: string[]
}) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data: result, error } = await supabase
      .from('teacher_specializations')
      .insert([{
        teacher_id: data.teacher_id,
        specialization_type: data.specialization_type,
        subjects: data.subjects
      }])
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error in addTeacherSpecializationAction:', error)
    return { success: false, error: 'Failed to add teacher specialization' }
  }
}

/**
 * Update teacher specialization
 */
export async function updateTeacherSpecializationAction(data: {
  id: string
  subjects: string[]
}) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data: result, error } = await supabase
      .from('teacher_specializations')
      .update({
        subjects: data.subjects,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('Error in updateTeacherSpecializationAction:', error)
    return { success: false, error: 'Failed to update teacher specialization' }
  }
}

/**
 * Remove teacher specialization (with validation)
 */
export async function removeTeacherSpecializationAction(specializationId: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // First check if teacher is assigned to any subjects in this specialization
    const { data: specialization, error: specError } = await supabase
      .from('teacher_specializations')
      .select('teacher_id, specialization_type, subjects')
      .eq('id', specializationId)
      .single()

    if (specError) {
      return { success: false, error: specError.message }
    }

    // Check if teacher is assigned to teach any subjects in this specialization
    const { data: assignments, error: assignError } = await supabase
      .from('class_subject_teachers')
      .select(`
        subject_id,
        subjects!inner(name_vietnamese)
      `)
      .eq('teacher_id', specialization.teacher_id)
      .in('subject_id', specialization.subjects)

    if (assignError) {
      return { success: false, error: assignError.message }
    }

    if (assignments && assignments.length > 0) {
      const assignedSubjects = assignments.map(a => {
        const subject = Array.isArray(a.subjects) ? a.subjects[0] : a.subjects
        return subject?.name_vietnamese || 'Unknown Subject'
      }).filter(Boolean).join(', ')
      
      return { 
        success: false, 
        error: `Không thể xóa chuyên ngành này vì giáo viên đang được phân công dạy các môn: ${assignedSubjects}` 
      }
    }

    // If no assignments, proceed with deletion
    const { error: deleteError } = await supabase
      .from('teacher_specializations')
      .delete()
      .eq('id', specializationId)

    if (deleteError) {
      return { success: false, error: deleteError.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Error in removeTeacherSpecializationAction:', error)
    return { success: false, error: 'Failed to remove teacher specialization' }
  }
}

/**
 * Get teachers by subject specialization
 */
export async function getTeachersBySubjectAction(subjectId: string) {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('teacher_specializations')
      .select(`
        teacher_id,
        profiles!inner(id, full_name, employee_id)
      `)
      .contains('subjects', [subjectId])

    if (error) {
      return { success: false, error: error.message }
    }

    const teachers = data?.map(item => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      return {
        id: item.teacher_id,
        full_name: profile?.full_name || '',
        employee_id: profile?.employee_id || ''
      }
    }) || []

    return { success: true, data: teachers }
  } catch (error) {
    console.error('Error in getTeachersBySubjectAction:', error)
    return { success: false, error: 'Failed to load teachers by subject' }
  }
}

/**
 * Check if teacher is assigned to specific subjects
 */
export async function getTeacherAssignedSubjectsAction(teacherId: string) {
  try {
    const supabase = await createClient()

    const { data: assignments, error } = await supabase
      .from('teacher_class_assignments')
      .select('subject_id')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (error) {
      return { success: false, error: error.message, data: [] }
    }

    // Return unique subject IDs
    const assignedSubjectIds = [...new Set(assignments?.map(a => a.subject_id) || [])]

    return { success: true, data: assignedSubjectIds }
  } catch (error) {
    console.error('Error in getTeacherAssignedSubjectsAction:', error)
    return { success: false, error: 'Failed to load teacher assigned subjects', data: [] }
  }
}
