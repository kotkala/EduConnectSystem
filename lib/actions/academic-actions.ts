"use server"

import { createClient } from "@/utils/supabase/server"
import { createAdminClient } from "@/utils/supabase/admin"
import { revalidatePath } from "next/cache"
import {
  academicYearSchema,
  updateAcademicYearSchema,
  semesterSchema,
  updateSemesterSchema,
  academicFiltersSchema,
  type AcademicYearFormData,
  type UpdateAcademicYearFormData,
  type SemesterFormData,
  type UpdateSemesterFormData,
  type AcademicFilters,
  type SemesterWithAcademicYear,
  type AcademicYearWithSemesters
} from "@/lib/validations/academic-validations"

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

// Academic Year CRUD Operations
export async function createAcademicYearAction(formData: AcademicYearFormData) {
  try {
    const validatedData = academicYearSchema.parse(formData)
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check if academic year name already exists
    const { data: existingYear } = await supabase
      .from("academic_years")
      .select("name")
      .eq("name", validatedData.name)
      .single()

    if (existingYear) {
      return {
        success: false,
        error: "Academic year already exists"
      }
    }

    // If setting as current, unset other current years
    if (validatedData.is_current) {
      await supabase
        .from("academic_years")
        .update({ is_current: false })
        .eq("is_current", true)
    }

    // Create academic year
    const { data: academicYear, error: createError } = await supabase
      .from("academic_years")
      .insert({
        name: validatedData.name,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        is_current: validatedData.is_current
      })
      .select()
      .single()

    if (createError) {
      return {
        success: false,
        error: createError.message
      }
    }

    // Auto-create default semesters
    const semester1StartDate = validatedData.start_date
    const semester1EndDate = new Date(validatedData.start_date)
    semester1EndDate.setMonth(semester1EndDate.getMonth() + 4) // ~4 months for semester 1
    
    const semester2StartDate = new Date(semester1EndDate)
    semester2StartDate.setDate(semester2StartDate.getDate() + 1)
    const semester2EndDate = validatedData.end_date

    const defaultSemesters = [
      {
        academic_year_id: academicYear.id,
        name: "Học kỳ 1",
        semester_number: 1,
        start_date: semester1StartDate,
        end_date: semester1EndDate.toISOString().split('T')[0],
        weeks_count: 18,
        is_current: validatedData.is_current
      },
      {
        academic_year_id: academicYear.id,
        name: "Học kỳ 2",
        semester_number: 2,
        start_date: semester2StartDate.toISOString().split('T')[0],
        end_date: semester2EndDate,
        weeks_count: 17,
        is_current: false
      }
    ]

    // If setting academic year as current, unset other current semesters
    if (validatedData.is_current) {
      await supabase
        .from("semesters")
        .update({ is_current: false })
        .eq("is_current", true)
    }

    await supabase
      .from("semesters")
      .insert(defaultSemesters)

    revalidatePath("/dashboard/admin/academic")
    return {
      success: true,
      message: "Academic year created successfully with default semesters"
    }

  } catch (error) {
    console.error("Create academic year error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create academic year"
    }
  }
}

export async function updateAcademicYearAction(formData: UpdateAcademicYearFormData) {
  try {
    const validatedData = updateAcademicYearSchema.parse(formData)
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check if academic year exists
    const { data: existingYear, error: fetchError } = await supabase
      .from("academic_years")
      .select("id, name")
      .eq("id", validatedData.id)
      .single()

    if (fetchError || !existingYear) {
      return {
        success: false,
        error: "Academic year not found"
      }
    }

    // Check if name is being changed and if new name already exists
    if (existingYear.name !== validatedData.name) {
      const { data: nameExists } = await supabase
        .from("academic_years")
        .select("name")
        .eq("name", validatedData.name)
        .neq("id", validatedData.id)
        .single()

      if (nameExists) {
        return {
          success: false,
          error: "Academic year name already exists"
        }
      }
    }

    // If setting as current, unset other current years
    if (validatedData.is_current) {
      await supabase
        .from("academic_years")
        .update({ is_current: false })
        .neq("id", validatedData.id)
        .eq("is_current", true)

      // Also unset current semesters from other years
      await supabase
        .from("semesters")
        .update({ is_current: false })
        .neq("academic_year_id", validatedData.id)
        .eq("is_current", true)
    }

    // Update academic year
    const { error: updateError } = await supabase
      .from("academic_years")
      .update({
        name: validatedData.name,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        is_current: validatedData.is_current,
        updated_at: new Date().toISOString()
      })
      .eq("id", validatedData.id)

    if (updateError) {
      return {
        success: false,
        error: updateError.message
      }
    }

    revalidatePath("/dashboard/admin/academic")
    return {
      success: true,
      message: "Academic year updated successfully"
    }

  } catch (error) {
    console.error("Update academic year error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update academic year"
    }
  }
}

export async function deleteAcademicYearAction(academicYearId: string) {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check if academic year exists
    const { data: academicYear, error: fetchError } = await supabase
      .from("academic_years")
      .select("id, name")
      .eq("id", academicYearId)
      .single()

    if (fetchError || !academicYear) {
      return {
        success: false,
        error: "Academic year not found"
      }
    }

    // Delete academic year (this will cascade delete semesters)
    const { error: deleteError } = await supabase
      .from("academic_years")
      .delete()
      .eq("id", academicYearId)

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message
      }
    }

    revalidatePath("/dashboard/admin/academic")
    return {
      success: true,
      message: "Academic year deleted successfully"
    }

  } catch (error) {
    console.error("Delete academic year error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete academic year"
    }
  }
}

export async function getAcademicYearsAction(filters?: AcademicFilters) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()
    const validatedFilters = filters ? academicFiltersSchema.parse(filters) : { page: 1, limit: 10 }

    let query = supabase
      .from("academic_years")
      .select(`
        *,
        semesters(*)
      `, { count: "exact" })

    // Apply filters
    if (validatedFilters.search) {
      query = query.ilike("name", `%${validatedFilters.search}%`)
    }

    if (validatedFilters.is_current !== undefined) {
      query = query.eq("is_current", validatedFilters.is_current)
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
      data: data as AcademicYearWithSemesters[],
      total: count || 0,
      page: validatedFilters.page
    }

  } catch (error) {
    console.error("Get academic years error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch academic years",
      data: [],
      total: 0,
      page: 1
    }
  }
}

// Semester CRUD Operations
export async function createSemesterAction(formData: SemesterFormData) {
  try {
    const validatedData = semesterSchema.parse(formData)
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check if semester number already exists for this academic year
    const { data: existingSemester } = await supabase
      .from("semesters")
      .select("semester_number")
      .eq("academic_year_id", validatedData.academic_year_id)
      .eq("semester_number", validatedData.semester_number)
      .single()

    if (existingSemester) {
      return {
        success: false,
        error: `Semester ${validatedData.semester_number} already exists for this academic year`
      }
    }

    // If setting as current, unset other current semesters
    if (validatedData.is_current) {
      await supabase
        .from("semesters")
        .update({ is_current: false })
        .eq("is_current", true)
    }

    // Create semester
    const { error: createError } = await supabase
      .from("semesters")
      .insert({
        academic_year_id: validatedData.academic_year_id,
        name: validatedData.name,
        semester_number: validatedData.semester_number,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        weeks_count: validatedData.weeks_count,
        is_current: validatedData.is_current
      })

    if (createError) {
      return {
        success: false,
        error: createError.message
      }
    }

    revalidatePath("/dashboard/admin/academic")
    return {
      success: true,
      message: "Semester created successfully"
    }

  } catch (error) {
    console.error("Create semester error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create semester"
    }
  }
}

export async function updateSemesterAction(formData: UpdateSemesterFormData) {
  try {
    const validatedData = updateSemesterSchema.parse(formData)
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check if semester exists
    const { data: existingSemester, error: fetchError } = await supabase
      .from("semesters")
      .select("id, academic_year_id, semester_number")
      .eq("id", validatedData.id)
      .single()

    if (fetchError || !existingSemester) {
      return {
        success: false,
        error: "Semester not found"
      }
    }

    // Check if semester number is being changed and if new number already exists
    if (existingSemester.semester_number !== validatedData.semester_number ||
        existingSemester.academic_year_id !== validatedData.academic_year_id) {
      const { data: numberExists } = await supabase
        .from("semesters")
        .select("semester_number")
        .eq("academic_year_id", validatedData.academic_year_id)
        .eq("semester_number", validatedData.semester_number)
        .neq("id", validatedData.id)
        .single()

      if (numberExists) {
        return {
          success: false,
          error: `Semester ${validatedData.semester_number} already exists for this academic year`
        }
      }
    }

    // If setting as current, unset other current semesters
    if (validatedData.is_current) {
      await supabase
        .from("semesters")
        .update({ is_current: false })
        .neq("id", validatedData.id)
        .eq("is_current", true)
    }

    // Update semester
    const { error: updateError } = await supabase
      .from("semesters")
      .update({
        academic_year_id: validatedData.academic_year_id,
        name: validatedData.name,
        semester_number: validatedData.semester_number,
        start_date: validatedData.start_date,
        end_date: validatedData.end_date,
        weeks_count: validatedData.weeks_count,
        is_current: validatedData.is_current,
        updated_at: new Date().toISOString()
      })
      .eq("id", validatedData.id)

    if (updateError) {
      return {
        success: false,
        error: updateError.message
      }
    }

    revalidatePath("/dashboard/admin/academic")
    return {
      success: true,
      message: "Semester updated successfully"
    }

  } catch (error) {
    console.error("Update semester error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update semester"
    }
  }
}

export async function deleteSemesterAction(semesterId: string) {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check if semester exists
    const { data: semester, error: fetchError } = await supabase
      .from("semesters")
      .select("id, name")
      .eq("id", semesterId)
      .single()

    if (fetchError || !semester) {
      return {
        success: false,
        error: "Semester not found"
      }
    }

    // Delete semester
    const { error: deleteError } = await supabase
      .from("semesters")
      .delete()
      .eq("id", semesterId)

    if (deleteError) {
      return {
        success: false,
        error: deleteError.message
      }
    }

    revalidatePath("/dashboard/admin/academic")
    return {
      success: true,
      message: "Semester deleted successfully"
    }

  } catch (error) {
    console.error("Delete semester error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete semester"
    }
  }
}

export async function getSemestersAction(filters?: AcademicFilters) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()
    const validatedFilters = filters ? academicFiltersSchema.parse(filters) : { page: 1, limit: 10 }

    let query = supabase
      .from("semesters")
      .select(`
        *,
        academic_year:academic_years(name)
      `, { count: "exact" })

    // Apply filters
    if (validatedFilters.search) {
      query = query.or(`name.ilike.%${validatedFilters.search}%,academic_year.name.ilike.%${validatedFilters.search}%`)
    }

    if (validatedFilters.is_current !== undefined) {
      query = query.eq("is_current", validatedFilters.is_current)
    }

    // Apply pagination
    const from = (validatedFilters.page - 1) * validatedFilters.limit
    const to = from + validatedFilters.limit - 1

    const { data, error, count } = await query
      .order("academic_year_id", { ascending: false })
      .order("semester_number", { ascending: true })
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
      data: data as SemesterWithAcademicYear[],
      total: count || 0,
      page: validatedFilters.page
    }

  } catch (error) {
    console.error("Get semesters error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch semesters",
      data: [],
      total: 0,
      page: 1
    }
  }
}
