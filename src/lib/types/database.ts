// ============================================
// EduConnect Database Types
// Generated from PostgreSQL schema
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================
// ENUM TYPES
// ============================================

export type UserRole = 
  | 'admin'
  | 'school_administrator'
  | 'homeroom_teacher'
  | 'subject_teacher'
  | 'parent'
  | 'student'

export type UserStatus = 
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'locked'

export type TermType = 
  | 'semester_1'
  | 'semester_2'
  | 'summer'
  | 'full_year'

export type DayOfWeek = 
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type SubjectType = 
  | 'mandatory'
  | 'elective'

export type RequestStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export type NotificationType = 
  | 'system'
  | 'academic'
  | 'attendance'
  | 'behavior'
  | 'meeting'
  | 'grade'
  | 'general'

export type ViolationSeverity = 
  | 'minor'
  | 'moderate'
  | 'major'
  | 'critical'

export type MeetingFormat = 
  | 'in_person'
  | 'online'
  | 'hybrid'

export type GenderType = 
  | 'male'
  | 'female'
  | 'other'

export type StatusType = 
  | 'active'
  | 'inactive'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'suspended'
  | 'reported'
  | 'under_review'
  | 'confirmed'
  | 'resolved'
  | 'dismissed'

export type AttendanceStatus = 
  | 'present'
  | 'absent'
  | 'late'
  | 'excused'

export type DataClassification = 
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'

// ============================================
// CORE TABLE TYPES
// ============================================

export interface User {
  id: string
  phone: string
  full_name: string
  role: UserRole
  status: UserStatus
  gender?: GenderType
  date_of_birth?: string
  address?: string
  avatar_url?: string
  metadata: Json
  last_login_at?: string
  created_at: string
  updated_at: string
  created_by?: string
  data_classification: DataClassification
}

export interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  description?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface AcademicTerm {
  id: string
  academic_year_id: string
  name: string
  type: TermType
  start_date: string
  end_date: string
  is_current: boolean
  created_at: string
  updated_at: string
}

export interface GradeLevel {
  id: string
  name: string
  level: number
  description?: string
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  academic_year_id: string
  grade_level_id: string
  name: string
  code: string
  capacity: number
  room_number?: string
  is_combined: boolean
  metadata: Json
  created_at: string
  updated_at: string
  created_by?: string
}

export interface Subject {
  id: string
  code: string
  name: string
  description?: string
  credits: number
  metadata: Json
  created_at: string
  updated_at: string
  created_by?: string
}

export interface SubjectAssignment {
  id: string
  academic_term_id: string
  subject_id: string
  grade_level_id?: string
  class_id?: string
  type: SubjectType
  weekly_periods: number
  created_at: string
  updated_at: string
}

export interface StudentEnrollment {
  id: string
  student_id: string
  class_id: string
  academic_year_id: string
  enrollment_date: string
  withdrawal_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ParentStudentRelationship {
  id: string
  parent_id: string
  student_id: string
  relationship_type: string
  is_primary_contact: boolean
  created_at: string
}

export interface HomeroomAssignment {
  id: string
  teacher_id: string
  class_id: string
  academic_year_id: string
  assigned_date: string
  end_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export interface TimeSlot {
  id: string
  name: string
  start_time: string
  end_time: string
  slot_order: number
  order_index: number
  is_break: boolean
  created_at: string
}

export interface TeachingSchedule {
  id: string
  academic_term_id: string
  class_id: string
  subject_id: string
  teacher_id: string
  day_of_week: DayOfWeek
  time_slot_id: string
  week_number: number
  room_number?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export interface ScheduleChangeRequest {
  id: string
  schedule_id: string
  requested_by: string
  new_date?: string
  new_time_slot_id?: string
  reason: string
  status: RequestStatus
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
  updated_at: string
}

export interface AttendanceRecord {
  id: string
  student_id: string
  class_id: string
  schedule_id?: string
  date: string
  status: AttendanceStatus
  remarks?: string
  recorded_by: string
  created_at: string
  updated_at: string
}

export interface LeaveRequest {
  id: string
  student_id: string
  requested_by: string
  start_date: string
  end_date: string
  reason: string
  supporting_documents: Json
  status: RequestStatus
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
  updated_at: string
}

export interface ExamSchedule {
  id: string
  academic_term_id: string
  class_id: string
  subject_id: string
  exam_type: string
  exam_date: string
  start_time: string
  end_time: string
  room_number?: string
  max_score: number
  created_at: string
  updated_at: string
  created_by?: string
}

export interface GradeRecord {
  id: string
  student_id: string
  subject_id: string
  academic_term_id: string
  exam_schedule_id?: string
  score: number
  max_score: number
  grade_type: string
  remarks?: string
  recorded_by: string
  is_final: boolean
  created_at: string
  updated_at: string
}

export interface GradeReevaluationRequest {
  id: string
  grade_record_id: string
  requested_by: string
  reason: string
  status: RequestStatus
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  new_score?: number
  created_at: string
  updated_at: string
}

export interface ViolationRule {
  id: string
  code: string
  name: string
  description: string
  severity: ViolationSeverity
  penalty_points: number
  default_actions: Json
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export interface StudentViolation {
  id: string
  student_id: string
  violation_rule_id: string
  violation_date: string
  description: string
  evidence: Json
  reported_by: string
  status: StatusType
  created_at: string
  updated_at: string
}

export interface DisciplinaryAction {
  id: string
  violation_id: string
  action_type: string
  description: string
  start_date: string
  end_date?: string
  is_completed: boolean
  completion_notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface TeacherFeedback {
  id: string
  teacher_id: string
  student_id: string
  class_id: string
  subject_id?: string
  feedback_type: string
  feedback_date: string
  content: string
  rating?: number
  metadata: Json
  created_at: string
  updated_at: string
}

export interface ScheduleConstraint {
  id: string
  constraint_type: 'teacher_unavailable' | 'class_unavailable' | 'subject_consecutive' | 'subject_not_consecutive' | 'preferred_time' | 'avoid_time' | 'max_daily_lessons' | 'break_between_lessons'
  teacher_id?: string
  class_id?: string
  subject_id?: string
  time_slot_id?: string
  day_of_week?: DayOfWeek
  description?: string
  priority: 'low' | 'medium' | 'high'
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export interface TeacherAssignment {
  id: string
  academic_term_id: string
  teacher_id: string
  class_id: string
  subject_id: string
  assigned_date: string
  end_date?: string
  is_active: boolean
  notes?: string
  created_at: string
  updated_at: string
  created_by?: string
}

export interface CurriculumDistribution {
  id: string
  academic_term_id: string
  subject_id: string
  grade_level_id?: string
  class_id?: string
  type: SubjectType
  weekly_periods: number
  created_at: string
  updated_at: string
  subject_name?: string
  subject_code?: string
  subject_credits?: number
  grade_level_name?: string
  grade_level?: number
  class_name?: string
  class_code?: string
  academic_term_name?: string
}

export interface Notification {
  id: string
  recipient_id: string
  sender_id?: string
  type: NotificationType
  title: string
  content: string
  metadata: Json
  is_read: boolean
  read_at?: string
  created_at: string
  updated_at: string
}

export interface Meeting {
  id: string
  organizer_id: string
  title: string
  description?: string
  meeting_date: string
  start_time: string
  end_time: string
  location?: string
  format: MeetingFormat
  class_id?: string
  participants: Json
  agenda?: string
  notes?: string
  status: StatusType
  created_at: string
  updated_at: string
}

export interface SchoolPolicy {
  id: string
  title: string
  description: string
  content: string
  category: string
  version: string
  effective_date: string
  expiry_date?: string
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  entity_type: string
  entity_id?: string
  old_values?: Json
  new_values?: Json
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface Document {
  id: string
  entity_type: string
  entity_id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by: string
  created_at: string
}

// ============================================
// MATERIALIZED VIEW TYPES
// ============================================

export interface StudentPerformanceSummary {
  student_id: string
  full_name: string
  class_name: string
  average_score: number
  total_subjects: number
  attendance_rate: number
  violation_count: number
  academic_term_id: string
  last_updated: string
}

// ============================================
// RELATIONSHIP TYPES
// ============================================

export interface UserWithProfile extends User {
  student_enrollments?: StudentEnrollment[]
  parent_relationships?: ParentStudentRelationship[]
  teacher_assignments?: HomeroomAssignment[]
  teaching_schedules?: TeachingSchedule[]
}

export interface ClassWithDetails extends Class {
  academic_year: AcademicYear
  grade_level: GradeLevel
  students?: StudentEnrollment[]
  homeroom_teacher?: HomeroomAssignment & { teacher: User }
  teaching_schedules?: TeachingSchedule[]
}

export interface SubjectWithAssignments extends Subject {
  assignments?: SubjectAssignment[]
  teaching_schedules?: TeachingSchedule[]
  grade_records?: GradeRecord[]
}

export interface ScheduleWithDetails extends TeachingSchedule {
  academic_term: AcademicTerm
  class: Class
  subject: Subject
  teacher: User
  time_slot: TimeSlot
}

export interface AttendanceWithDetails extends AttendanceRecord {
  student: User
  class: Class
  schedule?: TeachingSchedule
  recorded_by_user: User
}

export interface GradeWithDetails extends GradeRecord {
  student: User
  subject: Subject
  academic_term: AcademicTerm
  exam_schedule?: ExamSchedule
  recorded_by_user: User
}

export interface NotificationWithDetails extends Notification {
  recipient: User
  sender?: User
}

// ============================================
// QUERY RESULT TYPES
// ============================================

export interface PaginatedResult<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

export interface FilterOptions {
  search?: string
  status?: string
  role?: UserRole
  academic_year_id?: string
  academic_term_id?: string
  class_id?: string
  subject_id?: string
  grade_level_id?: string
  date_from?: string
  date_to?: string
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface DashboardStats {
  total_students: number
  total_teachers: number
  total_classes: number
  total_subjects: number
  attendance_rate: number
  average_grade: number
  active_violations: number
  pending_requests: number
}

// ============================================
// FORM INPUT TYPES
// ============================================

export interface CreateUserInput {
  phone: string
  full_name: string
  role: UserRole
  email: string
  password: string
  gender?: GenderType
  date_of_birth?: string
  address?: string
  avatar_url?: string
}

export interface UpdateUserInput {
  phone?: string
  full_name?: string
  gender?: GenderType
  date_of_birth?: string
  address?: string
  avatar_url?: string
  status?: UserStatus
}

export interface CreateClassInput {
  academic_year_id: string
  grade_level_id: string
  name: string
  code: string
  capacity: number
  room_number?: string
  is_combined: boolean
}

export interface CreateSubjectInput {
  code: string
  name: string
  description?: string
  credits: number
}

export interface CreateScheduleInput {
  academic_term_id: string
  class_id: string
  subject_id: string
  teacher_id: string
  day_of_week: DayOfWeek
  time_slot_id: string
  week_number: number
  room_number?: string
  notes?: string
}

export interface RecordAttendanceInput {
  student_id: string
  class_id: string
  schedule_id?: string
  date: string
  status: AttendanceStatus
  remarks?: string
}

export interface CreateGradeInput {
  student_id: string
  subject_id: string
  academic_term_id: string
  exam_schedule_id?: string
  score: number
  max_score: number
  grade_type: string
  remarks?: string
}

export interface CreateNotificationInput {
  recipient_id: string
  type: NotificationType
  title: string
  content: string
  metadata?: Json
}

export interface CreateMeetingInput {
  title: string
  description?: string
  meeting_date: string
  start_time: string
  end_time: string
  location?: string
  format: MeetingFormat
  class_id?: string
  participants: string[]
  agenda?: string
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Json
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

// ============================================
// UTILITY TYPES
// ============================================

export type TableName = 
  | 'users'
  | 'academic_years'
  | 'academic_terms'
  | 'grade_levels'
  | 'classes'
  | 'subjects'
  | 'subject_assignments'
  | 'student_enrollments'
  | 'parent_student_relationships'
  | 'homeroom_assignments'
  | 'time_slots'
  | 'schedule_constraints'
  | 'teacher_assignments'
  | 'teaching_schedules'
  | 'schedule_change_requests'
  | 'attendance_records'
  | 'leave_requests'
  | 'exam_schedules'
  | 'grade_records'
  | 'grade_reevaluation_requests'
  | 'violation_rules'
  | 'student_violations'
  | 'disciplinary_actions'
  | 'teacher_feedback'
  | 'notifications'
  | 'meetings'
  | 'school_policies'
  | 'audit_logs'
  | 'documents'

export type DatabaseTables = {
  users: User
  academic_years: AcademicYear
  academic_terms: AcademicTerm
  grade_levels: GradeLevel
  classes: Class
  subjects: Subject
  subject_assignments: SubjectAssignment
  student_enrollments: StudentEnrollment
  parent_student_relationships: ParentStudentRelationship
  homeroom_assignments: HomeroomAssignment
  time_slots: TimeSlot
  schedule_constraints: ScheduleConstraint
  teacher_assignments: TeacherAssignment
  teaching_schedules: TeachingSchedule
  schedule_change_requests: ScheduleChangeRequest
  attendance_records: AttendanceRecord
  leave_requests: LeaveRequest
  exam_schedules: ExamSchedule
  grade_records: GradeRecord
  grade_reevaluation_requests: GradeReevaluationRequest
  violation_rules: ViolationRule
  student_violations: StudentViolation
  disciplinary_actions: DisciplinaryAction
  teacher_feedback: TeacherFeedback
  notifications: Notification
  meetings: Meeting
  school_policies: SchoolPolicy
  audit_logs: AuditLog
  documents: Document
}

export type Database = {
  public: {
    Tables: DatabaseTables
    Views: {
      student_performance_summary: {
        Row: StudentPerformanceSummary
      }
      curriculum_distribution: {
        Row: CurriculumDistribution
      }
    }
  }
} 