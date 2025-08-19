import { z } from 'zod'

// Homeroom class information schema
export const homeroomClassSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  academic_year_name: z.string(),
  semester_name: z.string(),
  student_count: z.number().int().min(0)
})

export type HomeroomClass = z.infer<typeof homeroomClassSchema>

// Parent information schema
export const homeroomParentSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  email: z.string().email(),
  phone_number: z.string().optional(),
  relationship_type: z.string(),
  is_primary_contact: z.boolean()
})

export type HomeroomParent = z.infer<typeof homeroomParentSchema>

// Student with parents schema
export const homeroomStudentSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  email: z.string().email(),
  student_id: z.string(),
  phone_number: z.string().optional(),
  gender: z.string().optional(),
  date_of_birth: z.string().optional(),
  address: z.string().optional(),
  avatar_url: z.string().optional(),
  parents: z.array(homeroomParentSchema)
})

export type HomeroomStudent = z.infer<typeof homeroomStudentSchema>

// Filters for student list
export const homeroomFiltersSchema = z.object({
  search: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'all']).optional(),
  has_parents: z.boolean().optional(),
  sort_by: z.enum(['name', 'student_id', 'email']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc')
})

export type HomeroomFilters = z.infer<typeof homeroomFiltersSchema>

// Student detail view schema
export const studentDetailSchema = z.object({
  student: homeroomStudentSchema,
  class_info: homeroomClassSchema
})

export type StudentDetail = z.infer<typeof studentDetailSchema>
