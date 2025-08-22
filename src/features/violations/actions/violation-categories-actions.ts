'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminPermissions, checkAuthenticatedUser } from './shared/violation-permissions'
import { VIOLATION_CATEGORY_FIELDS } from './shared/violation-queries'
import {
  violationCategorySchema,
  updateViolationCategorySchema,
  type ViolationCategoryFormData,
  type UpdateViolationCategoryFormData,
  type ViolationCategory
} from '@/lib/validations/violation-validations'

/**
 * Create a new violation category
 * @param data - Violation category form data
 * @returns Promise with success status and created category data
 */
export async function createViolationCategoryAction(data: ViolationCategoryFormData) {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedData = violationCategorySchema.parse(data)

    const { data: category, error } = await supabase
      .from('violation_categories')
      .insert(validatedData)
      .select(VIOLATION_CATEGORY_FIELDS)
      .single()

    if (error) {
      console.error('Error creating violation category:', error)
      throw new Error('Không thể tạo danh mục vi phạm')
    }

    revalidatePath('/dashboard/admin/violations')
    return { 
      success: true, 
      data: category,
      message: 'Tạo danh mục vi phạm thành công'
    }
  } catch (error) {
    console.error('Create violation category error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi tạo danh mục vi phạm' 
    }
  }
}

/**
 * Update an existing violation category
 * @param data - Update violation category form data with ID
 * @returns Promise with success status and updated category data
 */
export async function updateViolationCategoryAction(data: UpdateViolationCategoryFormData) {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedData = updateViolationCategorySchema.parse(data)

    const { id, ...updateFields } = validatedData

    const { data: category, error } = await supabase
      .from('violation_categories')
      .update({
        ...updateFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(VIOLATION_CATEGORY_FIELDS)
      .single()

    if (error) {
      console.error('Error updating violation category:', error)
      throw new Error('Không thể cập nhật danh mục vi phạm')
    }

    revalidatePath('/dashboard/admin/violations')
    return { 
      success: true, 
      data: category,
      message: 'Cập nhật danh mục vi phạm thành công'
    }
  } catch (error) {
    console.error('Update violation category error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật danh mục vi phạm' 
    }
  }
}

/**
 * Get all violation categories
 * @param includeInactive - Whether to include inactive categories (default: false)
 * @returns Promise with success status and categories array
 */
export async function getViolationCategoriesAction(includeInactive: boolean = false): Promise<{ 
  success: boolean; 
  data?: ViolationCategory[]; 
  error?: string 
}> {
  try {
    const { supabase } = await checkAuthenticatedUser()

    let query = supabase
      .from('violation_categories')
      .select(VIOLATION_CATEGORY_FIELDS)
      .order('name')

    // Filter by active status unless explicitly including inactive
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: categories, error } = await query

    if (error) {
      console.error('Error fetching violation categories:', error)
      throw new Error('Không thể lấy danh sách danh mục vi phạm')
    }

    return { 
      success: true, 
      data: categories || []
    }
  } catch (error) {
    console.error('Get violation categories error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy danh mục vi phạm' 
    }
  }
}

/**
 * Soft delete a violation category (set is_active to false)
 * @param categoryId - ID of the category to deactivate
 * @returns Promise with success status
 */
export async function deactivateViolationCategoryAction(categoryId: string) {
  try {
    const { supabase } = await checkAdminPermissions()

    // Check if category has associated violation types
    const { data: violationTypes, error: checkError } = await supabase
      .from('violation_types')
      .select('id')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .limit(1)

    if (checkError) {
      console.error('Error checking violation types:', checkError)
      throw new Error('Không thể kiểm tra loại vi phạm liên quan')
    }

    if (violationTypes && violationTypes.length > 0) {
      throw new Error('Không thể xóa danh mục có loại vi phạm đang hoạt động')
    }

    const { error } = await supabase
      .from('violation_categories')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)

    if (error) {
      console.error('Error deactivating violation category:', error)
      throw new Error('Không thể xóa danh mục vi phạm')
    }

    revalidatePath('/dashboard/admin/violations')
    return { 
      success: true,
      message: 'Xóa danh mục vi phạm thành công'
    }
  } catch (error) {
    console.error('Deactivate violation category error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa danh mục vi phạm' 
    }
  }
}

/**
 * Reactivate a violation category (set is_active to true)
 * @param categoryId - ID of the category to reactivate
 * @returns Promise with success status
 */
export async function reactivateViolationCategoryAction(categoryId: string) {
  try {
    const { supabase } = await checkAdminPermissions()

    const { error } = await supabase
      .from('violation_categories')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)

    if (error) {
      console.error('Error reactivating violation category:', error)
      throw new Error('Không thể khôi phục danh mục vi phạm')
    }

    revalidatePath('/dashboard/admin/violations')
    return { 
      success: true,
      message: 'Khôi phục danh mục vi phạm thành công'
    }
  } catch (error) {
    console.error('Reactivate violation category error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra khi khôi phục danh mục vi phạm' 
    }
  }
}
