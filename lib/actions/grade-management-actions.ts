'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { checkAdminPermissions } from '@/lib/utils/permission-utils'
import { serverAuth } from '@/lib/auth-server'
import {
  gradeReportingPeriodSchema,
  updateGradeReportingPeriodSchema,
  type GradeReportingPeriodFormData,
  type UpdateGradeReportingPeriodFormData,
  type GradeFiltersFormData,
  type GradeReportingPeriod
} from '@/lib/validations/grade-management-validations'
import { sendGradeNotificationAction } from '@/lib/actions/notification-actions'

// Helper function to check if current time is within deadline
function isWithinDeadline(deadline: string): boolean {
  return new Date() <= new Date(deadline)
}

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

    revalidatePath('/dashboard/admin/grade-management')
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

    // Check if there are existing grades that would be affected by deadline changes
    if (updateData.edit_deadline !== currentPeriod.edit_deadline) {
      const { data: existingGrades } = await supabase
        .from('student_grades')
        .select('id')
        .eq('period_id', id)
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

    revalidatePath('/dashboard/admin/grade-management')
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

    revalidatePath('/dashboard/admin/grade-management')
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    // Check if user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      throw new Error('Teacher permissions required')
    }

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

// Create new student grade
export async function createStudentGradeAction(gradeData: {
  period_id: string
  student_id: string
  subject_id: string
  class_id: string
  grade_value: number
  grade_type: string
  notes?: string
}) {
  try {
    const { userId } = await checkAdminPermissions()
    const supabase = createAdminClient()

    // Validate grade data
    const validatedData = {
      period_id: gradeData.period_id,
      student_id: gradeData.student_id,
      subject_id: gradeData.subject_id,
      class_id: gradeData.class_id,
      grade_value: gradeData.grade_value,
      grade_type: gradeData.grade_type,
      notes: gradeData.notes || null,
      created_by: userId
    }

    // Check if grade already exists for this combination
    const { data: existingGrade } = await supabase
      .from('student_grades')
      .select('id')
      .eq('period_id', validatedData.period_id)
      .eq('student_id', validatedData.student_id)
      .eq('subject_id', validatedData.subject_id)
      .eq('grade_type', validatedData.grade_type)
      .single()

    if (existingGrade) {
      return {
        success: false,
        error: 'Điểm số cho học sinh này đã tồn tại với loại điểm này'
      }
    }

    const { data: grade, error } = await supabase
      .from('student_grades')
      .insert(validatedData)
      .select(`
        id,
        period_id,
        student_id,
        subject_id,
        class_id,
        grade_value,
        grade_type,
        notes,
        is_locked,
        created_by,
        created_at,
        updated_at,
        student:profiles!student_grades_student_id_fkey!inner(
          full_name,
          student_id
        ),
        subject:subjects!student_grades_subject_id_fkey!inner(
          name_vietnamese,
          code
        ),
        class:classes!student_grades_class_id_fkey!inner(
          name
        ),
        created_by_profile:profiles!student_grades_created_by_fkey!inner(
          full_name
        )
      `)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Send notification to parent
    try {
      await sendGradeNotificationAction(grade.id, 'grade_added')
    } catch (notificationError) {
      console.warn('Failed to send grade notification:', notificationError)
      // Don't fail the grade creation if notification fails
    }

    revalidateGradeManagement()
    return {
      success: true,
      data: grade,
      message: 'Đã tạo điểm số thành công'
    }
  } catch (error) {
    console.error('Error creating student grade:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tạo điểm số'
    }
  }
}

// Update student grade action
export async function updateStudentGradeAction(formData: {
  grade_id: string
  new_value: number
  change_reason: string
}) {
  try {
    await checkAdminPermissions()

    const supabase = createAdminClient()
    const user = await serverAuth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Không thể xác thực người dùng'
      }
    }

    // Validate grade value
    if (formData.new_value < 0 || formData.new_value > 10) {
      return {
        success: false,
        error: 'Điểm số phải từ 0 đến 10'
      }
    }

    // Get current grade and check permissions
    const { data: currentGrade, error: fetchError } = await supabase
      .from('student_grades')
      .select(`
        *,
        period:grade_reporting_periods!student_grades_period_id_fkey!inner(
          edit_deadline, is_active
        )
      `)
      .eq('id', formData.grade_id)
      .single()

    if (fetchError || !currentGrade) {
      return {
        success: false,
        error: 'Không tìm thấy điểm số'
      }
    }

    // Check if period allows editing
    if (!currentGrade.period.is_active || !isWithinDeadline(currentGrade.period.edit_deadline)) {
      return {
        success: false,
        error: 'Đã hết hạn sửa điểm cho kỳ báo cáo này'
      }
    }

    // Check if grade is locked
    if (currentGrade.is_locked) {
      return {
        success: false,
        error: 'Điểm số này đã bị khóa và không thể sửa'
      }
    }

    // Update the grade
    const { data: updatedGrade, error: updateError } = await supabase
      .from('student_grades')
      .update({
        grade_value: Math.round(formData.new_value * 10) / 10, // Round to 1 decimal
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('id', formData.grade_id)
      .select()
      .single()

    if (updateError) {
      return {
        success: false,
        error: 'Không thể cập nhật điểm số'
      }
    }

    // Create audit log entry
    await supabase
      .from('grade_audit_logs')
      .insert({
        grade_id: formData.grade_id,
        old_value: currentGrade.grade_value,
        new_value: formData.new_value,
        change_reason: formData.change_reason,
        changed_by: user.id,
        changed_at: new Date().toISOString()
      })

    // Send notification to parent about grade update
    try {
      await sendGradeNotificationAction(formData.grade_id, 'grade_updated')
    } catch (notificationError) {
      console.warn('Failed to send grade update notification:', notificationError)
      // Don't fail the grade update if notification fails
    }

    revalidateGradeManagement()

    return {
      success: true,
      message: 'Đã cập nhật điểm số thành công',
      data: updatedGrade
    }

  } catch (error) {
    console.error('Error updating grade:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể cập nhật điểm số'
    }
  }
}

// Bulk import grades from Excel
export async function bulkImportGradesAction(importData: {
  period_id: string
  class_id: string
  subject_id: string
  grade_type: string
  grades: Array<{
    student_id: string
    student_code: string
    student_name: string
    grade_value: number
    notes?: string
  }>
}) {
  try {
    const { userId } = await checkAdminPermissions()
    const supabase = createAdminClient()

    // Validate period permissions
    const periodCheck = await checkPeriodPermissionsAction(importData.period_id, 'import')
    if (!periodCheck.success) {
      return periodCheck
    }

    // Resolve student IDs from student codes in batches
    const studentCodes = [...new Set(importData.grades.map(g => g.student_code))] // Remove duplicates
    const batchSize = 100 // Process in batches to avoid query limits
    const studentMap = new Map<string, string>()

    for (let i = 0; i < studentCodes.length; i += batchSize) {
      const batch = studentCodes.slice(i, i + batchSize)
      const { data: students, error: studentError } = await supabase
        .from('profiles')
        .select('id, student_id')
        .in('student_id', batch)
        .eq('role', 'student')

      if (studentError) {
        throw new Error(`Không thể tìm thấy học sinh: ${studentError.message}`)
      }

      // Add to map
      students?.forEach(s => studentMap.set(s.student_id, s.id))
    }

    // Prepare grade records for insertion
    const gradeRecords = importData.grades
      .map(grade => {
        const studentId = studentMap.get(grade.student_code)
        if (!studentId) {
          console.warn(`Không tìm thấy học sinh với mã: ${grade.student_code}`)
          return null
        }

        return {
          period_id: importData.period_id,
          student_id: studentId,
          subject_id: importData.subject_id,
          class_id: importData.class_id,
          grade_value: Math.round(grade.grade_value * 10) / 10, // Round to 1 decimal
          grade_type: importData.grade_type,
          notes: grade.notes || null,
          created_by: userId,
          is_locked: false
        }
      })
      .filter(Boolean) // Remove null entries

    // Insert grades in batch
    const { data: insertedGrades, error } = await supabase
      .from('student_grades')
      .insert(gradeRecords)
      .select(`
        id,
        period_id,
        student_id,
        subject_id,
        class_id,
        grade_value,
        grade_type,
        notes,
        is_locked,
        created_by,
        created_at,
        updated_at
      `)

    if (error) {
      throw new Error(error.message)
    }

    // Send notifications to parents for all imported grades
    if (insertedGrades && insertedGrades.length > 0) {
      try {
        // Send notifications in parallel but don't wait for all to complete
        const notificationPromises = insertedGrades.map(grade =>
          sendGradeNotificationAction(grade.id, 'grade_added').catch(error => {
            console.warn(`Failed to send notification for grade ${grade.id}:`, error)
          })
        )

        // Fire and forget - don't wait for notifications to complete
        Promise.allSettled(notificationPromises)
      } catch (notificationError) {
        console.warn('Failed to send bulk grade notifications:', notificationError)
      }
    }

    revalidateGradeManagement()

    return {
      success: true,
      data: insertedGrades,
      message: `Đã nhập thành công ${insertedGrades?.length || 0} điểm số`
    }

  } catch (error) {
    console.error('Error bulk importing grades:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể nhập điểm số'
    }
  }
}

// Get audit logs for grade changes
export async function getGradeAuditLogsAction(filters?: {
  period_id?: string
  student_search?: string
  subject_id?: string
  class_id?: string
  changed_by?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    let query = supabase
      .from('grade_audit_logs')
      .select(`
        id,
        grade_id,
        old_value,
        new_value,
        change_reason,
        changed_by,
        changed_at,
        changed_by_profile:profiles!changed_by!inner(full_name),
        grade:student_grades!grade_id!inner(
          id,
          period_id,
          student_id,
          subject_id,
          class_id,
          grade_value,
          grade_type,
          is_locked,
          created_by,
          created_at,
          updated_at,
          student:profiles!student_id(
            full_name,
            student_id
          ),
          subject:subjects!subject_id(
            name_vietnamese,
            code
          ),
          class:classes!class_id(
            name
          )
        )
      `, { count: 'exact' })
      .order('changed_at', { ascending: false })

    // Apply filters
    if (filters?.period_id) {
      query = query.eq('grade.period_id', filters.period_id)
    }

    if (filters?.class_id) {
      query = query.eq('grade.class_id', filters.class_id)
    }

    if (filters?.subject_id) {
      query = query.eq('grade.subject_id', filters.subject_id)
    }

    if (filters?.changed_by) {
      query = query.eq('changed_by', filters.changed_by)
    }

    if (filters?.date_from) {
      query = query.gte('changed_at', filters.date_from)
    }

    if (filters?.date_to) {
      query = query.lte('changed_at', filters.date_to)
    }

    if (filters?.student_search) {
      query = query.ilike('grade.student.full_name', `%${filters.student_search}%`)
    }

    // Apply pagination
    const page = filters?.page || 1
    const limit = filters?.limit || 20
    const offset = (page - 1) * limit

    const { data: auditLogs, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: auditLogs || [],
      total: count || 0,
      page,
      limit
    }

  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải lịch sử thay đổi điểm'
    }
  }
}

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

// Revalidate grade management pages
function revalidateGradeManagement() {
  revalidatePath('/dashboard/admin/grade-management')
  revalidatePath('/dashboard/teacher/grade-reports')
  revalidatePath('/dashboard/parent/grades')
}
