"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/shared/utils/supabase/admin"
import { revalidatePath } from "next/cache"
import {
  teacherSchema,
  studentParentSchema,
  updateTeacherSchema,
  updateStudentParentSchema,
  userFiltersSchema,
  type TeacherFormData,
  type StudentParentFormData,
  type UpdateTeacherFormData,
  type UpdateStudentParentFormData,
  type UserFilters,
  type TeacherProfile,
  type StudentWithParent
} from "@/lib/validations/user-validations"

// Helper function to check admin permissions
async function checkAdminPermissions() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Yêu cầu xác thực")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || profile?.role !== "admin") {
    throw new Error("Yêu cầu quyền quản trị")
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
        error: "Email đã tồn tại"
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
        error: authError?.message || "Không thể tạo tài khoản người dùng"
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
      message: "Tạo giáo viên thành công"
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
          error: "Email đã tồn tại"
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
      .select("*", { count: 'exact' })
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

export async function getTeacherStatsAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Compute month boundaries in ISO
    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

    const [totalRes, homeroomRes, newMonthRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "teacher"),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "teacher")
        .eq("homeroom_enabled", true),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "teacher")
        .gte("created_at", monthStart.toISOString())
        .lt("created_at", nextMonthStart.toISOString())
    ])

    const anyError = totalRes.error || homeroomRes.error || newMonthRes.error
    if (anyError) {
      return {
        success: false,
        error: (anyError as { message: string }).message || "Failed to fetch stats"
      }
    }

    return {
      success: true,
      total: totalRes.count || 0,
      homeroom: homeroomRes.count || 0,
      newThisMonth: newMonthRes.count || 0
    }
  } catch (error) {
    console.error("Get teacher stats error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch teacher stats"
    }
  }
}


// Helper function to check for duplicate student data
async function checkStudentDuplicates(supabase: ReturnType<typeof createAdminClient>, studentData: StudentParentFormData['student']) {
  // Check for duplicate student_id
  const { data: existingStudent } = await supabase
    .from("profiles")
    .select("student_id")
    .eq("student_id", studentData.student_id)
    .single()

  if (existingStudent) {
    return { isDuplicate: true, error: "Student ID already exists" }
  }

  // Check for duplicate student email only
  const { data: existingStudentEmail } = await supabase
    .from("profiles")
    .select("email")
    .eq("email", studentData.email)
    .single()

  if (existingStudentEmail) {
    return { isDuplicate: true, error: "Email của học sinh đã tồn tại" }
  }

  return { isDuplicate: false }
}

// Helper function to find existing parent
async function findExistingParent(supabase: ReturnType<typeof createAdminClient>, parentEmail: string) {
  const { data: existingParent } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("email", parentEmail)
    .eq("role", "parent")
    .single()

  return existingParent
}

// Helper function to create auth users
async function createAuthUsers(supabase: ReturnType<typeof createAdminClient>, validatedData: StudentParentFormData, existingParent: { id: string } | null) {
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
    const redirectBase = process.env.NEXT_PUBLIC_SITE_URL
    if (!redirectBase) {
      // Cleanup: delete student auth user
      await supabase.auth.admin.deleteUser(studentAuthData.user.id)
      return {
        success: false,
        error: "Missing NEXT_PUBLIC_SITE_URL for invite redirect"
      }
    }
    const redirectTo = `${redirectBase}/auth/confirm?next=/dashboard/parent`
    const { data: parentAuthData, error: parentAuthError } = await supabase.auth.admin.inviteUserByEmail(
      validatedData.parent.email,
      {
        data: {
          full_name: validatedData.parent.full_name,
          role: "parent"
        },
        redirectTo
      }
    )

    if (parentAuthError || !parentAuthData?.user) {
      // Cleanup: delete student auth user
      await supabase.auth.admin.deleteUser(studentAuthData.user.id)
      return {
        success: false,
        error: parentAuthError?.message || "Failed to invite parent"
      }
    }

    parentUserId = parentAuthData.user.id
    shouldCreateParentProfile = true
  }

  return {
    success: true,
    studentAuthData,
    parentUserId,
    shouldCreateParentProfile
  }
}

// Helper function to create profiles and relationship
async function createProfilesAndRelationship(supabase: ReturnType<typeof createAdminClient>, validatedData: StudentParentFormData, studentAuthData: { user: { id: string } }, parentUserId: string, shouldCreateParentProfile: boolean) {
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
}

// Student + Parent CRUD Operations (Mandatory Relationship)
export async function createStudentWithParentAction(formData: StudentParentFormData) {
  try {
    const validatedData = studentParentSchema.parse(formData)
    await checkAdminPermissions() // Check permissions with regular client
    const supabase = createAdminClient() // Use admin client for user creation

    // Check for duplicates
    const duplicateCheck = await checkStudentDuplicates(supabase, validatedData.student)
    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        error: duplicateCheck.error
      }
    }

    // Check if parent already exists
    const existingParent = await findExistingParent(supabase, validatedData.parent.email)

    // Create auth users
    const authResult = await createAuthUsers(supabase, validatedData, existingParent)
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error
      }
    }

    const { studentAuthData, parentUserId, shouldCreateParentProfile } = authResult

    if (!studentAuthData || !parentUserId || shouldCreateParentProfile === undefined) {
      return {
        success: false,
        error: "Failed to create auth users"
      }
    }

    try {
      // Create profiles and relationship
      await createProfilesAndRelationship(supabase, validatedData, studentAuthData, parentUserId, shouldCreateParentProfile)

      revalidatePath("/dashboard/admin/users/students")
      return {
        success: true,
        message: existingParent
          ? "Tạo học sinh và liên kết với phụ huynh hiện có thành công"
          : "Tạo học sinh và phụ huynh thành công"
      }

    } catch (error) {
      // Cleanup: delete student auth user and parent auth user only if it was newly created
      if (studentAuthData?.user?.id) {
        await supabase.auth.admin.deleteUser(studentAuthData.user.id)
      }
      if (shouldCreateParentProfile && parentUserId) {
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

// Update existing Student & Parent data and relationship
export async function updateStudentParentAction(formData: UpdateStudentParentFormData) {
  try {
    const validated = updateStudentParentSchema.parse(formData)
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Fetch existing student by auth user id (student profile id)
    const { data: existingStudent, error: fetchStudentError } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone_number, gender, date_of_birth, address, student_id')
      .eq('id', validated.student_id)
      .eq('role', 'student')
      .single()

    if (fetchStudentError || !existingStudent) {
      return { success: false, error: 'Student not found' }
    }

    // If parent email provided, find or create/link parent profile
    let parentProfileId: string | undefined

    if (validated.parent && (validated.parent.email || validated.parent.full_name)) {
      // Try to find existing parent by email if provided
      if (validated.parent.email) {
        const { data: existingParent } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', validated.parent.email)
          .eq('role', 'parent')
          .single()

        if (existingParent) {
          parentProfileId = existingParent.id
        }
      }
    }

    // Update student profile if there are fields to update
    const studentUpdate = validated.student && Object.fromEntries(
      Object.entries(validated.student).filter(([, v]) => v !== undefined)
    )

    if (studentUpdate && Object.keys(studentUpdate).length > 0) {
      const { error: updStudentErr } = await supabase
        .from('profiles')
        .update(studentUpdate)
        .eq('id', validated.student_id)
        .eq('role', 'student')
      if (updStudentErr) {
        return { success: false, error: updStudentErr.message }
      }
    }

    // Update or create parent profile if parent fields provided but no parent found yet
    if (validated.parent) {
      // Build parent profile fields separate from relationship fields (omit relationship fields)
      const parentProfileFields = { ...validated.parent } as Record<string, unknown>
      delete parentProfileFields['relationship_type']
      delete parentProfileFields['is_primary_contact']

      if (!parentProfileId && (parentProfileFields.email || parentProfileFields.full_name)) {
        // Create new parent auth user via invite if email is present; else cannot create
        if (!parentProfileFields.email) {
          return { success: false, error: 'Parent email is required to create new parent' }
        }

        const redirectBase = process.env.NEXT_PUBLIC_SITE_URL
        if (!redirectBase) {
          return { success: false, error: 'Missing NEXT_PUBLIC_SITE_URL for invite redirect' }
        }

        const redirectTo = `${redirectBase}/auth/confirm?next=/dashboard/parent`
        const { data: parentAuthData, error: parentAuthError } = await supabase.auth.admin.inviteUserByEmail(
          parentProfileFields.email as string,
          {
            data: {
              full_name: (parentProfileFields.full_name as string) || '',
              role: 'parent'
            },
            redirectTo
          }
        )
        if (parentAuthError || !parentAuthData?.user) {
          return { success: false, error: parentAuthError?.message || 'Failed to invite parent' }
        }
        parentProfileId = parentAuthData.user.id

        const { error: parentProfErr } = await supabase
          .from('profiles')
          .insert({
            id: parentProfileId,
            role: 'parent',
            ...parentProfileFields
          })
        if (parentProfErr) {
          return { success: false, error: parentProfErr.message }
        }
      } else if (parentProfileId && Object.keys(parentProfileFields).length > 0) {
        // Update existing parent profile
        const { error: updParentErr } = await supabase
          .from('profiles')
          .update(parentProfileFields)
          .eq('id', parentProfileId)
          .eq('role', 'parent')
        if (updParentErr) {
          return { success: false, error: updParentErr.message }
        }
      }

      // Upsert relationship if we have a parent id
      if (parentProfileId) {
        // Check if relationship exists
        const { data: existingRel } = await supabase
          .from('parent_student_relationships')
          .select('id')
          .eq('student_id', validated.student_id)
          .eq('parent_id', parentProfileId)
          .single()

        const relationshipPayload = {
          parent_id: parentProfileId,
          student_id: validated.student_id,
          relationship_type: validated.parent.relationship_type ?? 'father',
          is_primary_contact: validated.parent.is_primary_contact ?? true
        }

        if (existingRel) {
          const { error: updRelErr } = await supabase
            .from('parent_student_relationships')
            .update({
              relationship_type: relationshipPayload.relationship_type,
              is_primary_contact: relationshipPayload.is_primary_contact
            })
            .eq('id', existingRel.id)
          if (updRelErr) {
            return { success: false, error: updRelErr.message }
          }
        } else {
          const { error: insRelErr } = await supabase
            .from('parent_student_relationships')
            .insert(relationshipPayload)
          if (insRelErr) {
            return { success: false, error: insRelErr.message }
          }
        }
      }
    }

    revalidatePath('/dashboard/admin/users/students')
    return { success: true, message: 'Updated student and parent data successfully' }

  } catch (error) {
    console.error('Update student & parent error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update student and parent' }
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
      `, { count: 'exact' })
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

    // Delete parent only if they have no other student relationships
    if (parentId) {
      const { data: otherRels, error: relErr } = await supabase
        .from('parent_student_relationships')
        .select('id')
        .eq('parent_id', parentId)
        .limit(1)

      if (!relErr && (!otherRels || otherRels.length === 0)) {
        const { error: deleteParentError } = await supabase.auth.admin.deleteUser(parentId)
        if (deleteParentError) {
          console.error("Failed to delete parent:", deleteParentError.message)
          // Don't fail the whole operation if parent deletion fails
        }
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
      error: error instanceof Error ? error.message : "Không thể tìm kiếm người dùng"
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
      if (lastStudentId?.startsWith('SU')) {
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
