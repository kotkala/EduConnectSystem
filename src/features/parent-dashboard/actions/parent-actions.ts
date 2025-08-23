'use server'

import { createClient } from '@/lib/supabase/server'

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
      throw new Error("Yêu cầu xác thực")
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
      .from('class_assignments')
      .select(`
        user_id,
        class_id,
        classes(
          id,
          name,
          homeroom_teacher_id,
          academic_years(name),
          homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(id, full_name)
        )
      `)
      .eq('assignment_type', 'student')
      .in('user_id', studentProfileIds)
      .eq('is_active', true)

    // Combine student info with current class assignments
    const studentsWithClasses: StudentInfo[] = students.map(student => {
      const currentAssignment = currentAssignments?.find(a => a.user_id === student.id)

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
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Helper function to get parent's student relationships
async function getParentStudentRelationships(supabase: Awaited<ReturnType<typeof createClient>>, parentId: string): Promise<string[]> {
  const { data: relationships } = await supabase
    .from('parent_student_relationships')
    .select('student_id')
    .eq('parent_id', parentId)

  return relationships?.map((r: { student_id: string }) => r.student_id) || []
}

// Helper function to get student profiles
async function getStudentProfiles(supabase: Awaited<ReturnType<typeof createClient>>, studentIds: string[]): Promise<Array<{ id: string; full_name: string; email: string; student_id: string }>> {
  if (studentIds.length === 0) return []

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email, student_id')
    .eq('role', 'student')
    .in('id', studentIds)

  return students || []
}

// Helper function to get class assignments for students
async function getStudentClassAssignments(supabase: Awaited<ReturnType<typeof createClient>>, academicYearId: string, studentIds: string[]) {
  const { data: assignments, error } = await supabase
    .from('class_assignments')
    .select(`
      user_id,
      class_id,
      classes!inner(
        id,
        name,
        homeroom_teacher_id,
        academic_year_id,
        academic_years(id, name),
        homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(id, full_name)
      )
    `)
    .eq('assignment_type', 'student')
    .eq('is_active', true)
    .eq('classes.academic_year_id', academicYearId)
    .in('user_id', studentIds)

  if (error) {
    throw new Error(error.message)
  }

  return assignments || []
}

// Helper function to transform assignment data to StudentInfo
function transformAssignmentToStudentInfo(
  assignment: {
    user_id: string
    class_id: string
    classes: unknown
  },
  student: { id: string; full_name: string; email: string; student_id: string }
): StudentInfo {
  const classes = assignment.classes as {
    id: string
    name: string
    academic_years: { name: string } | null
    homeroom_teacher: { id: string; full_name: string } | null
  }

  return {
    id: student.id,
    full_name: student.full_name,
    email: student.email,
    student_id: student.student_id,
    current_class: {
      id: classes.id,
      name: classes.name,
      academic_year: classes.academic_years?.name || 'Unknown',
      homeroom_teacher: classes.homeroom_teacher ? {
        id: classes.homeroom_teacher.id,
        full_name: classes.homeroom_teacher.full_name
      } : undefined
    }
  }
}

// Get students by academic year for a parent
export async function getParentStudentsByYearAction(academicYearId: string): Promise<{ success: boolean; data?: StudentInfo[]; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Get student IDs for this parent
    const studentIds = await getParentStudentRelationships(supabase, user.id)
    if (studentIds.length === 0) {
      return { success: true, data: [] }
    }

    // Get student profiles
    const students = await getStudentProfiles(supabase, studentIds)
    if (students.length === 0) {
      return { success: true, data: [] }
    }

    // Get class assignments for the academic year
    const assignments = await getStudentClassAssignments(supabase, academicYearId, studentIds)

    // Transform assignments to StudentInfo
    const studentsWithClasses: StudentInfo[] = []
    for (const assignment of assignments) {
      const student = students.find(s => s.id === assignment.user_id)
      if (student) {
        studentsWithClasses.push(transformAssignmentToStudentInfo(assignment, student))
      }
    }

    return { success: true, data: studentsWithClasses }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
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
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}
