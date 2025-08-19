import { z } from 'zod'

// Enhanced grade period types for the 7 grading periods
export const gradePeriodTypes = [
  'midterm_1', 'final_1', 'semester_1_summary',
  'midterm_2', 'final_2', 'semester_2_summary', 
  'yearly_summary'
] as const

export type GradePeriodType = typeof gradePeriodTypes[number]

// Grade period status
export const gradePeriodStatuses = ['open', 'closed', 'reopened'] as const
export type GradePeriodStatus = typeof gradePeriodStatuses[number]

// Enhanced grade reporting period schema
export const enhancedGradeReportingPeriodSchema = z.object({
  name: z.string().min(1, "Tên kỳ báo cáo không được để trống"),
  academic_year_id: z.string().uuid("ID năm học không hợp lệ"),
  semester_id: z.string().uuid("ID học kỳ không hợp lệ"),
  period_type: z.enum(gradePeriodTypes, { message: "Loại kỳ báo cáo không hợp lệ" }),
  start_date: z.string().min(1, "Ngày bắt đầu không được để trống"),
  end_date: z.string().min(1, "Ngày kết thúc không được để trống"),
  import_deadline: z.string().min(1, "Hạn nhập điểm không được để trống"),
  edit_deadline: z.string().min(1, "Hạn chỉnh sửa không được để trống"),
  status: z.enum(gradePeriodStatuses).default('open'),
  description: z.string().optional()
})

export type EnhancedGradeReportingPeriodFormData = z.infer<typeof enhancedGradeReportingPeriodSchema>

// Grade submission schema
export const gradeSubmissionSchema = z.object({
  period_id: z.string().uuid("ID kỳ báo cáo không hợp lệ"),
  teacher_id: z.string().uuid("ID giáo viên không hợp lệ"),
  class_id: z.string().uuid("ID lớp không hợp lệ"),
  subject_id: z.string().uuid("ID môn học không hợp lệ"),
  status: z.enum(['draft', 'submitted', 'approved', 'rejected']).default('draft'),
  reason_for_resubmission: z.string().optional()
})

export type GradeSubmissionFormData = z.infer<typeof gradeSubmissionSchema>

// AI feedback schema
export const aiFeedbackSchema = z.object({
  student_id: z.string().uuid("ID học sinh không hợp lệ"),
  class_id: z.string().uuid("ID lớp không hợp lệ"),
  period_id: z.string().uuid("ID kỳ báo cáo không hợp lệ"),
  feedback_content: z.string().min(10, "Nội dung phản hồi phải có ít nhất 10 ký tự"),
  feedback_style: z.enum(['friendly', 'serious', 'encouraging', 'understanding']),
  feedback_length: z.enum(['short', 'medium', 'long']),
  reason_for_revision: z.string().optional()
})

export type AIFeedbackFormData = z.infer<typeof aiFeedbackSchema>

// Excel grade import schema
export const excelGradeImportSchema = z.object({
  period_id: z.string().uuid("ID kỳ báo cáo không hợp lệ"),
  class_id: z.string().uuid("ID lớp không hợp lệ"),
  subject_id: z.string().uuid("ID môn học không hợp lệ"),
  grades: z.array(z.object({
    student_id: z.string().uuid("ID học sinh không hợp lệ"),
    student_code: z.string().min(1, "Mã học sinh không được để trống"),
    regular_grades: z.array(z.number().min(0).max(10).nullable()).optional(),
    midterm_grade: z.number().min(0).max(10).nullable().optional(),
    final_grade: z.number().min(0).max(10).nullable().optional(),
    semester_grade: z.number().min(0).max(10).nullable().optional(),
    yearly_grade: z.number().min(0).max(10).nullable().optional()
  }))
})

export type ExcelGradeImportFormData = z.infer<typeof excelGradeImportSchema>

// Grade audit log schema
export const gradeAuditLogSchema = z.object({
  grade_id: z.string().uuid("ID điểm không hợp lệ"),
  old_value: z.number().min(0).max(10).nullable().optional(),
  new_value: z.number().min(0).max(10),
  change_reason: z.string().min(1, "Lý do thay đổi không được để trống"),
  component_type: z.string().min(1, "Loại điểm không được để trống")
})

export type GradeAuditLogFormData = z.infer<typeof gradeAuditLogSchema>

// Parent feedback delivery schema
export const parentFeedbackDeliverySchema = z.object({
  feedback_id: z.string().uuid("ID phản hồi không hợp lệ"),
  parent_ids: z.array(z.string().uuid("ID phụ huynh không hợp lệ")),
  delivery_method: z.enum(['email', 'notification']).default('email'),
  send_to_all: z.boolean().default(true)
})

export type ParentFeedbackDeliveryFormData = z.infer<typeof parentFeedbackDeliverySchema>

// Subject regular grade configuration
export const subjectRegularGradeConfigSchema = z.object({
  subject_id: z.string().uuid("ID môn học không hợp lệ"),
  grade_level: z.enum(['10', '11', '12']),
  regular_grade_count: z.number().min(1).max(10)
})

export type SubjectRegularGradeConfigFormData = z.infer<typeof subjectRegularGradeConfigSchema>

// Grade period filters
export const gradePeriodFiltersSchema = z.object({
  academic_year_id: z.string().uuid().optional(),
  semester_id: z.string().uuid().optional(),
  period_type: z.enum(gradePeriodTypes).optional(),
  status: z.enum(gradePeriodStatuses).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

export type GradePeriodFiltersFormData = z.infer<typeof gradePeriodFiltersSchema>

// Grade tracking filters
export const gradeTrackingFiltersSchema = z.object({
  period_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  teacher_id: z.string().uuid().optional(),
  submission_status: z.enum(['draft', 'submitted', 'approved', 'rejected']).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

export type GradeTrackingFiltersFormData = z.infer<typeof gradeTrackingFiltersSchema>

// Interfaces for the enhanced system
export interface EnhancedGradeReportingPeriod {
  id: string
  name: string
  academic_year_id: string
  semester_id: string
  period_type: GradePeriodType
  start_date: string
  end_date: string
  import_deadline: string
  edit_deadline: string
  status: GradePeriodStatus
  description?: string
  notification_sent: boolean
  reminder_sent: boolean
  created_by: string
  created_at: string
  updated_at: string
  academic_year?: { name: string }
  semester?: { name: string }
  created_by_profile?: { full_name: string }
}

export interface GradePeriodSubmission {
  id: string
  period_id: string
  teacher_id: string
  class_id: string
  subject_id: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  submission_count: number
  reason_for_resubmission?: string
  submitted_at?: string
  approved_at?: string
  approved_by?: string
  created_at: string
  updated_at: string
  period?: EnhancedGradeReportingPeriod
  teacher?: { full_name: string; email: string }
  class?: { name: string }
  subject?: { name_vietnamese: string; code: string }
  approved_by_profile?: { full_name: string }
}

export interface AIGradeFeedback {
  id: string
  student_id: string
  class_id: string
  period_id: string
  feedback_content: string
  feedback_style: 'friendly' | 'serious' | 'encouraging' | 'understanding'
  feedback_length: 'short' | 'medium' | 'long'
  version_number: number
  reason_for_revision?: string
  status: 'draft' | 'sent_to_parents'
  sent_at?: string
  created_by: string
  created_at: string
  updated_at: string
  student?: { full_name: string; student_id: string }
  class?: { name: string }
  period?: EnhancedGradeReportingPeriod
  created_by_profile?: { full_name: string }
}

export interface ParentFeedbackDelivery {
  id: string
  feedback_id: string
  parent_id: string
  delivery_method: 'email' | 'notification'
  delivery_status: 'pending' | 'sent' | 'failed' | 'read'
  sent_at?: string
  read_at?: string
  error_message?: string
  created_at: string
  feedback?: AIGradeFeedback
  parent?: { full_name: string; email: string }
}

export interface SubjectRegularGradeConfig {
  id: string
  subject_id: string
  grade_level: '10' | '11' | '12'
  regular_grade_count: number
  created_at: string
  updated_at: string
  subject?: { name_vietnamese: string; code: string }
}
