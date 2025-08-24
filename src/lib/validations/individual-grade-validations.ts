import { z } from 'zod'

// Grade submission status enum
export const gradeSubmissionStatuses = ['draft', 'submitted', 'sent_to_teacher', 'sent_to_parent'] as const

// Student grade submission validation schemas
export const studentGradeSubmissionSchema = z.object({
  academic_year_id: z.string().uuid("Invalid academic year ID"),
  semester_id: z.string().uuid("Invalid semester ID"),
  class_id: z.string().uuid("Invalid class ID"),
  student_id: z.string().uuid("Invalid student ID"),
  submission_name: z.string()
    .min(1, "Submission name is required")
    .max(255, "Submission name must be 255 characters or less"),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional()
})

export const updateStudentGradeSubmissionSchema = studentGradeSubmissionSchema.safeExtend({
  id: z.string().uuid("Invalid submission ID"),
  status: z.enum(gradeSubmissionStatuses).optional()
})

// Individual subject grade validation schemas
export const individualSubjectGradeSchema = z.object({
  submission_id: z.string().uuid("Invalid submission ID"),
  subject_id: z.string().uuid("Invalid subject ID"),
  midterm_grade: z.number()
    .min(0, "Grade must be between 0 and 10")
    .max(10, "Grade must be between 0 and 10")
    .optional(),
  final_grade: z.number()
    .min(0, "Grade must be between 0 and 10")
    .max(10, "Grade must be between 0 and 10")
    .optional(),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional()
})

export const bulkIndividualGradesSchema = z.object({
  submission_id: z.string().uuid("Invalid submission ID"),
  grades: z.array(individualSubjectGradeSchema.omit({ submission_id: true })).min(1, "At least one grade is required")
})

// Filter schemas
export const submissionFiltersSchema = z.object({
  academic_year_id: z.string().uuid().optional(),
  semester_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  status: z.enum(gradeSubmissionStatuses).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional()
})

// Excel import schema for individual grades
export const individualExcelImportSchema = z.object({
  submission_id: z.string().uuid("Invalid submission ID"),
  excel_data: z.array(z.object({
    subject_id: z.string(),
    subject_name: z.string(),
    midterm_grade: z.number().optional(),
    final_grade: z.number().optional(),
    notes: z.string().optional()
  })).min(1, "Excel data is required")
})

// Type exports
export type StudentGradeSubmissionFormData = z.infer<typeof studentGradeSubmissionSchema>
export type UpdateStudentGradeSubmissionFormData = z.infer<typeof updateStudentGradeSubmissionSchema>
export type IndividualSubjectGradeFormData = z.infer<typeof individualSubjectGradeSchema>
export type BulkIndividualGradesFormData = z.infer<typeof bulkIndividualGradesSchema>
export type SubmissionFilters = z.infer<typeof submissionFiltersSchema>
export type IndividualExcelImportFormData = z.infer<typeof individualExcelImportSchema>

// Database types
export interface StudentGradeSubmission {
  id: string
  academic_year_id: string
  semester_id: string
  class_id: string
  student_id: string
  submission_name: string
  status: 'draft' | 'submitted' | 'sent_to_teacher'
  created_by: string | null
  submitted_at: string | null
  sent_to_teacher_at: string | null
  excel_file_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StudentGradeSubmissionWithDetails extends StudentGradeSubmission {
  student: {
    id: string
    full_name: string
    student_id: string
    email: string
  }
  created_by_profile?: {
    full_name: string
  }
}

export interface IndividualSubjectGrade {
  id: string
  submission_id: string
  subject_id: string
  midterm_grade: number | null
  final_grade: number | null
  average_grade: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface IndividualSubjectGradeWithDetails extends IndividualSubjectGrade {
  subject: {
    id: string
    code: string
    name_vietnamese: string
    name_english: string
    category: string
  }
}

export interface ClassGradeSummary {
  id: string
  academic_year_id: string
  semester_id: string
  class_id: string
  summary_name: string
  total_students: number
  submitted_students: number
  sent_by: string | null
  sent_at: string | null
  created_at: string
  updated_at: string
}
