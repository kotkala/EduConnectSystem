'use server'

import { createClient } from '@/utils/supabase/server'
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
    throw new Error("Authentication required")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error("Admin access required")
  }

  return { userId: user.id, supabase }
}

// Helper function to check teacher permissions (homeroom teacher)
async function checkHomeroomTeacherPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("Authentication required")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    throw new Error("Teacher access required")
  }

  // Check if teacher is a homeroom teacher
  const { data: homeroomClass } = await supabase
    .from('classes')
    .select('id, name')
    .eq('homeroom_teacher_id', user.id)
    .eq('is_active', true)
    .single()

  if (!homeroomClass) {
    throw new Error("Homeroom teacher access required")
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
      error: error instanceof Error ? error.message : 'An error occurred' 
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
      error: error instanceof Error ? error.message : 'An error occurred' 
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
      error: error instanceof Error ? error.message : 'An error occurred'
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
        default_severity: validatedData.default_severity
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
      error: error instanceof Error ? error.message : 'An error occurred' 
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
      error: error instanceof Error ? error.message : 'An error occurred' 
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
      error: error instanceof Error ? error.message : 'An error occurred'
    }
  }
}

// Student Violations Actions
export async function createStudentViolationAction(data: StudentViolationFormData) {
  try {
    const { userId, supabase } = await checkAdminPermissions()
    const validatedData = studentViolationSchema.parse(data)

    const { data: violation, error } = await supabase
      .from('student_violations')
      .insert({
        student_id: validatedData.student_id,
        class_id: validatedData.class_id,
        violation_type_id: validatedData.violation_type_id,
        severity: validatedData.severity,
        description: validatedData.description,
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
      error: error instanceof Error ? error.message : 'An error occurred' 
    }
  }
}

export async function createBulkStudentViolationsAction(data: BulkStudentViolationFormData) {
  try {
    const { userId, supabase } = await checkAdminPermissions()
    const validatedData = bulkStudentViolationSchema.parse(data)

    const violations = validatedData.student_ids.map(studentId => ({
      student_id: studentId,
      class_id: validatedData.class_id,
      violation_type_id: validatedData.violation_type_id,
      severity: validatedData.severity,
      description: validatedData.description,
      violation_date: validatedData.violation_date,
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
      error: error instanceof Error ? error.message : 'An error occurred'
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
      error: error instanceof Error ? error.message : 'An error occurred'
    }
  }
}

export async function getStudentViolationsAction(filters?: ViolationFilters): Promise<{ success: boolean; data?: StudentViolationWithDetails[]; total?: number; error?: string }> {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedFilters = filters ? violationFiltersSchema.parse(filters) : { page: 1, limit: 10 }

    // Simple count query first
    let countQuery = supabase
      .from('student_violations')
      .select('*', { count: 'exact', head: true })

    // Apply same filters to count
    if (validatedFilters.search) {
      countQuery = countQuery.ilike('description', `%${validatedFilters.search}%`)
    }
    if (validatedFilters.student_id) {
      countQuery = countQuery.eq('student_id', validatedFilters.student_id)
    }
    if (validatedFilters.class_id) {
      countQuery = countQuery.eq('class_id', validatedFilters.class_id)
    }
    if (validatedFilters.severity && validatedFilters.severity !== 'all') {
      countQuery = countQuery.eq('severity', validatedFilters.severity)
    }
    if (validatedFilters.date_from) {
      countQuery = countQuery.gte('recorded_at', validatedFilters.date_from)
    }
    if (validatedFilters.date_to) {
      countQuery = countQuery.lte('recorded_at', validatedFilters.date_to)
    }

    // Handle category filter for count
    if (validatedFilters.category_id && validatedFilters.category_id !== 'all') {
      const { data: violationTypes } = await supabase
        .from('violation_types')
        .select('id')
        .eq('category_id', validatedFilters.category_id)

      if (violationTypes && violationTypes.length > 0) {
        const typeIds = violationTypes.map(vt => vt.id)
        countQuery = countQuery.in('violation_type_id', typeIds)
      } else {
        return { success: true, data: [], total: 0 }
      }
    }

    const { count, error: countError } = await countQuery
    if (countError) {
      throw new Error(countError.message)
    }

    // Simple data query with basic joins
    let dataQuery = supabase
      .from('student_violations')
      .select(`
        *,
        student:profiles!student_id(id, full_name, email, student_id),
        class:classes!class_id(id, name),
        violation_type:violation_types!violation_type_id(id, name, category_id),
        recorded_by:profiles!recorded_by(id, full_name)
      `)

    // Apply same filters to data query
    if (validatedFilters.search) {
      dataQuery = dataQuery.ilike('description', `%${validatedFilters.search}%`)
    }
    if (validatedFilters.student_id) {
      dataQuery = dataQuery.eq('student_id', validatedFilters.student_id)
    }
    if (validatedFilters.class_id) {
      dataQuery = dataQuery.eq('class_id', validatedFilters.class_id)
    }
    if (validatedFilters.severity && validatedFilters.severity !== 'all') {
      dataQuery = dataQuery.eq('severity', validatedFilters.severity)
    }
    if (validatedFilters.date_from) {
      dataQuery = dataQuery.gte('recorded_at', validatedFilters.date_from)
    }
    if (validatedFilters.date_to) {
      dataQuery = dataQuery.lte('recorded_at', validatedFilters.date_to)
    }

    // Handle category filter for data
    if (validatedFilters.category_id && validatedFilters.category_id !== 'all') {
      const { data: violationTypes } = await supabase
        .from('violation_types')
        .select('id')
        .eq('category_id', validatedFilters.category_id)

      if (violationTypes && violationTypes.length > 0) {
        const typeIds = violationTypes.map(vt => vt.id)
        dataQuery = dataQuery.in('violation_type_id', typeIds)
      } else {
        return { success: true, data: [], total: 0 }
      }
    }

    // Apply pagination and ordering
    const offset = (validatedFilters.page - 1) * validatedFilters.limit
    dataQuery = dataQuery
      .order('recorded_at', { ascending: false })
      .range(offset, offset + validatedFilters.limit - 1)

    const { data: violations, error: dataError } = await dataQuery
    if (dataError) {
      throw new Error(dataError.message)
    }

    // Get category names for violation types
    if (violations && violations.length > 0) {
      const categoryIds = [...new Set(violations
        .map(v => v.violation_type?.category_id)
        .filter(Boolean))]

      if (categoryIds.length > 0) {
        const { data: categories } = await supabase
          .from('violation_categories')
          .select('id, name')
          .in('id', categoryIds)

        const categoriesMap = new Map(categories?.map(c => [c.id, c]) || [])
        violations.forEach(violation => {
          if (violation.violation_type?.category_id) {
            violation.violation_type.category = categoriesMap.get(violation.violation_type.category_id)
          }
        })
      }
    }

    return { success: true, data: violations || [], total: count || 0 }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred'
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
      throw new Error('Authentication required')
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
      error: error instanceof Error ? error.message : 'An error occurred'
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
      error: error instanceof Error ? error.message : 'An error occurred'
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
      error: error instanceof Error ? error.message : 'An error occurred'
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
      throw new Error("Authentication required")
    }

    // Set default pagination values
    const page = filters?.page || 1
    const limit = filters?.limit || 10
    const offset = (page - 1) * limit

    let query = supabase
      .from('student_violations')
      .select(`
        *,
        student:profiles!student_violations_student_id_fkey(id, full_name, email, student_id),
        class:classes(id, name),
        violation_type:violation_types(
          id,
          name,
          category:violation_categories(id, name)
        ),
        recorded_by:profiles!student_violations_recorded_by_fkey(id, full_name),
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
      error: error instanceof Error ? error.message : 'An error occurred'
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
      block &&
      block.id &&
      block.id.trim() !== '' &&
      block.display_name &&
      block.display_name.trim() !== ''
    )

    return { success: true, data: filteredClassBlocks }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred'
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
      .filter(cls => cls && cls.id && cls.name)
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
      error: error instanceof Error ? error.message : 'An error occurred'
    }
  }
}

export async function getStudentsByClassAction(classId?: string): Promise<{ success: boolean; data?: Array<{id: string; full_name: string; student_id: string; email: string}>; error?: string }> {
  try {
    const supabase = await createClient()

    // Simple approach: get all students first, then filter by class if needed
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
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
        .from('student_class_assignments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('is_active', true)

      if (assignmentsError) {
        throw new Error(assignmentsError.message)
      }

      const studentIdsInClass = assignments?.map(a => a.student_id) || []

      const filteredStudents = students
        .filter(student =>
          studentIdsInClass.includes(student.id) &&
          student &&
          student.id &&
          student.id.trim() !== '' &&
          student.full_name &&
          student.full_name.trim() !== '' &&
          student.email &&
          student.email.trim() !== ''
        )
        .map(student => ({
          id: student.id,
          full_name: student.full_name,
          student_id: student.email || 'N/A',
          email: student.email
        }))

      return { success: true, data: filteredStudents }
    }

    // Return all students if no class filter
    const allStudents = students
      .filter(student =>
        student &&
        student.id &&
        student.id.trim() !== '' &&
        student.full_name &&
        student.full_name.trim() !== '' &&
        student.email &&
        student.email.trim() !== ''
      )
      .map(student => ({
        id: student.id,
        full_name: student.full_name,
        student_id: student.email || 'N/A',
        email: student.email
      }))

    return { success: true, data: allStudents }
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred'
    }
  }
}
