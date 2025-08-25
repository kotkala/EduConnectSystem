import { z } from "zod"

// Subject combination configurations
export const SUBJECT_COMBINATIONS = {
  'khoa-hoc-tu-nhien': {
    name: 'Khoa học tự nhiên',
    variants: [
      {
        id: 'ly-hoa-sinh-tin',
        name: 'Lý - Hóa - Sinh - Tin',
        subjects: ['physics', 'chemistry', 'biology', 'informatics']
      },
      {
        id: 'ly-hoa-sinh-congnghe', 
        name: 'Lý - Hóa - Sinh - Công nghệ',
        subjects: ['physics', 'chemistry', 'biology', 'technology']
      }
    ]
  },
  'khoa-hoc-xa-hoi': {
    name: 'Khoa học xã hội',
    variants: [
      {
        id: 'dia-gdkt-ly-congnghe',
        name: 'Địa - GDKT - Lý - Công nghệ', 
        subjects: ['geography', 'civic_education', 'physics', 'technology']
      },
      {
        id: 'dia-gdkt',
        name: 'Địa - GDKT',
        subjects: ['geography', 'civic_education']
      }
    ]
  }
} as const

// Extract valid combination types and variants for validation
const combinationTypes = Object.keys(SUBJECT_COMBINATIONS) as [string, ...string[]]
const allVariants = Object.values(SUBJECT_COMBINATIONS).flatMap(combo => 
  combo.variants.map(variant => variant.id)
) as [string, ...string[]]

// Class validation schemas
export const classSchema = z.object({
  name: z.string()
    .min(1, "Class name is required")
    .max(100, "Class name must be 100 characters or less")
    .optional(), // Optional when using auto-generation
  class_block_id: z.string().uuid("Invalid class block ID").optional(),
  class_suffix: z.string()
    .min(1, "Class suffix is required when using class blocks")
    .max(20, "Class suffix must be 20 characters or less")
    .regex(/^[A-Z0-9]+$/, "Class suffix must contain only uppercase letters and numbers")
    .optional(),
  auto_generated_name: z.boolean().default(false),
  academic_year_id: z.string().uuid("Invalid academic year ID"),
  semester_id: z.string().uuid("Invalid semester ID"),
  is_subject_combination: z.boolean().default(false),
  subject_combination_type: z.enum(combinationTypes).optional(),
  subject_combination_variant: z.enum(allVariants).optional(),
  homeroom_teacher_id: z.string().uuid("Invalid teacher ID").optional(),
  max_students: z.number()
    .int("Max students must be an integer")
    .min(1, "Max students must be at least 1")
    .max(100, "Max students cannot exceed 100")
    .default(40),
  description: z.string().max(500, "Description must be 500 characters or less").optional()
}).refine((data) => {
  // If auto_generated_name is true, require class_block_id and class_suffix
  if (data.auto_generated_name) {
    return data.class_block_id && data.class_suffix
  }
  // If auto_generated_name is false, require name
  return data.name && data.name.length > 0
}, {
  message: "Either provide a class name or select a class block with suffix",
  path: ["name"]
}).refine((data) => {
  // If is_subject_combination is true, both type and variant must be provided
  if (data.is_subject_combination) {
    return data.subject_combination_type && data.subject_combination_variant
  }
  // If is_subject_combination is false, neither type nor variant should be provided
  return !data.subject_combination_type && !data.subject_combination_variant
}, {
  message: "Subject combination type and variant are required when creating a combined class",
  path: ["subject_combination_type"]
}).refine((data) => {
  // Validate that the variant belongs to the selected type
  if (data.is_subject_combination && data.subject_combination_type && data.subject_combination_variant) {
    const selectedType = SUBJECT_COMBINATIONS[data.subject_combination_type as keyof typeof SUBJECT_COMBINATIONS]
    return selectedType?.variants.some(variant => variant.id === data.subject_combination_variant)
  }
  return true
}, {
  message: "Selected variant does not belong to the chosen subject combination type",
  path: ["subject_combination_variant"]
})

export const updateClassSchema = classSchema.safeExtend({
  id: z.string().uuid("Invalid class ID")
})

// Student assignment schemas
export const studentAssignmentSchema = z.object({
  student_id: z.string().uuid("Invalid student ID"),
  class_id: z.string().uuid("Invalid class ID"),
  assignment_type: z.literal("student")
})

export const bulkStudentAssignmentSchema = z.object({
  assignments: z.array(studentAssignmentSchema).min(1, "At least one assignment is required")
})

// Filter schemas
export const classFiltersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  academic_year_id: z.string().uuid().optional(),
  semester_id: z.string().uuid().optional(),
  is_subject_combination: z.boolean().optional(),
  subject_combination_type: z.enum(combinationTypes).optional(),
  homeroom_teacher_id: z.string().uuid().optional()
})

// Type exports
export type ClassFormData = z.infer<typeof classSchema>
export type UpdateClassFormData = z.infer<typeof updateClassSchema>
export type StudentAssignmentFormData = z.infer<typeof studentAssignmentSchema>
export type BulkStudentAssignmentFormData = z.infer<typeof bulkStudentAssignmentSchema>
export type ClassFilters = z.infer<typeof classFiltersSchema>

// Database types
export interface Class {
  id: string
  name: string
  class_block_id: string | null
  class_suffix: string | null
  auto_generated_name: boolean
  academic_year_id: string
  semester_id: string
  is_subject_combination: boolean
  subject_combination_type: string | null
  subject_combination_variant: string | null
  homeroom_teacher_id: string | null
  max_students: number
  current_students: number
  description: string | null
  created_at: string
  updated_at: string
}

export interface ClassWithDetails extends Class {
  academic_year: {
    name: string
  }
  semester: {
    name: string
  }
  class_block: {
    id: string
    name: string
    display_name: string
  } | null
  homeroom_teacher: {
    full_name: string
    employee_id: string
  } | null
}

export interface StudentClassAssignment {
  id: string
  student_id: string
  class_id: string
  assignment_type: 'main' | 'combined'
  assigned_at: string
}

export interface StudentWithClassAssignments {
  id: string
  full_name: string
  student_id: string
  main_class: Class | null
  combined_class: Class | null
}

// Helper functions
export function getSubjectCombinationName(type: string, variant: string): string {
  const combinationType = SUBJECT_COMBINATIONS[type as keyof typeof SUBJECT_COMBINATIONS]
  if (!combinationType) return 'Unknown'
  
  const variantInfo = combinationType.variants.find(v => v.id === variant)
  return variantInfo ? variantInfo.name : 'Unknown'
}

export function getSubjectCombinationSubjects(type: string, variant: string): readonly string[] {
  const combinationType = SUBJECT_COMBINATIONS[type as keyof typeof SUBJECT_COMBINATIONS]
  if (!combinationType) return []

  const variantInfo = combinationType.variants.find(v => v.id === variant)
  return variantInfo ? variantInfo.subjects : []
}
