-- ============================================
-- EduConnect Database Schema for Supabase
-- ============================================
-- This schema is designed for an educational management system
-- supporting multiple user roles, academic management, and AI-powered features
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI embeddings

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
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
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
    CONSTRAINT valid_phone CHECK (phone ~ '^\d{10}$' OR phone IS NULL),
    data_classification TEXT DEFAULT 'internal' CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted'))
);

-- Create indexes for users
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_phone ON public.users(phone) WHERE phone IS NOT NULL;

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

-- Trigger to enforce student_id refers to a user with role 'student'
CREATE OR REPLACE FUNCTION check_student_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.users WHERE id = NEW.student_id AND role = 'student'
    ) THEN
        RAISE EXCEPTION 'student_id % does not refer to a user with role=student', NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_student_role
BEFORE INSERT OR UPDATE ON public.student_enrollments
FOR EACH ROW
EXECUTE FUNCTION check_student_role();

-- Create indexes for student enrollments
CREATE INDEX idx_student_enrollments_student ON public.student_enrollments(student_id);
CREATE INDEX idx_student_enrollments_class ON public.student_enrollments(class_id);
CREATE INDEX idx_student_enrollments_active ON public.student_enrollments(is_active) WHERE is_active = true;

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

-- Trigger to enforce parent_id refers to a user with role 'parent' and student_id with role 'student'
CREATE OR REPLACE FUNCTION check_parent_student_roles()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.users WHERE id = NEW.parent_id AND role = 'parent'
    ) THEN
        RAISE EXCEPTION 'parent_id % does not refer to a user with role=parent', NEW.parent_id;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM public.users WHERE id = NEW.student_id AND role = 'student'
    ) THEN
        RAISE EXCEPTION 'student_id % does not refer to a user with role=student', NEW.student_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_parent_student_roles
BEFORE INSERT OR UPDATE ON public.parent_student_relationships
FOR EACH ROW
EXECUTE FUNCTION check_parent_student_roles();

-- Create indexes for parent-student relationships
CREATE INDEX idx_parent_student_parent ON public.parent_student_relationships(parent_id);
CREATE INDEX idx_parent_student_student ON public.parent_student_relationships(student_id);
CREATE INDEX idx_parent_student_primary ON public.parent_student_relationships(is_primary_contact) WHERE is_primary_contact = true;

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

-- Trigger to enforce teacher_id refers to a user with role 'homeroom_teacher'
CREATE OR REPLACE FUNCTION check_homeroom_teacher_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.users WHERE id = NEW.teacher_id AND role = 'homeroom_teacher'
    ) THEN
        RAISE EXCEPTION 'teacher_id % does not refer to a user with role=homeroom_teacher', NEW.teacher_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_homeroom_teacher_role
BEFORE INSERT OR UPDATE ON public.homeroom_assignments
FOR EACH ROW
EXECUTE FUNCTION check_homeroom_teacher_role();

-- Create indexes for homeroom assignments
CREATE INDEX idx_homeroom_assignments_teacher ON public.homeroom_assignments(teacher_id);
CREATE INDEX idx_homeroom_assignments_class ON public.homeroom_assignments(class_id);
CREATE INDEX idx_homeroom_assignments_active ON public.homeroom_assignments(is_active) WHERE is_active = true;

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

-- Trigger to enforce teacher_id refers to a user with role 'subject_teacher' or 'homeroom_teacher'
CREATE OR REPLACE FUNCTION check_teaching_schedule_teacher_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.users WHERE id = NEW.teacher_id AND role IN ('subject_teacher', 'homeroom_teacher')
    ) THEN
        RAISE EXCEPTION 'teacher_id % does not refer to a user with role=subject_teacher or homeroom_teacher', NEW.teacher_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_teaching_schedule_teacher_role
BEFORE INSERT OR UPDATE ON public.teaching_schedules
FOR EACH ROW
EXECUTE FUNCTION check_teaching_schedule_teacher_role();

-- Create indexes for teaching schedules
CREATE INDEX idx_teaching_schedules_term ON public.teaching_schedules(academic_term_id);
CREATE INDEX idx_teaching_schedules_class ON public.teaching_schedules(class_id);
CREATE INDEX idx_teaching_schedules_teacher ON public.teaching_schedules(teacher_id);
CREATE INDEX idx_teaching_schedules_subject ON public.teaching_schedules(subject_id);
CREATE INDEX idx_teaching_schedules_day_slot ON public.teaching_schedules(day_of_week, time_slot_id);

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

-- Create indexes for schedule change requests
CREATE INDEX idx_schedule_change_requests_schedule ON public.schedule_change_requests(schedule_id);
CREATE INDEX idx_schedule_change_requests_status ON public.schedule_change_requests(status);
CREATE INDEX idx_schedule_change_requests_requested_by ON public.schedule_change_requests(requested_by);

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

-- Create indexes for leave requests
CREATE INDEX idx_leave_requests_student ON public.leave_requests(student_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON public.leave_requests(start_date, end_date);

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

-- Trigger to enforce re-evaluation request is within 7 days of grade record creation
CREATE OR REPLACE FUNCTION check_reevaluation_window()
RETURNS TRIGGER AS $$
DECLARE
    grade_created_at TIMESTAMPTZ;
BEGIN
    SELECT created_at INTO grade_created_at FROM public.grade_records WHERE id = NEW.grade_record_id;
    IF grade_created_at IS NULL THEN
        RAISE EXCEPTION 'grade_record_id % does not exist in grade_records', NEW.grade_record_id;
    END IF;
    IF NEW.created_at > (grade_created_at + INTERVAL '7 days') THEN
        RAISE EXCEPTION 'Re-evaluation request must be within 7 days of grade record creation';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_reevaluation_window
BEFORE INSERT OR UPDATE ON public.grade_reevaluation_requests
FOR EACH ROW
EXECUTE FUNCTION check_reevaluation_window();

-- Create indexes for grade re-evaluation requests
CREATE INDEX idx_grade_reevaluation_grade ON public.grade_reevaluation_requests(grade_record_id);
CREATE INDEX idx_grade_reevaluation_status ON public.grade_reevaluation_requests(status);

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
    student_ids UUID[] DEFAULT '{}',
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
CREATE INDEX idx_teacher_feedback_student_ids ON public.teacher_feedback USING GIN(student_ids);

-- AI feedback summaries
CREATE TABLE public.ai_feedback_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_ids UUID[] NOT NULL,
    student_id UUID REFERENCES public.users(id),
    class_id UUID REFERENCES public.classes(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    summary_type TEXT NOT NULL,
    content TEXT NOT NULL,
    key_insights JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '[]',
    embedding vector(1536), -- For AI similarity search
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for AI feedback summaries
CREATE INDEX idx_ai_feedback_summaries_student ON public.ai_feedback_summaries(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_ai_feedback_summaries_class ON public.ai_feedback_summaries(class_id) WHERE class_id IS NOT NULL;
CREATE INDEX idx_ai_feedback_summaries_period ON public.ai_feedback_summaries(period_start, period_end);
CREATE INDEX idx_ai_feedback_summaries_embedding ON public.ai_feedback_summaries USING ivfflat (embedding vector_cosine_ops);

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
    student_ids UUID[] DEFAULT '{}',
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
CREATE INDEX idx_meetings_student_ids ON public.meetings USING GIN(student_ids);

-- Meeting participants
CREATE TABLE public.meeting_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.users(id),
    invitation_sent BOOLEAN DEFAULT FALSE,
    response_status TEXT CHECK (response_status IN ('pending', 'accepted', 'declined', 'tentative')),
    attended BOOLEAN,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(meeting_id, participant_id)
);

-- Create indexes for meeting participants
CREATE INDEX idx_meeting_participants_meeting ON public.meeting_participants(meeting_id);
CREATE INDEX idx_meeting_participants_participant ON public.meeting_participants(participant_id);

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
-- AI ASSISTANT TABLES
-- ============================================

-- AI conversation threads
CREATE TABLE public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT,
    context JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for AI conversations
CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_active ON public.ai_conversations(user_id, is_active) WHERE is_active = true;

-- AI messages
CREATE TABLE public.ai_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for AI messages
CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_created ON public.ai_messages(conversation_id, created_at);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables with updated_at column
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t, t);
    END LOOP;
END $$;

-- Function to ensure only one current academic year
CREATE OR REPLACE FUNCTION ensure_single_current_academic_year()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_current = TRUE THEN
        UPDATE public.academic_years 
        SET is_current = FALSE 
        WHERE id != NEW.id AND is_current = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_current_year
BEFORE INSERT OR UPDATE ON public.academic_years
FOR EACH ROW
WHEN (NEW.is_current = TRUE)
EXECUTE FUNCTION ensure_single_current_academic_year();

-- Function to auto-create notification for violations
CREATE OR REPLACE FUNCTION notify_homeroom_teacher_violation()
RETURNS TRIGGER AS $$
DECLARE
    v_homeroom_teacher_id UUID;
    v_student_name TEXT;
    v_violation_name TEXT;
BEGIN
    -- Get homeroom teacher
    SELECT ha.teacher_id INTO v_homeroom_teacher_id
    FROM public.homeroom_assignments ha
    JOIN public.student_enrollments se ON se.class_id = ha.class_id
    WHERE se.student_id = NEW.student_id 
    AND ha.is_active = TRUE 
    AND se.is_active = TRUE
    LIMIT 1;
    
    -- Get student name
    SELECT full_name INTO v_student_name
    FROM public.users
    WHERE id = NEW.student_id;
    
    -- Get violation name
    SELECT name INTO v_violation_name
    FROM public.violation_rules
    WHERE id = NEW.violation_rule_id;
    
    -- Create notification if homeroom teacher found
    IF v_homeroom_teacher_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            sender_id,
            recipient_id,
            type,
            title,
            content,
            metadata
        ) VALUES (
            NEW.reported_by,
            v_homeroom_teacher_id,
            'behavior',
            'Student Violation Report',
            format('Student %s has been reported for: %s', v_student_name, v_violation_name),
            jsonb_build_object(
                'violation_id', NEW.id,
                'student_id', NEW.student_id,
                'violation_date', NEW.violation_date
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_violation
AFTER INSERT ON public.student_violations
FOR EACH ROW
EXECUTE FUNCTION notify_homeroom_teacher_violation();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Teachers can view students in their class" ON public.users
    FOR SELECT USING (
        role = 'student' AND
        EXISTS (
            SELECT 1 FROM public.student_enrollments se
            JOIN public.homeroom_assignments ha ON ha.class_id = se.class_id
            WHERE se.student_id = users.id 
            AND ha.teacher_id = auth.uid()
            AND ha.is_active = TRUE
            AND se.is_active = TRUE
        )
    );

CREATE POLICY "Parents can view their children" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.parent_student_relationships
            WHERE student_id = users.id 
            AND parent_id = auth.uid()
        )
    );

-- Additional RLS policies would be needed for other tables based on business requirements

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Full text search indexes
CREATE INDEX idx_users_fulltext ON public.users USING GIN(to_tsvector('english', full_name || ' ' || COALESCE(email, '')));
CREATE INDEX idx_subjects_fulltext ON public.subjects USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_notifications_fulltext ON public.notifications USING GIN(to_tsvector('english', title || ' ' || content));

-- ============================================
-- INITIAL DATA (OPTIONAL)
-- ============================================

-- Insert default time slots
INSERT INTO public.time_slots (name, start_time, end_time, slot_order, is_break) VALUES
    ('Period 1', '07:30', '08:15', 1, false),
    ('Period 2', '08:20', '09:05', 2, false),
    ('Morning Break', '09:05', '09:20', 3, true),
    ('Period 3', '09:20', '10:05', 4, false),
    ('Period 4', '10:10', '10:55', 5, false),
    ('Period 5', '11:00', '11:45', 6, false),
    ('Lunch Break', '11:45', '13:00', 7, true),
    ('Period 6', '13:00', '13:45', 8, false),
    ('Period 7', '13:50', '14:35', 9, false),
    ('Period 8', '14:40', '15:25', 10, false),
    ('Period 9', '15:30', '16:15', 11, false),
    ('Period 10', '16:20', '17:05', 12, false)
ON CONFLICT (slot_order) DO NOTHING;

-- Insert default grade levels
INSERT INTO public.grade_levels (name, level, description) VALUES
    ('Grade 1', 1, 'First grade'),
    ('Grade 2', 2, 'Second grade'),
    ('Grade 3', 3, 'Third grade'),
    ('Grade 4', 4, 'Fourth grade'),
    ('Grade 5', 5, 'Fifth grade'),
    ('Grade 6', 6, 'Sixth grade'),
    ('Grade 7', 7, 'Seventh grade'),
    ('Grade 8', 8, 'Eighth grade'),
    ('Grade 9', 9, 'Ninth grade'),
    ('Grade 10', 10, 'Tenth grade'),
    ('Grade 11', 11, 'Eleventh grade'),
    ('Grade 12', 12, 'Twelfth grade')
ON CONFLICT (level) DO NOTHING;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant permissions to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON public.users TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;
GRANT INSERT ON public.leave_requests TO authenticated;
GRANT INSERT ON public.grade_reevaluation_requests TO authenticated;
GRANT INSERT ON public.schedule_change_requests TO authenticated;
GRANT INSERT ON public.ai_conversations TO authenticated;
GRANT INSERT ON public.ai_messages TO authenticated;

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

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

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS data_classification TEXT DEFAULT 'internal' CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted'));

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