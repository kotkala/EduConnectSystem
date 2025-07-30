"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { revalidatePath } from "next/cache"
import {
  teacherSchema,
  studentParentSchema,
  updateTeacherSchema,
  userFiltersSchema,
  type TeacherFormData,
  type StudentParentFormData,
  type UpdateTeacherFormData,
  type UserFilters,
  type TeacherProfile,
  type StudentWithParent
} from "@/lib/validations/user-validations"

// Helper function to check admin permissions
async function checkAdminPermissions() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Authentication required")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "admin") {
    throw new Error("Admin permissions required")
  }

  return { userId: user.id }
}

// Teacher CRUD Operations
export async function createTeacherAction(formData: TeacherFormData) {
  try {
    const validatedData = teacherSchema.parse(formData)
    await checkAdminPermissions() // Check permissions with regular client
    const supabase = createAdminClient() // Use admin client for user creation

    // Check if employee_id already exists
    const { data: existingTeacher } = await supabase
      .from("profiles")
      .select("employee_id")
      .eq("employee_id", validatedData.employee_id)
      .single()

    if (existingTeacher) {
      return {
        success: false,
        error: "Employee ID already exists"
      }
    }

    // Check if email already exists
    const { data: existingEmail } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", validatedData.email)
      .single()

    if (existingEmail) {
      return {
        success: false,
        error: "Email already exists"
      }
    }

    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: "TempPassword123!", // Temporary password
      email_confirm: true,
      user_metadata: {
        full_name: validatedData.full_name,
        role: "teacher"
      }
    })

    if (authError || !authData.user) {
      return {
        success: false,
        error: authError?.message || "Failed to create user account"
      }
    }

    // Create profile
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        full_name: validatedData.full_name,
        role: "teacher",
        employee_id: validatedData.employee_id,
        phone_number: validatedData.phone_number,
        gender: validatedData.gender,
        date_of_birth: validatedData.date_of_birth,
        address: validatedData.address,
        homeroom_enabled: validatedData.homeroom_enabled
      })

    if (profileError) {
      // Cleanup: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        error: profileError.message
      }
    }

    revalidatePath("/dashboard/admin/users/teachers")
    return {
      success: true,
      message: "Teacher created successfully"
    }

  } catch (error) {
    console.error("Create teacher error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create teacher"
    }
  }
}

export async function updateTeacherAction(formData: UpdateTeacherFormData) {
  try {
    const validatedData = updateTeacherSchema.parse(formData)
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check if teacher exists
    const { data: existingTeacher, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", validatedData.id)
      .eq("role", "teacher")
      .single()

    if (fetchError || !existingTeacher) {
      return {
        success: false,
        error: "Teacher not found"
      }
    }

    // Check for duplicate employee_id if it's being updated
    if (validatedData.employee_id && validatedData.employee_id !== existingTeacher.employee_id) {
      const { data: duplicateEmployee } = await supabase
        .from("profiles")
        .select("employee_id")
        .eq("employee_id", validatedData.employee_id)
        .neq("id", validatedData.id)
        .single()

      if (duplicateEmployee) {
        return {
          success: false,
          error: "Employee ID already exists"
        }
      }
    }

    // Check for duplicate email if it's being updated
    if (validatedData.email && validatedData.email !== existingTeacher.email) {
      const { data: duplicateEmail } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", validatedData.email)
        .neq("id", validatedData.id)
        .single()

      if (duplicateEmail) {
        return {
          success: false,
          error: "Email already exists"
        }
      }
    }

    // Update profile
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([key, value]) => key !== "id" && value !== undefined)
    )

    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", validatedData.id)

    if (updateError) {
      return {
        success: false,
        error: updateError.message
      }
    }

    revalidatePath("/dashboard/admin/users/teachers")
    return {
      success: true,
      message: "Teacher updated successfully"
    }

  } catch (error) {
    console.error("Update teacher error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update teacher"
    }
  }
}

export async function deleteTeacherAction(teacherId: string) {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check if teacher exists
    const { data: teacher, error: fetchError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", teacherId)
      .eq("role", "teacher")
      .single()

    if (fetchError || !teacher) {
      return {
        success: false,
        error: "Teacher not found"
      }
    }

    // Delete auth user (this will cascade delete the profile)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(teacherId)

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message
      }
    }

    revalidatePath("/dashboard/admin/users/teachers")
    return {
      success: true,
      message: "Teacher deleted successfully"
    }

  } catch (error) {
    console.error("Delete teacher error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete teacher"
    }
  }
}

export async function getTeachersAction(filters?: UserFilters) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()
    const validatedFilters = filters ? userFiltersSchema.parse(filters) : { page: 1, limit: 10 }

    let query = supabase
      .from("profiles")
      .select("*")
      .eq("role", "teacher")
      .order("created_at", { ascending: false })

    // Apply search filter
    if (validatedFilters.search) {
      query = query.or(`full_name.ilike.%${validatedFilters.search}%,email.ilike.%${validatedFilters.search}%,employee_id.ilike.%${validatedFilters.search}%`)
    }

    // Apply gender filter
    if (validatedFilters.gender) {
      query = query.eq("gender", validatedFilters.gender)
    }

    // Apply pagination
    const from = (validatedFilters.page - 1) * validatedFilters.limit
    const to = from + validatedFilters.limit - 1
    query = query.range(from, to)

    const { data: teachers, error, count } = await query

    if (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      }
    }

    return {
      success: true,
      data: teachers as TeacherProfile[],
      total: count || 0,
      page: validatedFilters.page,
      limit: validatedFilters.limit
    }

  } catch (error) {
    console.error("Get teachers error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch teachers",
      data: [],
      total: 0
    }
  }
}

// Student + Parent CRUD Operations (Mandatory Relationship)
export async function createStudentWithParentAction(formData: StudentParentFormData) {
  try {
    const validatedData = studentParentSchema.parse(formData)
    await checkAdminPermissions() // Check permissions with regular client
    const supabase = createAdminClient() // Use admin client for user creation

    // Check for duplicate student_id
    const { data: existingStudent } = await supabase
      .from("profiles")
      .select("student_id")
      .eq("student_id", validatedData.student.student_id)
      .single()

    if (existingStudent) {
      return {
        success: false,
        error: "Student ID already exists"
      }
    }

    // Check for duplicate student email only
    const { data: existingStudentEmail } = await supabase
      .from("profiles")
      .select("email")
      .eq("email", validatedData.student.email)
      .single()

    if (existingStudentEmail) {
      return {
        success: false,
        error: "Student email already exists"
      }
    }

    // Check if parent already exists
    const { data: existingParent } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("email", validatedData.parent.email)
      .eq("role", "parent")
      .single()

    // Always create student user
    const { data: studentAuthData, error: studentAuthError } = await supabase.auth.admin.createUser({
      email: validatedData.student.email,
      password: "TempPassword123!",
      email_confirm: true,
      user_metadata: {
        full_name: validatedData.student.full_name,
        role: "student"
      }
    })

    if (studentAuthError || !studentAuthData.user) {
      return {
        success: false,
        error: studentAuthError?.message || "Failed to create student account"
      }
    }

    // Only create parent user if they don't exist
    let parentUserId: string
    let shouldCreateParentProfile = false

    if (existingParent) {
      parentUserId = existingParent.id
    } else {
      const { data: parentAuthData, error: parentAuthError } = await supabase.auth.admin.createUser({
        email: validatedData.parent.email,
        password: "TempPassword123!",
        email_confirm: true,
        user_metadata: {
          full_name: validatedData.parent.full_name,
          role: "parent"
        }
      })

      if (parentAuthError || !parentAuthData.user) {
        // Cleanup: delete student auth user
        await supabase.auth.admin.deleteUser(studentAuthData.user.id)
        return {
          success: false,
          error: parentAuthError?.message || "Failed to create parent account"
        }
      }

      parentUserId = parentAuthData.user.id
      shouldCreateParentProfile = true
    }

    try {
      // Create student profile
      const { error: studentProfileError } = await supabase
        .from("profiles")
        .insert({
          id: studentAuthData.user.id,
          email: validatedData.student.email,
          full_name: validatedData.student.full_name,
          role: "student",
          student_id: validatedData.student.student_id,
          phone_number: validatedData.student.phone_number,
          gender: validatedData.student.gender,
          date_of_birth: validatedData.student.date_of_birth,
          address: validatedData.student.address
        })

      if (studentProfileError) {
        throw new Error(`Student profile error: ${studentProfileError.message}`)
      }

      // Create parent profile only if it's a new parent
      if (shouldCreateParentProfile) {
        const { error: parentProfileError } = await supabase
          .from("profiles")
          .insert({
            id: parentUserId,
            email: validatedData.parent.email,
            full_name: validatedData.parent.full_name,
            role: "parent",
            phone_number: validatedData.parent.phone_number,
            gender: validatedData.parent.gender,
            date_of_birth: validatedData.parent.date_of_birth,
            address: validatedData.parent.address
          })

        if (parentProfileError) {
          throw new Error(`Parent profile error: ${parentProfileError.message}`)
        }
      }

      // Create parent-student relationship
      const { error: relationshipError } = await supabase
        .from("parent_student_relationships")
        .insert({
          parent_id: parentUserId,
          student_id: studentAuthData.user.id,
          relationship_type: validatedData.parent.relationship_type,
          is_primary_contact: validatedData.parent.is_primary_contact
        })

      if (relationshipError) {
        throw new Error(`Relationship error: ${relationshipError.message}`)
      }

      revalidatePath("/dashboard/admin/users/students")
      return {
        success: true,
        message: existingParent
          ? "Student created and linked to existing parent successfully"
          : "Student and parent created successfully"
      }

    } catch (error) {
      // Cleanup: delete student auth user and parent auth user only if it was newly created
      await supabase.auth.admin.deleteUser(studentAuthData.user.id)
      if (shouldCreateParentProfile) {
        await supabase.auth.admin.deleteUser(parentUserId)
      }
      throw error
    }

  } catch (error) {
    console.error("Create student with parent error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create student and parent"
    }
  }
}

export async function getStudentsWithParentsAction(filters?: UserFilters) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()
    const validatedFilters = filters ? userFiltersSchema.parse(filters) : { page: 1, limit: 10 }

    let query = supabase
      .from("profiles")
      .select(`
        *,
        parent_relationships:parent_student_relationships!student_id(
          id,
          relationship_type,
          is_primary_contact,
          parent:profiles!parent_id(
            id,
            full_name,
            email,
            phone_number,
            role
          )
        )
      `)
      .eq("role", "student")
      .order("created_at", { ascending: false })

    // Apply search filter
    if (validatedFilters.search) {
      query = query.or(`full_name.ilike.%${validatedFilters.search}%,email.ilike.%${validatedFilters.search}%,student_id.ilike.%${validatedFilters.search}%`)
    }

    // Apply gender filter
    if (validatedFilters.gender) {
      query = query.eq("gender", validatedFilters.gender)
    }

    // Apply pagination
    const from = (validatedFilters.page - 1) * validatedFilters.limit
    const to = from + validatedFilters.limit - 1
    query = query.range(from, to)

    const { data: students, error, count } = await query

    if (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0
      }
    }

    // Transform data to include parent relationship
    const studentsWithParents = students?.map(student => ({
      ...student,
      parent_relationship: student.parent_relationships?.[0] ? {
        id: student.parent_relationships[0].id,
        parent: student.parent_relationships[0].parent,
        relationship_type: student.parent_relationships[0].relationship_type,
        is_primary_contact: student.parent_relationships[0].is_primary_contact
      } : undefined
    })) || []

    return {
      success: true,
      data: studentsWithParents as StudentWithParent[],
      total: count || 0,
      page: validatedFilters.page,
      limit: validatedFilters.limit
    }

  } catch (error) {
    console.error("Get students with parents error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch students",
      data: [],
      total: 0
    }
  }
}

export async function deleteStudentAction(studentId: string) {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Get student with parent relationship
    const { data: student, error: fetchError } = await supabase
      .from("profiles")
      .select(`
        id, role,
        parent_relationships:parent_student_relationships!student_id(
          parent_id
        )
      `)
      .eq("id", studentId)
      .eq("role", "student")
      .single()

    if (fetchError || !student) {
      return {
        success: false,
        error: "Student not found"
      }
    }

    // Get parent ID
    const parentId = student.parent_relationships?.[0]?.parent_id

    // Delete student auth user (this will cascade delete profile and relationships)
    const { error: deleteStudentError } = await supabase.auth.admin.deleteUser(studentId)

    if (deleteStudentError) {
      return {
        success: false,
        error: deleteStudentError.message
      }
    }

    // Delete parent if exists
    if (parentId) {
      const { error: deleteParentError } = await supabase.auth.admin.deleteUser(parentId)
      if (deleteParentError) {
        console.error("Failed to delete parent:", deleteParentError.message)
        // Don't fail the whole operation if parent deletion fails
      }
    }

    revalidatePath("/dashboard/admin/users/students")
    return {
      success: true,
      message: "Student and parent deleted successfully"
    }

  } catch (error) {
    console.error("Delete student error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete student"
    }
  }
}

// Search users by email for suggestions
export async function searchUsersByEmailAction(emailQuery: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, phone_number, address, gender, date_of_birth')
      .ilike('email', `%${emailQuery}%`)
      .limit(5)
      .order('full_name', { ascending: true })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: users || []
    }
  } catch (error) {
    console.error('Error searching users by email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to search users"
    }
  }
}

// Generate next student ID (SU + auto-increment number)
export async function generateNextStudentIdAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Get the highest student ID number
    const { data: students, error } = await supabase
      .from('profiles')
      .select('student_id')
      .eq('role', 'student')
      .not('student_id', 'is', null)
      .order('student_id', { ascending: false })
      .limit(1)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    let nextNumber = 1
    if (students && students.length > 0) {
      const lastStudentId = students[0].student_id
      if (lastStudentId && lastStudentId.startsWith('SU')) {
        const lastNumber = parseInt(lastStudentId.substring(2))
        if (!isNaN(lastNumber)) {
          nextNumber = lastNumber + 1
        }
      }
    }

    // Format with leading zeros (SU001, SU002, etc.)
    const nextStudentId = `SU${nextNumber.toString().padStart(3, '0')}`

    return {
      success: true,
      data: nextStudentId
    }
  } catch (error) {
    console.error('Error generating next student ID:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate student ID"
    }
  }
}
