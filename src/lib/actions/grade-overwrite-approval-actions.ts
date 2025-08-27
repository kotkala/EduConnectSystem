'use server'

import { createClient } from '@/shared/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface GradeDetail {
  student_id: string
  component_type: string
  old_value: string | number
  new_value: string | number
  reason: string
}

// Translation function for component types
function translateComponentType(componentType: string): string {
  switch (componentType) {
    case 'regular_1':
      return 'Điểm thường xuyên 1'
    case 'regular_2':
      return 'Điểm thường xuyên 2'
    case 'regular_3':
      return 'Điểm thường xuyên 3'
    case 'regular_4':
      return 'Điểm thường xuyên 4'
    case 'midterm':
      return 'Điểm giữa kì'
    case 'final':
      return 'Điểm cuối kì'
    case 'semester_1':
      return 'Học kỳ 1'
    case 'semester_2':
      return 'Học kỳ 2'
    case 'yearly':
      return 'Cả năm'
    case 'summary':
      return 'Tổng kết'
    default:
      return componentType
  }
}

export interface GradeOverwriteRequest {
  id: string
  teacher_id: string
  class_id: string
  subject_id: string
  period_id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  excel_file_url?: string
  requested_at: string
  reviewed_at?: string
  reviewed_by?: string
  admin_notes?: string
  teacher_name?: string
  class_name?: string
  subject_name?: string
  period_name?: string
  grade_details?: GradeDetail[]
  // Additional fields for admin page compatibility
  student_name?: string
  component_type?: string
  old_value?: string | number
  new_value?: string | number
  change_reason?: string
}

export interface CreateGradeOverwriteRequestData {
  teacher_id: string
  class_id: string
  subject_id: string
  period_id: string
  reason: string
  excel_file_url?: string
  grade_details?: Array<{
    student_id: string
    component_type: string
    old_value: string
    new_value: string
    reason: string
  }>
}

export interface ReviewGradeOverwriteRequestData {
  request_id: string
  status: 'approved' | 'rejected'
  admin_notes?: string
}

// Create a new grade overwrite request
export async function createGradeOverwriteRequestAction(
  data: CreateGradeOverwriteRequestData
): Promise<{ success: boolean; error?: string; data?: GradeOverwriteRequest }> {
  try {
    const supabase = await createClient()

    const { data: request, error } = await supabase
      .from('grade_overwrite_approvals')
      .insert({
        teacher_id: data.teacher_id,
        class_id: data.class_id,
        subject_id: data.subject_id,
        period_id: data.period_id,
        reason: data.reason,
        excel_file_url: data.excel_file_url,
        grade_details: data.grade_details,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating grade overwrite request:', error)
      return {
        success: false,
        error: 'Không thể tạo yêu cầu ghi đè điểm'
      }
    }

    revalidatePath('/dashboard/admin/grade-overwrite-approvals')
    revalidatePath('/dashboard/teacher/grade-management')

    return {
      success: true,
      data: request
    }

  } catch (error) {
    console.error('Error creating grade overwrite request:', error)
    return {
      success: false,
      error: 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

// Get all grade overwrite requests for admin
export async function getGradeOverwriteRequestsAction(): Promise<{
  success: boolean
  error?: string
  data?: GradeOverwriteRequest[]
}> {
  try {
    const supabase = await createClient()

    const { data: requests, error } = await supabase
      .from('grade_overwrite_approvals')
      .select(`
        *,
        teacher:profiles!grade_overwrite_approvals_teacher_id_fkey(full_name),
        class:classes!grade_overwrite_approvals_class_id_fkey(name),
        subject:subjects!grade_overwrite_approvals_subject_id_fkey(name_vietnamese),
        period:grade_reporting_periods!grade_overwrite_approvals_period_id_fkey(name, period_type),
        reviewer:profiles!grade_overwrite_approvals_reviewed_by_fkey(full_name)
      `)
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Error fetching grade overwrite requests:', error)
      return {
        success: false,
        error: 'Không thể tải danh sách yêu cầu ghi đè điểm'
      }
    }

    // Get all unique student IDs from grade details to fetch student names
    const allStudentIds = new Set<string>()
    requests?.forEach(request => {
      if (request.grade_details && Array.isArray(request.grade_details)) {
        request.grade_details.forEach((detail: GradeDetail) => {
          if (detail.student_id) {
            allStudentIds.add(detail.student_id)
          }
        })
      }
    })

    // Fetch student names
    let studentNames: Record<string, string> = {}
    if (allStudentIds.size > 0) {
      const { data: students } = await supabase
        .from('profiles')
        .select('student_id, full_name')
        .in('student_id', Array.from(allStudentIds))
        .eq('role', 'student')

      if (students) {
        studentNames = students.reduce((acc, student) => {
          acc[student.student_id] = student.full_name
          return acc
        }, {} as Record<string, string>)
      }
    }

    const formattedRequests = requests?.map(request => {
      // Get unique students from grade details
      const uniqueStudents = new Set<string>()
      const gradeDetails = (request.grade_details as GradeDetail[]) || []

      gradeDetails.forEach((detail: GradeDetail) => {
        if (detail.student_id) {
          uniqueStudents.add(detail.student_id)
        }
      })

      // Create student names display
      const studentNamesDisplay = Array.from(uniqueStudents)
        .map(studentId => studentNames[studentId] || studentId)
        .join(', ')

      // Create component type display with Vietnamese translation
      const componentTypes = new Set<string>()
      gradeDetails.forEach((detail: GradeDetail) => {
        if (detail.component_type) {
          componentTypes.add(translateComponentType(detail.component_type))
        }
      })

      // Create old/new values display with Vietnamese translation
      const oldValues = gradeDetails.map((detail: GradeDetail) =>
        `${translateComponentType(detail.component_type)}: ${detail.old_value || 'Chưa có điểm'}`
      ).join('; ')

      const newValues = gradeDetails.map((detail: GradeDetail) =>
        `${translateComponentType(detail.component_type)}: ${detail.new_value}`
      ).join('; ')

      return {
        id: request.id,
        teacher_id: request.teacher_id,
        class_id: request.class_id,
        subject_id: request.subject_id,
        period_id: request.period_id,
        reason: request.reason,
        status: request.status,
        excel_file_url: request.excel_file_url,
        requested_at: request.requested_at,
        reviewed_at: request.reviewed_at,
        reviewed_by: request.reviewed_by,
        admin_notes: request.admin_notes,
        teacher_name: request.teacher?.full_name || 'Chưa xác định',
        class_name: request.class?.name || 'Chưa xác định',
        subject_name: request.subject?.name_vietnamese || 'Chưa xác định',
        period_name: request.period?.name || 'Chưa xác định',
        // Additional fields expected by admin page
        student_name: studentNamesDisplay || 'Không xác định',
        component_type: Array.from(componentTypes).join(', ') || 'multiple',
        old_value: oldValues || 'Xem chi tiết trong Excel',
        new_value: newValues || 'Xem chi tiết trong Excel',
        change_reason: request.reason
      }
    }) || []

    return {
      success: true,
      data: formattedRequests
    }

  } catch (error) {
    console.error('Error fetching grade overwrite requests:', error)
    return {
      success: false,
      error: 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

// Review (approve/reject) a grade overwrite request
export async function reviewGradeOverwriteRequestAction(
  data: ReviewGradeOverwriteRequestData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        error: 'Không thể xác thực người dùng'
      }
    }

    // Update the request
    const { error: updateError } = await supabase
      .from('grade_overwrite_approvals')
      .update({
        status: data.status,
        admin_notes: data.admin_notes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', data.request_id)

    if (updateError) {
      console.error('Error updating grade overwrite request:', updateError)
      return {
        success: false,
        error: 'Không thể cập nhật yêu cầu ghi đè điểm'
      }
    }

    // If approved, we need to trigger the grade update process
    if (data.status === 'approved') {
      try {
        // Get the grade details from the request
        const { data: requestData, error: requestError } = await supabase
          .from('grade_overwrite_approvals')
          .select('grade_details, teacher_id, class_id, subject_id, period_id')
          .eq('id', data.request_id)
          .single()

        if (requestError || !requestData?.grade_details) {
          console.error('Could not get grade details for approved request:', requestError)
          return {
            success: false,
            error: 'Không thể lấy chi tiết điểm để cập nhật'
          }
        }

        // Process each grade detail and update the grades
        const gradeDetails = requestData.grade_details as GradeDetail[]
        console.log('Processing approved grade overwrite request:', {
          requestId: data.request_id,
          teacherId: requestData.teacher_id,
          classId: requestData.class_id,
          subjectId: requestData.subject_id,
          periodId: requestData.period_id,
          gradeDetailsCount: gradeDetails.length,
          adminNotes: data.admin_notes
        })

        // Update grades for each student and component
        for (const detail of gradeDetails) {
          const { student_id, component_type, new_value } = detail

          // Get the student's profile ID from student_id
          const { data: studentProfile, error: studentError } = await supabase
            .from('profiles')
            .select('id')
            .eq('student_id', student_id)
            .eq('role', 'student')
            .single()

          if (studentError || !studentProfile) {
            console.error(`Could not find student profile for ${student_id}:`, studentError)
            continue
          }

          // Update or insert the grade in the correct table
          const scoreValue = typeof new_value === 'string' ? parseFloat(new_value) : new_value
          const { data: gradeData, error: gradeError } = await supabase
            .from('student_detailed_grades')
            .upsert({
              student_id: studentProfile.id,
              class_id: requestData.class_id,
              subject_id: requestData.subject_id,
              period_id: requestData.period_id,
              component_type,
              grade_value: isNaN(scoreValue) ? null : scoreValue,
              updated_at: new Date().toISOString(),
              created_by: user.id
            }, {
              onConflict: 'student_id,class_id,subject_id,period_id,component_type'
            })
            .select('id')
            .single()

          if (gradeError) {
            console.error(`Failed to update grade for student ${student_id}, component ${component_type}:`, gradeError)
            continue
          }

          // Log the grade change to audit logs
          if (gradeData) {
            const { error: auditError } = await supabase
              .from('unified_audit_logs')
              .insert({
                audit_type: 'grade',
                table_name: 'student_detailed_grades',
                record_id: gradeData.id,
                action: 'UPDATE',
                user_id: user.id,
                user_role: user.role || 'admin',
                old_values: { old_value: detail.old_value },
                new_values: { new_value: scoreValue },
                changes_summary: detail.reason || 'Cập nhật điểm từ đơn ghi đè',
                ip_address: '127.0.0.1'
              })

            if (auditError) {
              console.error('Audit log error for student:', student_id, auditError)
              // Don't fail the grade update if audit logging fails
            }
          }

          console.log('Updated grade for student:', student_id, 'component:', component_type, 'value:', new_value)
        }

        // Create audit log entry for the approval
        const { error: approvalAuditError } = await supabase
          .from('unified_audit_logs')
          .insert({
            table_name: 'grade_overwrite_approvals',
            record_id: data.request_id,
            action: 'approve',
            old_values: { status: 'pending' },
            new_values: {
              status: 'approved',
              admin_notes: data.admin_notes,
              reviewed_by: user.id,
              reviewed_at: new Date().toISOString()
            },
            user_id: user.id,
            user_role: 'admin'
          })

        if (approvalAuditError) {
          console.error('Failed to create audit log:', approvalAuditError)
        }

        console.log('Successfully processed all grade updates for request:', data.request_id)
      } catch (error) {
        console.error('Error updating grades after approval:', error)
        return {
          success: false,
          error: 'Có lỗi xảy ra khi cập nhật điểm sau khi phê duyệt'
        }
      }
    }

    revalidatePath('/dashboard/admin/grade-overwrite-approvals')
    revalidatePath('/dashboard/teacher/grade-management')

    return {
      success: true
    }

  } catch (error) {
    console.error('Error reviewing grade overwrite request:', error)
    return {
      success: false,
      error: 'Đã xảy ra lỗi không mong muốn'
    }
  }
}

// Get grade overwrite requests for a specific teacher
export async function getTeacherGradeOverwriteRequestsAction(
  teacherId: string
): Promise<{
  success: boolean
  error?: string
  data?: GradeOverwriteRequest[]
}> {
  try {
    const supabase = await createClient()

    const { data: requests, error } = await supabase
      .from('grade_overwrite_approvals')
      .select('*, class:classes!grade_overwrite_approvals_class_id_fkey(name), subject:subjects!grade_overwrite_approvals_subject_id_fkey(name_vietnamese), period:grade_reporting_periods!grade_overwrite_approvals_period_id_fkey(name), reviewer:profiles!grade_overwrite_approvals_reviewed_by_fkey(full_name)')
      .eq('teacher_id', teacherId)
      .order('requested_at', { ascending: false })

    if (error) {
      console.error('Error fetching teacher grade overwrite requests:', error)
      return {
        success: false,
        error: 'Không thể tải danh sách yêu cầu ghi đè điểm'
      }
    }

    const formattedRequests = requests?.map(request => ({
      id: request.id,
      teacher_id: request.teacher_id,
      class_id: request.class_id,
      subject_id: request.subject_id,
      period_id: request.period_id,
      reason: request.reason,
      status: request.status,
      excel_file_url: request.excel_file_url,
      requested_at: request.requested_at,
      reviewed_at: request.reviewed_at,
      reviewed_by: request.reviewed_by,
      admin_notes: request.admin_notes,
      class_name: request.class?.name || 'Chưa xác định',
      subject_name: request.subject?.name_vietnamese || 'Chưa xác định',
      period_name: request.period?.name || 'Chưa xác định'
    })) || []

    return {
      success: true,
      data: formattedRequests
    }

  } catch (error) {
    console.error('Error fetching teacher grade overwrite requests:', error)
    return {
      success: false,
      error: 'Đã xảy ra lỗi không mong muốn'
    }
  }
}
