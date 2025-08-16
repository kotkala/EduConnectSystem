import { z } from "zod"

// Grade value validation - follows VNedu standards
export const gradeValueSchema = z
  .number()
  .min(0, "Điểm số phải từ 0 trở lên")
  .max(10, "Điểm số không được vượt quá 10")
  .refine(
    (val) => {
      // Check if it has at most 1 decimal place
      const decimalPlaces = (val.toString().split('.')[1] || '').length
      return decimalPlaces <= 1
    },
    "Điểm số chỉ được có tối đa 1 chữ số thập phân"
  )
  .transform((val) => Math.round(val * 10) / 10) // Round to 1 decimal place

// Grade type enumeration - Updated for VNedu compatibility
export const gradeTypes = ['semester1', 'semester2', 'full_year'] as const
export type GradeType = typeof gradeTypes[number]

// Grade reporting period schema
export const gradeReportingPeriodSchema = z.object({
  name: z.string()
    .min(1, "Tên kỳ báo cáo là bắt buộc")
    .max(255, "Tên kỳ báo cáo không được vượt quá 255 ký tự"),
  academic_year_id: z.string().uuid("ID năm học không hợp lệ"),
  semester_id: z.string().uuid("ID học kỳ không hợp lệ"),
  start_date: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    "Ngày bắt đầu không hợp lệ"
  ),
  end_date: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    "Ngày kết thúc không hợp lệ"
  ),
  import_deadline: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    "Hạn chót nhập điểm không hợp lệ"
  ),
  edit_deadline: z.string().refine(
    (date) => !isNaN(Date.parse(date)),
    "Hạn chót sửa điểm không hợp lệ"
  ),
  description: z.string().max(1000, "Mô tả không được vượt quá 1000 ký tự").optional()
}).refine(
  (data) => new Date(data.start_date) < new Date(data.end_date),
  {
    message: "Ngày bắt đầu phải trước ngày kết thúc",
    path: ["end_date"]
  }
).refine(
  (data) => new Date(data.import_deadline) <= new Date(data.edit_deadline),
  {
    message: "Hạn chót nhập điểm phải trước hoặc bằng hạn chót sửa điểm",
    path: ["edit_deadline"]
  }
).refine(
  (data) => new Date(data.import_deadline) <= new Date(data.end_date),
  {
    message: "Hạn chót nhập điểm phải trong khoảng thời gian báo cáo",
    path: ["import_deadline"]
  }
)

export type GradeReportingPeriodFormData = z.infer<typeof gradeReportingPeriodSchema>

// Update grade reporting period schema
export const updateGradeReportingPeriodSchema = gradeReportingPeriodSchema.extend({
  id: z.string().uuid("ID kỳ báo cáo không hợp lệ")
})

export type UpdateGradeReportingPeriodFormData = z.infer<typeof updateGradeReportingPeriodSchema>

// Student grade schema
export const studentGradeSchema = z.object({
  period_id: z.string().uuid("ID kỳ báo cáo không hợp lệ"),
  student_id: z.string().uuid("ID học sinh không hợp lệ"),
  subject_id: z.string().uuid("ID môn học không hợp lệ"),
  class_id: z.string().uuid("ID lớp học không hợp lệ"),
  grade_value: gradeValueSchema,
  grade_type: z.enum(gradeTypes, { message: "Loại điểm không hợp lệ" }),
  notes: z.string().max(500, "Ghi chú không được vượt quá 500 ký tự").optional()
})

export type StudentGradeFormData = z.infer<typeof studentGradeSchema>

// Bulk grade import schema
export const bulkGradeImportSchema = z.object({
  period_id: z.string().uuid("ID kỳ báo cáo không hợp lệ"),
  class_id: z.string().uuid("ID lớp học không hợp lệ"),
  subject_id: z.string().uuid("ID môn học không hợp lệ"),
  grade_type: z.enum(gradeTypes),
  grades: z.array(z.object({
    student_id: z.string().uuid("ID học sinh không hợp lệ"),
    student_code: z.string().min(1, "Mã học sinh là bắt buộc"),
    student_name: z.string().min(1, "Tên học sinh là bắt buộc"),
    grade_value: gradeValueSchema,
    notes: z.string().max(500).optional()
  })).min(1, "Phải có ít nhất một điểm số để nhập")
})

export type BulkGradeImportFormData = z.infer<typeof bulkGradeImportSchema>

// Grade audit log schema
export const gradeAuditLogSchema = z.object({
  grade_id: z.string().uuid("ID điểm số không hợp lệ"),
  old_value: gradeValueSchema.optional(),
  new_value: gradeValueSchema,
  change_reason: z.string()
    .min(10, "Lý do thay đổi phải có ít nhất 10 ký tự")
    .max(1000, "Lý do thay đổi không được vượt quá 1000 ký tự")
})

export type GradeAuditLogFormData = z.infer<typeof gradeAuditLogSchema>

// Excel import validation schema
export const excelImportSchema = z.object({
  period_id: z.string().uuid("ID kỳ báo cáo không hợp lệ"),
  class_id: z.string().uuid("ID lớp học không hợp lệ"),
  subject_id: z.string().uuid("ID môn học không hợp lệ"),
  grade_type: z.enum(gradeTypes),
  file: z.instanceof(File, { message: "File Excel là bắt buộc" })
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      "File không được vượt quá 10MB"
    )
    .refine(
      (file) => [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel'
      ].includes(file.type),
      "File phải có định dạng Excel (.xlsx hoặc .xls)"
    )
})

export type ExcelImportFormData = z.infer<typeof excelImportSchema>

// Grade filters schema
export const gradeFiltersSchema = z.object({
  period_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  grade_type: z.enum(gradeTypes).optional(),
  student_search: z.string().max(100).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

export type GradeFiltersFormData = z.infer<typeof gradeFiltersSchema>

// Grade statistics schema
export const gradeStatsSchema = z.object({
  period_id: z.string().uuid("ID kỳ báo cáo không hợp lệ"),
  class_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional()
})

export type GradeStatsFormData = z.infer<typeof gradeStatsSchema>

// VNedu Excel format validation
export const vnEduExcelRowSchema = z.object({
  stt: z.number().int().positive("STT phải là số nguyên dương"),
  ma_hoc_sinh: z.string().min(1, "Mã học sinh là bắt buộc"),
  ho_ten: z.string().min(1, "Họ tên là bắt buộc"),
  diem_so: z.union([
    z.number(),
    z.string().transform((val) => {
      const num = parseFloat(val.replace(',', '.'))
      if (isNaN(num)) throw new Error("Điểm số không hợp lệ")
      return num
    })
  ]).pipe(gradeValueSchema),
  ghi_chu: z.string().max(500).optional().default("")
})

export type VnEduExcelRow = z.infer<typeof vnEduExcelRowSchema>

// Export types for components
export interface GradeReportingPeriod {
  id: string
  name: string
  academic_year_id: string
  semester_id: string
  start_date: string
  end_date: string
  import_deadline: string
  edit_deadline: string
  description?: string
  is_active: boolean
  created_by: string
  created_at: string
  academic_year?: { name: string }
  semester?: { name: string }
  created_by_profile?: { full_name: string }
}

export interface StudentGrade {
  id: string
  period_id: string
  student_id: string
  subject_id: string
  class_id: string
  grade_value: number
  grade_type: GradeType
  notes?: string
  is_locked: boolean
  created_by: string
  created_at: string
  updated_at: string
  student?: { full_name: string; student_id: string }
  subject?: { name_vietnamese: string; code: string }
  class?: { name: string }
  created_by_profile?: { full_name: string }
}

export interface GradeAuditLog {
  id: string
  grade_id: string
  old_value?: number
  new_value: number
  change_reason: string
  changed_by: string
  changed_at: string
  changed_by_profile?: { full_name: string }
  grade?: StudentGrade
}

export interface GradeImportResult {
  id: string
  period_id: string
  filename: string
  total_records: number
  valid_records: number
  error_records: number
  import_status: 'processing' | 'completed' | 'failed'
  error_details?: Record<string, unknown>
  imported_by: string
  imported_at: string
  imported_by_profile?: { full_name: string }
}
