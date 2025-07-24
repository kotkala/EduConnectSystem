import { z } from 'zod'

// Classroom validation schemas
export const classroomSchema = z.object({
  name: z.string()
    .min(1, 'Classroom name is required')
    .max(50, 'Classroom name must be less than 50 characters')
    .regex(/^[A-Za-z0-9\-_\s]+$/, 'Classroom name can only contain letters, numbers, hyphens, underscores, and spaces'),
  building: z.string()
    .max(50, 'Building name must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  floor: z.number()
    .int('Floor must be a whole number')
    .min(1, 'Floor must be at least 1')
    .max(20, 'Floor cannot exceed 20')
    .optional(),
  capacity: z.number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(200, 'Capacity cannot exceed 200')
    .default(40),
  room_type: z.enum(['standard', 'lab', 'computer', 'auditorium', 'gym', 'library']).default('standard'),
  equipment: z.array(z.string()).default([]),
  is_active: z.boolean().default(true)
})

export const updateClassroomSchema = classroomSchema.partial().extend({
  id: z.string().uuid('Invalid classroom ID')
})

export const classroomFiltersSchema = z.object({
  search: z.string().optional(),
  building: z.string().optional(),
  room_type: z.string().optional(),
  is_active: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10)
})

// Timetable event validation schemas
export const timetableEventSchema = z.object({
  class_id: z.string().uuid('Please select a valid class'),
  subject_id: z.string().uuid('Please select a valid subject'),
  teacher_id: z.string().uuid('Please select a valid teacher'),
  classroom_id: z.string().uuid('Please select a valid classroom'),
  semester_id: z.string().uuid('Please select a valid semester'),
  day_of_week: z.number()
    .int('Day of week must be a number')
    .min(0, 'Invalid day of week')
    .max(6, 'Invalid day of week'),
  start_time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format'),
  end_time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format'),
  week_number: z.number()
    .int('Week number must be a whole number')
    .min(1, 'Week number must be at least 1')
    .max(52, 'Week number cannot exceed 52'),
  notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
}).refine((data) => {
  // Validate that end_time is after start_time
  const startTime = new Date(`1970-01-01T${data.start_time}:00`)
  const endTime = new Date(`1970-01-01T${data.end_time}:00`)
  return endTime > startTime
}, {
  message: 'End time must be after start time',
  path: ['end_time']
})

export const updateTimetableEventSchema = timetableEventSchema.partial().extend({
  id: z.string().uuid('Invalid event ID')
})

export const timetableFiltersSchema = z.object({
  class_id: z.string().uuid().optional(),
  semester_id: z.string().uuid().optional(),
  week_number: z.number().int().min(1).max(52).optional(),
  teacher_id: z.string().uuid().optional(),
  classroom_id: z.string().uuid().optional(),
  day_of_week: z.number().int().min(0).max(6).optional()
})

// Week selection schema
export const weekSelectionSchema = z.object({
  academic_year_id: z.string().uuid('Please select an academic year'),
  semester_id: z.string().uuid('Please select a semester'),
  class_block_id: z.string().uuid('Please select a class block'),
  class_id: z.string().uuid('Please select a class'),
  week_number: z.number().int().min(1).max(52, 'Week number must be between 1 and 52')
})

// Time slot schema for calendar
export const timeSlotSchema = z.object({
  hour: z.number().int().min(7).max(17), // 7 AM to 5 PM
  minute: z.number().int().min(0).max(45).multipleOf(15), // 0, 15, 30, 45
  duration: z.number().int().default(45) // Default 45 minutes
})

// Type exports
export type ClassroomFormData = z.infer<typeof classroomSchema>
export type UpdateClassroomFormData = z.infer<typeof updateClassroomSchema>
export type ClassroomFilters = z.infer<typeof classroomFiltersSchema>

export type TimetableEventFormData = z.infer<typeof timetableEventSchema>
export type UpdateTimetableEventFormData = z.infer<typeof updateTimetableEventSchema>
export type TimetableFilters = z.infer<typeof timetableFiltersSchema>

export type WeekSelectionFormData = z.infer<typeof weekSelectionSchema>
export type TimeSlot = z.infer<typeof timeSlotSchema>

// Database types
export interface Classroom {
  id: string
  name: string
  building: string | null
  floor: number | null
  capacity: number
  room_type: string
  equipment: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimetableEvent {
  id: string
  class_id: string
  subject_id: string
  teacher_id: string
  classroom_id: string
  semester_id: string
  day_of_week: number
  start_time: string
  end_time: string
  week_number: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TimetableEventDetailed extends TimetableEvent {
  class_name: string
  subject_code: string
  subject_name: string
  teacher_name: string
  classroom_name: string
  building: string | null
  floor: number | null
  room_type: string
  semester_name: string
  academic_year_name: string
}

// Calendar event type for integration with experiment-06 calendar
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: Date
  end: Date
  color: 'emerald' | 'orange' | 'violet' | 'blue' | 'rose'
  location?: string
  allDay?: boolean
  // Additional timetable-specific properties
  subject_code?: string
  teacher_name?: string
  classroom_name?: string
  class_name?: string
}

// Helper functions for time calculations
export const calculateEndTime = (startTime: string, durationMinutes: number = 45): string => {
  const [hours, minutes] = startTime.split(':').map(Number)
  const startDate = new Date()
  startDate.setHours(hours, minutes, 0, 0)
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000)
  
  return `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
}

export const getDayName = (dayOfWeek: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayOfWeek] || 'Unknown'
}

export const getWeeksInSemester = (semesterStartDate: Date, semesterEndDate: Date): number[] => {
  const weeks: number[] = []
  const currentDate = new Date(semesterStartDate)
  let weekNumber = 1
  
  while (currentDate <= semesterEndDate && weekNumber <= 52) {
    weeks.push(weekNumber)
    currentDate.setDate(currentDate.getDate() + 7)
    weekNumber++
  }
  
  return weeks
}

// Room type options for forms
export const ROOM_TYPES = [
  { value: 'standard', label: 'Standard Classroom' },
  { value: 'lab', label: 'Laboratory' },
  { value: 'computer', label: 'Computer Lab' },
  { value: 'auditorium', label: 'Auditorium' },
  { value: 'gym', label: 'Gymnasium' },
  { value: 'library', label: 'Library' }
] as const

// Equipment options for classrooms
export const EQUIPMENT_OPTIONS = [
  'Projector',
  'Whiteboard',
  'Smart Board',
  'Computer',
  'Audio System',
  'Air Conditioning',
  'Laboratory Equipment',
  'Sports Equipment',
  'Musical Instruments'
] as const
