# EduConnect Database ERD Conversion (dbdiagram.io Syntax)

## Overview

This document provides a **complete** conversion of the EduConnect PostgreSQL database schema to [dbdiagram.io](https://dbdiagram.io) syntax (DBML) for full visualization and collaboration. All tables, columns, and relationships are included.

---

## Full DBML Schema

Table users {
  id uuid [pk]
  phone text [unique, not null]
  full_name text [not null]
  role user_role [not null] // enum
  status user_status // enum
  gender gender_type // enum
  date_of_birth date
  address text
  avatar_url text
  metadata jsonb
  last_login_at timestamptz
  created_at timestamptz
  updated_at timestamptz
  created_by uuid [ref: - users.id]
  data_classification text
}

Table academic_years {
  id uuid [pk]
  name text [unique, not null]
  start_date date [not null]
  end_date date [not null]
  is_current boolean
  description text
  created_at timestamptz
  updated_at timestamptz
  created_by uuid [ref: - users.id]
}

Table academic_terms {
  id uuid [pk]
  academic_year_id uuid [not null, ref: > academic_years.id]
  name text [not null]
  type term_type [not null] // enum
  start_date date [not null]
  end_date date [not null]
  is_current boolean
  created_at timestamptz
  updated_at timestamptz
}

Table grade_levels {
  id uuid [pk]
  name text [unique, not null]
  level int [unique, not null]
  description text
  created_at timestamptz
  updated_at timestamptz
}

Table classes {
  id uuid [pk]
  academic_year_id uuid [not null, ref: > academic_years.id]
  grade_level_id uuid [not null, ref: > grade_levels.id]
  name text [not null]
  code text [not null]
  capacity int
  room_number text
  is_combined boolean
  metadata jsonb
  created_at timestamptz
  updated_at timestamptz
  created_by uuid [ref: - users.id]
}

Table combined_class_mappings {
  id uuid [pk]
  combined_class_id uuid [not null, ref: > classes.id]
  source_class_id uuid [not null, ref: > classes.id]
  created_at timestamptz
}

Table subjects {
  id uuid [pk]
  code text [unique, not null]
  name text [not null]
  description text
  credits int
  metadata jsonb
  created_at timestamptz
  updated_at timestamptz
  created_by uuid [ref: - users.id]
}

Table subject_assignments {
  id uuid [pk]
  academic_term_id uuid [not null, ref: > academic_terms.id]
  subject_id uuid [not null, ref: > subjects.id]
  grade_level_id uuid [ref: > grade_levels.id]
  class_id uuid [ref: > classes.id]
  type subject_type [not null] // enum
  weekly_periods int
  created_at timestamptz
  updated_at timestamptz
}

Table student_enrollments {
  id uuid [pk]
  student_id uuid [not null, ref: > users.id]
  class_id uuid [not null, ref: > classes.id]
  academic_year_id uuid [not null, ref: > academic_years.id]
  enrollment_date date
  withdrawal_date date
  is_active boolean
  created_at timestamptz
  updated_at timestamptz
}

Table parent_student_relationships {
  id uuid [pk]
  parent_id uuid [not null, ref: > users.id]
  student_id uuid [not null, ref: > users.id]
  relationship_type text
  is_primary_contact boolean
  created_at timestamptz
}

Table homeroom_assignments {
  id uuid [pk]
  teacher_id uuid [not null, ref: > users.id]
  class_id uuid [not null, ref: > classes.id]
  academic_year_id uuid [not null, ref: > academic_years.id]
  assigned_date date
  end_date date
  is_active boolean
  created_at timestamptz
  updated_at timestamptz
  created_by uuid [ref: - users.id]
}

Table time_slots {
  id uuid [pk]
  name text [not null]
  start_time time [not null]
  end_time time [not null]
  slot_order int [not null, unique]
  is_break boolean
  created_at timestamptz
}

Table teaching_schedules {
  id uuid [pk]
  academic_term_id uuid [not null, ref: > academic_terms.id]
  class_id uuid [not null, ref: > classes.id]
  subject_id uuid [not null, ref: > subjects.id]
  teacher_id uuid [not null, ref: > users.id]
  day_of_week day_of_week [not null] // enum
  time_slot_id uuid [not null, ref: > time_slots.id]
  room_number text
  is_active boolean
  created_at timestamptz
  updated_at timestamptz
  created_by uuid [ref: - users.id]
}

Table schedule_change_requests {
  id uuid [pk]
  schedule_id uuid [not null, ref: > teaching_schedules.id]
  requested_by uuid [not null, ref: > users.id]
  new_date date
  new_time_slot_id uuid [ref: > time_slots.id]
  reason text [not null]
  status request_status // enum
  reviewed_by uuid [ref: > users.id]
  reviewed_at timestamptz
  review_notes text
  created_at timestamptz
  updated_at timestamptz
}

Table attendance_records {
  id uuid [pk]
  student_id uuid [not null, ref: > users.id]
  class_id uuid [not null, ref: > classes.id]
  schedule_id uuid [ref: > teaching_schedules.id]
  date date [not null]
  status text [not null] // present, absent, late, excused
  remarks text
  recorded_by uuid [not null, ref: > users.id]
  created_at timestamptz
  updated_at timestamptz
}

Table leave_requests {
  id uuid [pk]
  student_id uuid [not null, ref: > users.id]
  requested_by uuid [not null, ref: > users.id]
  start_date date [not null]
  end_date date [not null]
  reason text [not null]
  supporting_documents jsonb
  status request_status // enum
  reviewed_by uuid [ref: > users.id]
  reviewed_at timestamptz
  review_notes text
  created_at timestamptz
  updated_at timestamptz
}

Table exam_schedules {
  id uuid [pk]
  academic_term_id uuid [not null, ref: > academic_terms.id]
  class_id uuid [not null, ref: > classes.id]
  subject_id uuid [not null, ref: > subjects.id]
  exam_type text [not null]
  exam_date date [not null]
  start_time time [not null]
  end_time time [not null]
  room_number text
  max_score decimal
  created_at timestamptz
  updated_at timestamptz
  created_by uuid [ref: - users.id]
}

Table grade_records {
  id uuid [pk]
  student_id uuid [not null, ref: > users.id]
  subject_id uuid [not null, ref: > subjects.id]
  academic_term_id uuid [not null, ref: > academic_terms.id]
  exam_schedule_id uuid [ref: > exam_schedules.id]
  grade_type text [not null]
  score decimal
  max_score decimal
  percentage decimal
  letter_grade text
  comments text
  is_final boolean
  recorded_by uuid [not null, ref: > users.id]
  created_at timestamptz
  updated_at timestamptz
}

Table grade_reevaluation_requests {
  id uuid [pk]
  grade_record_id uuid [not null, ref: > grade_records.id]
  requested_by uuid [not null, ref: > users.id]
  reason text [not null]
  status request_status // enum
  reviewed_by uuid [ref: > users.id]
  reviewed_at timestamptz
  original_score decimal
  new_score decimal
  review_notes text
  created_at timestamptz
  updated_at timestamptz
}

Table violation_rules {
  id uuid [pk]
  code text [unique, not null]
  name text [not null]
  description text
  category text [not null]
  severity violation_severity [not null] // enum
  default_action text
  is_active boolean
  created_at timestamptz
  updated_at timestamptz
  created_by uuid [ref: - users.id]
}

Table student_violations {
  id uuid [pk]
  student_id uuid [not null, ref: > users.id]
  violation_rule_id uuid [not null, ref: > violation_rules.id]
  class_id uuid [ref: > classes.id]
  violation_date date [not null]
  violation_time time
  location text
  description text [not null]
  witnesses text[]
  evidence jsonb
  reported_by uuid [not null, ref: > users.id]
  status text // reported, under_review, confirmed, resolved, dismissed
  created_at timestamptz
  updated_at timestamptz
}

Table disciplinary_actions {
  id uuid [pk]
  violation_id uuid [not null, ref: > student_violations.id]
  action_type text [not null]
  description text [not null]
  start_date date [not null]
  end_date date
  assigned_by uuid [not null, ref: > users.id]
  is_completed boolean
  completion_notes text
  created_at timestamptz
  updated_at timestamptz
}

Table teacher_feedback {
  id uuid [pk]
  teacher_id uuid [not null, ref: > users.id]
  class_id uuid [not null, ref: > classes.id]
  schedule_id uuid [ref: > teaching_schedules.id]
  feedback_date date [not null]
  feedback_type text [not null] // lesson, behavior, general
  scope text [not null] // individual, group, class
  content text [not null]
  tags text[]
  attachments jsonb
  is_ai_processed boolean
  ai_summary text
  created_at timestamptz
  updated_at timestamptz
}

Table notifications {
  id uuid [pk]
  sender_id uuid [ref: > users.id]
  recipient_id uuid [ref: > users.id]
  recipient_role user_role // enum
  type notification_type // enum
  title text [not null]
  content text [not null]
  metadata jsonb
  is_read boolean
  read_at timestamptz
  is_sent boolean
  sent_at timestamptz
  delivery_channels text[]
  created_at timestamptz
  template_id uuid [ref: > notification_templates.id]
  variables jsonb
}

Table notification_templates {
  id uuid [pk]
  code text [unique, not null]
  type notification_type // enum
  title_template text [not null]
  content_template text [not null]
  variables text[]
  is_active boolean
}

Table meetings {
  id uuid [pk]
  organizer_id uuid [not null, ref: > users.id]
  title text [not null]
  description text
  meeting_date date [not null]
  start_time time [not null]
  end_time time [not null]
  format meeting_format [not null] // enum
  location text
  meeting_link text
  class_id uuid [ref: > classes.id]
  is_cancelled boolean
  cancellation_reason text
  created_at timestamptz
  updated_at timestamptz
}

Table school_policies {
  id uuid [pk]
  title text [not null]
  content text [not null]
  category text [not null]
  scope text[]
  version int
  is_active boolean
  effective_date date
  expiry_date date
  created_by uuid [not null, ref: > users.id]
  created_at timestamptz
  updated_at timestamptz
}

Table audit_logs {
  id uuid [pk]
  user_id uuid [ref: > users.id]
  action text [not null]
  entity_type text [not null]
  entity_id uuid
  old_data jsonb
  new_data jsonb
  ip_address inet
  user_agent text
  created_at timestamptz
}

Table documents {
  id uuid [pk]
  entity_type text [not null]
  entity_id uuid [not null]
  file_name text [not null]
  file_type text [not null]
  file_size bigint
  file_url text [not null]
  uploaded_by uuid [ref: > users.id]
  uploaded_at timestamptz
  is_deleted boolean
}

Table data_retention_policies {
  id uuid [pk]
  table_name text [not null]
  retention_days int [not null]
  action text // archive, delete, anonymize
  is_active boolean
}

Table addresses {
  id uuid [pk]
  user_id uuid [ref: > users.id]
  type text // home, work, temporary
  street_address text
  district text
  city text
  province text
  postal_code text
  country text
  is_primary boolean
}

// Materialized View (read-only, for reporting)
Table student_performance_summary {
  student_id uuid
  full_name text
  class_id uuid
  term_id uuid
  total_attendance int
  present_days int
  avg_grade float
  violation_count int
  Note: 'Materialized View'
}
