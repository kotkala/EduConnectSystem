import { z } from 'zod'

// Grade component type enum
export const gradeComponentTypes = [
  'regular_1', 'regular_2', 'regular_3', 'regular_4',
  'midterm', 'final',
  'semester_1', 'semester_2', 'yearly', 'summary'
] as const

export type GradeComponentType = typeof gradeComponentTypes[number]

// Validation schema for detailed grade
export const detailedGradeSchema = z.object({
  period_id: z.string().uuid(),
  student_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  class_id: z.string().uuid(),
  component_type: z.enum(gradeComponentTypes),
  grade_value: z.number().min(0).max(10).nullable()
})

export type DetailedGradeFormData = z.infer<typeof detailedGradeSchema>

// Bulk import schema for Excel data
export const bulkDetailedGradeSchema = z.object({
  period_id: z.string().uuid(),
  class_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  grade_type: z.enum(['semester1', 'semester2', 'yearly']),
  grades: z.array(z.object({
    student_id: z.string().uuid(),
    regular_grades: z.array(z.number().min(0).max(10).nullable()).optional(),
    midterm_grade: z.number().min(0).max(10).nullable().optional(),
    final_grade: z.number().min(0).max(10).nullable().optional(),
    semester_1_grade: z.number().min(0).max(10).nullable().optional(),
    semester_2_grade: z.number().min(0).max(10).nullable().optional(),
    yearly_grade: z.number().min(0).max(10).nullable().optional()
  }))
})

export type BulkDetailedGradeFormData = z.infer<typeof bulkDetailedGradeSchema>
