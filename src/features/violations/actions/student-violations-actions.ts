'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminPermissions, checkHomeroomTeacherPermissions, checkParentPermissions } from './shared/violation-permissions'
import { 
  STUDENT_VIOLATION_WITH_DETAILS_FIELDS, 
  STUDENT_BASIC_FIELDS,
  CLASS_BLOCK_FIELDS,
  CLASS_WITH_ACADEMIC_INFO_FIELDS,
  buildPaginationParams 
} from './shared/violation-queries'
import {
  studentViolationSchema,
  bulkStudentViolationSchema,
  updateStudentViolationSchema,
  violationFiltersSchema,
  type StudentViolationFormData,
  type BulkStudentViolationFormData,
  type UpdateStudentViolationFormData,
  type ViolationFilters
} from '@/lib/validations/violation-validations'

// Simple type for violation data returned from Supabase
type ViolationData = {
  id: string
  violation_type_id: string
  student_id: string
  class_id: string
  points: number
  notes?: string
  violation_date: string
  created_at: string
  created_by: string
  violation_types?: {
    id: string
    name: string
    category_id: string
    severity: string
    points: number
    violation_categories?: Array<{ id: string; name: string; color: string }>
  }
  profiles?: Array<{ id: string; full_name: string; student_id: string; email: string }>
  classes?: Array<{ id: string; name: string }>
  created_by_profile?: Array<{ full_name: string }>
}

/**
 * Create a single student violation
 */
export async function createStudentViolationAction(data: StudentViolationFormData) {
  try {
    const { userId, supabase } = await checkAdminPermissions()
    const validatedData = studentViolationSchema.parse(data)

    // Get points from violation type if not provided
    let points = validatedData.points
    if (!points) {
      const { data: violationType } = await supabase
        .from('violation_types')
        .select('points')
        .eq('id', validatedData.violation_type_id)
        .single()
      
      points = violationType?.points || 0
    }

    const { data: violation, error } = await supabase
      .from('student_violations')
      .insert({
        ...validatedData,
        points,
        created_by: userId,
        created_at: new Date().toISOString()
      })
      .select(STUDENT_VIOLATION_WITH_DETAILS_FIELDS)
      .single()

    if (error) throw new Error('Không thể tạo vi phạm')

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: violation }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Create multiple student violations at once
 */
export async function createBulkStudentViolationsAction(data: BulkStudentViolationFormData) {
  try {
    const { userId, supabase } = await checkAdminPermissions()
    const validatedData = bulkStudentViolationSchema.parse(data)

    // Get points from violation type
    const { data: violationType } = await supabase
      .from('violation_types')
      .select('points')
      .eq('id', validatedData.violation_type_id)
      .single()

    const points = violationType?.points || 0

    // Create violations for all selected students
    const violations = validatedData.student_ids.map(studentId => ({
      violation_type_id: validatedData.violation_type_id,
      student_id: studentId,
      class_id: validatedData.class_id,
      points,
      notes: validatedData.description || '',
      violation_date: validatedData.violation_date,
      created_by: userId,
      created_at: new Date().toISOString()
    }))

    const { data: createdViolations, error } = await supabase
      .from('student_violations')
      .insert(violations)
      .select(STUDENT_VIOLATION_WITH_DETAILS_FIELDS)

    if (error) throw new Error('Không thể tạo vi phạm hàng loạt')

    revalidatePath('/dashboard/admin/violations')
    return { 
      success: true, 
      data: createdViolations,
      count: createdViolations?.length || 0
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Update a student violation
 */
export async function updateStudentViolationAction(data: UpdateStudentViolationFormData) {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedData = updateStudentViolationSchema.parse(data)
    const { id, ...updateFields } = validatedData

    const { data: violation, error } = await supabase
      .from('student_violations')
      .update({ ...updateFields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(STUDENT_VIOLATION_WITH_DETAILS_FIELDS)
      .single()

    if (error) throw new Error('Không thể cập nhật vi phạm')

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: violation }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get student violations with filters and pagination
 */
export async function getStudentViolationsAction(filters?: ViolationFilters): Promise<{
  success: boolean;
  data?: ViolationData[];
  total?: number;
  error?: string
}> {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedFilters = filters ? violationFiltersSchema.parse(filters) : { page: 1, limit: 10 }
    const { from, to } = buildPaginationParams(validatedFilters.page, validatedFilters.limit)

    let query = supabase
      .from('student_violations')
      .select(STUDENT_VIOLATION_WITH_DETAILS_FIELDS, { count: 'exact' })

    // Apply filters
    if (validatedFilters.student_id) {
      query = query.eq('student_id', validatedFilters.student_id)
    }
    if (validatedFilters.class_id) {
      query = query.eq('class_id', validatedFilters.class_id)
    }
    if (validatedFilters.severity && validatedFilters.severity !== 'all') {
      query = query.eq('violation_types.severity', validatedFilters.severity)
    }
    if (validatedFilters.date_from) {
      query = query.gte('violation_date', validatedFilters.date_from)
    }
    if (validatedFilters.date_to) {
      query = query.lte('violation_date', validatedFilters.date_to)
    }

    const { data: violations, error, count } = await query
      .order('violation_date', { ascending: false })
      .range(from, to)

    if (error) throw new Error('Không thể lấy danh sách vi phạm')

    return {
      success: true,
      data: (violations || []) as unknown as ViolationData[],
      total: count || 0
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get violations for homeroom teacher's class
 */
export async function getHomeroomViolationsAction(): Promise<{
  success: boolean;
  data?: ViolationData[];
  error?: string
}> {
  try {
    const { homeroomClass, supabase } = await checkHomeroomTeacherPermissions()

    const classId = (homeroomClass as unknown as { id: string })?.id

    const { data: violations, error } = await supabase
      .from('student_violations')
      .select(STUDENT_VIOLATION_WITH_DETAILS_FIELDS)
      .eq('class_id', classId)
      .order('violation_date', { ascending: false })
      .limit(50)

    if (error) throw new Error('Không thể lấy danh sách vi phạm lớp chủ nhiệm')

    return { success: true, data: (violations || []) as unknown as ViolationData[] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get violations for parent's children
 */
export async function getParentViolationsAction(
  studentId?: string,
  filters?: {
    week?: number
    severity?: string
    page?: number
    limit?: number
  }
): Promise<{
  success: boolean;
  data?: ViolationData[];
  total?: number;
  error?: string;
}> {
  try {
    const { userId, supabase } = await checkParentPermissions()
    const { page = 1, limit = 10, week, severity } = filters || {}
    const { from, to } = buildPaginationParams(page, limit)

    // Get parent's children if studentId not provided
    let targetStudentIds: string[] = []
    
    if (studentId) {
      // Verify parent has access to this student
      const { data: relationship } = await supabase
        .from('parent_student_relationships')
        .select('student_id')
        .eq('parent_id', userId)
        .eq('student_id', studentId)
        .single()
      
      if (!relationship) {
        throw new Error('Không có quyền truy cập thông tin học sinh này')
      }
      targetStudentIds = [studentId]
    } else {
      // Get all children
      const { data: relationships } = await supabase
        .from('parent_student_relationships')
        .select('student_id')
        .eq('parent_id', userId)
      
      targetStudentIds = relationships?.map(r => r.student_id) || []
    }

    if (targetStudentIds.length === 0) {
      return { success: true, data: [], total: 0 }
    }

    let query = supabase
      .from('student_violations')
      .select(STUDENT_VIOLATION_WITH_DETAILS_FIELDS, { count: 'exact' })
      .in('student_id', targetStudentIds)

    // Apply filters
    if (severity) {
      query = query.eq('violation_types.severity', severity)
    }
    
    if (week) {
      // Calculate week date range (simplified)
      const now = new Date()
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() - (week - 1) * 7))
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      
      query = query
        .gte('violation_date', startOfWeek.toISOString().split('T')[0])
        .lte('violation_date', endOfWeek.toISOString().split('T')[0])
    }

    const { data: violations, error, count } = await query
      .order('violation_date', { ascending: false })
      .range(from, to)

    if (error) throw new Error('Không thể lấy danh sách vi phạm')

    return {
      success: true,
      data: (violations || []) as unknown as ViolationData[],
      total: count || 0
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }
  }
}

/**
 * Get class blocks for violation recording
 */
export async function getClassBlocksAction(): Promise<{
  success: boolean;
  data?: Array<{id: string; name: string; display_name: string}>;
  error?: string
}> {
  try {
    const { supabase } = await checkAdminPermissions()

    const { data: classBlocks, error } = await supabase
      .from('class_blocks')
      .select(CLASS_BLOCK_FIELDS)
      .eq('is_active', true)
      .order('name')

    if (error) throw new Error('Không thể lấy danh sách khối lớp')

    return { success: true, data: classBlocks || [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }
  }
}

/**
 * Get classes by block for violation recording
 */
export async function getClassesByBlockAction(classBlockId: string): Promise<{
  success: boolean;
  data?: Array<{id: string; name: string; academic_year: {name: string}; semester: {name: string}}>;
  error?: string
}> {
  try {
    const { supabase } = await checkAdminPermissions()

    const { data: classes, error } = await supabase
      .from('classes')
      .select(CLASS_WITH_ACADEMIC_INFO_FIELDS)
      .eq('class_block_id', classBlockId)
      .eq('academic_years.is_current', true)
      .eq('semesters.is_current', true)
      .order('name')

    if (error) throw new Error('Không thể lấy danh sách lớp')

    return { success: true, data: (classes || []) as unknown as Array<{id: string; name: string; academic_year: {name: string}; semester: {name: string}}> }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }
  }
}

/**
 * Get students by class for violation recording
 */
export async function getStudentsByClassAction(classId?: string): Promise<{
  success: boolean;
  data?: Array<{id: string; full_name: string; student_id: string; email: string}>;
  error?: string
}> {
  try {
    const { supabase } = await checkAdminPermissions()

    let query = supabase
      .from('profiles')
      .select(STUDENT_BASIC_FIELDS)
      .eq('role', 'student')
      .order('full_name')

    if (classId) {
      // Get students in specific class through student_class_assignments_view
      const { data: classAssignments } = await supabase
        .from('student_class_assignments_view')
        .select('student_id')
        .eq('class_id', classId)

      const studentIds = classAssignments?.map(ca => ca.student_id) || []
      if (studentIds.length === 0) {
        return { success: true, data: [] }
      }

      query = query.in('id', studentIds)
    }

    const { data: students, error } = await query

    if (error) throw new Error('Không thể lấy danh sách học sinh')

    return { success: true, data: students || [] }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }
  }
}
