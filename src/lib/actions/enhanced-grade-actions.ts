    'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from '@/shared/utils/supabase/admin'
import { checkAdminPermissions, checkTeacherPermissions } from '@/lib/utils/permission-utils'
import {
  enhancedGradeReportingPeriodSchema,
  gradeSubmissionSchema,
  aiFeedbackSchema,
  gradeAuditLogSchema,
  parentFeedbackDeliverySchema,
  gradePeriodFiltersSchema,
  gradeTrackingFiltersSchema,
  type EnhancedGradeReportingPeriodFormData,
  type GradeSubmissionFormData,
  type AIFeedbackFormData,
  type GradeAuditLogFormData,
  type ParentFeedbackDeliveryFormData,
  type GradePeriodFiltersFormData,
  type GradeTrackingFiltersFormData,
  type EnhancedGradeReportingPeriod,
  type GradePeriodSubmission,
  type AIGradeFeedback
} from '@/lib/validations/enhanced-grade-validations'

// Action response type
interface ActionResponse<T> {
  success: boolean
  data?: T
  error?: string
  total?: number
  page?: number
  limit?: number
}

import {
  type TeacherClass,
  type TeacherSubject,
  VIETNAMESE_GRADE_STANDARDS
} from '@/lib/types/teacher-grade-types'

// Create enhanced grade reporting period
export async function createEnhancedGradeReportingPeriodAction(
  formData: EnhancedGradeReportingPeriodFormData
): Promise<ActionResponse<EnhancedGradeReportingPeriod>> {
  try {
    const { userId } = await checkAdminPermissions()
    const validatedData = enhancedGradeReportingPeriodSchema.parse(formData)
    
    const supabase = createAdminClient()

    // Check for overlapping periods of the same type
    const { data: existingPeriods } = await supabase
      .from('grade_reporting_periods')
      .select('id, name, start_date, end_date')
      .eq('academic_year_id', validatedData.academic_year_id)
      .eq('semester_id', validatedData.semester_id)
      .eq('period_type', validatedData.period_type)
      .eq('is_active', true)

    if (existingPeriods && existingPeriods.length > 0) {
      return {
        success: false,
        error: "Đã tồn tại kỳ báo cáo cùng loại trong học kỳ này"
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
      console.error('Error creating grade reporting period:', error)
      return {
        success: false,
        error: "Không thể tạo kỳ báo cáo điểm"
      }
    }

    return {
      success: true,
      data: period as EnhancedGradeReportingPeriod
    }
  } catch (error) {
    console.error('Error in createEnhancedGradeReportingPeriodAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}

// Get enhanced grade reporting periods
export async function getEnhancedGradeReportingPeriodsAction(
  filters?: GradePeriodFiltersFormData
): Promise<ActionResponse<EnhancedGradeReportingPeriod[]>> {
  try {
    // Allow both admin and teacher access
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "Authentication required"
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
      return {
        success: false,
        error: "Access denied"
      }
    }
    
    const validatedFilters = filters ? gradePeriodFiltersSchema.parse(filters) : {
      page: 1,
      limit: 20
    }

    let query = supabase
      .from('grade_reporting_periods')
      .select(`
        *,
        academic_year:academic_years(name),
        semester:semesters(name),
        created_by_profile:profiles!created_by(full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (validatedFilters.academic_year_id) {
      query = query.eq('academic_year_id', validatedFilters.academic_year_id)
    }
    if (validatedFilters.semester_id) {
      query = query.eq('semester_id', validatedFilters.semester_id)
    }
    if (validatedFilters.period_type) {
      query = query.eq('period_type', validatedFilters.period_type)
    }
    if (validatedFilters.status) {
      query = query.eq('status', validatedFilters.status)
    }

    // Apply pagination
    const page = validatedFilters.page || 1
    const limit = validatedFilters.limit || 20
    const offset = (page - 1) * limit

    const { data: periods, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching grade reporting periods:', error)
      return {
        success: false,
        error: "Không thể tải danh sách kỳ báo cáo"
      }
    }

    return {
      success: true,
      data: periods as EnhancedGradeReportingPeriod[],
      total: count || 0,
      page,
      limit
    }
  } catch (error) {
    console.error('Error in getEnhancedGradeReportingPeriodsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}

// Update grade reporting period status
export async function updateGradeReportingPeriodStatusAction(
  periodId: string,
  status: 'open' | 'closed' | 'reopened',
  reason?: string
): Promise<ActionResponse<EnhancedGradeReportingPeriod>> {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    const { data: period, error } = await supabase
      .from('grade_reporting_periods')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', periodId)
      .select(`
        *,
        academic_year:academic_years(name),
        semester:semesters(name),
        created_by_profile:profiles!created_by(full_name)
      `)
      .single()

    if (error) {
      console.error('Error updating period status:', error)
      return {
        success: false,
        error: "Không thể cập nhật trạng thái kỳ báo cáo"
      }
    }

    // Log the status change if needed
    if (reason && status === 'reopened') {
      // Could add audit log here
    }

    return {
      success: true,
      data: period as EnhancedGradeReportingPeriod
    }
  } catch (error) {
    console.error('Error in updateGradeReportingPeriodStatusAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}

// Submit grades for a period
export async function submitGradesForPeriodAction(
  formData: GradeSubmissionFormData
): Promise<ActionResponse<GradePeriodSubmission>> {
  try {
    const { userId } = await checkTeacherPermissions()
    const validatedData = gradeSubmissionSchema.parse(formData)
    
    const supabase = createAdminClient()

    // Check if submission already exists
    const { data: existingSubmission } = await supabase
      .from('grade_period_submissions')
      .select('*')
      .eq('period_id', validatedData.period_id)
      .eq('teacher_id', validatedData.teacher_id)
      .eq('class_id', validatedData.class_id)
      .eq('subject_id', validatedData.subject_id)
      .maybeSingle()

    let submission
    if (existingSubmission) {
      // Update existing submission
      const { data: updatedSubmission, error } = await supabase
        .from('grade_period_submissions')
        .update({
          status: validatedData.status,
          submission_count: existingSubmission.submission_count + 1,
          reason_for_resubmission: validatedData.reason_for_resubmission,
          submitted_at: validatedData.status === 'submitted' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSubmission.id)
        .select(`
          *,
          period:grade_reporting_periods(*),
          teacher:profiles!teacher_id(full_name, email),
          class:classes(name),
          subject:subjects(name_vietnamese, code)
        `)
        .single()

      if (error) {
        console.error('Error updating submission:', error)
        return {
          success: false,
          error: "Không thể cập nhật bài nộp điểm"
        }
      }
      submission = updatedSubmission
    } else {
      // Create new submission
      const { data: newSubmission, error } = await supabase
        .from('grade_period_submissions')
        .insert({
          ...validatedData,
          teacher_id: userId,
          submitted_at: validatedData.status === 'submitted' ? new Date().toISOString() : null
        })
        .select(`
          *,
          period:grade_reporting_periods(*),
          teacher:profiles!teacher_id(full_name, email),
          class:classes(name),
          subject:subjects(name_vietnamese, code)
        `)
        .single()

      if (error) {
        console.error('Error creating submission:', error)
        return {
          success: false,
          error: "Không thể tạo bài nộp điểm"
        }
      }
      submission = newSubmission
    }

    return {
      success: true,
      data: submission as GradePeriodSubmission
    }
  } catch (error) {
    console.error('Error in submitGradesForPeriodAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}

// Create or update AI feedback for student
export async function createAIFeedbackAction(
  formData: AIFeedbackFormData
): Promise<ActionResponse<AIGradeFeedback>> {
  try {
    const { userId } = await checkTeacherPermissions()
    const validatedData = aiFeedbackSchema.parse(formData)

    const supabase = createAdminClient()

    // Check if feedback already exists for this student and period
    const { data: existingFeedback } = await supabase
      .from('ai_grade_feedback')
      .select('*')
      .eq('student_id', validatedData.student_id)
      .eq('period_id', validatedData.period_id)
      .eq('class_id', validatedData.class_id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const versionNumber = existingFeedback ? existingFeedback.version_number + 1 : 1

    // Always create a new version for audit trail
    const { data: feedback, error } = await supabase
      .from('ai_grade_feedback')
      .insert({
        ...validatedData,
        version_number: versionNumber,
        created_by: userId,
        status: 'draft'
      })
      .select(`
        *,
        student:profiles!student_id(full_name, student_id),
        class:classes(name),
        period:grade_reporting_periods(*),
        created_by_profile:profiles!created_by(full_name)
      `)
      .single()

    if (error) {
      console.error('Error creating AI feedback:', error)
      return {
        success: false,
        error: "Không thể tạo phản hồi AI"
      }
    }

    return {
      success: true,
      data: feedback as AIGradeFeedback
    }
  } catch (error) {
    console.error('Error in createAIFeedbackAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}

// Get existing AI feedback for student and period
export async function getAIFeedbackForStudentAction(
  studentId: string,
  periodId: string
): Promise<ActionResponse<AIGradeFeedback | null>> {
  try {
    await checkTeacherPermissions()
    const supabase = createAdminClient()

    const { data: feedback, error } = await supabase
      .from('ai_grade_feedback')
      .select(`
        *,
        student:profiles!student_id(full_name, student_id),
        class:classes(name),
        period:grade_reporting_periods(*),
        created_by_profile:profiles!created_by(full_name)
      `)
      .eq('student_id', studentId)
      .eq('period_id', periodId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error getting AI feedback:', error)
      return {
        success: false,
        error: "Không thể lấy phản hồi AI"
      }
    }

    return {
      success: true,
      data: feedback as AIGradeFeedback | null
    }
  } catch (error) {
    console.error('Error in getAIFeedbackForStudentAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}

// Update grade submission with AI feedback (for homeroom teacher grade reports)
export async function updateGradeSubmissionFeedbackAction(
  classId: string,
  periodId: string,
  aiFeedback: string,
  teacherNotes?: string
): Promise<ActionResponse<unknown>> {
  try {
    const { userId } = await checkTeacherPermissions()
    const supabase = createAdminClient()

    // First, try to find existing submission
    const { data: existingSubmission } = await supabase
      .from('grade_submissions')
      .select('*')
      .eq('class_id', classId)
      .eq('period_id', periodId)
      .maybeSingle()

    let result
    if (existingSubmission) {
      // Update existing submission
      const { data, error } = await supabase
        .from('grade_submissions')
        .update({
          ai_feedback: aiFeedback.trim(),
          teacher_notes: teacherNotes?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('class_id', classId)
        .eq('period_id', periodId)
        .select()
        .single()

      if (error) {
        console.error('Error updating grade submission:', error)
        return {
          success: false,
          error: "Không thể cập nhật đánh giá"
        }
      }
      result = data
    } else {
      // Create new submission if it doesn't exist
      const { data, error } = await supabase
        .from('grade_submissions')
        .insert({
          class_id: classId,
          period_id: periodId,
          homeroom_teacher_id: userId,
          sent_by: userId,
          ai_feedback: aiFeedback.trim(),
          teacher_notes: teacherNotes?.trim() || null,
          status: 'pending_review'
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating grade submission:', error)
        return {
          success: false,
          error: "Không thể tạo đánh giá"
        }
      }
      result = data
    }

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('Error updating grade submission feedback:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}

// Send feedback to parents
export async function sendFeedbackToParentsAction(
  formData: ParentFeedbackDeliveryFormData
): Promise<ActionResponse<{ deliveries: unknown[]; feedback: unknown }>> {
  try {
    await checkTeacherPermissions()
    const validatedData = parentFeedbackDeliverySchema.parse(formData)

    const supabase = createAdminClient()

    // Get feedback details
    const { data: feedback, error: feedbackError } = await supabase
      .from('ai_grade_feedback')
      .select(`
        *,
        student:profiles!student_id(full_name, student_id),
        class:classes(name)
      `)
      .eq('id', validatedData.feedback_id)
      .single()

    if (feedbackError || !feedback) {
      return {
        success: false,
        error: "Không tìm thấy phản hồi"
      }
    }

    // Get parent IDs if sending to all
    let parentIds = validatedData.parent_ids
    if (validatedData.send_to_all) {
      const { data: parents } = await supabase
        .from('parent_student_relationships')
        .select('parent_id')
        .eq('student_id', feedback.student_id)

      if (parents) {
        parentIds = parents.map(p => p.parent_id)
      }
    }

    // Create delivery records
    const deliveryRecords = parentIds.map(parentId => ({
      feedback_id: validatedData.feedback_id,
      parent_id: parentId,
      delivery_method: validatedData.delivery_method,
      delivery_status: 'pending' as const
    }))

    const { data: deliveries, error: deliveryError } = await supabase
      .from('parent_feedback_delivery')
      .insert(deliveryRecords)
      .select(`
        *,
        feedback:ai_grade_feedback(*),
        parent:profiles!parent_id(full_name, email)
      `)

    if (deliveryError) {
      console.error('Error creating delivery records:', deliveryError)
      return {
        success: false,
        error: "Không thể tạo bản ghi gửi phản hồi"
      }
    }

    // Update feedback status
    await supabase
      .from('ai_grade_feedback')
      .update({
        status: 'sent_to_parents',
        sent_at: new Date().toISOString()
      })
      .eq('id', validatedData.feedback_id)

    // CRITICAL FIX: Update grade_submissions.ai_feedback field so parent page can see the feedback
    // Find the corresponding grade_submission for this student/class/period
    const { data: gradeSubmission } = await supabase
      .from('grade_submissions')
      .select('id')
      .eq('class_id', feedback.class_id)
      .eq('period_id', feedback.period_id)
      .single()

    if (gradeSubmission) {
      // Update the ai_feedback field in grade_submissions table
      await supabase
        .from('grade_submissions')
        .update({
          ai_feedback: feedback.feedback_content,
          sent_to_parents_at: new Date().toISOString()
        })
        .eq('id', gradeSubmission.id)
    }

    // TODO: Implement actual email sending logic here
    // For now, mark as sent
    await supabase
      .from('parent_feedback_delivery')
      .update({
        delivery_status: 'sent',
        sent_at: new Date().toISOString()
      })
      .in('id', deliveries?.map(d => d.id) || [])

    return {
      success: true,
      data: { deliveries, feedback }
    }
  } catch (error) {
    console.error('Error in sendFeedbackToParentsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}

// Get subject regular grade configuration
export async function getSubjectRegularGradeConfigAction(): Promise<ActionResponse<unknown[]>> {
  try {
    const supabase = await createClient()

    const { data: configs, error } = await supabase
      .from('subject_regular_grade_config')
      .select(`
        *,
        subject:subjects(name_vietnamese, code)
      `)
      .order('subject(name_vietnamese)')

    if (error) {
      console.error('Error fetching subject grade config:', error)
      return {
        success: false,
        error: "Không thể tải cấu hình điểm môn học"
      }
    }

    return {
      success: true,
      data: configs || []
    }
  } catch (error) {
    console.error('Error in getSubjectRegularGradeConfigAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}

// Log grade change for audit
export async function logGradeChangeAction(
  formData: GradeAuditLogFormData
): Promise<ActionResponse<unknown>> {
  try {
    const { userId } = await checkTeacherPermissions()
    const validatedData = gradeAuditLogSchema.parse(formData)

    const supabase = createAdminClient()

    const { data: auditLog, error } = await supabase
      .from('grade_audit_logs')
      .insert({
        ...validatedData,
        changed_by: userId,
        changed_at: new Date().toISOString()
      })
      .select(`
        *,
        changed_by_profile:profiles!changed_by(full_name)
      `)
      .single()

    if (error) {
      console.error('Error creating audit log:', error)
      return {
        success: false,
        error: "Không thể tạo nhật ký thay đổi điểm"
      }
    }

    return {
      success: true,
      data: auditLog
    }
  } catch (error) {
    console.error('Error in logGradeChangeAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}

// Get grade submissions for tracking
export async function getGradeSubmissionsAction(
  filters?: GradeTrackingFiltersFormData
): Promise<ActionResponse<GradePeriodSubmission[]>> {
  try {
    // Allow both admin and teacher access
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: "Authentication required"
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'teacher'].includes(profile.role)) {
      return {
        success: false,
        error: "Access denied"
      }
    }
    
    const validatedFilters = filters ? gradeTrackingFiltersSchema.parse(filters) : {
      page: 1,
      limit: 20
    }

    let query = supabase
      .from('grade_period_submissions')
      .select(`
        *,
        period:grade_reporting_periods(*),
        teacher:profiles!teacher_id(full_name, email),
        class:classes(name),
        subject:subjects(name_vietnamese, code),
        approved_by_profile:profiles!approved_by(full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (validatedFilters.period_id) {
      query = query.eq('period_id', validatedFilters.period_id)
    }
    if (validatedFilters.class_id) {
      query = query.eq('class_id', validatedFilters.class_id)
    }
    if (validatedFilters.subject_id) {
      query = query.eq('subject_id', validatedFilters.subject_id)
    }
    if (validatedFilters.teacher_id) {
      query = query.eq('teacher_id', validatedFilters.teacher_id)
    }
    if (validatedFilters.submission_status) {
      query = query.eq('status', validatedFilters.submission_status)
    }

    // If user is a teacher, only show their submissions
    if (profile.role === 'teacher') {
      query = query.eq('teacher_id', user.id)
    }

    // Apply pagination
    const page = validatedFilters.page || 1
    const limit = validatedFilters.limit || 20
    const offset = (page - 1) * limit

    const { data: submissions, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching grade submissions:', error)
      return {
        success: false,
        error: "Không thể tải danh sách bài nộp điểm"
      }
    }

    return {
      success: true,
      data: submissions as GradePeriodSubmission[],
      total: count || 0,
      page,
      limit
    }
  } catch (error) {
    console.error('Error in getGradeSubmissionsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}

// Get teacher's classes
export async function getTeacherClassesAction(): Promise<ActionResponse<TeacherClass[]>> {
  try {
    const { userId } = await checkTeacherPermissions()
    const supabase = await createClient()

    const { data: assignments, error } = await supabase
      .from('teacher_class_assignments_view')
      .select(`
        class_id,
        class_name,
        class_block_name
      `)
      .eq('teacher_id', userId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching teacher classes:', error)
      return {
        success: false,
        error: "Không thể tải danh sách lớp học"
      }
    }

    // Get unique classes (a teacher might teach multiple subjects in the same class)
    const uniqueClasses = new Map<string, TeacherClass>()
    if (assignments) {
      for (const assignment of assignments) {
        if (!uniqueClasses.has(assignment.class_id)) {
          uniqueClasses.set(assignment.class_id, {
            id: assignment.class_id,
            name: assignment.class_name,
            grade_level: parseInt(assignment.class_block_name)
          })
        }
      }
    }

    return {
      success: true,
      data: Array.from(uniqueClasses.values())
    }
  } catch (error) {
    console.error('Error in getTeacherClassesAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}

// Get teacher's subjects
export async function getTeacherSubjectsAction(): Promise<ActionResponse<TeacherSubject[]>> {
  try {
    const { userId } = await checkTeacherPermissions()
    const supabase = await createClient()

    const { data: subjects, error } = await supabase
      .from('teachers_for_subjects')
      .select(`
        subject_id,
        subject_name_vietnamese,
        subject_code
      `)
      .eq('teacher_id', userId)

    if (error) {
      console.error('Error fetching teacher subjects:', error)
      return {
        success: false,
        error: "Không thể tải danh sách môn học"
      }
    }

    const teacherSubjects: TeacherSubject[] = []
    if (subjects) {
      for (const subject of subjects) {
        teacherSubjects.push({
          id: subject.subject_id,
          name_vietnamese: subject.subject_name_vietnamese,
          code: subject.subject_code,
          regular_grade_count: VIETNAMESE_GRADE_STANDARDS[subject.subject_name_vietnamese] || 3
        })
      }
    }

    return {
      success: true,
      data: teacherSubjects
    }
  } catch (error) {
    console.error('Error in getTeacherSubjectsAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Lỗi không xác định"
    }
  }
}