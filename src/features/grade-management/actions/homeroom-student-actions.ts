"use server"

import { createClient } from "@/lib/supabase/server"

// Helper function to check homeroom teacher permissions
async function checkHomeroomTeacherPermissions() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Yêu cầu xác thực")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, homeroom_enabled")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    throw new Error("Không tìm thấy hồ sơ")
  }

  if (profile.role !== "teacher") {
    throw new Error("Yêu cầu quyền giáo viên")
  }

  if (!profile.homeroom_enabled) {
    throw new Error("Yêu cầu quyền giáo viên chủ nhiệm")
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

    // Get homeroom class information with proper type inference following Context7 pattern
    const homeroomClassQuery = supabase
      .from('classes')
      .select(`
        id,
        name,
        academic_years!inner(name),
        semesters!inner(name)
      `)
      .eq('homeroom_teacher_id', userId)
      .single()

    const { data: homeroomClass, error } = await homeroomClassQuery

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
        academic_year_name: Array.isArray(homeroomClass.academic_years)
          ? homeroomClass.academic_years[0]?.name || ''
          : (homeroomClass.academic_years as { name: string })?.name || '',
        semester_name: Array.isArray(homeroomClass.semesters)
          ? homeroomClass.semesters[0]?.name || ''
          : (homeroomClass.semesters as { name: string })?.name || '',
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

    // Use the optimized RPC function following Context7 pattern for complex queries
    const { data: studentsWithParents, error: studentsError } = await supabase
      .rpc('get_homeroom_students_with_parents', {
        p_teacher_id: userId
      })

    if (studentsError) {
      console.error('Error fetching students with parents:', studentsError)
      return { success: false, error: studentsError.message }
    }

    // Transform the data to match the expected format
    const formattedStudents = studentsWithParents?.map((student: {
      student_id: string;
      student_full_name: string;
      student_email: string;
      student_code: string;
      student_phone_number?: string;
      student_gender?: string;
      student_date_of_birth?: string;
      student_address?: string;
      student_avatar_url?: string;
      parents: unknown;
    }) => ({
      id: student.student_id,
      full_name: student.student_full_name,
      email: student.student_email,
      student_id: student.student_code,
      phone_number: student.student_phone_number || '',
      gender: student.student_gender || '',
      date_of_birth: student.student_date_of_birth || '',
      address: student.student_address || '',
      avatar_url: student.student_avatar_url || '',
      parents: Array.isArray(student.parents) ? student.parents : []
    })) || []

    return {
      success: true,
      data: formattedStudents
    }

  } catch (error) {
    console.error("Get homeroom students error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch homeroom students"
    }
  }
}