'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Types for teacher assignment
export interface AvailableSubject {
  id: string
  code: string
  name_vietnamese: string
  name_english: string
  category: string
  description?: string
}

export interface AvailableTeacher {
  teacher_id: string
  teacher_name: string
  teacher_email: string
}

export interface TeacherAssignment {
  id: string
  teacher_id: string
  class_id: string
  subject_id: string
  academic_year_id: string
  assigned_at: string
  teacher_name: string
  teacher_email: string
  class_name: string
  subject_code: string
  subject_name_vietnamese: string
  subject_name_english: string
  subject_category: string
  academic_year_name: string
  assigned_by_name: string
}

// Get available subjects for a specific class (not yet assigned)
export async function getAvailableSubjectsForClassAction(classId: string) {
  try {
    const supabase = await createClient()

    const { data: availableSubjects, error } = await supabase
      .from('available_subjects_for_class')
      .select('*')
      .eq('class_id', classId)
      .order('code')

    if (error) {
      console.error('Error fetching available subjects:', error)
      return {
        success: false,
        error: 'Failed to fetch available subjects',
        data: []
      }
    }

    return {
      success: true,
      data: (availableSubjects || []) as AvailableSubject[]
    }
  } catch (error) {
    console.error('Error in getAvailableSubjectsForClassAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch available subjects',
      data: []
    }
  }
}

// Get available teachers for a specific subject
export async function getAvailableTeachersForSubjectAction(subjectId: string) {
  try {
    const supabase = await createClient()

    const { data: availableTeachers, error } = await supabase
      .from('teachers_for_subjects')
      .select('teacher_id, teacher_name, teacher_email')
      .eq('subject_id', subjectId)
      .order('teacher_name')

    if (error) {
      console.error('Error fetching available teachers:', error)
      return {
        success: false,
        error: 'Failed to fetch available teachers',
        data: []
      }
    }

    return {
      success: true,
      data: (availableTeachers || []) as AvailableTeacher[]
    }
  } catch (error) {
    console.error('Error in getAvailableTeachersForSubjectAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch available teachers',
      data: []
    }
  }
}

// Assign teacher to class subject
export async function assignTeacherToClassSubjectAction(
  teacherId: string,
  classId: string,
  subjectId: string,
  assignedBy: string
) {
  try {
    console.log('Starting teacher assignment:', { teacherId, classId, subjectId, assignedBy })

    // Validate inputs
    if (!teacherId || !classId || !subjectId || !assignedBy) {
      return {
        success: false,
        error: 'Missing required parameters for teacher assignment'
      }
    }

    const supabase = await createClient()

    // Get the academic year from the class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('academic_year_id, name')
      .eq('id', classId)
      .single()

    if (classError) {
      console.error('Error fetching class data:', classError)
      return {
        success: false,
        error: 'Failed to fetch class information'
      }
    }

    if (!classData) {
      return {
        success: false,
        error: 'Class not found'
      }
    }

    console.log('Class data retrieved:', classData)

    // Check if assignment already exists
    const { data: existingAssignment } = await supabase
      .from('teacher_class_assignments')
      .select('id')
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .single()

    if (existingAssignment) {
      return {
        success: false,
        error: 'This subject is already assigned to a teacher in this class'
      }
    }

    // Insert the assignment
    const { data: assignment, error } = await supabase
      .from('teacher_class_assignments')
      .insert({
        teacher_id: teacherId,
        class_id: classId,
        subject_id: subjectId,
        academic_year_id: classData.academic_year_id,
        assigned_by: assignedBy,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting teacher assignment:', error)

      // Check if it's a unique constraint violation
      if (error.code === '23505') {
        return {
          success: false,
          error: 'This subject is already assigned to a teacher in this class'
        }
      }

      // Check for foreign key violations
      if (error.code === '23503') {
        return {
          success: false,
          error: 'Invalid teacher, class, or subject reference'
        }
      }

      return {
        success: false,
        error: `Database error: ${error.message}`
      }
    }

    console.log('Teacher assignment successful:', assignment)
    revalidatePath('/dashboard/admin/classes')

    return {
      success: true,
      data: assignment
    }
  } catch (error) {
    console.error('Exception in assignTeacherToClassSubjectAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign teacher to class subject'
    }
  }
}

// Get current teacher assignments for a class
export async function getClassTeacherAssignmentsAction(classId: string) {
  try {
    const supabase = await createClient()

    const { data: assignments, error } = await supabase
      .from('teacher_class_assignments_view')
      .select('*')
      .eq('class_id', classId)
      .order('subject_code')

    if (error) {
      console.error('Error fetching class teacher assignments:', error)
      return {
        success: false,
        error: 'Failed to fetch class teacher assignments',
        data: []
      }
    }

    return {
      success: true,
      data: (assignments || []) as TeacherAssignment[]
    }
  } catch (error) {
    console.error('Error in getClassTeacherAssignmentsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch class teacher assignments',
      data: []
    }
  }
}

// Remove teacher assignment
export async function removeTeacherAssignmentAction(assignmentId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('teacher_class_assignments')
      .update({ is_active: false })
      .eq('id', assignmentId)

    if (error) {
      console.error('Error removing teacher assignment:', error)
      return {
        success: false,
        error: 'Failed to remove teacher assignment'
      }
    }

    revalidatePath('/dashboard/admin/classes')
    
    return {
      success: true
    }
  } catch (error) {
    console.error('Error in removeTeacherAssignmentAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove teacher assignment'
    }
  }
}

// Get all teacher assignments for admin overview
export async function getAllTeacherAssignmentsAction(academicYearId?: string) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('teacher_class_assignments_view')
      .select('*')
      .order('class_name')
      .order('subject_code')

    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Error fetching all teacher assignments:', error)
      return {
        success: false,
        error: 'Failed to fetch teacher assignments',
        data: []
      }
    }

    return {
      success: true,
      data: (assignments || []) as TeacherAssignment[]
    }
  } catch (error) {
    console.error('Error in getAllTeacherAssignmentsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch teacher assignments',
      data: []
    }
  }
}
