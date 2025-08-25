import { z } from 'zod'

// Grade improvement request status enum
export const gradeImprovementRequestStatuses = [
  'pending',
  'approved', 
  'rejected'
] as const

export type GradeImprovementRequestStatus = typeof gradeImprovementRequestStatuses[number]

// Validation schema for grade improvement period
export const gradeImprovementPeriodSchema = z.object({
  name: z.string().min(1, 'Tên kỳ cải thiện điểm là bắt buộc').max(100),
  description: z.string().optional(),
  start_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Ngày bắt đầu không hợp lệ'
  }),
  end_date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Ngày kết thúc không hợp lệ'
  }),
  grade_reporting_period_id: z.string().uuid('ID kỳ báo cáo điểm không hợp lệ'),
  is_active: z.boolean().default(true)
}).refine((data) => {
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  return startDate < endDate
}, {
  message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc',
  path: ['end_date']
})

export type GradeImprovementPeriodFormData = z.infer<typeof gradeImprovementPeriodSchema>

// Validation schema for grade improvement request
export const gradeImprovementRequestSchema = z.object({
  improvement_period_id: z.string().uuid('ID kỳ cải thiện điểm không hợp lệ'),
  subject_id: z.string().uuid('ID môn học không hợp lệ'),
  reason: z.string().min(10, 'Lý do phải có ít nhất 10 ký tự').max(500, 'Lý do không được quá 500 ký tự')
})

export type GradeImprovementRequestFormData = z.infer<typeof gradeImprovementRequestSchema>

// Validation schema for admin response to grade improvement request
export const gradeImprovementResponseSchema = z.object({
  request_id: z.string().uuid('ID đơn cải thiện điểm không hợp lệ'),
  status: z.enum(gradeImprovementRequestStatuses),
  admin_comment: z.string().min(1, 'Nhận xét của admin là bắt buộc').max(1000, 'Nhận xét không được quá 1000 ký tự')
})

export type GradeImprovementResponseFormData = z.infer<typeof gradeImprovementResponseSchema>

// Interface for grade improvement period with relations
export interface GradeImprovementPeriod {
  id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  grade_reporting_period_id: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: string
  grade_reporting_period?: {
    id: string
    name: string
    start_date: string
    end_date: string
  }
  created_by_profile?: {
    full_name: string
  }
}

// Interface for grade improvement request with relations
export interface GradeImprovementRequest {
  id: string
  improvement_period_id: string
  student_id: string
  subject_id: string
  reason: string
  status: GradeImprovementRequestStatus
  admin_comment?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
  improvement_period?: GradeImprovementPeriod
  student?: {
    id: string
    full_name: string
    student_id: string
  }
  subject?: {
    id: string
    name_vietnamese: string
    code: string
  }
  reviewed_by_profile?: {
    full_name: string
  }
}

// Filter schema for grade improvement requests
export const gradeImprovementRequestFiltersSchema = z.object({
  status: z.enum(gradeImprovementRequestStatuses).optional(),
  improvement_period_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  student_search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20)
})

export type GradeImprovementRequestFilters = z.infer<typeof gradeImprovementRequestFiltersSchema>
