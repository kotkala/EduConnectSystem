import { z } from 'zod'

// Violation severity enum
export const violationSeverityLevels = ['minor', 'moderate', 'serious', 'severe'] as const
export type ViolationSeverity = typeof violationSeverityLevels[number]

// Violation category validation schemas
export const violationCategorySchema = z.object({
  name: z.string()
    .min(1, "Category name is required")
    .max(100, "Category name must be 100 characters or less"),
  description: z.string()
    .max(500, "Description must be 500 characters or less")
    .optional()
})

export const updateViolationCategorySchema = violationCategorySchema.extend({
  id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Invalid category ID"),
  is_active: z.boolean().optional()
})

// Violation type validation schemas
export const violationTypeSchema = z.object({
  category_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Mã danh mục không hợp lệ"),
  name: z.string()
    .min(1, "Tên loại vi phạm là bắt buộc")
    .max(200, "Tên loại vi phạm tối đa 200 ký tự"),
  description: z.string()
    .max(500, "Mô tả tối đa 500 ký tự")
    .optional(),
  default_severity: z.enum(violationSeverityLevels, {
    message: "Mức độ vi phạm không hợp lệ"
  }),
  points: z.number().int().min(0, "Điểm trừ phải >= 0").default(0)
})

export const updateViolationTypeSchema = violationTypeSchema.extend({
  id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Mã loại vi phạm không hợp lệ"),
  is_active: z.boolean().optional(),
  points: z.number().int().min(0).default(0)
})

// Student violation validation schemas
export const studentViolationSchema = z.object({
  student_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Mã học sinh không hợp lệ"),
  class_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Mã lớp không hợp lệ"),
  violation_type_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Mã loại vi phạm không hợp lệ"),
  severity: z.enum(violationSeverityLevels, {
    message: "Mức độ vi phạm không hợp lệ"
  }),
  points: z.number().int().min(0, "Điểm trừ phải >= 0").optional(),
  description: z.string()
    .max(1000, "Mô tả tối đa 1000 ký tự")
    .optional(),
  violation_date: z.string().optional(),
  academic_year_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Mã năm học không hợp lệ"),
  semester_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Mã học kì không hợp lệ")
})

export const bulkStudentViolationSchema = z.object({
  student_ids: z.array(z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Mã học sinh không hợp lệ"))
    .min(1, "Cần chọn ít nhất 1 học sinh"),
  class_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Mã lớp không hợp lệ"),
  violation_type_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Mã loại vi phạm không hợp lệ"),
  severity: z.enum(violationSeverityLevels, {
    message: "Mức độ vi phạm không hợp lệ"
  }),
  points: z.number().int().min(0, "Điểm trừ phải >= 0").optional(),
  description: z.string()
    .max(1000, "Mô tả tối đa 1000 ký tự")
    .optional(),
  violation_date: z.string()
    .min(1, "Ngày vi phạm là bắt buộc")
    .refine((date) => !isNaN(Date.parse(date)), "Định dạng ngày không hợp lệ"),
  academic_year_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Mã năm học không hợp lệ"),
  semester_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Mã học kì không hợp lệ")
})

export const updateStudentViolationSchema = z.object({
  id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Invalid violation ID"),
  severity: z.enum(violationSeverityLevels, {
    message: "Invalid severity level"
  }).optional(),
  description: z.string()
    .max(1000, "Description must be 1000 characters or less")
    .optional()
})

// Violation notification validation schemas
export const violationNotificationSchema = z.object({
  violation_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Invalid violation ID"),
  parent_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Invalid parent ID")
})

export const bulkViolationNotificationSchema = z.object({
  violation_ids: z.array(z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Invalid violation ID"))
    .min(1, "At least one violation must be selected"),
  parent_ids: z.array(z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Invalid parent ID"))
    .min(1, "At least one parent must be selected")
})

// Filter schemas
export const violationFiltersSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  search: z.string().optional(),
  category_id: z.string().refine((val) => val === '' || val === 'all' || z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i).safeParse(val).success, {
    message: "Invalid category ID"
  }).optional(),
  severity: z.string().refine((val) => !val || val === 'all' || (violationSeverityLevels as readonly string[]).includes(val), {
    message: "Invalid severity level"
  }).optional(),
  student_id: z.string().refine((val) => val === '' || z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i).safeParse(val).success, {
    message: "Invalid student ID"
  }).optional(),
  class_id: z.string().refine((val) => val === '' || z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i).safeParse(val).success, {
    message: "Invalid class ID"
  }).optional(),
  academic_year_id: z.string().refine((val) => val === '' || z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i).safeParse(val).success, {
    message: "Invalid academic year ID"
  }).optional(),
  semester_id: z.string().refine((val) => val === '' || z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i).safeParse(val).success, {
    message: "Invalid semester ID"
  }).optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional()
})

// Type exports
export type ViolationCategoryFormData = z.infer<typeof violationCategorySchema>
export type UpdateViolationCategoryFormData = z.infer<typeof updateViolationCategorySchema>
// Dùng input type để tương thích zodResolver (trường points có thể không gửi từ form)
export type ViolationTypeFormData = z.input<typeof violationTypeSchema>
export type UpdateViolationTypeFormData = z.infer<typeof updateViolationTypeSchema>
export type StudentViolationFormData = z.infer<typeof studentViolationSchema>
export type BulkStudentViolationFormData = z.infer<typeof bulkStudentViolationSchema>
export type UpdateStudentViolationFormData = z.infer<typeof updateStudentViolationSchema>
export type ViolationNotificationFormData = z.infer<typeof violationNotificationSchema>
export type BulkViolationNotificationFormData = z.infer<typeof bulkViolationNotificationSchema>
export type ViolationFilters = z.infer<typeof violationFiltersSchema>

// Database types
export interface ViolationCategory {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ViolationType {
  id: string
  category_id: string
  name: string
  description: string | null
  default_severity: ViolationSeverity
  points: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ViolationTypeWithCategory extends ViolationType {
  category: {
    id: string
    name: string
  }
}

export interface StudentViolation {
  id: string
  student_id: string
  class_id: string
  violation_type_id: string
  severity: ViolationSeverity
  points: number
  description: string | null
  violation_date: string
  recorded_by: string
  recorded_at: string
  academic_year_id: string
  semester_id: string
  week_index: number
  month_index: number
  created_at: string
  updated_at: string
}

export interface StudentViolationWithDetails {
  id: string
  student_id: string
  class_id: string
  violation_type_id: string
  severity: ViolationSeverity
  points: number
  description: string | null
  violation_date: string
  recorded_at: string
  academic_year_id: string
  semester_id: string
  week_index: number
  month_index: number
  created_at: string
  updated_at: string
  student: {
    id: string
    full_name: string
    email: string
    student_id: string
  }
  class: {
    id: string
    name: string
  }
  violation_type: {
    id: string
    name: string
    category: {
      id: string
      name: string
    }
  }
  recorded_by: {
    id: string
    full_name: string
  }
  academic_year: {
    id: string
    name: string
  }
  semester: {
    id: string
    name: string
    start_date: string
  }
}

export interface ViolationNotification {
  id: string
  violation_id: string
  parent_id: string
  teacher_id: string
  sent_at: string
  is_read: boolean
  read_at: string | null
  created_at: string
  updated_at: string
}

export interface ViolationNotificationWithDetails extends ViolationNotification {
  violation: StudentViolationWithDetails
  parent: {
    id: string
    full_name: string
    email: string
  }
  teacher: {
    id: string
    full_name: string
    email: string
  }
}

// Utility functions
export function getSeverityLabel(severity: ViolationSeverity): string {
  const labels: Record<ViolationSeverity, string> = {
    minor: 'Nhẹ',
    moderate: 'Trung bình',
    serious: 'Nghiêm trọng',
    severe: 'Rất nghiêm trọng'
  }
  return labels[severity]
}

export function getSeverityColor(severity: ViolationSeverity): string {
  const colors: Record<ViolationSeverity, string> = {
    minor: 'text-yellow-600 bg-yellow-50',
    moderate: 'text-orange-600 bg-orange-50',
    serious: 'text-red-600 bg-red-50',
    severe: 'text-red-800 bg-red-100'
  }
  return colors[severity]
}
