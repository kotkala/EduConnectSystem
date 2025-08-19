export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      timetable_events: {
        Row: {
          class_id: string | null
          classroom_id: string | null
          created_at: string | null
          day_of_week: number
          end_time: string
          exchange_request_id: string | null
          id: string
          notes: string | null
          semester_id: string | null
          start_time: string
          subject_id: string | null
          substitute_date: string | null
          substitute_teacher_id: string | null
          teacher_id: string | null
          updated_at: string | null
          week_number: number
        }
      }
      subjects: {
        Row: {
          category: 'core' | 'specialized'
          code: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name_english: string
          name_vietnamese: string
          updated_at: string | null
        }
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          employee_id: string | null
          full_name: string | null
          gender: string | null
          homeroom_enabled: boolean | null
          id: string
          phone_number: string | null
          role: 'admin' | 'teacher' | 'student' | 'parent'
          student_id: string | null
          updated_at: string | null
        }
      }
      classrooms: {
        Row: {
          building: string | null
          capacity: number | null
          created_at: string | null
          equipment: string[] | null
          floor: number | null
          id: string
          is_active: boolean | null
          name: string
          room_type: string | null
          updated_at: string | null
        }
      }
      classes: {
        Row: {
          academic_year_id: string | null
          auto_generated_name: boolean | null
          class_block_id: string | null
          class_suffix: string | null
          created_at: string | null
          current_students: number | null
          description: string | null
          homeroom_teacher_id: string | null
          id: string
          is_subject_combination: boolean | null
          max_students: number | null
          name: string
          semester_id: string | null
          subject_combination_type: string | null
          subject_combination_variant: string | null
          updated_at: string | null
        }
      }
    }
  }
}

// Type helper to get proper joined data types
export type TimetableEventWithRelations = Database['public']['Tables']['timetable_events']['Row'] & {
  subjects?: Database['public']['Tables']['subjects']['Row'] | null
  profiles?: Database['public']['Tables']['profiles']['Row'] | null
  classrooms?: Database['public']['Tables']['classrooms']['Row'] | null
  classes?: Database['public']['Tables']['classes']['Row'] | null
}

export type TimetableEventProcessed = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  week_number: number
  notes?: string | null
  created_at: string | null
  subject?: {
    id: string
    code: string
    name_vietnamese: string
    category: 'core' | 'specialized'
  } | null
  teacher?: {
    id: string
    full_name: string | null
    avatar_url?: string | null
  } | null
  classroom?: {
    name: string
    building?: string | null
    floor?: number | null
  } | null
  class?: {
    id: string
    name: string
  } | null
}
