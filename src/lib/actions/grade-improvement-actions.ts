'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/shared/utils/supabase/admin'
import { checkAdminPermissions, checkStudentPermissions } from '@/lib/utils/permission-utils'
import {
  gradeImprovementPeriodSchema,
  gradeImprovementRequestSchema,
  gradeImprovementResponseSchema,
  gradeImprovementRequestFiltersSchema,
  type GradeImprovementPeriodFormData,
  type GradeImprovementRequestFormData,
  type GradeImprovementResponseFormData,
  type GradeImprovementRequestFilters,
  type GradeImprovementPeriod,
  type GradeImprovementRequest
} from '@/lib/validations/grade-improvement-validations'


// ADMIN FUNCTIONS

// Create grade improvement period
export async function createGradeImprovementPeriodAction(formData: GradeImprovementPeriodFormData) {
  try {
    const { userId } = await checkAdminPermissions()
    const validatedData = gradeImprovementPeriodSchema.parse(formData)
    const supabase = createAdminClient()

    // Check if the end date is before the grade reporting period end date
    const { data: gradeReportingPeriod, error: periodError } = await supabase
      .from('grade_reporting_periods')
      .select('end_date')
      .eq('id', validatedData.grade_reporting_period_id)
      .single()

    if (periodError) {
      throw new Error('Không tìm thấy kỳ báo cáo điểm')
    }

    const improvementEndDate = new Date(validatedData.end_date)
    const reportingEndDate = new Date(gradeReportingPeriod.end_date)

    if (improvementEndDate >= reportingEndDate) {
      throw new Error('Thời gian kết thúc nhận đơn phải nhỏ hơn thời gian kết thúc kỳ báo cáo điểm')
    }

    // Check for overlapping periods
    const { data: existingPeriods, error: overlapError } = await supabase
      .from('grade_improvement_periods')
      .select('id, name, start_date, end_date')
      .eq('grade_reporting_period_id', validatedData.grade_reporting_period_id)
      .eq('is_active', true)

    if (overlapError) {
      throw new Error('Lỗi khi kiểm tra kỳ cải thiện điểm hiện có')
    }

    const newStartDate = new Date(validatedData.start_date)
    const newEndDate = new Date(validatedData.end_date)

    const hasOverlap = existingPeriods?.some(period => {
      const existingStart = new Date(period.start_date)
      const existingEnd = new Date(period.end_date)
      return (newStartDate <= existingEnd && newEndDate >= existingStart)
    })

    if (hasOverlap) {
      throw new Error('Khoảng thời gian bị trùng lặp với kỳ cải thiện điểm khác')
    }

    const { data: period, error } = await supabase
      .from('grade_improvement_periods')
      .insert({
        ...validatedData,
        created_by: userId
      })
      .select(`
        *,
        grade_reporting_period:grade_reporting_periods!grade_improvement_periods_grade_reporting_period_id_fkey(
          id,
          name,
          start_date,
          end_date
        ),
        created_by_profile:profiles!grade_improvement_periods_created_by_fkey(
          full_name
        )
      `)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/grade-improvement')
    
    return {
      success: true,
      data: period as GradeImprovementPeriod,
      message: 'Tạo kỳ cải thiện điểm thành công'
    }
  } catch (error) {
    console.error('createGradeImprovementPeriodAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tạo kỳ cải thiện điểm'
    }
  }
}

// Get grade improvement periods
export async function getGradeImprovementPeriodsAction() {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    const { data: periods, error } = await supabase
      .from('grade_improvement_periods')
      .select(`
        *,
        grade_reporting_period:grade_reporting_periods!grade_improvement_periods_grade_reporting_period_id_fkey(
          id,
          name,
          start_date,
          end_date
        ),
        created_by_profile:profiles!grade_improvement_periods_created_by_fkey(
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: periods as GradeImprovementPeriod[]
    }
  } catch (error) {
    console.error('getGradeImprovementPeriodsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải danh sách kỳ cải thiện điểm'
    }
  }
}

// Update grade improvement period status
export async function updateGradeImprovementPeriodAction(periodId: string, isActive: boolean) {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    const { data: period, error } = await supabase
      .from('grade_improvement_periods')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', periodId)
      .select(`
        *,
        grade_reporting_period:grade_reporting_periods!grade_improvement_periods_grade_reporting_period_id_fkey(
          id,
          name,
          start_date,
          end_date
        ),
        created_by_profile:profiles!grade_improvement_periods_created_by_fkey(
          full_name
        )
      `)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/grade-improvement')

    return {
      success: true,
      data: period as GradeImprovementPeriod,
      message: `Đã ${isActive ? 'mở' : 'đóng'} kỳ cải thiện điểm`
    }
  } catch (error) {
    console.error('updateGradeImprovementPeriodAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể cập nhật trạng thái kỳ cải thiện điểm'
    }
  }
}

// Get grade improvement requests with filters
export async function getGradeImprovementRequestsAction(filters: GradeImprovementRequestFilters) {
  try {
    await checkAdminPermissions()
    const validatedFilters = gradeImprovementRequestFiltersSchema.parse(filters)
    const supabase = createAdminClient()

    let query = supabase
      .from('grade_improvement_requests')
      .select(`
        *,
        improvement_period:grade_improvement_periods!grade_improvement_requests_improvement_period_id_fkey(
          id,
          name,
          start_date,
          end_date
        ),
        student:profiles!grade_improvement_requests_student_id_fkey(
          id,
          full_name,
          student_id
        ),
        subject:subjects!grade_improvement_requests_subject_id_fkey(
          id,
          name_vietnamese,
          code
        ),
        reviewed_by_profile:profiles!grade_improvement_requests_reviewed_by_fkey(
          full_name
        )
      `)

    // Apply filters
    if (validatedFilters.status) {
      query = query.eq('status', validatedFilters.status)
    }

    if (validatedFilters.improvement_period_id) {
      query = query.eq('improvement_period_id', validatedFilters.improvement_period_id)
    }

    if (validatedFilters.subject_id) {
      query = query.eq('subject_id', validatedFilters.subject_id)
    }

    // Apply pagination
    const offset = (validatedFilters.page - 1) * validatedFilters.limit
    query = query.range(offset, offset + validatedFilters.limit - 1)

    // Order by creation date
    query = query.order('created_at', { ascending: false })

    const { data: requests, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: {
        requests: requests as GradeImprovementRequest[],
        total: count || 0,
        page: validatedFilters.page,
        limit: validatedFilters.limit,
        totalPages: Math.ceil((count || 0) / validatedFilters.limit)
      }
    }
  } catch (error) {
    console.error('getGradeImprovementRequestsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải danh sách đơn cải thiện điểm'
    }
  }
}

// Respond to grade improvement request
export async function respondToGradeImprovementRequestAction(formData: GradeImprovementResponseFormData) {
  try {
    const { userId } = await checkAdminPermissions()
    const validatedData = gradeImprovementResponseSchema.parse(formData)
    const supabase = createAdminClient()

    const { data: request, error } = await supabase
      .from('grade_improvement_requests')
      .update({
        status: validatedData.status,
        admin_comment: validatedData.admin_comment,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', validatedData.request_id)
      .select(`
        *,
        improvement_period:grade_improvement_periods!grade_improvement_requests_improvement_period_id_fkey(
          id,
          name
        ),
        student:profiles!grade_improvement_requests_student_id_fkey(
          id,
          full_name,
          student_id
        ),
        subject:subjects!grade_improvement_requests_subject_id_fkey(
          id,
          name_vietnamese,
          code
        )
      `)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/grade-improvement')
    revalidatePath('/dashboard/student/grade-improvement')
    
    return {
      success: true,
      data: request as GradeImprovementRequest,
      message: `${validatedData.status === 'approved' ? 'Phê duyệt' : 'Từ chối'} đơn cải thiện điểm thành công`
    }
  } catch (error) {
    console.error('respondToGradeImprovementRequestAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể xử lý đơn cải thiện điểm'
    }
  }
}

// STUDENT FUNCTIONS

// Get active grade improvement periods for students
export async function getActiveGradeImprovementPeriodsAction() {
  try {
    await checkStudentPermissions()
    const supabase = await createClient()

    const now = new Date().toISOString()

    const { data: periods, error } = await supabase
      .from('grade_improvement_periods')
      .select(`
        *,
        grade_reporting_period:grade_reporting_periods!grade_improvement_periods_grade_reporting_period_id_fkey(
          id,
          name,
          start_date,
          end_date
        ),
        created_by_profile:profiles!grade_improvement_periods_created_by_fkey(
          full_name
        )
      `)
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .order('end_date', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: periods as GradeImprovementPeriod[]
    }
  } catch (error) {
    console.error('getActiveGradeImprovementPeriodsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải danh sách kỳ cải thiện điểm'
    }
  }
}

// Create grade improvement request (student)
export async function createGradeImprovementRequestAction(formData: GradeImprovementRequestFormData) {
  try {
    const { userId } = await checkStudentPermissions()
    const validatedData = gradeImprovementRequestSchema.parse(formData)
    const supabase = await createClient()

    // Check if the improvement period is active and within time range
    const now = new Date().toISOString()
    const { data: period, error: periodError } = await supabase
      .from('grade_improvement_periods')
      .select('*')
      .eq('id', validatedData.improvement_period_id)
      .eq('is_active', true)
      .lte('start_date', now)
      .gte('end_date', now)
      .single()

    if (periodError || !period) {
      throw new Error('Kỳ cải thiện điểm không còn hiệu lực hoặc đã hết hạn')
    }

    // Check if student already has a request for this subject in this period
    const { data: existingRequest } = await supabase
      .from('grade_improvement_requests')
      .select('id')
      .eq('improvement_period_id', validatedData.improvement_period_id)
      .eq('student_id', userId)
      .eq('subject_id', validatedData.subject_id)
      .single()

    if (existingRequest) {
      throw new Error('Bạn đã tạo đơn cải thiện điểm cho môn học này trong kỳ này')
    }

    const { data: request, error } = await supabase
      .from('grade_improvement_requests')
      .insert({
        ...validatedData,
        student_id: userId,
        status: 'pending'
      })
      .select(`
        *,
        improvement_period:grade_improvement_periods!grade_improvement_requests_improvement_period_id_fkey(
          id,
          name,
          start_date,
          end_date
        ),
        subject:subjects!grade_improvement_requests_subject_id_fkey(
          id,
          name_vietnamese,
          code
        )
      `)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/student/grade-improvement')

    return {
      success: true,
      data: request as GradeImprovementRequest,
      message: 'Tạo đơn cải thiện điểm thành công'
    }
  } catch (error) {
    console.error('createGradeImprovementRequestAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tạo đơn cải thiện điểm'
    }
  }
}

// Get student's grade improvement requests
export async function getStudentGradeImprovementRequestsAction() {
  try {
    const { userId } = await checkStudentPermissions()
    const supabase = await createClient()

    const { data: requests, error } = await supabase
      .from('grade_improvement_requests')
      .select(`
        *,
        improvement_period:grade_improvement_periods!grade_improvement_requests_improvement_period_id_fkey(
          id,
          name,
          start_date,
          end_date
        ),
        subject:subjects!grade_improvement_requests_subject_id_fkey(
          id,
          name_vietnamese,
          code
        ),
        reviewed_by_profile:profiles!grade_improvement_requests_reviewed_by_fkey(
          full_name
        )
      `)
      .eq('student_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: requests as GradeImprovementRequest[]
    }
  } catch (error) {
    console.error('getStudentGradeImprovementRequestsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải danh sách đơn cải thiện điểm'
    }
  }
}

// Get student's subjects for grade improvement
export async function getStudentSubjectsForImprovementAction() {
  try {
    const { userId } = await checkStudentPermissions()
    const supabase = await createClient()

    // Get student's current class assignments (both main and combined)
    const { data: classAssignments, error: classError } = await supabase
      .from('class_assignments')
      .select(`
        class_id,
        assignment_type,
        classes!class_assignments_class_id_fkey(
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .eq('assignment_type', 'student')
      .eq('is_active', true)

    if (classError) {
      console.error('Error fetching class assignments:', classError)
      throw new Error('Lỗi khi tải thông tin lớp học')
    }

    if (!classAssignments || classAssignments.length === 0) {
      console.error('No class assignments found for student:', userId)
      throw new Error('Bạn chưa được phân công vào lớp học nào. Vui lòng liên hệ với ban giám hiệu để được hỗ trợ.')
    }

    // Get all class IDs (both main and combined classes)
    const classIds = classAssignments.map(assignment => assignment.class_id)

    // Get unique subject IDs that student has grades for (from all their classes)
    const { data: gradeSubjects, error: subjectsError } = await supabase
      .from('student_detailed_grades')
      .select('subject_id')
      .eq('student_id', userId)
      .in('class_id', classIds)

    if (subjectsError) {
      throw new Error(subjectsError.message)
    }

    // Get unique subject IDs
    const uniqueSubjectIds = [...new Set(gradeSubjects?.map(item => item.subject_id) || [])]

    if (uniqueSubjectIds.length === 0) {
      return {
        success: true,
        data: []
      }
    }

    // Get subject details
    const { data: subjects, error: subjectDetailsError } = await supabase
      .from('subjects')
      .select('id, name_vietnamese, code, category')
      .in('id', uniqueSubjectIds)

    if (subjectDetailsError) {
      throw new Error(subjectDetailsError.message)
    }

    return {
      success: true,
      data: subjects || []
    }
  } catch (error) {
    console.error('getStudentSubjectsForImprovementAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải danh sách môn học'
    }
  }
}
