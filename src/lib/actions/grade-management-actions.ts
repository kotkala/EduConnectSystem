'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/shared/utils/supabase/server'
import { createAdminClient } from '@/shared/utils/supabase/admin'
import { checkAdminPermissions, checkTeacherPermissions } from '@/lib/utils/permission-utils'
import {
  gradeReportingPeriodSchema,
  updateGradeReportingPeriodSchema,
  type GradeReportingPeriodFormData,
  type UpdateGradeReportingPeriodFormData,
  type GradeFiltersFormData,
  type GradeReportingPeriod
} from '@/lib/validations/grade-management-validations'



// Helper function to check if period is active for imports
function canImportGrades(period: GradeReportingPeriod): boolean {
  const now = new Date()
  const startDate = new Date(period.start_date)
  const importDeadline = new Date(period.import_deadline)
  
  return now >= startDate && now <= importDeadline && period.is_active
}

// Helper function to check if period allows grade editing
function canEditGrades(period: GradeReportingPeriod): boolean {
  const now = new Date()
  const editDeadline = new Date(period.edit_deadline)
  
  return now <= editDeadline && period.is_active
}

// Create grade reporting period
export async function createGradeReportingPeriodAction(formData: GradeReportingPeriodFormData) {
  try {
    const { userId } = await checkAdminPermissions()
    const validatedData = gradeReportingPeriodSchema.parse(formData)
    
    const supabase = createAdminClient()

    // Check for overlapping periods in the same academic year and semester
    const { data: existingPeriods } = await supabase
      .from('grade_reporting_periods')
      .select('id, name, start_date, end_date')
      .eq('academic_year_id', validatedData.academic_year_id)
      .eq('semester_id', validatedData.semester_id)
      .eq('is_active', true)

    if (existingPeriods && existingPeriods.length > 0) {
      const hasOverlap = existingPeriods.some(period => {
        const existingStart = new Date(period.start_date)
        const existingEnd = new Date(period.end_date)
        const newStart = new Date(validatedData.start_date)
        const newEnd = new Date(validatedData.end_date)
        
        return (newStart <= existingEnd && newEnd >= existingStart)
      })

      if (hasOverlap) {
        return {
          success: false,
          error: "Kỳ báo cáo bị trùng thời gian với kỳ báo cáo khác trong cùng học kỳ"
        }
      }
    }

    const { data: period, error } = await supabase
      .from('grade_reporting_periods')
      .insert({
        ...validatedData,
        created_by: userId
      })
      .select(`
        *,
        academic_year:academic_years(name),
        semester:semesters(name),
        created_by_profile:profiles!created_by(full_name)
      `)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/grade-periods')
    return { 
      success: true, 
      data: period,
      message: "Tạo kỳ báo cáo điểm số thành công"
    }
  } catch (error) {
    console.error('Error creating grade reporting period:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể tạo kỳ báo cáo điểm số' 
    }
  }
}

// Get grade reporting periods with filters
export async function getGradeReportingPeriodsAction(filters?: Partial<GradeFiltersFormData>) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    let query = supabase
      .from('grade_reporting_periods')
      .select(`
        id,
        name,
        start_date,
        end_date,
        import_deadline,
        edit_deadline,
        is_active,
        academic_year:academic_years!inner(name),
        semester:semesters!inner(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters if provided
    if (filters?.period_id) {
      query = query.eq('id', filters.period_id)
    }

    // Apply pagination
    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const offset = (page - 1) * limit

    const { data: periods, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    return { 
      success: true, 
      data: periods || [],
      total: count || 0,
      page,
      limit
    }
  } catch (error) {
    console.error('Error fetching grade reporting periods:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể lấy danh sách kỳ báo cáo' 
    }
  }
}

// Get single grade reporting period
export async function getGradeReportingPeriodAction(id: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data: period, error } = await supabase
      .from('grade_reporting_periods')
      .select(`
        *,
        academic_year:academic_years(name),
        semester:semesters(name),
        created_by_profile:profiles!created_by(full_name)
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, data: period }
  } catch (error) {
    console.error('Error fetching grade reporting period:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể lấy thông tin kỳ báo cáo' 
    }
  }
}

// Update grade reporting period
export async function updateGradeReportingPeriodAction(formData: UpdateGradeReportingPeriodFormData) {
  try {
    await checkAdminPermissions()
    const validatedData = updateGradeReportingPeriodSchema.parse(formData)
    const { id, ...updateData } = validatedData
    
    const supabase = createAdminClient()

    // Check if period exists and get current data
    const { data: currentPeriod, error: fetchError } = await supabase
      .from('grade_reporting_periods')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (fetchError || !currentPeriod) {
      return {
        success: false,
        error: "Không tìm thấy kỳ báo cáo điểm số"
      }
    }

    // Check if there are existing grades in the NEW system that would be affected by deadline changes
    if (updateData.edit_deadline !== currentPeriod.edit_deadline) {
      const { data: existingGrades } = await supabase
        .from('individual_subject_grades')
        .select('id')
        .limit(1)

      if (existingGrades && existingGrades.length > 0) {
        const newDeadline = new Date(updateData.edit_deadline)
        const currentDeadline = new Date(currentPeriod.edit_deadline)
        
        if (newDeadline < currentDeadline) {
          return {
            success: false,
            error: "Không thể rút ngắn hạn chót sửa điểm khi đã có điểm số được nhập"
          }
        }
      }
    }

    const { data: period, error } = await supabase
      .from('grade_reporting_periods')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        academic_year:academic_years(name),
        semester:semesters(name),
        created_by_profile:profiles!created_by(full_name)
      `)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/grade-periods')
    return { 
      success: true, 
      data: period,
      message: "Cập nhật kỳ báo cáo điểm số thành công"
    }
  } catch (error) {
    console.error('Error updating grade reporting period:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể cập nhật kỳ báo cáo điểm số' 
    }
  }
}

// Delete (deactivate) grade reporting period
export async function deleteGradeReportingPeriodAction(id: string) {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check if there are existing grades in the NEW system
    const { data: existingGrades } = await supabase
      .from('individual_subject_grades')
      .select('id')
      .eq('submission_id', id)
      .limit(1)

    if (existingGrades && existingGrades.length > 0) {
      return {
        success: false,
        error: "Không thể xóa kỳ báo cáo đã có điểm số. Vui lòng vô hiệu hóa thay vì xóa."
      }
    }

    const { error } = await supabase
      .from('grade_reporting_periods')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/grade-periods')
    return { 
      success: true,
      message: "Xóa kỳ báo cáo điểm số thành công"
    }
  } catch (error) {
    console.error('Error deleting grade reporting period:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể xóa kỳ báo cáo điểm số' 
    }
  }
}

// Check if period allows operations
export async function checkPeriodPermissionsAction(periodId: string, operation: 'import' | 'edit') {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data: period, error } = await supabase
      .from('grade_reporting_periods')
      .select('*')
      .eq('id', periodId)
      .eq('is_active', true)
      .single()

    if (error || !period) {
      return {
        success: false,
        error: "Không tìm thấy kỳ báo cáo điểm số"
      }
    }

    const canPerformOperation = operation === 'import' 
      ? canImportGrades(period)
      : canEditGrades(period)

    if (!canPerformOperation) {
      const deadlineType = operation === 'import' ? 'nhập điểm' : 'sửa điểm'
      const deadline = operation === 'import' ? period.import_deadline : period.edit_deadline
      
      return {
        success: false,
        error: `Đã hết hạn ${deadlineType}. Hạn chót: ${new Date(deadline).toLocaleString('vi-VN')}`
      }
    }

    return { success: true, data: period }
  } catch (error) {
    console.error('Error checking period permissions:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Không thể kiểm tra quyền thao tác' 
    }
  }
}

// DEPRECATED: Old grade system functions removed - now using homeroom teacher grade submission system

// Get students for grade input with pagination (OPTIMIZED)
export async function getStudentsForGradeInputAction(options?: {
  page?: number
  limit?: number
  search?: string
  class_id?: string
}) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Optimized query using student_class_assignments to avoid over-fetching
    let query = supabase
      .from('student_class_assignments')
      .select(`
        student:profiles!student_class_assignments_student_id_fkey(
          id,
          full_name,
          student_id
        ),
        class:classes!student_class_assignments_class_id_fkey(
          id,
          name
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .in('assignment_type', ['main', 'homeroom'])
      .order('student(full_name)')

    // Apply class filter first (most selective)
    if (options?.class_id) {
      query = query.eq('class_id', options.class_id)
    }

    // Apply search filter on student data
    if (options?.search) {
      const searchTerm = options.search.trim()
      if (searchTerm) {
        query = query.or(`student.full_name.ilike.%${searchTerm}%,student.student_id.ilike.%${searchTerm}%`)
      }
    }

    // Apply pagination with reasonable limits
    const page = Math.max(options?.page || 1, 1)
    const limit = Math.min(Math.max(options?.limit || 20, 1), 50) // Max 50 per page for performance
    const offset = (page - 1) * limit

    const { data: assignments, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    // Transform the data to match expected format (OPTIMIZED)
    const students = assignments?.filter(assignment => {
      const student = Array.isArray(assignment.student) ? assignment.student[0] : assignment.student
      return student?.id && student?.full_name && student?.student_id
    }).map(assignment => {
      const student = Array.isArray(assignment.student) ? assignment.student[0] : assignment.student
      const classInfo = Array.isArray(assignment.class) ? assignment.class[0] : assignment.class
      return {
        id: student.id,
        full_name: student.full_name,
        student_id: student.student_id,
        class_id: classInfo?.id,
        class: classInfo
      }
    }) || []

    return {
      success: true,
      data: students,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  } catch (error) {
    console.error('Error getting students:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải danh sách học sinh'
    }
  }
}

// Get subjects for grade input (OPTIMIZED)
export async function getSubjectsForGradeInputAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Optimized query with only necessary fields
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select(`
        id,
        name_vietnamese,
        code
      `)
      .eq('is_active', true)
      .order('name_vietnamese')
      .limit(100) // Reasonable limit to prevent over-fetching

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: subjects || []
    }
  } catch (error) {
    console.error('Error getting subjects:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải danh sách môn học'
    }
  }
}

// Get grade reporting periods for teachers (no admin permission required)
export async function getGradeReportingPeriodsForTeachersAction(filters?: Partial<GradeFiltersFormData>) {
  try {
    await checkTeacherPermissions()
    const supabase = await createClient()

    let query = supabase
      .from('grade_reporting_periods')
      .select(`
        id,
        name,
        start_date,
        end_date,
        import_deadline,
        edit_deadline,
        is_active,
        academic_year:academic_years!inner(name),
        semester:semesters!inner(name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters if provided
    if (filters?.period_id) {
      query = query.eq('id', filters.period_id)
    }

    // Apply pagination
    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const offset = (page - 1) * limit

    const { data: periods, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: periods || [],
      total: count || 0,
      page,
      limit
    }
  } catch (error) {
    console.error('Error fetching grade reporting periods for teachers:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể lấy danh sách kỳ báo cáo'
    }
  }
}

// Get classes for grade input (OPTIMIZED)
export async function getClassesForGradeInputAction(academicYearId?: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Optimized query with academic year filtering
    let query = supabase
      .from('classes')
      .select(`
        id,
        name,
        academic_year_id,
        current_students
      `)
      .order('name')
      .limit(100) // Reasonable limit

    // Filter by academic year if provided
    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    const { data: classes, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: classes || []
    }
  } catch (error) {
    console.error('Error getting classes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải danh sách lớp học'
    }
  }
}

// DEPRECATED: Old grade system function removed - use homeroom teacher grade submission system instead

// DEPRECATED: Old grade system function removed - use homeroom teacher grade submission system instead

// DEPRECATED: Old grade system function removed - use homeroom teacher grade submission system instead

// DEPRECATED: Old grade system function removed - use homeroom teacher grade submission system instead

// Get all classes for dropdowns
export async function getClassesAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        academic_year_id,
        semester_id,
        current_students,
        max_students,
        academic_year:academic_years(name),
        semester:semesters(name)
      `)
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: classes || []
    }

  } catch (error) {
    console.error('Error fetching classes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải danh sách lớp học'
    }
  }
}

// Get all subjects for dropdowns
export async function getSubjectsAction() {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { data: subjects, error } = await supabase
      .from('subjects')
      .select(`
        id,
        code,
        name_vietnamese,
        name_english,
        category,
        is_active
      `)
      .eq('is_active', true)
      .order('name_vietnamese', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: subjects || []
    }

  } catch (error) {
    console.error('Error fetching subjects:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải danh sách môn học'
    }
  }
}


