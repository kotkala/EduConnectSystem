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



    // Use optimized query with proper joins - Context7 pattern for complex relationships
    const { data: studentsWithParentsData, error: queryError } = await supabase
      .from('student_class_assignments')
      .select(`
        student_id,
        profiles!student_class_assignments_student_id_fkey (
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

    if (queryError) {
      throw new Error(queryError.message)
    }



    if (!studentsWithParentsData || studentsWithParentsData.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    // Get all student IDs for parent lookup
    const studentIds = studentsWithParentsData.map(item => {
      // Handle the case where profiles might be an array or single object
      const profiles = item.profiles
      if (Array.isArray(profiles)) {
        return profiles[0]?.id
      }
      return (profiles as { id: string } | null)?.id
    }).filter(Boolean)


    // Get parent relationships without embedded resources first
    const { data: parentRelationships, error: parentsError } = await supabase
      .from('parent_student_relationships')
      .select(`
        student_id,
        parent_id,
        relationship_type,
        is_primary_contact
      `)
      .in('student_id', studentIds)
      .order('is_primary_contact', { ascending: false })

    if (parentsError) {
      throw new Error(parentsError.message)
    }

    // Get parent details separately
    const parentIds = parentRelationships?.map(rel => rel.parent_id) || []

    const { data: parents, error: parentsDetailError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone_number
      `)
      .in('id', parentIds)

    if (parentsDetailError) {
      throw new Error(parentsDetailError.message)
    }







    // Combine student and parent data using correct mapping
    const studentsWithParents = studentsWithParentsData.map(item => {
      // Handle the case where profiles might be an array or single object
      let student: {
        id: string
        full_name: string
        email: string
        student_id: string
        phone_number?: string
        gender?: string
        date_of_birth?: string
        address?: string
        avatar_url?: string
      } | null = null

      const profiles = item.profiles
      if (Array.isArray(profiles)) {
        student = profiles[0] || null
      } else {
        student = profiles as typeof student
      }

      if (!student) {
        return null
      }

      const studentParentRelations = parentRelationships
        ?.filter(rel => rel.student_id === student.id) || []

      const studentParents = studentParentRelations.map(rel => {
        const parentDetail = parents?.find(p => p.id === rel.parent_id)
        return {
          id: parentDetail?.id || '',
          full_name: parentDetail?.full_name || '',
          email: parentDetail?.email || '',
          phone_number: parentDetail?.phone_number || '',
          relationship_type: rel.relationship_type,
          is_primary_contact: rel.is_primary_contact || false
        }
      })



      return {
        id: student.id,
        full_name: student.full_name,
        email: student.email,
        student_id: student.student_id,
        phone_number: student.phone_number,
        gender: student.gender,
        date_of_birth: student.date_of_birth,
        address: student.address,
        avatar_url: student.avatar_url,
        parents: studentParents
      }
    }).filter((student): student is NonNullable<typeof student> => student !== null)



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
