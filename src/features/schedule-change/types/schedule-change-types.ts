import { z } from 'zod'

// Validation schemas
export const scheduleChangeRequestSchema = z.object({
  academic_year_id: z.string().uuid(),
  semester_id: z.string().uuid(),
  week_number: z.number().min(1).max(52),
  change_date: z.string(),
  subject_id: z.string().uuid(),
  class_id: z.string().uuid(),
  original_period: z.number().min(1).max(10),
  reason: z.string().min(10, 'Lý do phải có ít nhất 10 ký tự')
})

export const adminResponseSchema = z.object({
  request_id: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  admin_response: z.string().min(5, 'Phản hồi phải có ít nhất 5 ký tự')
})

export type ScheduleChangeRequestFormData = z.infer<typeof scheduleChangeRequestSchema>
export type AdminResponseFormData = z.infer<typeof adminResponseSchema>

export interface ScheduleChangeRequest {
  id: string
  teacher_id: string
  academic_year_id: string
  semester_id: string
  week_number: number
  change_date: string
  subject_id: string
  class_id: string
  original_period: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_response: string | null
  admin_id: string | null
  responded_at: string | null
  created_at: string
  updated_at: string
  teacher: {
    id: string
    full_name: string
    email: string
  }
  academic_year: {
    id: string
    name: string
  }
  semester: {
    id: string
    name: string
  }
  subject: {
    id: string
    name_vietnamese: string
    code: string
  }
  class: {
    id: string
    name: string
  }
  admin?: {
    id: string
    full_name: string
  }
}
