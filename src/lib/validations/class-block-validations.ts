import { z } from "zod"

// Class Block Schema
export const classBlockSchema = z.object({
  name: z.string()
    .min(1, "Block name is required")
    .max(50, "Block name must be less than 50 characters")
    .regex(/^\d+$/, "Block name must contain only numbers"),
  display_name: z.string()
    .min(1, "Display name is required")
    .max(100, "Display name must be less than 100 characters"),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0)
})

export const updateClassBlockSchema = classBlockSchema.partial().safeExtend({
  id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, 'Invalid class block ID')
})

// Class Block Filters
export const classBlockFiltersSchema = z.object({
  search: z.string().optional(),
  is_active: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

// Types
export type ClassBlockFormData = z.infer<typeof classBlockSchema>
export type UpdateClassBlockFormData = z.infer<typeof updateClassBlockSchema>
export type ClassBlockFilters = z.infer<typeof classBlockFiltersSchema>

export interface ClassBlock {
  id: string
  name: string
  display_name: string
  description?: string
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface ClassBlockWithStats extends ClassBlock {
  class_count: number
  student_count: number
}

// Student Assignment Schema
export const studentAssignmentSchema = z.object({
  student_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid student ID"),
  class_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid class ID"),
  assignment_type: z.literal("student")
})

export const bulkStudentAssignmentSchema = z.object({
  student_ids: z.array(z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)).min(1, "At least one student must be selected"),
  class_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid class ID"),
  assignment_type: z.literal("student")
})

export type StudentAssignmentFormData = z.infer<typeof studentAssignmentSchema>
export type BulkStudentAssignmentFormData = z.infer<typeof bulkStudentAssignmentSchema>

export interface StudentClassAssignment {
  id: string
  student_id: string
  class_id: string
  assignment_type: "student"
  assigned_at: string
  assigned_by?: string
  is_active: boolean
  student?: {
    id: string
    full_name: string
    email: string
    student_id: string
  }
  class?: {
    id: string
    name: string
    class_block?: {
      name: string
      display_name: string
    }
  }
}

// Class Assignment Filters
export const classAssignmentFiltersSchema = z.object({
  class_id: z.string().regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).optional(),
  assignment_type: z.enum(["student"]).optional(),
  is_active: z.boolean().optional(),
  search: z.string().optional(), // Search by student name or ID
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

export type ClassAssignmentFilters = z.infer<typeof classAssignmentFiltersSchema>

// Available Students (not assigned to a specific assignment type)
export interface AvailableStudent {
  id: string
  full_name: string
  email: string
  student_id: string
}
