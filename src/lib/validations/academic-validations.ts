import { z } from "zod"

// Academic Year validation schemas
export const academicYearSchema = z.object({
  name: z.string()
    .min(1, "Academic year name is required")
    .max(20, "Academic year name must be 20 characters or less")
    .regex(/^\d{4}-\d{4}$/, "Academic year must be in format YYYY-YYYY (e.g., 2024-2025)"),
  start_date: z.string()
    .min(1, "Start date is required")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  end_date: z.string()
    .min(1, "End date is required")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  is_current: z.boolean().default(false)
}).refine((data) => {
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  return endDate > startDate
}, {
  message: "End date must be after start date",
  path: ["end_date"]
})

export const updateAcademicYearSchema = academicYearSchema.safeExtend({
  id: z.string().uuid("Invalid academic year ID")
})

// Semester validation schemas
export const semesterSchema = z.object({
  academic_year_id: z.string().uuid("Invalid academic year ID"),
  name: z.string()
    .min(1, "Semester name is required")
    .max(50, "Semester name must be 50 characters or less"),
  semester_number: z.number()
    .int("Semester number must be an integer")
    .min(1, "Semester number must be 1 or 2")
    .max(2, "Semester number must be 1 or 2"),
  start_date: z.string()
    .min(1, "Start date is required")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  end_date: z.string()
    .min(1, "End date is required")
    .refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  weeks_count: z.number()
    .int("Weeks count must be an integer")
    .min(1, "Weeks count must be at least 1")
    .max(30, "Weeks count cannot exceed 30"),
  is_current: z.boolean().default(false)
}).refine((data) => {
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  return endDate > startDate
}, {
  message: "End date must be after start date",
  path: ["end_date"]
})

export const updateSemesterSchema = semesterSchema.safeExtend({
  id: z.string().uuid("Invalid semester ID")
})

// Filter schemas
export const academicFiltersSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  is_current: z.boolean().optional()
})

// Type exports
export type AcademicYearFormData = z.infer<typeof academicYearSchema>
export type UpdateAcademicYearFormData = z.infer<typeof updateAcademicYearSchema>
export type SemesterFormData = z.infer<typeof semesterSchema>
export type UpdateSemesterFormData = z.infer<typeof updateSemesterSchema>
export type AcademicFilters = z.infer<typeof academicFiltersSchema>

// Database types
export interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  created_at: string
  updated_at: string
}

export interface Semester {
  id: string
  academic_year_id: string
  name: string
  semester_number: number
  start_date: string
  end_date: string
  weeks_count: number
  is_current: boolean
  created_at: string
  updated_at: string
}

export interface SemesterWithAcademicYear extends Semester {
  academic_year: {
    name: string
  }
}

export interface AcademicYearWithSemesters extends AcademicYear {
  semesters: Semester[]
}
