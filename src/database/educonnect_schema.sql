-- ============================================
-- EduConnect Database Schema (Optimized, Clean, Sufficient)
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================
-- ENUM TYPES (Idempotent Creation)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'admin',
            'school_administrator', 
            'homeroom_teacher',
            'subject_teacher',
            'parent',
            'student'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM (
            'active',
            'inactive',
            'suspended',
            'locked'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'term_type') THEN
        CREATE TYPE term_type AS ENUM (
            'semester_1',
            'semester_2',
            'summer',
            'full_year'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'day_of_week') THEN
        CREATE TYPE day_of_week AS ENUM (
            'monday',
            'tuesday', 
            'wednesday',
            'thursday',
            'friday',
            'saturday',
            'sunday'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subject_type') THEN
        CREATE TYPE subject_type AS ENUM (
            'mandatory',
            'elective'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status') THEN
        CREATE TYPE request_status AS ENUM (
            'pending',
            'approved',
            'rejected',
            'cancelled'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE notification_type AS ENUM (
            'system',
            'academic',
            'attendance',
            'behavior',
            'meeting',
            'grade',
            'general'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'violation_severity') THEN
        CREATE TYPE violation_severity AS ENUM (
            'minor',
            'moderate', 
            'major',
            'critical'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_format') THEN
        CREATE TYPE meeting_format AS ENUM (
            'in_person',
            'online',
            'hybrid'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE gender_type AS ENUM (
            'male',
            'female',
            'other'
        );
    END IF;
END
$$;

-- Unified status type for consistency across tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_type') THEN
        CREATE TYPE status_type AS ENUM (
            'active', 'inactive', 'pending', 'approved', 'rejected', 'cancelled', 'completed', 'suspended', 'reported', 'under_review', 'confirmed', 'resolved', 'dismissed'
        );
    END IF;
END
$$;

-- ============================================
-- BASE TABLES FOR INHERITANCE
-- ============================================

-- Base audit table for common fields
CREATE TABLE IF NOT EXISTS base_audit (
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    version INTEGER DEFAULT 1
);

-- ============================================
-- CORE TABLES
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    status user_status DEFAULT 'active',
    gender gender_type,
    date_of_birth DATE,
    address TEXT,
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    data_classification TEXT DEFAULT 'internal' CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted'))
);

-- Create indexes for users
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_users_fulltext ON public.users USING GIN(to_tsvector('english', full_name || ' ' || COALESCE(phone, '')));

-- Academic years
CREATE TABLE public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    CONSTRAINT valid_date_range CHECK (start_date < end_date),
    CONSTRAINT unique_current_year EXCLUDE (is_current WITH =) WHERE (is_current = true)
);

-- Create index for current academic year
CREATE INDEX idx_academic_years_current ON public.academic_years(is_current) WHERE is_current = true;

-- Academic terms/semesters
CREATE TABLE public.academic_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type term_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_term_dates CHECK (start_date < end_date),
    UNIQUE(academic_year_id, type)
);

-- Create indexes for academic terms
CREATE INDEX idx_academic_terms_year ON public.academic_terms(academic_year_id);
CREATE INDEX idx_academic_terms_current ON public.academic_terms(is_current) WHERE is_current = true;

-- Grade levels
CREATE TABLE public.grade_levels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    level INTEGER NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_level CHECK (level > 0 AND level <= 12)
);

-- Classes
CREATE TABLE public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    grade_level_id UUID NOT NULL REFERENCES public.grade_levels(id),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    capacity INTEGER DEFAULT 30,
    room_number TEXT,
    is_combined BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    CONSTRAINT valid_capacity CHECK (capacity > 0),
    UNIQUE(academic_year_id, code)
);

-- Create indexes for classes
CREATE INDEX idx_classes_academic_year ON public.classes(academic_year_id);
CREATE INDEX idx_classes_grade_level ON public.classes(grade_level_id);
CREATE INDEX idx_classes_combined ON public.classes(is_combined) WHERE is_combined = true;

-- Combined class mappings (for classes that combine students from multiple regular classes)
CREATE TABLE public.combined_class_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    combined_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    source_class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(combined_class_id, source_class_id)
);

-- Subjects
CREATE TABLE public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    CONSTRAINT valid_credits CHECK (credits > 0)
);

-- Create index for subject code
CREATE INDEX idx_subjects_code ON public.subjects(code);
CREATE INDEX idx_subjects_fulltext ON public.subjects USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Subject assignments to grades/classes
CREATE TABLE public.subject_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id),
    grade_level_id UUID REFERENCES public.grade_levels(id),
    class_id UUID REFERENCES public.classes(id),
    type subject_type NOT NULL DEFAULT 'mandatory',
    weekly_periods INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_weekly_periods CHECK (weekly_periods > 0),
    CONSTRAINT grade_or_class CHECK (
        (grade_level_id IS NOT NULL AND class_id IS NULL) OR 
        (grade_level_id IS NULL AND class_id IS NOT NULL)
    )
);

-- Create indexes for subject assignments
CREATE INDEX idx_subject_assignments_term ON public.subject_assignments(academic_term_id);
CREATE INDEX idx_subject_assignments_subject ON public.subject_assignments(subject_id);
CREATE INDEX idx_subject_assignments_grade ON public.subject_assignments(grade_level_id) WHERE grade_level_id IS NOT NULL;
CREATE INDEX idx_subject_assignments_class ON public.subject_assignments(class_id) WHERE class_id IS NOT NULL;

-- ============================================
-- USER RELATIONSHIPS
-- ============================================

-- Student enrollments
CREATE TABLE public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    withdrawal_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, academic_year_id)
);

-- Parent-student relationships
CREATE TABLE public.parent_student_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL DEFAULT 'parent',
    is_primary_contact BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- Homeroom teacher assignments
CREATE TABLE public.homeroom_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
    assigned_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    UNIQUE(class_id, academic_year_id)
);

-- ============================================
-- SCHEDULING
-- ============================================

-- Time slots for scheduling
CREATE TABLE public.time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_order INTEGER NOT NULL,
    is_break BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time),
    UNIQUE(slot_order)
);

-- Teaching schedules
CREATE TABLE public.teaching_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id),
    subject_id UUID NOT NULL REFERENCES public.subjects(id),
    teacher_id UUID NOT NULL REFERENCES public.users(id),
    day_of_week day_of_week NOT NULL,
    time_slot_id UUID NOT NULL REFERENCES public.time_slots(id),
    room_number TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    UNIQUE(academic_term_id, day_of_week, time_slot_id, teacher_id),
    UNIQUE(academic_term_id, day_of_week, time_slot_id, class_id)
);

-- Teaching schedule change requests
CREATE TABLE public.schedule_change_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES public.teaching_schedules(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.users(id),
    new_date DATE,
    new_time_slot_id UUID REFERENCES public.time_slots(id),
    reason TEXT NOT NULL,
    status request_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_request_date CHECK (new_date >= CURRENT_DATE + INTERVAL '1 day')
);

-- ============================================
-- ATTENDANCE
-- ============================================

-- Attendance records
CREATE TABLE public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id),
    schedule_id UUID REFERENCES public.teaching_schedules(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    remarks TEXT,
    recorded_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, schedule_id, date)
);

-- Create indexes for attendance records
CREATE INDEX idx_attendance_student ON public.attendance_records(student_id);
CREATE INDEX idx_attendance_class ON public.attendance_records(class_id);
CREATE INDEX idx_attendance_date ON public.attendance_records(date);
CREATE INDEX idx_attendance_status ON public.attendance_records(status);
CREATE INDEX idx_attendance_student_date ON public.attendance_records(student_id, date DESC);

-- Leave requests
CREATE TABLE public.leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.users(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    supporting_documents JSONB DEFAULT '[]',
    status request_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_leave_dates CHECK (start_date <= end_date),
    CONSTRAINT valid_leave_request_date CHECK (start_date >= CURRENT_DATE)
);

-- ============================================
-- GRADES AND ASSESSMENTS
-- ============================================

-- Exam schedules
CREATE TABLE public.exam_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_term_id UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id),
    subject_id UUID NOT NULL REFERENCES public.subjects(id),
    exam_type TEXT NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number TEXT,
    max_score DECIMAL(5,2) DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    CONSTRAINT valid_exam_time CHECK (start_time < end_time),
    CONSTRAINT valid_max_score CHECK (max_score > 0)
);

-- Create indexes for exam schedules
CREATE INDEX idx_exam_schedules_term ON public.exam_schedules(academic_term_id);
CREATE INDEX idx_exam_schedules_class ON public.exam_schedules(class_id);
CREATE INDEX idx_exam_schedules_subject ON public.exam_schedules(subject_id);
CREATE INDEX idx_exam_schedules_date ON public.exam_schedules(exam_date);

-- Grade records
CREATE TABLE public.grade_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id),
    academic_term_id UUID NOT NULL REFERENCES public.academic_terms(id),
    exam_schedule_id UUID REFERENCES public.exam_schedules(id),
    grade_type TEXT NOT NULL,
    score DECIMAL(5,2),
    max_score DECIMAL(5,2) DEFAULT 100,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN max_score > 0 THEN (score / max_score) * 100 ELSE NULL END
    ) STORED,
    letter_grade TEXT,
    comments TEXT,
    is_final BOOLEAN DEFAULT FALSE,
    recorded_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_score CHECK (score >= 0 AND score <= max_score),
    CONSTRAINT valid_max_score CHECK (max_score > 0)
);

-- Create indexes for grade records
CREATE INDEX idx_grade_records_student ON public.grade_records(student_id);
CREATE INDEX idx_grade_records_subject ON public.grade_records(subject_id);
CREATE INDEX idx_grade_records_term ON public.grade_records(academic_term_id);
CREATE INDEX idx_grade_records_final ON public.grade_records(is_final) WHERE is_final = true;
CREATE INDEX idx_grade_records_student_term_subject ON public.grade_records(student_id, academic_term_id, subject_id);

-- Grade re-evaluation requests
CREATE TABLE public.grade_reevaluation_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grade_record_id UUID NOT NULL REFERENCES public.grade_records(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.users(id),
    reason TEXT NOT NULL,
    status request_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    original_score DECIMAL(5,2),
    new_score DECIMAL(5,2),
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIOLATIONS AND DISCIPLINE
-- ============================================

-- Violation rules
CREATE TABLE public.violation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    severity violation_severity NOT NULL,
    default_action TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- Create indexes for violation rules
CREATE INDEX idx_violation_rules_code ON public.violation_rules(code);
CREATE INDEX idx_violation_rules_severity ON public.violation_rules(severity);
CREATE INDEX idx_violation_rules_active ON public.violation_rules(is_active) WHERE is_active = true;

-- Student violations
CREATE TABLE public.student_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    violation_rule_id UUID NOT NULL REFERENCES public.violation_rules(id),
    class_id UUID REFERENCES public.classes(id),
    violation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    violation_time TIME DEFAULT CURRENT_TIME,
    location TEXT,
    description TEXT NOT NULL,
    witnesses TEXT[],
    evidence JSONB DEFAULT '[]',
    reported_by UUID NOT NULL REFERENCES public.users(id),
    status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'under_review', 'confirmed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for student violations
CREATE INDEX idx_student_violations_student ON public.student_violations(student_id);
CREATE INDEX idx_student_violations_rule ON public.student_violations(violation_rule_id);
CREATE INDEX idx_student_violations_date ON public.student_violations(violation_date);
CREATE INDEX idx_student_violations_status ON public.student_violations(status);
CREATE INDEX idx_violations_student_date_status ON public.student_violations(student_id, violation_date DESC, status);

-- Disciplinary actions
CREATE TABLE public.disciplinary_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    violation_id UUID NOT NULL REFERENCES public.student_violations(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    assigned_by UUID NOT NULL REFERENCES public.users(id),
    is_completed BOOLEAN DEFAULT FALSE,
    completion_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for disciplinary actions
CREATE INDEX idx_disciplinary_actions_violation ON public.disciplinary_actions(violation_id);
CREATE INDEX idx_disciplinary_actions_completed ON public.disciplinary_actions(is_completed);

-- ============================================
-- FEEDBACK AND COMMUNICATION
-- ============================================

-- Teacher feedback
CREATE TABLE public.teacher_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.users(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    schedule_id UUID REFERENCES public.teaching_schedules(id),
    feedback_date DATE NOT NULL DEFAULT CURRENT_DATE,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('lesson', 'behavior', 'general')),
    scope TEXT NOT NULL CHECK (scope IN ('individual', 'group', 'class')),
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    is_ai_processed BOOLEAN DEFAULT FALSE,
    ai_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for teacher feedback
CREATE INDEX idx_teacher_feedback_teacher ON public.teacher_feedback(teacher_id);
CREATE INDEX idx_teacher_feedback_class ON public.teacher_feedback(class_id);
CREATE INDEX idx_teacher_feedback_date ON public.teacher_feedback(feedback_date);
CREATE INDEX idx_teacher_feedback_type ON public.teacher_feedback(feedback_type);

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES public.users(id),
    recipient_id UUID REFERENCES public.users(id),
    recipient_role user_role,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_sent BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    delivery_channels TEXT[] DEFAULT '{in_app}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    template_id UUID REFERENCES notification_templates(id),
    variables JSONB
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX idx_notifications_unread ON public.notifications(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX idx_notifications_fulltext ON public.notifications USING GIN(to_tsvector('english', title || ' ' || content));
CREATE INDEX idx_notifications_recipient_created ON public.notifications(recipient_id, created_at DESC);

-- Meetings
CREATE TABLE public.meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID NOT NULL REFERENCES public.users(id),
    title TEXT NOT NULL,
    description TEXT,
    meeting_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    format meeting_format NOT NULL DEFAULT 'in_person',
    location TEXT,
    meeting_link TEXT,
    class_id UUID REFERENCES public.classes(id),
    is_cancelled BOOLEAN DEFAULT FALSE,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT valid_meeting_time CHECK (start_time < end_time),
    CONSTRAINT valid_meeting_link CHECK (
        (format = 'in_person' AND meeting_link IS NULL) OR
        (format IN ('online', 'hybrid') AND meeting_link IS NOT NULL)
    )
);

-- Create indexes for meetings
CREATE INDEX idx_meetings_organizer ON public.meetings(organizer_id);
CREATE INDEX idx_meetings_date ON public.meetings(meeting_date);
CREATE INDEX idx_meetings_class ON public.meetings(class_id) WHERE class_id IS NOT NULL;

-- ============================================
-- SYSTEM CONFIGURATION
-- ============================================

-- School rules and policies
CREATE TABLE public.school_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL,
    scope TEXT[] DEFAULT '{all}',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    created_by UUID NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for school policies
CREATE INDEX idx_school_policies_active ON public.school_policies(is_active) WHERE is_active = true;
CREATE INDEX idx_school_policies_category ON public.school_policies(category);

-- Audit logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for audit logs
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ============================================
-- END OF SCHEMA
-- ============================================

-- ============================================
-- CENTRALIZED DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL, -- e.g. 'leave_request', 'violation', 'feedback'
    entity_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT,
    file_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);

-- ============================================
-- DATA RETENTION & CLASSIFICATION
-- ============================================
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    retention_days INTEGER NOT NULL,
    action TEXT CHECK (action IN ('archive', 'delete', 'anonymize')),
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- NOTIFICATION TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    type notification_type NOT NULL,
    title_template TEXT NOT NULL,
    content_template TEXT NOT NULL,
    variables TEXT[],
    is_active BOOLEAN DEFAULT TRUE
);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES notification_templates(id);
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS variables JSONB;

-- ============================================
-- ADDRESSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    type TEXT CHECK (type IN ('home', 'work', 'temporary')),
    street_address TEXT,
    district TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'Vietnam',
    is_primary BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, type)
);
-- Optionally remove address from users or keep for backward compatibility

-- ============================================
-- MATERIALIZED VIEW: STUDENT PERFORMANCE SUMMARY
-- ============================================
CREATE MATERIALIZED VIEW IF NOT EXISTS student_performance_summary AS
SELECT 
    s.id as student_id,
    s.full_name,
    se.class_id,
    at.id as term_id,
    COUNT(DISTINCT ar.id) as total_attendance,
    COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN ar.id END) as present_days,
    AVG(gr.percentage) as avg_grade,
    COUNT(DISTINCT sv.id) as violation_count
FROM public.users s
JOIN public.student_enrollments se ON s.id = se.student_id
JOIN public.academic_terms at ON at.is_current = true
LEFT JOIN public.attendance_records ar ON ar.student_id = s.id
LEFT JOIN public.grade_records gr ON gr.student_id = s.id AND gr.academic_term_id = at.id
LEFT JOIN public.student_violations sv ON sv.student_id = s.id
WHERE s.role = 'student'
GROUP BY s.id, s.full_name, se.class_id, at.id;
CREATE INDEX IF NOT EXISTS idx_perf_summary_student ON student_performance_summary(student_id);

-- ============================================
-- COMPOSITE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance_records(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_grades_student_term_subject ON public.grade_records(student_id, academic_term_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_violations_student_date_status ON public.student_violations(student_id, violation_date DESC, status);

-- ============================================
-- PARTITIONING EXAMPLE FOR ATTENDANCE
-- ============================================
-- Partition attendance_records by month (example)
-- CREATE TABLE public.attendance_records_new (
--     LIKE public.attendance_records INCLUDING ALL
-- ) PARTITION BY RANGE (date);
-- CREATE TABLE public.attendance_records_2024_01 PARTITION OF public.attendance_records_new
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ============================================
-- ARCHIVAL SCHEMA & FUNCTION
-- ============================================
CREATE SCHEMA IF NOT EXISTS archive;
CREATE TABLE IF NOT EXISTS archive.academic_years_archive (
    LIKE public.academic_years INCLUDING ALL,
    archived_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE OR REPLACE FUNCTION archive_old_academic_years() RETURNS void AS $$
BEGIN
    INSERT INTO archive.academic_years_archive 
    SELECT *, NOW() FROM public.academic_years 
    WHERE end_date < CURRENT_DATE - INTERVAL '3 years';
    DELETE FROM public.academic_years 
    WHERE end_date < CURRENT_DATE - INTERVAL '3 years';
END;
$$ LANGUAGE plpgsql;

-- 2. Đảm bảo index cho các bảng lớn
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON public.attendance_records(student_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_grade_records_student_term_subject ON public.grade_records(student_id, academic_term_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON public.notifications(recipient_id, created_at DESC);

-- 3. Kiểm tra và tối ưu các trigger kiểm tra vai trò (giữ lại các trigger cần thiết, loại bỏ trigger kiểm tra vai trò không còn dùng)
DROP TRIGGER IF EXISTS trg_check_parent_student_roles ON public.parent_student_relationships;
DROP FUNCTION IF EXISTS check_parent_student_roles();
DROP TRIGGER IF EXISTS trg_check_homeroom_teacher_role ON public.homeroom_assignments;
DROP FUNCTION IF EXISTS check_homeroom_teacher_role();
DROP TRIGGER IF EXISTS trg_check_student_role ON public.student_enrollments;
DROP FUNCTION IF EXISTS check_student_role();
DROP TRIGGER IF EXISTS trg_check_teaching_schedule_teacher_role ON public.teaching_schedules;
DROP FUNCTION IF EXISTS check_teaching_schedule_teacher_role();

