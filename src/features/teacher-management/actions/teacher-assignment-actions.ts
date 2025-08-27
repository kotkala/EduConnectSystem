'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkAdminPermissions } from '@/lib/utils/permission-utils'

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
  employee_id?: string
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
        error: 'Không thể lấy danh sách môn học khả dụng',
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
      error: error instanceof Error ? error.message : 'Không thể lấy danh sách môn học khả dụng',
      data: []
    }
  }
}

// Get available teachers for a specific subject (filtered by specialization)
export async function getAvailableTeachersForSubjectAction(subjectId: string) {
  try {
    const supabase = await createClient()

    // Get teachers who have specialization for this subject
    const { data: availableTeachers, error } = await supabase
      .from('teacher_specializations')
      .select(`
        teacher_id,
        profiles!inner(id, full_name, email, employee_id)
      `)
      .contains('subjects', [subjectId])
      .order('profiles(full_name)')

    if (error) {
      console.error('Error fetching available teachers:', error)
      return {
        success: false,
        error: 'Không thể lấy danh sách giáo viên khả dụng',
        data: []
      }
    }

    // Transform data to match expected format
    const teachers = availableTeachers?.map(item => {
      const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
      return {
        teacher_id: item.teacher_id,
        teacher_name: profile?.full_name || '',
        teacher_email: profile?.email || '',
        employee_id: profile?.employee_id || ''
      }
    }) || []

    return {
      success: true,
      data: teachers as AvailableTeacher[]
    }
  } catch (error) {
    console.error('Error in getAvailableTeachersForSubjectAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể lấy danh sách giáo viên khả dụng',
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
        error: 'Thiếu tham số bắt buộc cho việc phân công giáo viên'
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
        error: 'Không thể lấy thông tin lớp'
      }
    }

    if (!classData) {
      return {
        success: false,
        error: 'Không tìm thấy lớp'
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
        error: 'Môn học này đã được phân công cho một giáo viên trong lớp này'
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
          error: 'Môn học này đã được phân công cho một giáo viên trong lớp này'
        }
      }

      // Check for foreign key violations
      if (error.code === '23503') {
        return {
          success: false,
          error: 'Tham chiếu giáo viên, lớp, hoặc môn học không hợp lệ'
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
      error: error instanceof Error ? error.message : 'Không thể phân công giáo viên cho môn học của lớp'
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
      .eq('is_active', true)
      .order('subject_code')

    if (error) {
      console.error('Error fetching class teacher assignments:', error)
      return {
        success: false,
        error: 'Không thể lấy danh sách phân công giáo viên của lớp',
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
      error: error instanceof Error ? error.message : 'Không thể lấy danh sách phân công giáo viên của lớp',
      data: []
    }
  }
}

// Remove teacher assignment
export async function removeTeacherAssignmentAction(assignmentId: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { error } = await supabase
      .from('teacher_class_assignments')
      .update({ is_active: false })
      .eq('id', assignmentId)

    if (error) {
      console.error('Error removing teacher assignment:', error)
      return {
        success: false,
        error: 'Không thể gỡ phân công giáo viên'
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
      error: error instanceof Error ? error.message : 'Không thể gỡ phân công giáo viên'
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
        error: 'Không thể lấy danh sách phân công giáo viên',
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
      error: error instanceof Error ? error.message : 'Không thể lấy danh sách phân công giáo viên',
      data: []
    }
  }
}
