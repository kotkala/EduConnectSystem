"use server"

import { createClient } from "@/shared/utils/supabase/server"
import { revalidatePath } from "next/cache"
import {
  studentAssignmentSchema,
  bulkStudentAssignmentSchema,
  classAssignmentFiltersSchema,
  type StudentAssignmentFormData,
  type BulkStudentAssignmentFormData,
  type ClassAssignmentFilters,
  type StudentClassAssignment,
  type AvailableStudent
} from "@/lib/validations/class-block-validations"

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

  if (profileError || !profile) {
    throw new Error("Không tìm thấy hồ sơ")
  }

  if (profile.role !== "admin") {
    throw new Error("Yêu cầu quyền quản trị")
  }

  return { user, profile }
}

// Get available students for assignment (not assigned to specific assignment type in academic year)
export async function getAvailableStudentsAction(classId: string, assignmentType: "main" | "combined") {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Get class details to determine academic year
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("academic_year_id, name")
      .eq("id", classId)
      .single()

    if (classError || !classData) {
      return {
        success: false,
        error: "Không tìm thấy lớp",
        data: []
      }
    }

    // First, get student IDs already assigned to this assignment type in this academic year
    const { data: assignedStudents } = await supabase
      .from("student_class_assignments")
      .select("student_id")
      .eq("assignment_type", assignmentType)
      .eq("academic_year_id", classData.academic_year_id)
      .eq("is_active", true)

    const assignedStudentIds = assignedStudents?.map(s => s.student_id) || []

    // Get students who are NOT already assigned to this assignment type
    let query = supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        student_id
      `)
      .eq("role", "student")

    // Apply exclusion filter only if there are assigned students
    if (assignedStudentIds.length > 0) {
      const quotedIds = assignedStudentIds.map(id => `"${id}"`).join(',')
      query = query.not("id", "in", `(${quotedIds})`)
    }

    const { data: availableStudents, error } = await query

    if (error) {
      console.error("Error fetching available students:", error)
      return {
        success: false,
        error: "Không thể lấy danh sách học sinh khả dụng",
        data: []
      }
    }

    return {
      success: true,
      data: (availableStudents || []) as AvailableStudent[]
    }
  } catch (error) {
    console.error("Error in getAvailableStudentsAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách học sinh khả dụng",
      data: []
    }
  }
}

// Assign single student to class
export async function assignStudentToClassAction(formData: StudentAssignmentFormData) {
  try {
    const { user } = await checkAdminPermissions()
    const validatedData = studentAssignmentSchema.parse(formData)
    const supabase = await createClient()

    // Check if student is already assigned to this assignment type in the academic year
    const { data: existingAssignment } = await supabase
      .from("student_class_assignments_view")
      .select("id, class_name, assignment_type")
      .eq("student_id", validatedData.student_id)
      .eq("assignment_type", validatedData.assignment_type)
      .eq("class_id", validatedData.class_id)
      .single()

    if (existingAssignment) {
      return {
        success: false,
        error: `Student is already assigned to ${existingAssignment.class_name} as ${existingAssignment.assignment_type} class`
      }
    }

    // Insert assignment
    const { data, error } = await supabase
      .from("student_class_assignments")
      .insert({
        student_id: validatedData.student_id,
        class_id: validatedData.class_id,
        assignment_type: validatedData.assignment_type,
        assigned_by: user.id,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error("Error assigning student:", error)
      
      // Handle constraint violations
      if (error.message.includes("unique_student_assignment_per_year")) {
        return {
          success: false,
          error: `Student is already assigned to a ${validatedData.assignment_type} class this academic year`
        }
      }
      
      return {
        success: false,
        error: "Không thể phân công học sinh vào lớp"
      }
    }

    revalidatePath("/dashboard/admin/classes")

    return {
      success: true,
      data: data,
      message: "Student assigned successfully"
    }
  } catch (error) {
    console.error("Error in assignStudentToClassAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể phân công học sinh"
    }
  }
}

// Bulk assign students to class
export async function bulkAssignStudentsToClassAction(formData: BulkStudentAssignmentFormData) {
  try {
    const { user } = await checkAdminPermissions()
    const validatedData = bulkStudentAssignmentSchema.parse(formData)
    const supabase = await createClient()

    // Prepare assignments
    const assignments = validatedData.student_ids.map(studentId => ({
      student_id: studentId,
      class_id: validatedData.class_id,
      assignment_type: validatedData.assignment_type,
      assigned_by: user.id,
      is_active: true
    }))

    // Insert assignments
    const { data, error } = await supabase
      .from("student_class_assignments")
      .insert(assignments)
      .select()

    if (error) {
      console.error("Error bulk assigning students:", error)
      
      // Handle constraint violations
      if (error.message.includes("unique_student_assignment_per_year")) {
        return {
          success: false,
          error: `One or more students are already assigned to a ${validatedData.assignment_type} class this academic year`
        }
      }
      
      return {
        success: false,
        error: "Không thể phân công học sinh vào lớp"
      }
    }

    revalidatePath("/dashboard/admin/classes")

    return {
      success: true,
      data: data,
      message: `Successfully assigned ${validatedData.student_ids.length} students to class`
    }
  } catch (error) {
    console.error("Error in bulkAssignStudentsToClassAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể phân công học sinh"
    }
  }
}

// Get class assignments with filters
export async function getClassAssignmentsAction(filters?: ClassAssignmentFilters) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()
    const validatedFilters = filters ? classAssignmentFiltersSchema.parse(filters) : { page: 1, limit: 10 }

    let query = supabase
      .from("student_class_assignments_view")
      .select("*")

    // Apply filters
    if (validatedFilters.class_id) {
      query = query.eq("class_id", validatedFilters.class_id)
    }

    if (validatedFilters.assignment_type) {
      query = query.eq("assignment_type", validatedFilters.assignment_type)
    }

    if (validatedFilters.is_active !== undefined) {
      query = query.eq("is_active", validatedFilters.is_active)
    }

    if (validatedFilters.search) {
      query = query.or(`student_name.ilike.%${validatedFilters.search}%,student_number.ilike.%${validatedFilters.search}%,student_email.ilike.%${validatedFilters.search}%`)
    }

    // Get total count
    const { count } = await supabase
      .from("student_class_assignments_view")
      .select("*", { count: "exact", head: true })

    // Apply pagination and ordering
    const { data, error } = await query
      .order("assigned_at", { ascending: false })
      .range(
        (validatedFilters.page - 1) * validatedFilters.limit,
        validatedFilters.page * validatedFilters.limit - 1
      )

    if (error) {
      console.error("Error fetching class assignments:", error)
      return {
        success: false,
        error: "Không thể lấy danh sách phân công lớp",
        data: [],
        total: 0,
        page: validatedFilters.page
      }
    }

    return {
      success: true,
      data: data as StudentClassAssignment[],
      total: count || 0,
      page: validatedFilters.page
    }
  } catch (error) {
    console.error("Error in getClassAssignmentsAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách phân công lớp",
      data: [],
      total: 0,
      page: 1
    }
  }
}

// Remove student from class
export async function removeStudentFromClassAction(assignmentId: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { error } = await supabase
      .from("student_class_assignments")
      .update({ is_active: false })
      .eq("id", assignmentId)

    if (error) {
      console.error("Error removing student from class:", error)
      return {
        success: false,
        error: "Không thể gỡ học sinh khỏi lớp"
      }
    }

    revalidatePath("/dashboard/admin/classes")

    return {
      success: true,
      message: "Student removed from class successfully"
    }
  } catch (error) {
    console.error("Error in removeStudentFromClassAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể gỡ học sinh khỏi lớp"
    }
  }
}
