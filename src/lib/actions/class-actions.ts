"use server"

import { createClient } from "@/shared/utils/supabase/server"
import { createAdminClient } from "@/shared/utils/supabase/admin"
import { revalidatePath } from "next/cache"
import {
  classSchema,
  updateClassSchema,
  studentAssignmentSchema,
  classFiltersSchema,
  type ClassFormData,
  type UpdateClassFormData,
  type StudentAssignmentFormData,
  type ClassFilters,
  type ClassWithDetails,
  type StudentWithClassAssignments
} from "@/lib/validations/class-validations"

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

// Class CRUD Operations
export async function createClassAction(formData: ClassFormData) {
  try {
    const validatedData = classSchema.parse(formData)
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check if class name already exists in the same academic year and semester
    const { data: existingClass } = await supabase
      .from("classes")
      .select("name")
      .eq("name", validatedData.name)
      .eq("academic_year_id", validatedData.academic_year_id)
      .eq("semester_id", validatedData.semester_id)
      .single()

    if (existingClass) {
      return {
        success: false,
        error: "Tên lớp đã tồn tại trong niên khóa và học kỳ này"
      }
    }

    // Validate homeroom teacher if provided
    if (validatedData.homeroom_teacher_id) {
      const { data: teacher } = await supabase
        .from("profiles")
        .select("role, homeroom_enabled")
        .eq("id", validatedData.homeroom_teacher_id)
        .eq("role", "teacher")
        .single()

      if (!teacher) {
        return {
          success: false,
          error: "Không tìm thấy giáo viên chủ nhiệm đã chọn"
        }
      }

      if (!teacher.homeroom_enabled) {
        return {
          success: false,
          error: "Giáo viên đã chọn chưa được kích hoạt cho nhiệm vụ chủ nhiệm"
        }
      }

      // Check if teacher is already assigned to another class in the same semester
      const { data: existingAssignment } = await supabase
        .from("classes")
        .select("name")
        .eq("homeroom_teacher_id", validatedData.homeroom_teacher_id)
        .eq("semester_id", validatedData.semester_id)
        .single()

      if (existingAssignment) {
        return {
          success: false,
          error: `Giáo viên đã được phân công làm GVCN cho lớp "${existingAssignment.name}" trong học kỳ này`
        }
      }
    }

    // Create class
    const { error: createError } = await supabase
      .from("classes")
      .insert({
        name: validatedData.name,
        class_block_id: validatedData.class_block_id || null,
        class_suffix: validatedData.class_suffix || null,
        auto_generated_name: validatedData.auto_generated_name || false,
        academic_year_id: validatedData.academic_year_id,
        semester_id: validatedData.semester_id,
        is_subject_combination: validatedData.is_subject_combination,
        subject_combination_type: validatedData.subject_combination_type || null,
        subject_combination_variant: validatedData.subject_combination_variant || null,
        homeroom_teacher_id: validatedData.homeroom_teacher_id || null,
        max_students: validatedData.max_students,
        description: validatedData.description || null
      })

    if (createError) {
      return {
        success: false,
        error: createError.message
      }
    }

    revalidatePath("/dashboard/admin/classes")
    return {
      success: true,
      message: "Tạo lớp thành công"
    }

  } catch (error) {
    console.error("Create class error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể tạo lớp"
    }
  }
}

export async function updateClassAction(formData: UpdateClassFormData) {
  try {
    const validatedData = updateClassSchema.parse(formData)
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check if class exists
    const { data: existingClass, error: fetchError } = await supabase
      .from("classes")
      .select("id, name, academic_year_id, semester_id")
      .eq("id", validatedData.id)
      .single()

    if (fetchError || !existingClass) {
      return {
        success: false,
        error: "Không tìm thấy lớp"
      }
    }

    // Check if name is being changed and if new name already exists
    if (existingClass.name !== validatedData.name ||
        existingClass.academic_year_id !== validatedData.academic_year_id ||
        existingClass.semester_id !== validatedData.semester_id) {
      const { data: nameExists } = await supabase
        .from("classes")
        .select("name")
        .eq("name", validatedData.name)
        .eq("academic_year_id", validatedData.academic_year_id)
        .eq("semester_id", validatedData.semester_id)
        .neq("id", validatedData.id)
        .single()

      if (nameExists) {
        return {
          success: false,
          error: "Tên lớp đã tồn tại trong niên khóa và học kỳ này"
        }
      }
    }

    // Validate homeroom teacher if provided
    if (validatedData.homeroom_teacher_id) {
      const { data: teacher } = await supabase
        .from("profiles")
        .select("role, homeroom_enabled")
        .eq("id", validatedData.homeroom_teacher_id)
        .eq("role", "teacher")
        .single()

      if (!teacher) {
        return {
          success: false,
          error: "Không tìm thấy giáo viên chủ nhiệm đã chọn"
        }
      }

      if (!teacher.homeroom_enabled) {
        return {
          success: false,
          error: "Giáo viên đã chọn chưa được kích hoạt cho nhiệm vụ chủ nhiệm"
        }
      }

      // Check if teacher is already assigned to another class in the same semester
      const { data: existingAssignment } = await supabase
        .from("classes")
        .select("name")
        .eq("homeroom_teacher_id", validatedData.homeroom_teacher_id)
        .eq("semester_id", validatedData.semester_id)
        .neq("id", validatedData.id)
        .single()

      if (existingAssignment) {
        return {
          success: false,
          error: `Giáo viên đã được phân công làm GVCN cho lớp "${existingAssignment.name}" trong học kỳ này`
        }
      }
    }

    // Update class
    const { error: updateError } = await supabase
      .from("classes")
      .update({
        name: validatedData.name,
        class_block_id: validatedData.class_block_id || null,
        class_suffix: validatedData.class_suffix || null,
        auto_generated_name: validatedData.auto_generated_name || false,
        academic_year_id: validatedData.academic_year_id,
        semester_id: validatedData.semester_id,
        is_subject_combination: validatedData.is_subject_combination,
        subject_combination_type: validatedData.subject_combination_type || null,
        subject_combination_variant: validatedData.subject_combination_variant || null,
        homeroom_teacher_id: validatedData.homeroom_teacher_id || null,
        max_students: validatedData.max_students,
        description: validatedData.description || null,
        updated_at: new Date().toISOString()
      })
      .eq("id", validatedData.id)

    if (updateError) {
      return {
        success: false,
        error: updateError.message
      }
    }

    revalidatePath("/dashboard/admin/classes")
    return {
      success: true,
      message: "Cập nhật lớp thành công"
    }

  } catch (error) {
    console.error("Update class error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể cập nhật lớp"
    }
  }
}

export async function deleteClassAction(classId: string) {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check if class exists
    const { data: classData, error: fetchError } = await supabase
      .from("classes")
      .select("id, name, current_students")
      .eq("id", classId)
      .single()

    if (fetchError || !classData) {
      return {
        success: false,
        error: "Không tìm thấy lớp"
      }
    }

    // Check if class has students
    if (classData.current_students > 0) {
      return {
        success: false,
        error: "Không thể xóa lớp đang có học sinh. Vui lòng gỡ tất cả học sinh trước."
      }
    }

    // Delete class (this will cascade delete student assignments)
    const { error: deleteError } = await supabase
      .from("classes")
      .delete()
      .eq("id", classId)

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message
      }
    }

    revalidatePath("/dashboard/admin/classes")
    return {
      success: true,
      message: "Xóa lớp thành công"
    }

  } catch (error) {
    console.error("Delete class error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể xóa lớp"
    }
  }
}

export async function getClassesAction(filters?: ClassFilters) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()
    const validatedFilters = filters ? classFiltersSchema.parse(filters) : { page: 1, limit: 10 }

    // Check if classes table exists
    const { error: tableCheckError } = await supabase
      .from("classes")
      .select("id")
      .limit(1)

    if (tableCheckError?.message?.includes('relation "classes" does not exist')) {
      return {
        success: false,
        error: "Bảng classes không tồn tại. Vui lòng liên hệ quản trị viên để thiết lập cơ sở dữ liệu.",
        data: [],
        total: 0,
        page: validatedFilters.page
      }
    }

    let query = supabase
      .from("classes")
      .select(`
        *,
        academic_year:academic_years(name),
        semester:semesters(name),
        class_block:class_blocks(id, name, display_name),
        homeroom_teacher:profiles!homeroom_teacher_id(full_name, employee_id)
      `, { count: "exact" })

    // Apply filters
    if (validatedFilters.search) {
      query = query.ilike("name", `%${validatedFilters.search}%`)
    }

    if (validatedFilters.academic_year_id) {
      query = query.eq("academic_year_id", validatedFilters.academic_year_id)
    }

    if (validatedFilters.semester_id) {
      query = query.eq("semester_id", validatedFilters.semester_id)
    }

    if (validatedFilters.is_subject_combination !== undefined) {
      query = query.eq("is_subject_combination", validatedFilters.is_subject_combination)
    }

    if (validatedFilters.subject_combination_type) {
      query = query.eq("subject_combination_type", validatedFilters.subject_combination_type)
    }

    if (validatedFilters.homeroom_teacher_id) {
      query = query.eq("homeroom_teacher_id", validatedFilters.homeroom_teacher_id)
    }

    // Apply pagination
    const from = (validatedFilters.page - 1) * validatedFilters.limit
    const to = from + validatedFilters.limit - 1

    const { data, error, count } = await query
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        total: 0,
        page: validatedFilters.page
      }
    }

    return {
      success: true,
      data: data as ClassWithDetails[],
      total: count || 0,
      page: validatedFilters.page
    }

  } catch (error) {
    console.error("Get classes error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Không thể lấy danh sách lớp",
      data: [],
      total: 0,
      page: 1
    }
  }
}

// Student Assignment Operations
export async function assignStudentToClassAction(formData: StudentAssignmentFormData) {
  try {
    const validatedData = studentAssignmentSchema.parse(formData)
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Validate student exists and is a student
    const { data: student } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", validatedData.student_id)
      .eq("role", "student")
      .single()

    if (!student) {
      return {
        success: false,
        error: "Không tìm thấy học sinh"
      }
    }

    // Validate class exists
    const { data: classData } = await supabase
      .from("classes")
      .select("id, name, max_students, current_students, is_subject_combination")
      .eq("id", validatedData.class_id)
      .single()

    if (!classData) {
      return {
        success: false,
        error: "Không tìm thấy lớp"
      }
    }

    // Check class capacity
    if (classData.current_students >= classData.max_students) {
      return {
        success: false,
        error: "Lớp đã đạt sĩ số tối đa"
      }
    }

    // Validate assignment type matches class type
    if (validatedData.assignment_type === 'main' && classData.is_subject_combination) {
      return {
        success: false,
        error: "Không thể phân học sinh vào lớp tổ hợp làm lớp chính"
      }
    }

    if (validatedData.assignment_type === 'combined' && !classData.is_subject_combination) {
      return {
        success: false,
        error: "Không thể phân học sinh vào lớp thường làm lớp tổ hợp"
      }
    }

    // Check if student already has assignment of this type
    const { data: existingAssignment } = await supabase
      .from("student_class_assignments")
      .select("id, class_id")
      .eq("student_id", validatedData.student_id)
      .eq("assignment_type", validatedData.assignment_type)
      .single()

    if (existingAssignment) {
      return {
        success: false,
        error: `Học sinh đã có phân công lớp dạng ${validatedData.assignment_type}`
      }
    }

    // Create assignment
    const { error: assignError } = await supabase
      .from("student_class_assignments")
      .insert({
        student_id: validatedData.student_id,
        class_id: validatedData.class_id,
        assignment_type: validatedData.assignment_type
      })

    if (assignError) {
      return {
        success: false,
        error: assignError.message
      }
    }

    // Update class current_students count
    const { error: updateError } = await supabase
      .from("classes")
      .update({
        current_students: classData.current_students + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", validatedData.class_id)

    if (updateError) {
      console.error("Failed to update class student count:", updateError)
    }

    revalidatePath("/dashboard/admin/classes")
    return {
      success: true,
      message: `Phân công học sinh vào lớp dạng ${validatedData.assignment_type} thành công`
    }

  } catch (error) {
    console.error("Assign student to class error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign student to class"
    }
  }
}

export async function removeStudentFromClassAction(assignmentId: string) {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Get assignment details
    const { data: assignment, error: fetchError } = await supabase
      .from("student_class_assignments")
      .select("id, student_id, class_id, assignment_type")
      .eq("id", assignmentId)
      .single()

    if (fetchError || !assignment) {
      return {
        success: false,
        error: "Không tìm thấy phân công"
      }
    }

    // Get class details for updating count
    const { data: classData } = await supabase
      .from("classes")
      .select("current_students")
      .eq("id", assignment.class_id)
      .single()

    // Remove assignment
    const { error: deleteError } = await supabase
      .from("student_class_assignments")
      .delete()
      .eq("id", assignmentId)

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message
      }
    }

    // Update class current_students count
    if (classData && classData.current_students > 0) {
      const { error: updateError } = await supabase
        .from("classes")
        .update({
          current_students: classData.current_students - 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", assignment.class_id)

      if (updateError) {
        console.error("Failed to update class student count:", updateError)
      }
    }

    revalidatePath("/dashboard/admin/classes")
    return {
      success: true,
      message: "Gỡ học sinh khỏi lớp thành công"
    }

  } catch (error) {
    console.error("Remove student from class error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove student from class"
    }
  }
}

export async function getStudentsWithClassAssignmentsAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        student_id,
        student_class_assignments!student_class_assignments_student_id_fkey(
          id,
          assignment_type,
          class:classes(
            id,
            name,
            is_subject_combination,
            subject_combination_type,
            subject_combination_variant
          )
        )
      `)
      .eq("role", "student")
      .order("full_name")

    if (error) {
      return {
        success: false,
        error: error.message,
        data: []
      }
    }

    // Transform data to include main_class and combined_class
    const studentsWithAssignments = data.map(student => {
      const assignments = student.student_class_assignments || []
      const mainAssignment = assignments.find(a => a.assignment_type === 'main')
      const combinedAssignment = assignments.find(a => a.assignment_type === 'combined')

      return {
        id: student.id,
        full_name: student.full_name,
        student_id: student.student_id,
        main_class: mainAssignment?.class || null,
        combined_class: combinedAssignment?.class || null
      }
    })

    return {
      success: true,
      data: studentsWithAssignments as StudentWithClassAssignments[]
    }

  } catch (error) {
    console.error("Get students with class assignments error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch students with class assignments",
      data: []
    }
  }
}

// Helper function to get homeroom-enabled teachers
export async function getHomeroomEnabledTeachersAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, employee_id")
      .eq("role", "teacher")
      .eq("homeroom_enabled", true)
      .order("full_name")

    if (error) {
      return {
        success: false,
        error: error.message,
        data: []
      }
    }

    return {
      success: true,
      data: data
    }

  } catch (error) {
    console.error("Get homeroom enabled teachers error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch homeroom enabled teachers",
      data: []
    }
  }
}

// Get single class by ID
export async function getClassByIdAction(classId: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("classes")
      .select(`
        *,
        academic_year:academic_years(name),
        semester:semesters(name),
        class_block:class_blocks(id, name, display_name),
        homeroom_teacher:profiles!homeroom_teacher_id(full_name, employee_id)
      `)
      .eq("id", classId)
      .single()

    if (error) {
      console.error("Error fetching class by ID:", error)
      return {
        success: false,
        error: error.message === "PGRST116" ? "Class not found" : "Failed to fetch class",
        data: null
      }
    }

    return {
      success: true,
      data: data as ClassWithDetails
    }

  } catch (error) {
    console.error("Get class by ID error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch class",
      data: null
    }
  }
}

// Get students in a specific class with combined class information
export async function getClassStudentsWithDetailsAction(classId: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("student_class_assignments")
      .select(`
        id,
        student_id,
        assignment_type,
        assigned_at,
        student:profiles!student_class_assignments_student_id_fkey(
          id,
          full_name,
          student_id,
          email
        )
      `)
      .eq("class_id", classId)
      .eq("is_active", true)
      .order("assigned_at", { ascending: false })

    if (error) {
      console.error("Error fetching class students:", error)
      return {
        success: false,
        error: "Failed to fetch class students",
        data: []
      }
    }

    // Batch fetch other assignments to avoid N+1 queries
    const assignments = data || []
    const uniqueStudentIds = Array.from(new Set(assignments.map(a => a.student_id)))

    // Fetch all active assignments for these students (both types)
    const { data: otherAssignments, error: otherErr } = await supabase
      .from("student_class_assignments")
      .select(`
        student_id,
        assignment_type,
        class:classes(name)
      `)
      .in("student_id", uniqueStudentIds)
      .eq("is_active", true)

    if (otherErr) {
      console.error("Error fetching other assignments:", otherErr)
    }

    // Build map: student_id -> { main?: className, combined?: className }
    const studentIdToTypeToClass: Record<string, { main?: string; combined?: string }> = {}
    for (const oa of otherAssignments || []) {
      const cls = Array.isArray(oa.class) ? oa.class[0] : oa.class
      const className: string | undefined = cls?.name
      if (!className) continue
      const bucket = (studentIdToTypeToClass[oa.student_id] ||= {})
      if (oa.assignment_type === "main") bucket.main = className
      else if (oa.assignment_type === "combined") bucket.combined = className
    }

    const studentsWithOtherClass = assignments.map((assignment) => {
      const student = Array.isArray(assignment.student) ? assignment.student[0] : assignment.student
      const otherType = assignment.assignment_type === "main" ? "combined" : "main"
      const otherName = studentIdToTypeToClass[assignment.student_id]?.[otherType as "main" | "combined"]
      return {
        id: assignment.id,
        student_id: student?.student_id || "",
        full_name: student?.full_name || "",
        email: student?.email || "",
        assignment_type: assignment.assignment_type,
        assigned_at: assignment.assigned_at,
        combined_class_name: otherName ?? undefined
      }
    })

    return {
      success: true,
      data: studentsWithOtherClass
    }

  } catch (error) {
    console.error("Get class students with details error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch class students",
      data: []
    }
  }
}
