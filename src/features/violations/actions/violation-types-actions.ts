'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminPermissions, checkAuthenticatedUser } from './shared/violation-permissions'
import { VIOLATION_TYPE_WITH_CATEGORY_FIELDS, buildPaginationParams } from './shared/violation-queries'
import {
  violationTypeSchema,
  updateViolationTypeSchema,
  type ViolationTypeFormData,
  type UpdateViolationTypeFormData,
  type ViolationTypeWithCategory
} from '@/lib/validations/violation-validations'

/**
 * Create a new violation type
 */
export async function createViolationTypeAction(data: ViolationTypeFormData) {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedData = violationTypeSchema.parse(data)

    const { data: violationType, error } = await supabase
      .from('violation_types')
      .insert(validatedData)
      .select(VIOLATION_TYPE_WITH_CATEGORY_FIELDS)
      .single()

    if (error) throw new Error('Không thể tạo loại vi phạm')

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: violationType }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Update an existing violation type
 */
export async function updateViolationTypeAction(data: UpdateViolationTypeFormData) {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedData = updateViolationTypeSchema.parse(data)
    const { id, ...updateFields } = validatedData

    const { data: violationType, error } = await supabase
      .from('violation_types')
      .update({ ...updateFields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(VIOLATION_TYPE_WITH_CATEGORY_FIELDS)
      .single()

    if (error) throw new Error('Không thể cập nhật loại vi phạm')

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: violationType }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get violation types by category
 */
export async function getViolationTypesAction(categoryId?: string): Promise<{ 
  success: boolean; 
  data?: ViolationTypeWithCategory[]; 
  error?: string 
}> {
  try {
    const { supabase } = await checkAdminPermissions()

    let query = supabase
      .from('violation_types')
      .select(VIOLATION_TYPE_WITH_CATEGORY_FIELDS)
      .eq('is_active', true)
      .order('name')

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: violationTypes, error } = await query

    if (error) throw new Error('Không thể lấy danh sách loại vi phạm')

    return { success: true, data: (violationTypes || []) as unknown as ViolationTypeWithCategory[] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get violation types with pagination and search
 */
export async function getViolationTypesWithPaginationAction(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  severity?: string;
}): Promise<{
  success: boolean;
  data?: ViolationTypeWithCategory[];
  total?: number;
  error?: string;
}> {
  try {
    console.log('🔍 getViolationTypesWithPaginationAction - Starting with filters:', filters)
    const { supabase } = await checkAuthenticatedUser()
    const { page = 1, limit = 10, search, category_id, severity } = filters || {}
    const { from, to } = buildPaginationParams(page, limit)

    // Build query
    let query = supabase
      .from('violation_types')
      .select(VIOLATION_TYPE_WITH_CATEGORY_FIELDS, { count: 'exact' })
      .eq('is_active', true)

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    if (category_id) {
      query = query.eq('category_id', category_id)
    }
    
    if (severity) {
      query = query.eq('severity', severity)
    }

    // Apply pagination and ordering
    console.log('🔍 Executing paginated query...')
    const { data: violationTypes, error, count } = await query
      .order('name')
      .range(from, to)

    console.log('🔍 Paginated query result:', { data: violationTypes, error, count })

    if (error) {
      console.error('🔍 Paginated query error:', error)
      throw new Error('Không thể lấy danh sách loại vi phạm')
    }

    console.log('🔍 Success! Returning paginated data...')
    return {
      success: true,
      data: (violationTypes || []) as unknown as ViolationTypeWithCategory[],
      total: count || 0
    }
  } catch (error) {
    console.error('🔍 getViolationTypesWithPaginationAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }
  }
}

/**
 * Deactivate a violation type
 */
export async function deactivateViolationTypeAction(typeId: string) {
  try {
    const { supabase } = await checkAdminPermissions()

    // Check if type has associated violations
    const { data: violations } = await supabase
      .from('student_violations')
      .select('id')
      .eq('violation_type_id', typeId)
      .limit(1)

    if (violations && violations.length > 0) {
      throw new Error('Không thể xóa loại vi phạm đã được sử dụng')
    }

    const { error } = await supabase
      .from('violation_types')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', typeId)

    if (error) throw new Error('Không thể xóa loại vi phạm')

    revalidatePath('/dashboard/admin/violations')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get violation categories and types together
 */
export async function getViolationCategoriesAndTypesAction(): Promise<{
  success: boolean;
  categories?: Array<{id: string; name: string; description: string; is_active: boolean}>;
  types?: ViolationTypeWithCategory[];
  error?: string
}> {
  try {
    console.log('🔍 getViolationCategoriesAndTypesAction - Starting...')
    const { supabase } = await checkAuthenticatedUser()

    console.log('🔍 Running parallel queries...')
    const [categoriesResult, typesResult] = await Promise.all([
      supabase
        .from('violation_categories')
        .select('id, name, description, is_active')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('violation_types')
        .select(VIOLATION_TYPE_WITH_CATEGORY_FIELDS)
        .eq('is_active', true)
        .order('name')
    ])

    console.log('🔍 Categories result:', categoriesResult)
    console.log('🔍 Types result:', typesResult)

    if (categoriesResult.error) {
      console.error('🔍 Categories error:', categoriesResult.error)
      throw new Error('Không thể lấy danh mục vi phạm')
    }
    if (typesResult.error) {
      console.error('🔍 Types error:', typesResult.error)
      throw new Error('Không thể lấy loại vi phạm')
    }

    console.log('🔍 Success! Returning data...')
    return {
      success: true,
      categories: categoriesResult.data || [],
      types: (typesResult.data || []) as unknown as ViolationTypeWithCategory[]
    }
  } catch (error) {
    console.error('🔍 getViolationCategoriesAndTypesAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }
  }
}
