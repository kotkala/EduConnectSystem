"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import {
  classBlockSchema,
  updateClassBlockSchema,
  classBlockFiltersSchema,
  type ClassBlockFormData,
  type UpdateClassBlockFormData,
  type ClassBlockFilters,
  type ClassBlock,
  type ClassBlockWithStats
} from "@/lib/validations/class-block-validations"

// Helper function to check admin permissions
async function checkAdminPermissions() {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("YÃªu cáº§u xÃ¡c thá»±c")
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    throw new Error("KhÃ´ng tÃ¬m tháº¥y há»“ sÆ¡")
  }

  if (profile.role !== "admin") {
    throw new Error("YÃªu cáº§u quyá»n quáº£n trá»‹")
  }

  return { user, profile }
}

// Get all class blocks
export async function getClassBlocksAction(filters?: ClassBlockFilters) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()
    const validatedFilters = filters ? classBlockFiltersSchema.parse(filters) : { page: 1, limit: 10 }

    let query = supabase
      .from("class_blocks")
      .select(`
        id,
        name,
        display_name,
        description,
        is_active,
        sort_order,
        created_at,
        updated_at
      `)

    // Apply filters
    if (validatedFilters.search) {
      query = query.or(`name.ilike.%${validatedFilters.search}%,display_name.ilike.%${validatedFilters.search}%`)
    }

    if (validatedFilters.is_active !== undefined) {
      query = query.eq("is_active", validatedFilters.is_active)
    }

    // Get total count with same filters
    let countQuery = supabase
      .from("class_blocks")
      .select("*", { count: "exact", head: true })

    // Apply same filters for count
    if (validatedFilters.search) {
      countQuery = countQuery.or(`name.ilike.%${validatedFilters.search}%,display_name.ilike.%${validatedFilters.search}%`)
    }

    if (validatedFilters.is_active !== undefined) {
      countQuery = countQuery.eq("is_active", validatedFilters.is_active)
    }

    const { count } = await countQuery

    // Apply pagination and ordering
    const { data, error } = await query
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
      .range(
        (validatedFilters.page - 1) * validatedFilters.limit,
        validatedFilters.page * validatedFilters.limit - 1
      )

    if (error) {
      console.error("Error fetching class blocks:", error)
      return {
        success: false,
        error: "KhÃ´ng thá»ƒ láº¥y khá»‘i lá»›p",
        data: [],
        total: 0,
        page: validatedFilters.page
      }
    }

    return {
      success: true,
      data: data as ClassBlock[],
      total: count || 0,
      page: validatedFilters.page
    }
  } catch (error) {
    console.error("Error in getClassBlocksAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch class blocks",
      data: [],
      total: 0,
      page: 1
    }
  }
}

// Get class blocks with statistics
export async function getClassBlocksWithStatsAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Get class blocks
    const { data: blocks, error } = await supabase
      .from("class_blocks")
      .select(`
        id,
        name,
        display_name,
        description,
        is_active,
        sort_order,
        created_at,
        updated_at
      `)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching class blocks with stats:", error)
      return {
        success: false,
        error: "Failed to fetch class blocks",
        data: []
      }
    }

    // Get class counts for each block
    const transformedData = await Promise.all(blocks.map(async (block) => {
      // Get class count
      const { count: classCount } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true })
        .eq("class_block_id", block.id)

      // Get classes for this block to count students
      const { data: blockClasses } = await supabase
        .from("classes")
        .select("id")
        .eq("class_block_id", block.id)

      let studentCount = 0
      if (blockClasses && blockClasses.length > 0) {
        const classIds = blockClasses.map(c => c.id)
        const { count } = await supabase
          .from("student_class_assignments")
          .select("*", { count: "exact", head: true })
          .in("class_id", classIds)
          .eq("is_active", true)

        studentCount = count || 0
      }

      return {
        ...block,
        class_count: classCount || 0,
        student_count: studentCount
      }
    }))

    return {
      success: true,
      data: transformedData as ClassBlockWithStats[]
    }
  } catch (error) {
    console.error("Error in getClassBlocksWithStatsAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch class blocks",
      data: []
    }
  }
}

// Get active class blocks for dropdowns
export async function getActiveClassBlocksAction() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("class_blocks")
      .select("id, name, display_name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })

    if (error) {
      console.error("Error fetching active class blocks:", error)
      return {
        success: false,
        error: "Failed to fetch class blocks",
        data: []
      }
    }

    return {
      success: true,
      data: data as Pick<ClassBlock, "id" | "name" | "display_name">[]
    }
  } catch (error) {
    console.error("Error in getActiveClassBlocksAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch class blocks",
      data: []
    }
  }
}

// Create class block
export async function createClassBlockAction(formData: ClassBlockFormData) {
  try {
    await checkAdminPermissions()
    const validatedData = classBlockSchema.parse(formData)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("class_blocks")
      .insert([validatedData])
      .select()
      .single()

    if (error) {
      console.error("Error creating class block:", error)
      return {
        success: false,
        error: error.message.includes("duplicate") 
          ? "A class block with this name already exists"
          : "Failed to create class block"
      }
    }

    revalidatePath("/dashboard/admin/class-blocks")
    revalidatePath("/dashboard/admin/classes")

    return {
      success: true,
      data: data as ClassBlock,
      message: "Class block created successfully"
    }
  } catch (error) {
    console.error("Error in createClassBlockAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create class block"
    }
  }
}

// Update class block
export async function updateClassBlockAction(formData: UpdateClassBlockFormData) {
  try {
    await checkAdminPermissions()
    const validatedData = updateClassBlockSchema.parse(formData)
    const { id, ...updateData } = validatedData
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("class_blocks")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating class block:", error)
      return {
        success: false,
        error: error.message.includes("duplicate") 
          ? "A class block with this name already exists"
          : "Failed to update class block"
      }
    }

    revalidatePath("/dashboard/admin/class-blocks")
    revalidatePath("/dashboard/admin/classes")

    return {
      success: true,
      data: data as ClassBlock,
      message: "Class block updated successfully"
    }
  } catch (error) {
    console.error("Error in updateClassBlockAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update class block"
    }
  }
}

// Delete class block
export async function deleteClassBlockAction(id: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Check if class block has associated classes
    const { data: classes, error: classCheckError } = await supabase
      .from("classes")
      .select("id")
      .eq("class_block_id", id)
      .limit(1)

    if (classCheckError) {
      console.error("Error checking class block usage:", classCheckError)
      return {
        success: false,
        error: "Failed to check class block usage"
      }
    }

    if (classes && classes.length > 0) {
      return {
        success: false,
        error: "Cannot delete class block that has associated classes"
      }
    }

    const { error } = await supabase
      .from("class_blocks")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting class block:", error)
      return {
        success: false,
        error: "Failed to delete class block"
      }
    }

    revalidatePath("/dashboard/admin/class-blocks")
    revalidatePath("/dashboard/admin/classes")

    return {
      success: true,
      message: "Class block deleted successfully"
    }
  } catch (error) {
    console.error("Error in deleteClassBlockAction:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete class block"
    }
  }
}
