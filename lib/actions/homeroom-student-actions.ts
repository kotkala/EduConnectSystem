"use server"

import { createClient } from "@/utils/supabase/server"

// Helper function to check homeroom teacher permissions
async function checkHomeroomTeacherPermissions() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Authentication required")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, homeroom_enabled")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    throw new Error("Profile not found")
  }

  if (profile.role !== "teacher") {
    throw new Error("Teacher access required")
  }

  if (!profile.homeroom_enabled) {
    throw new Error("Homeroom teacher permissions required")
  }

  return { userId: user.id, profile }
}

// Get homeroom class information for the current teacher
export async function getHomeroomClassInfoAction(): Promise<{
  success: boolean
  data?: {
    id: string
    name: string
    academic_year_name: string
    semester_name: string
    student_count: number
  }
  error?: string
}> {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // Get homeroom class information
    const { data: homeroomClass, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        academic_years!inner(name),
        semesters!inner(name)
      `)
      .eq('homeroom_teacher_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return {
          success: false,
          error: "You are not assigned as a homeroom teacher to any class"
        }
      }
      throw new Error(error.message)
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
        id: homeroomClass.id,
        name: homeroomClass.name,
        academic_year_name: (homeroomClass.academic_years as unknown as { name: string }).name,
        semester_name: (homeroomClass.semesters as unknown as { name: string }).name,
        student_count: studentCount || 0
      }
    }

  } catch (error) {
    console.error("Get homeroom class info error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch homeroom class information"
    }
  }
}

// Get students in homeroom class with their parent information
export async function getHomeroomStudentsAction(): Promise<{
  success: boolean
  data?: Array<{
    id: string
    full_name: string
    email: string
    student_id: string
    phone_number?: string
    gender?: string
    date_of_birth?: string
    address?: string
    avatar_url?: string
    parents: Array<{
      id: string
      full_name: string
      email: string
      phone_number?: string
      relationship_type: string
      is_primary_contact: boolean
    }>
  }>
  error?: string
}> {
  try {
    const { userId } = await checkHomeroomTeacherPermissions()
    const supabase = await createClient()

    // First get the homeroom class ID
    const { data: homeroomClass } = await supabase
      .from('classes')
      .select('id')
      .eq('homeroom_teacher_id', userId)
      .single()

    if (!homeroomClass) {
      return {
        success: false,
        error: "You are not assigned as a homeroom teacher to any class"
      }
    }

    // Get students in the homeroom class
    const { data: studentAssignments, error: studentsError } = await supabase
      .from('student_class_assignments')
      .select(`
        student_id,
        profiles!student_class_assignments_student_id_fkey(
          id,
          full_name,
          email,
          student_id,
          phone_number,
          gender,
          date_of_birth,
          address,
          avatar_url
        )
      `)
      .eq('class_id', homeroomClass.id)
      .eq('is_active', true)
      .order('profiles(full_name)')

    if (studentsError) {
      throw new Error(studentsError.message)
    }

    if (!studentAssignments || studentAssignments.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    // Get parent information for all students
    const studentIds = studentAssignments.map(assignment => assignment.student_id)
    
    const { data: parentRelationships, error: parentsError } = await supabase
      .from('parent_student_relationships')
      .select(`
        student_id,
        relationship_type,
        is_primary_contact,
        parent:profiles!parent_id(
          id,
          full_name,
          email,
          phone_number
        )
      `)
      .in('student_id', studentIds)
      .order('is_primary_contact', { ascending: false })

    if (parentsError) {
      throw new Error(parentsError.message)
    }

    // Combine student and parent data
    const studentsWithParents = studentAssignments.map(assignment => {
      const student = assignment.profiles as unknown as {
        id: string
        full_name: string
        email: string
        student_id: string
        phone_number?: string
        gender?: string
        date_of_birth?: string
        address?: string
        avatar_url?: string
      }

      const studentParents = parentRelationships
        ?.filter(rel => rel.student_id === assignment.student_id)
        ?.map(rel => ({
          id: (rel.parent as unknown as { id: string }).id,
          full_name: (rel.parent as unknown as { full_name: string }).full_name,
          email: (rel.parent as unknown as { email: string }).email,
          phone_number: (rel.parent as unknown as { phone_number?: string }).phone_number,
          relationship_type: rel.relationship_type,
          is_primary_contact: rel.is_primary_contact || false
        })) || []

      return {
        ...student,
        parents: studentParents
      }
    })

    return {
      success: true,
      data: studentsWithParents
    }

  } catch (error) {
    console.error("Get homeroom students error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch homeroom students"
    }
  }
}
