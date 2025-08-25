import { z } from "zod"

// Gender enum
export const genderEnum = z.enum(['male', 'female'], {
  message: "Gender is required"
})

// Relationship type enum
export const relationshipTypeEnum = z.enum(['father', 'mother', 'guardian'], {
  message: "Relationship type is required"
})

// Base user fields
const baseUserFields = {
  full_name: z.string()
    .min(1, "Name is required")
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z.string()
    .min(1, "Email is required")
    .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format"),
  phone_number: z.string()
    .min(1, "Phone number is required")
    .regex(/^[\d+\-\s()]+$/, "Invalid phone number format"),
  gender: genderEnum,
  date_of_birth: z.string()
    .min(1, "Date of birth is required")
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      return birthDate <= today
    }, "Date of birth cannot be in the future")
    .refine((date) => {
      const birthDate = new Date(date)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      const dayDiff = today.getDate() - birthDate.getDate()

      // Adjust age if birthday hasn't occurred this year
      const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age

      return actualAge >= 0 && actualAge <= 150
    }, "Age must be between 0 and 150 years"),
  address: z.string()
    .min(1, "Address is required")
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address must be less than 500 characters")
}

// Teacher validation schema
export const teacherSchema = z.object({
  employee_id: z.string()
    .min(1, "Employee ID is required")
    .regex(/^[A-Z0-9]+$/, "Employee ID must contain only uppercase letters and numbers")
    .min(3, "Employee ID must be at least 3 characters")
    .max(20, "Employee ID must be less than 20 characters"),
  ...baseUserFields
}).refine((data) => {
  const birthDate = new Date(data.date_of_birth)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()
  const dayDiff = today.getDate() - birthDate.getDate()

  // Adjust age if birthday hasn't occurred this year
  const actualAge = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) ? age - 1 : age

  return actualAge >= 18
}, {
  message: "Teacher must be at least 18 years old",
  path: ["date_of_birth"]
})

// Student validation schema
export const studentSchema = z.object({
  student_id: z.string()
    .min(1, "Student ID is required")
    .regex(/^[A-Z0-9]+$/, "Student ID must contain only uppercase letters and numbers")
    .min(3, "Student ID must be at least 3 characters")
    .max(20, "Student ID must be less than 20 characters"),
  ...baseUserFields
})

// Parent validation schema
export const parentSchema = z.object({
  ...baseUserFields,
  relationship_type: relationshipTypeEnum,
  is_primary_contact: z.boolean()
})

// Student + Parent combined schema (mandatory relationship)
export const studentParentSchema = z.object({
  student: studentSchema,
  parent: parentSchema
}).refine((data) => {
  // Ensure student and parent don't have the same email
  return data.student.email !== data.parent.email
}, {
  message: "Student and parent cannot have the same email address",
  path: ["parent", "email"]
}).refine((data) => {
  // Ensure student and parent don't have the same phone
  return data.student.phone_number !== data.parent.phone_number
}, {
  message: "Student and parent cannot have the same phone number",
  path: ["parent", "phone_number"]
}).refine((data) => {
  // Ensure parent is at least 18 years older than student
  const studentBirthDate = new Date(data.student.date_of_birth)
  const parentBirthDate = new Date(data.parent.date_of_birth)

  // Calculate parent age when student was born
  const parentAgeWhenStudentBorn = studentBirthDate.getFullYear() - parentBirthDate.getFullYear()
  const monthDiff = studentBirthDate.getMonth() - parentBirthDate.getMonth()
  const dayDiff = studentBirthDate.getDate() - parentBirthDate.getDate()

  // Adjust age if parent's birthday hadn't occurred yet when student was born
  const actualParentAgeWhenStudentBorn = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0))
    ? parentAgeWhenStudentBorn - 1
    : parentAgeWhenStudentBorn

  return actualParentAgeWhenStudentBorn >= 18
}, {
  message: "Parent must be at least 18 years older than student",
  path: ["parent", "date_of_birth"]
})

// Update schemas for editing
export const updateTeacherSchema = teacherSchema.partial().safeExtend({
  id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Invalid teacher ID")
})

export const updateStudentParentSchema = z.object({
  student_id: z.string().regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i, "Invalid student ID"),
  student: studentSchema.partial(),
  parent: parentSchema.partial()
}).refine((data) => {
  // Only validate email uniqueness if both emails are provided
  if (data.student.email && data.parent.email) {
    return data.student.email !== data.parent.email
  }
  return true
}, {
  message: "Student and parent cannot have the same email address",
  path: ["parent", "email"]
}).refine((data) => {
  // Only validate age difference if both dates of birth are provided
  if (data.student.date_of_birth && data.parent.date_of_birth) {
    const studentBirthDate = new Date(data.student.date_of_birth)
    const parentBirthDate = new Date(data.parent.date_of_birth)

    // Calculate parent age when student was born
    const parentAgeWhenStudentBorn = studentBirthDate.getFullYear() - parentBirthDate.getFullYear()
    const monthDiff = studentBirthDate.getMonth() - parentBirthDate.getMonth()
    const dayDiff = studentBirthDate.getDate() - parentBirthDate.getDate()

    // Adjust age if parent's birthday hadn't occurred yet when student was born
    const actualParentAgeWhenStudentBorn = (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0))
      ? parentAgeWhenStudentBorn - 1
      : parentAgeWhenStudentBorn

    return actualParentAgeWhenStudentBorn >= 18
  }
  return true
}, {
  message: "Parent must be at least 18 years older than student",
  path: ["parent", "date_of_birth"]
})

// Filter schemas
export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(['teacher', 'student', 'parent']).optional(),
  gender: genderEnum.optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
})

// Type exports
export type TeacherFormData = z.infer<typeof teacherSchema>
export type StudentFormData = z.infer<typeof studentSchema>
export type ParentFormData = z.infer<typeof parentSchema>
export type StudentParentFormData = z.infer<typeof studentParentSchema>
export type UpdateTeacherFormData = z.infer<typeof updateTeacherSchema>
export type UpdateStudentParentFormData = z.infer<typeof updateStudentParentSchema>
export type UserFilters = z.infer<typeof userFiltersSchema>

// Extended profile type for user management
export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'teacher' | 'student' | 'parent'
  phone_number: string | null
  gender: 'male' | 'female' | 'other' | null
  date_of_birth: string | null
  address: string | null
  employee_id: string | null
  student_id: string | null
  homeroom_enabled: boolean
  created_at: string
  updated_at: string
}

// Teacher with homeroom info
export interface TeacherProfile extends UserProfile {
  role: 'teacher'
  employee_id: string
  homeroom_enabled: boolean
}

// Student with parent relationship
export interface StudentWithParent extends UserProfile {
  role: 'student'
  student_id: string
  parent_relationship?: {
    id: string
    parent: UserProfile
    relationship_type: 'father' | 'mother' | 'guardian'
    is_primary_contact: boolean
  }
}

// Parent with student relationships
export interface ParentWithStudents extends UserProfile {
  role: 'parent'
  student_relationships?: {
    id: string
    student: UserProfile
    relationship_type: 'father' | 'mother' | 'guardian'
    is_primary_contact: boolean
  }[]
}
