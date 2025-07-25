'use server'

import { createClient } from '@/utils/supabase/server'

export interface StudentInfo {
  id: string
  full_name: string
  email: string
  student_id: string
  current_class?: {
    id: string
    name: string
    academic_year: string
    homeroom_teacher?: {
      id: string
      full_name: string
    }
  }
}

export interface ParentStudentRelationship {
  id: string
  student_id: string
  relationship_type: string
  is_primary_contact: boolean
  student: StudentInfo
}

// Get all students for a parent across all academic years
export async function getParentStudentsAction(): Promise<{ success: boolean; data?: StudentInfo[]; error?: string }> {
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
      throw new Error("Parent access required")
    }

    // Get all students related to this parent
    const { data: relationships, error: relationshipsError } = await supabase
      .from('parent_student_relationships')
      .select(`
        id,
        student_id,
        relationship_type,
        is_primary_contact
      `)
      .eq('parent_id', user.id)

    if (relationshipsError) {
      throw new Error(relationshipsError.message)
    }

    if (!relationships || relationships.length === 0) {
      return { success: true, data: [] }
    }

    // Get student profiles manually
    const studentIds = relationships.map(r => r.student_id)
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_id')
      .eq('role', 'student')
      .in('id', studentIds)

    if (studentsError) {
      throw new Error(studentsError.message)
    }

    if (!students || students.length === 0) {
      return { success: true, data: [] }
    }

    // Get current class assignments for each student using their profile IDs
    const studentProfileIds = students.map(s => s.id)
    const { data: currentAssignments } = await supabase
      .from('student_class_assignments')
      .select(`
        student_id,
        class_id,
        classes(
          id,
          name,
          homeroom_teacher_id,
          academic_years(name),
          homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(id, full_name)
        )
      `)
      .in('student_id', studentProfileIds)
      .eq('is_active', true)

    // Combine student info with current class assignments
    const studentsWithClasses: StudentInfo[] = students.map(student => {
      const currentAssignment = currentAssignments?.find(a => a.student_id === student.id)

      return {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        student_id: student.student_id,
        current_class: currentAssignment ? {
          id: (currentAssignment.classes as unknown as { id: string }).id,
          name: (currentAssignment.classes as unknown as { name: string }).name,
          academic_year: (currentAssignment.classes as unknown as { academic_years: { name: string } | null })?.academic_years?.name || 'Unknown',
          homeroom_teacher: (currentAssignment.classes as unknown as { homeroom_teacher: { id: string; full_name: string } | null }).homeroom_teacher ? {
            id: (currentAssignment.classes as unknown as { homeroom_teacher: { id: string; full_name: string } }).homeroom_teacher.id,
            full_name: (currentAssignment.classes as unknown as { homeroom_teacher: { id: string; full_name: string } }).homeroom_teacher.full_name
          } : undefined
        } : undefined
      }
    })

    return { success: true, data: studentsWithClasses }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

// Get students by academic year for a parent
export async function getParentStudentsByYearAction(academicYearId: string): Promise<{ success: boolean; data?: StudentInfo[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Authentication required")
    }

    // First get the student IDs for this parent
    const { data: relationships } = await supabase
      .from('parent_student_relationships')
      .select('student_id')
      .eq('parent_id', user.id)

    if (!relationships || relationships.length === 0) {
      return { success: true, data: [] }
    }

    // Get student profiles manually
    const studentProfileIds = relationships.map(r => r.student_id)
    const { data: students } = await supabase
      .from('profiles')
      .select('id, full_name, email, student_id')
      .eq('role', 'student')
      .in('id', studentProfileIds)

    if (!students || students.length === 0) {
      return { success: true, data: [] }
    }

    // Get students for this parent in the specified academic year
    const { data: assignments, error } = await supabase
      .from('student_class_assignments')
      .select(`
        student_id,
        class_id,
        classes(
          id,
          name,
          homeroom_teacher_id,
          academic_years(id, name),
          homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(id, full_name)
        )
      `)
      .eq('academic_year_id', academicYearId)
      .eq('is_active', true)
      .in('student_id', studentProfileIds)

    if (error) {
      throw new Error(error.message)
    }

    const studentsWithClasses: StudentInfo[] = []

    if (assignments) {
      for (const assignment of assignments) {
        const student = students.find(s => s.id === assignment.student_id)
        if (student) {
          studentsWithClasses.push({
            id: student.id,
            full_name: student.full_name,
            email: student.email,
            student_id: student.student_id,
            current_class: {
              id: (assignment.classes as unknown as { id: string }).id,
              name: (assignment.classes as unknown as { name: string }).name,
              academic_year: (assignment.classes as unknown as { academic_years: { name: string } | null })?.academic_years?.name || 'Unknown',
              homeroom_teacher: (assignment.classes as unknown as { homeroom_teacher: { id: string; full_name: string } | null }).homeroom_teacher ? {
                id: (assignment.classes as unknown as { homeroom_teacher: { id: string; full_name: string } }).homeroom_teacher.id,
                full_name: (assignment.classes as unknown as { homeroom_teacher: { id: string; full_name: string } }).homeroom_teacher.full_name
              } : undefined
            }
          })
        }
      }
    }

    return { success: true, data: studentsWithClasses }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}

// Get available academic years
export async function getAcademicYearsAction(): Promise<{ success: boolean; data?: { id: string; name: string; is_current: boolean }[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: academicYears, error } = await supabase
      .from('academic_years')
      .select('id, name, is_current')
      .order('name', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data: academicYears || [] }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An error occurred' }
  }
}
