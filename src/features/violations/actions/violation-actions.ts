'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  violationCategorySchema,
  updateViolationCategorySchema,
  violationTypeSchema,
  updateViolationTypeSchema,
  studentViolationSchema,
  bulkStudentViolationSchema,
  updateStudentViolationSchema,
  violationNotificationSchema,
  violationFiltersSchema,
  type ViolationCategoryFormData,
  type UpdateViolationCategoryFormData,
  type ViolationTypeFormData,
  type UpdateViolationTypeFormData,
  type StudentViolationFormData,
  type BulkStudentViolationFormData,
  type UpdateStudentViolationFormData,
  type ViolationNotificationFormData,
  type ViolationFilters,
  type ViolationCategory,
  type ViolationTypeWithCategory,
  type StudentViolationWithDetails
} from '@/lib/validations/violation-validations'

// Helper function to check admin permissions
async function checkAdminPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Yêu cầu xác thực")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error("Yêu cầu quyền quản trị")
  }

  return { userId: user.id, supabase }
}

// Helper function to check teacher permissions (homeroom teacher)
async function checkHomeroomTeacherPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Yêu cầu xác thực")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    throw new Error("Yêu cầu quyền giáo viên")
  }

  // Check if teacher is a homeroom teacher
  const { data: homeroomClass } = await supabase
    .from('classes')
    .select('id, name')
    .eq('homeroom_teacher_id', user.id)
    .eq('is_active', true)
    .single()

  if (!homeroomClass) {
    throw new Error("Yêu cầu quyền giáo viên chủ nhiệm")
  }

  return { userId: user.id, supabase, homeroomClass }
}

// Violation Categories Actions
export async function createViolationCategoryAction(data: ViolationCategoryFormData) {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedData = violationCategorySchema.parse(data)

    const { data: category, error } = await supabase
      .from('violation_categories')
      .insert({
        name: validatedData.name,
        description: validatedData.description
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: category }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

export async function updateViolationCategoryAction(data: UpdateViolationCategoryFormData) {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedData = updateViolationCategorySchema.parse(data)

    const { data: category, error } = await supabase
      .from('violation_categories')
      .update({
        name: validatedData.name,
        description: validatedData.description,
        is_active: validatedData.is_active
      })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: category }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

export async function getViolationCategoriesAction(): Promise<{ success: boolean; data?: ViolationCategory[]; error?: string }> {
  try {
    const { supabase } = await checkAdminPermissions()

    const { data: categories, error } = await supabase
      .from('violation_categories')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (error) throw new Error(error.message)

    return { success: true, data: categories || [] }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

// Violation Types Actions
export async function createViolationTypeAction(data: ViolationTypeFormData) {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedData = violationTypeSchema.parse(data)

    const { data: violationType, error } = await supabase
      .from('violation_types')
      .insert({
        category_id: validatedData.category_id,
        name: validatedData.name,
        description: validatedData.description,
        default_severity: validatedData.default_severity,
        points: (data as { points?: number }).points ?? 0
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: violationType }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

export async function updateViolationTypeAction(data: UpdateViolationTypeFormData) {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedData = updateViolationTypeSchema.parse(data)

    const { data: violationType, error } = await supabase
      .from('violation_types')
      .update({
        category_id: validatedData.category_id,
        name: validatedData.name,
        description: validatedData.description,
        default_severity: validatedData.default_severity,
        points: (data as { points?: number }).points ?? 0,
        is_active: validatedData.is_active
      })
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: violationType }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

export async function getViolationTypesAction(categoryId?: string): Promise<{ success: boolean; data?: ViolationTypeWithCategory[]; error?: string }> {
  try {
    const { supabase } = await checkAdminPermissions()

    let query = supabase
      .from('violation_types')
      .select('*, category:violation_categories(id, name)')
      .eq('is_active', true)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: violationTypes, error } = await query.order('name')
    if (error) throw new Error(error.message)

    return { success: true, data: violationTypes || [] }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

// Helper functions for getStudentViolationsAction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyViolationFilters(query: any, filters: any, supabase: any): Promise<{ query: any; isEmpty: boolean }> {
  if (filters.search) {
    query = query.ilike('description', `%${filters.search}%`)
  }
  if (filters.student_id) {
    query = query.eq('student_id', filters.student_id)
  }
  if (filters.class_id) {
    query = query.eq('class_id', filters.class_id)
  }
  if (filters.severity && filters.severity !== 'all') {
    query = query.eq('severity', filters.severity)
  }
  if (filters.date_from) {
    query = query.gte('recorded_at', filters.date_from)
  }
  if (filters.date_to) {
    query = query.lte('recorded_at', filters.date_to)
  }

  // Handle category filter
  if (filters.category_id && filters.category_id !== 'all') {
    const { data: violationTypes } = await supabase
      .from('violation_types')
      .select('id')
      .eq('category_id', filters.category_id)

    if (violationTypes?.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const typeIds = violationTypes.map((vt: any) => vt.id)
      query = query.in('violation_type_id', typeIds)
    } else {
      return { query, isEmpty: true }
    }
  }

  return { query, isEmpty: false }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getViolationCount(supabase: any, filters: any) {
  const countQuery = supabase
    .from('student_violations')
    .select('*', { count: 'exact', head: true })

  const { query: filteredCountQuery, isEmpty } = await applyViolationFilters(countQuery, filters, supabase)

  if (isEmpty) {
    return { count: 0, error: null }
  }

  return await filteredCountQuery
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getViolationData(supabase: any, filters: any) {
  const dataQuery = supabase
    .from('student_violations')
    .select(`
      *,
      student:profiles!student_id(id, full_name, email, student_id),
      class:classes!class_id(id, name),
      violation_type:violation_types!violation_type_id(id, name, category_id),
      recorded_by:profiles!recorded_by(id, full_name)
    `)

  const { query: filteredDataQuery, isEmpty } = await applyViolationFilters(dataQuery, filters, supabase)

  if (isEmpty) {
    return { data: [], error: null }
  }

  // Apply pagination and ordering
  const offset = (filters.page - 1) * filters.limit
  const finalQuery = filteredDataQuery
    .order('recorded_at', { ascending: false })
    .range(offset, offset + filters.limit - 1)

  return await finalQuery
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function enrichViolationsWithCategories(violations: any[], supabase: any) {
  if (!violations?.length) return violations

  const categoryIds = [...new Set(violations
    .map(v => v.violation_type?.category_id)
    .filter(Boolean))]

  if (categoryIds.length === 0) return violations

  const { data: categories } = await supabase
    .from('violation_categories')
    .select('id, name')
    .in('id', categoryIds)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoriesMap = new Map(categories?.map((c: any) => [c.id, c]) || [])
  violations.forEach(violation => {
    if (violation.violation_type?.category_id) {
      violation.violation_type.category = categoriesMap.get(violation.violation_type.category_id)
    }
  })

  return violations
}

// Student Violations Actions
export async function createStudentViolationAction(data: StudentViolationFormData) {
  try {
    const { userId, supabase } = await checkAdminPermissions()
    const validatedData = studentViolationSchema.parse(data)

    // Lấy points từ loại vi phạm nếu points không được truyền vào
    const { data: vtype } = await supabase
      .from('violation_types')
      .select('id, points')
      .eq('id', validatedData.violation_type_id)
      .single()

    const points = typeof validatedData.points === 'number' ? validatedData.points : (vtype?.points ?? 0)

    // Tính week_index, month_index dựa trên violation_date (hoặc recorded_at::date), và start_date của học kì
    const { data: sem } = await supabase
      .from('semesters')
      .select('id, start_date')
      .eq('id', validatedData.semester_id)
      .single()

    const vDate = validatedData.violation_date ? new Date(validatedData.violation_date) : new Date()
    const semStart = sem?.start_date ? new Date(sem.start_date) : new Date()
    const diffDays = Math.floor((Date.UTC(vDate.getFullYear(), vDate.getMonth(), vDate.getDate()) - Date.UTC(semStart.getFullYear(), semStart.getMonth(), semStart.getDate())) / (1000 * 60 * 60 * 24))
    const week_index = Math.max(1, Math.floor(diffDays / 7) + 1)
    const month_index = Math.floor((week_index - 1) / 4) + 1

    const { data: violation, error } = await supabase
      .from('student_violations')
      .insert({
        student_id: validatedData.student_id,
        class_id: validatedData.class_id,
        violation_type_id: validatedData.violation_type_id,
        severity: validatedData.severity,
        points,
        description: validatedData.description,
        violation_date: validatedData.violation_date ?? new Date().toISOString().slice(0,10),
        week_index,
        month_index,
        recorded_by: userId,
        academic_year_id: validatedData.academic_year_id,
        semester_id: validatedData.semester_id
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: violation }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

export async function createBulkStudentViolationsAction(data: BulkStudentViolationFormData) {
  try {
    const { userId, supabase } = await checkAdminPermissions()
    const validatedData = bulkStudentViolationSchema.parse(data)

    // Lấy points
    const { data: vtype } = await supabase
      .from('violation_types')
      .select('id, points')
      .eq('id', validatedData.violation_type_id)
      .single()

    const { data: sem } = await supabase
      .from('semesters')
      .select('id, start_date')
      .eq('id', validatedData.semester_id)
      .single()

    const vDate = new Date(validatedData.violation_date)
    const semStart = sem?.start_date ? new Date(sem.start_date) : new Date()
    const diffDays = Math.floor((Date.UTC(vDate.getFullYear(), vDate.getMonth(), vDate.getDate()) - Date.UTC(semStart.getFullYear(), semStart.getMonth(), semStart.getDate())) / (1000 * 60 * 60 * 24))
    const week_index = Math.max(1, Math.floor(diffDays / 7) + 1)
    const month_index = Math.floor((week_index - 1) / 4) + 1

    const points = typeof validatedData.points === 'number' ? validatedData.points : (vtype?.points ?? 0)

    const violations = validatedData.student_ids.map(studentId => ({
      student_id: studentId,
      class_id: validatedData.class_id,
      violation_type_id: validatedData.violation_type_id,
      severity: validatedData.severity,
      description: validatedData.description,
      violation_date: validatedData.violation_date,
      points,
      week_index,
      month_index,
      recorded_by: userId,
      academic_year_id: validatedData.academic_year_id,
      semester_id: validatedData.semester_id
    }))

    const { data: createdViolations, error } = await supabase
      .from('student_violations')
      .insert(violations)
      .select()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: createdViolations }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

export async function updateStudentViolationAction(data: UpdateStudentViolationFormData) {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedData = updateStudentViolationSchema.parse(data)

    const updateData: Record<string, unknown> = {}
    if (validatedData.severity !== undefined) updateData.severity = validatedData.severity
    if (validatedData.description !== undefined) updateData.description = validatedData.description

    const { data: violation, error } = await supabase
      .from('student_violations')
      .update(updateData)
      .eq('id', validatedData.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: violation }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

export async function getStudentViolationsAction(filters?: ViolationFilters): Promise<{ success: boolean; data?: StudentViolationWithDetails[]; total?: number; error?: string }> {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedFilters = filters ? violationFiltersSchema.parse(filters) : { page: 1, limit: 10 }

    // Get count using helper function
    const { count, error: countError } = await getViolationCount(supabase, validatedFilters)
    if (countError) {
      throw new Error(countError.message)
    }

    // Get data using helper function
    const { data: violations, error: dataError } = await getViolationData(supabase, validatedFilters)
    if (dataError) {
      throw new Error(dataError.message)
    }

    // Enrich with category data using helper function
    const enrichedViolations = await enrichViolationsWithCategories(violations, supabase)

    return { success: true, data: enrichedViolations || [], total: count || 0 }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

export async function getViolationCategoriesAndTypesAction(): Promise<{
  success: boolean;
  categories?: ViolationCategory[];
  types?: ViolationTypeWithCategory[];
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Yêu cầu xác thực')
    }

    // Simple parallel queries
    const [categoriesResult, typesResult] = await Promise.all([
      supabase
        .from('violation_categories')
        .select('*')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('violation_types')
        .select('*, category:violation_categories(id, name)')
        .eq('is_active', true)
        .order('name')
    ])

    if (categoriesResult.error) throw new Error(categoriesResult.error.message)
    if (typesResult.error) throw new Error(typesResult.error.message)

    return {
      success: true,
      categories: categoriesResult.data || [],
      types: typesResult.data || []
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

// Paginated violation types with search functionality
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
  page?: number;
  error?: string;
}> {
  try {
    const { supabase } = await checkAdminPermissions()

    // Set default values
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const offset = (page - 1) * limit

    // Build base query
    let query = supabase
      .from('violation_types')
      .select('*, category:violation_categories(id, name)', { count: 'exact' })
      .eq('is_active', true)

    // Apply search filter
    if (filters?.search?.trim()) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }

    // Apply category filter
    if (filters?.category_id && filters.category_id !== 'all') {
      query = query.eq('category_id', filters.category_id)
    }

    // Apply severity filter
    if (filters?.severity && filters.severity !== 'all') {
      query = query.eq('default_severity', filters.severity)
    }

    // Apply pagination and ordering
    const { data: violationTypes, error, count } = await query
      .order('name')
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: violationTypes || [],
      total: count || 0,
      page
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

// Violation Notifications Actions
export async function createViolationNotificationAction(data: ViolationNotificationFormData) {
  try {
    const { userId, supabase } = await checkHomeroomTeacherPermissions()
    const validatedData = violationNotificationSchema.parse(data)

    const { data: notification, error } = await supabase
      .from('violation_notifications')
      .insert({
        violation_id: validatedData.violation_id,
        parent_id: validatedData.parent_id,
        teacher_id: userId
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/teacher/violations')
    return { success: true, data: notification }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

// Get violations for homeroom teacher
export async function getHomeroomViolationsAction(): Promise<{ success: boolean; data?: StudentViolationWithDetails[]; error?: string }> {
  try {
    const { homeroomClass, supabase } = await checkHomeroomTeacherPermissions()

    const { data: violations, error } = await supabase
      .from('student_violations')
      .select(`
        *,
        student:profiles!student_violations_student_id_fkey(id, full_name, email),
        class:classes(id, name),
        violation_type:violation_types(
          id,
          name,
          category_id,
          violation_categories(id, name)
        ),
        recorded_by:profiles!student_violations_recorded_by_fkey(id, full_name),
        academic_year:academic_years(id, name),
        semester:semesters(id, name)
      `)
      .eq('class_id', homeroomClass.id)
      .order('recorded_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data: violations || [] }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

// Get violations for parent with filtering and pagination
export async function getParentViolationsAction(
  studentId?: string,
  filters?: {
    week?: number
    severity?: string
    page?: number
    limit?: number
  }
): Promise<{
  success: boolean
  data?: StudentViolationWithDetails[]
  totalCount?: number
  totalPages?: number
  currentPage?: number
  error?: string
}> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Set default pagination values
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const offset = (page - 1) * limit

    let query = supabase
      .from('student_violations')
      .select(`
        *,
        student:profiles!student_id(id, full_name, email, student_id),
        class:classes(id, name),
        violation_type:violation_types(
          id,
          name,
          category:violation_categories(id, name)
        ),
        recorded_by:profiles!recorded_by(id, full_name),
        academic_year:academic_years(id, name),
        semester:semesters(id, name, start_date)
      `)

    // Filter by student if specified
    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    // Note: Week filtering is done client-side since week_number is calculated dynamically

    // Filter by severity if specified
    if (filters?.severity && filters.severity !== 'all') {
      query = query.eq('severity', filters.severity)
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('student_violations')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId || '')

    // Apply pagination and ordering
    const { data: violations, error } = await query
      .order('recorded_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    const totalPages = Math.ceil((totalCount || 0) / limit)

    return {
      success: true,
      data: violations || [],
      totalCount: totalCount || 0,
      totalPages,
      currentPage: page
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

// Helper functions for violation recording
export async function getClassBlocksAction(): Promise<{ success: boolean; data?: Array<{id: string; name: string; display_name: string}>; error?: string }> {
  try {
    const supabase = await createClient()

    const { data: classBlocks, error } = await supabase
      .from('class_blocks')
      .select('id, name, display_name')
      .eq('is_active', true)
      .order('display_name')

    if (error) {
      throw new Error(error.message)
    }

    // Filter out any items with empty IDs or names
    const filteredClassBlocks = (classBlocks || []).filter(block =>
      block?.id?.trim() !== '' &&
      block?.display_name?.trim() !== ''
    )

    return { success: true, data: filteredClassBlocks }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

export async function getClassesByBlockAction(classBlockId: string): Promise<{ success: boolean; data?: Array<{id: string; name: string; academic_year: {name: string}; semester: {name: string}}>; error?: string }> {
  try {
    const supabase = await createClient()

    // Simple approach: get classes with basic info
    const { data: classes, error } = await supabase
      .from('classes')
      .select('id, name, academic_year_id, semester_id')
      .eq('class_block_id', classBlockId)
      .order('name')

    if (error) {
      throw new Error(error.message)
    }

    if (!classes || classes.length === 0) {
      return { success: true, data: [] }
    }

    // Get current academic year and semester for display
    const { data: currentAcademicYear } = await supabase
      .from('academic_years')
      .select('name')
      .eq('is_current', true)
      .single()

    const { data: currentSemester } = await supabase
      .from('semesters')
      .select('name')
      .eq('is_current', true)
      .single()

    // Transform data with proper null safety
    const transformedClasses = classes
      .filter(cls => cls?.id && cls?.name)
      .map(cls => ({
        id: cls.id,
        name: cls.name,
        academic_year: {
          name: currentAcademicYear?.name || '2024-2025'
        },
        semester: {
          name: currentSemester?.name || 'Học kỳ 1'
        }
      }))

    return { success: true, data: transformedClasses }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

// Get violation statistics for admin dashboard
export async function getViolationStatsAction(): Promise<{
  success: boolean;
  data?: {
    totalViolations: number;
    thisWeekViolations: number;
    totalCategories: number;
    notificationsSent: number;
  };
  error?: string;
}> {
  try {
    const { supabase } = await checkAdminPermissions()

    // Get current date for week calculation
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay()) // Start of current week (Sunday)
    weekStart.setHours(0, 0, 0, 0)

    // Execute all queries in parallel for better performance
    const [
      totalViolationsResult,
      thisWeekViolationsResult,
      totalCategoriesResult,
      notificationsSentResult
    ] = await Promise.all([
      // Total violations
      supabase
        .from('student_violations')
        .select('id', { count: 'exact', head: true }),

      // This week violations
      supabase
        .from('student_violations')
        .select('id', { count: 'exact', head: true })
        .gte('recorded_at', weekStart.toISOString()),

      // Total active categories
      supabase
        .from('violation_categories')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),

      // Disciplinary cases created this month (as proxy for notifications)
      supabase
        .from('student_disciplinary_cases')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
    ])

    // Check for errors
    if (totalViolationsResult.error) throw new Error(totalViolationsResult.error.message)
    if (thisWeekViolationsResult.error) throw new Error(thisWeekViolationsResult.error.message)
    if (totalCategoriesResult.error) throw new Error(totalCategoriesResult.error.message)
    if (notificationsSentResult.error) throw new Error(notificationsSentResult.error.message)

    return {
      success: true,
      data: {
        totalViolations: totalViolationsResult.count || 0,
        thisWeekViolations: thisWeekViolationsResult.count || 0,
        totalCategories: totalCategoriesResult.count || 0,
        notificationsSent: notificationsSentResult.count || 0
      }
    }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

export async function getStudentsByClassAction(classId?: string): Promise<{ success: boolean; data?: Array<{id: string; full_name: string; student_id: string; email: string}>; error?: string }> {
  try {
    const supabase = await createClient()

    // Simple approach: get all students first, then filter by class if needed
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, student_id, email')
      .eq('role', 'student')

    if (studentsError) {
      throw new Error(studentsError.message)
    }

    if (!students || students.length === 0) {
      return { success: true, data: [] }
    }

    // If class filter is provided, get students in that class
    if (classId) {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('class_assignments')
        .select('user_id')
        .eq('class_id', classId)
        .eq('assignment_type', 'student')
        .eq('is_active', true)

      if (assignmentsError) {
        throw new Error(assignmentsError.message)
      }

      const studentIdsInClass = assignments?.map(a => a.user_id) || []

      const filteredStudents = students
        .filter(student =>
          studentIdsInClass.includes(student.id) &&
          student?.id?.trim() !== '' &&
          student?.full_name?.trim() !== '' &&
          student?.email?.trim() !== ''
        )
        .map(student => ({
          id: student.id,
          full_name: student.full_name,
          student_id: student.student_id || 'N/A',
          email: student.email
        }))

      return { success: true, data: filteredStudents }
    }

    // Return all students if no class filter
    const allStudents = students
      .filter(student =>
        student?.id?.trim() !== '' &&
        student?.full_name?.trim() !== '' &&
        student?.email?.trim() !== ''
      )
      .map(student => ({
        id: student.id,
        full_name: student.full_name,
        student_id: student.student_id || 'N/A',
        email: student.email
      }))

    return { success: true, data: allStudents }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn'
    }
  }
}


// ===== Các hành động nâng cao cho điểm/tuần/tháng và kỷ luật =====

// Tính tuần/tháng theo học kì
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function computeWeekMonthIndices(violationDateISO: string, semesterStartISO: string) {
  const v = new Date(violationDateISO)
  const s = new Date(semesterStartISO)
  const vUTC = Date.UTC(v.getFullYear(), v.getMonth(), v.getDate())
  const sUTC = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate())
  const diffDays = Math.floor((vUTC - sUTC) / (1000 * 60 * 60 * 24))
  const week_index = Math.max(1, Math.floor(diffDays / 7) + 1)
  const month_index = Math.floor((week_index - 1) / 4) + 1
  return { week_index, month_index }
}

// Gom nhóm vi phạm theo học sinh trong 1 tuần (mặc định phục vụ báo cáo tuần)
export async function getWeeklyGroupedViolationsAction(params: { semester_id: string; week_index: number; class_id?: string }) {
  try {
    const { supabase } = await checkAdminPermissions()

    let query = supabase
      .from('student_violations')
      .select(`
        id, student_id, class_id, violation_type_id, severity, points, description, violation_date,
        student:profiles!student_id(id, full_name, student_id),
        class:classes!class_id(id, name),
        violation_type:violation_types!violation_type_id(id, name)
      `)
      .eq('semester_id', params.semester_id)
      .eq('week_index', params.week_index)

    if (params.class_id) query = query.eq('class_id', params.class_id)

    // Chuyển kiểu an toàn cho dữ liệu trả về từ Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = (await query) as any
    type Row = { id: string; student_id: string; class_id: string; violation_type_id?: string; severity?: string; points: number; description: string | null; violation_date: string; student: { id: string; full_name: string; student_id: string } | null; class: { id: string; name: string } | null; violation_type?: { id: string; name: string } | null }
    if (error) throw new Error(error.message)

    // Group by student
    const map = new Map<string, { student: { id: string; full_name: string; student_id: string } | null; class: { id: string; name: string } | null; total_points: number; total_violations: number; violations: Array<{ id: string; name: string; points: number; date: string; description: string | null }> }>()
    for (const row of ((data || []) as unknown as Row[])) {
      const key = row.student_id
      if (!map.has(key)) {
        map.set(key, {
          student: row.student,
          class: row.class,
          total_points: 0,
          total_violations: 0,
          violations: [] as Array<{ id: string; name: string; points: number; date: string; description: string | null }>
        })
      }
      const agg = map.get(key)!
      agg.total_points += row.points || 0
      agg.total_violations += 1
      agg.violations.push({ id: row.id, name: row.violation_type?.name || '', points: row.points || 0, date: row.violation_date, description: row.description })
    }

    return { success: true, data: Array.from(map.values()) }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Xếp hạng theo "tháng học kì" (4 tuần) - Optimized with pagination
export async function getMonthlyRankingAction(params: {
  semester_id: string;
  month_index: number;
  class_id?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const { supabase } = await checkAdminPermissions()
    let query = supabase
      .from('student_violations')
      .select(`
        id, student_id, class_id, points,
        student:profiles!student_id(id, full_name, student_id),
        class:classes!class_id(id, name)
      `)
      .eq('semester_id', params.semester_id)
      .eq('month_index', params.month_index)
      .order('created_at', { ascending: false })

    if (params.class_id) query = query.eq('class_id', params.class_id)

    // Add pagination for performance
    if (params.limit) {
      query = query.limit(params.limit)
      if (params.offset) {
        query = query.range(params.offset, params.offset + params.limit - 1)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = (await query) as any
    if (error) throw new Error(error.message)

    // Get viewed status from monthly_violation_alerts
    const { data: alertsData } = await supabase
      .from('monthly_violation_alerts')
      .select('student_id, is_seen, seen_at')
      .eq('semester_id', params.semester_id)
      .eq('month_index', params.month_index)

    const viewedStatusMap = new Map<string, { is_seen: boolean; seen_at: string | null }>()
    for (const alert of (alertsData || [])) {
      viewedStatusMap.set(alert.student_id, {
        is_seen: alert.is_seen || false,
        seen_at: alert.seen_at
      })
    }

    const map = new Map<string, {
      student: { id: string; full_name: string; student_id: string } | null;
      class: { id: string; name: string } | null;
      total_points: number;
      total_violations: number;
      is_viewed: boolean;
      viewed_at: string | null;
    }>()

    for (const row of (data || [])) {
      const key = row.student_id
      if (!map.has(key)) {
        const viewedStatus = viewedStatusMap.get(key) || { is_seen: false, seen_at: null }
        map.set(key, {
          student: row.student,
          class: row.class,
          total_points: 0,
          total_violations: 0,
          is_viewed: viewedStatus.is_seen,
          viewed_at: viewedStatus.seen_at
        })
      }
      const agg = map.get(key)!
      agg.total_points += row.points || 0
      agg.total_violations += 1
    }

    const arr = Array.from(map.values())
    arr.sort((a, b) => {
      if (b.total_violations !== a.total_violations) return b.total_violations - a.total_violations
      if (b.total_points !== a.total_points) return b.total_points - a.total_points
      return (a.student?.full_name || '').localeCompare(b.student?.full_name || '')
    })

    return { success: true, data: arr }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Danh sách HS có >=3 vi phạm trong tháng chưa được admin đánh dấu đã xem
export async function getMonthlyThreePlusListAction(params: { semester_id: string; month_index: number }) {
  try {
    const { supabase } = await checkAdminPermissions()

    // Lấy alerts chưa xem từ bảng monthly_violation_alerts
    const { data, error } = await supabase
      .from('monthly_violation_alerts')
      .select(`
        student_id, total_violations,
        student:profiles!student_id(id, full_name, student_id)
      `)
      .eq('semester_id', params.semester_id)
      .eq('month_index', params.month_index)
      .eq('is_seen', false)
      .gte('total_violations', 3)

    if (error) throw new Error(error.message)

    const withDetails = (data || []).map(alert => ({
      count: alert.total_violations,
      student: alert.student || { id: alert.student_id, full_name: 'Không xác định', student_id: '' }
    }))

    return { success: true, data: withDetails, total: withDetails.length }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Lấy số lượng alerts chưa xem cho sidebar badge
export async function getUnseenViolationAlertsCountAction(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const { supabase } = await checkAdminPermissions()

    // Lấy học kì hiện tại
    const { data: currentSemester } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_current', true)
      .single()

    if (!currentSemester) {
      return { success: true, count: 0 }
    }

    // Đếm alerts chưa xem có >= 3 vi phạm
    const { count, error } = await supabase
      .from('monthly_violation_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('semester_id', currentSemester.id)
      .eq('is_seen', false)
      .gte('total_violations', 3)

    if (error) throw new Error(error.message)

    return { success: true, count: count || 0 }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Đánh dấu đã xem cho 1 học sinh trong tháng (badge giảm)
export async function markMonthlyAlertSeenAction(params: { student_id: string; semester_id: string; month_index: number }) {
  try {
    const { userId, supabase } = await checkAdminPermissions()

    // Update the correct table: monthly_violation_alerts
    const { error } = await supabase
      .from('monthly_violation_alerts')
      .update({
        is_seen: true,
        seen_by: userId,
        seen_at: new Date().toISOString()
      })
      .eq('student_id', params.student_id)
      .eq('semester_id', params.semester_id)
      .eq('month_index', params.month_index)

    if (error) throw new Error(error.message)
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Tạo case kỷ luật
export async function createDisciplinaryCaseAction(params: { student_id: string; class_id?: string; semester_id: string; week_index: number; action_type_id: string; notes?: string; violation_ids?: string[] }) {
  try {
    const { userId, supabase } = await checkAdminPermissions()

    let total_points = 0
    if (params.violation_ids && params.violation_ids.length > 0) {
      const { data: vio } = await supabase
        .from('student_violations')
        .select('points')
        .in('id', params.violation_ids)
      total_points = (vio || []).reduce((s, v) => s + (v.points || 0), 0)
    }

    const { data, error } = await supabase
      .from('student_disciplinary_cases')
      .insert({
        student_id: params.student_id,
        class_id: params.class_id,
        semester_id: params.semester_id,
        week_index: params.week_index,
        total_points,
        action_type_id: params.action_type_id,
        notes: params.notes,
        violation_ids: params.violation_ids || [],
        status: 'draft',
        created_by: userId
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Lấy danh sách hình thức kỷ luật
export async function getDisciplinaryActionTypesAction() {
  try {
    const { supabase } = await checkAdminPermissions()
    const { data, error } = await supabase
      .from('violation_types')
      .select('*')
      .eq('type_category', 'action')
      .eq('is_active', true)
      .order('type_name')

    if (error) throw new Error(error.message)
    return { success: true, data: data || [] }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Tạo hình thức kỷ luật mới
export async function createDisciplinaryActionTypeAction(params: { name: string; description?: string; severity_level?: number }) {
  try {
    const { supabase } = await checkAdminPermissions()
    const { data, error } = await supabase
      .from('violation_types')
      .insert({
        type_category: 'action',
        type_code: params.name.toLowerCase().replace(/\s+/g, '_'),
        type_name: params.name,
        description: params.description,
        severity_level: typeof params.severity_level === 'number' ? params.severity_level : 1,
        is_active: true
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Cập nhật hình thức kỷ luật
export async function updateDisciplinaryActionTypeAction(params: { id: string; name?: string; description?: string; severity_level?: number; is_active?: boolean }) {
  try {
    const { supabase } = await checkAdminPermissions()
    const updateData: Record<string, unknown> = {}
    if (typeof params.name === 'string') updateData.name = params.name
    if (typeof params.description === 'string') updateData.description = params.description
    if (typeof params.severity_level === 'number') updateData.severity_level = params.severity_level
    if (typeof params.is_active === 'boolean') updateData.is_active = params.is_active

    const { data, error } = await supabase
      .from('disciplinary_action_types')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Vô hiệu (soft-delete) hình thức kỷ luật
export async function deactivateDisciplinaryActionTypeAction(params: { id: string }) {
  try {
    const { supabase } = await checkAdminPermissions()
    const { data, error } = await supabase
      .from('violation_types')
      .update({ is_active: false })
      .eq('id', params.id)
      .eq('type_category', 'action')
      .select()
      .single()

    if (error) throw new Error(error.message)
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Lấy danh sách case kỷ luật
export async function getDisciplinaryCasesAction(params?: { semester_id?: string; status?: string; class_id?: string }) {
  try {
    const { supabase } = await checkAdminPermissions()
    let query = supabase
      .from('student_disciplinary_cases')
      .select(`
        id, student_id, class_id, semester_id, week_index, total_points, notes, status, created_at,
        student:profiles!student_id(id, full_name, student_id),
        class:classes!class_id(id, name),
        action_type:disciplinary_action_types!action_type_id(id, name)
      `)
      .order('created_at', { ascending: false })

    if (params?.semester_id) query = query.eq('semester_id', params.semester_id)
    if (params?.status) query = query.eq('status', params.status)
    if (params?.class_id) query = query.eq('class_id', params.class_id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = (await query) as any
    if (error) throw new Error(error.message)
    return { success: true, data: data || [] }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}

// Cập nhật trạng thái case kỷ luật
export async function updateDisciplinaryCaseStatusAction(params: { case_id: string; status: string }) {
  try {
    const { supabase } = await checkAdminPermissions()
    const { data, error } = await supabase
      .from('student_disciplinary_cases')
      .update({ status: params.status, updated_at: new Date().toISOString() })
      .eq('id', params.case_id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return { success: true, data }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' }
  }
}


