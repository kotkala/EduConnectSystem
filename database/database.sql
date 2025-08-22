-- EduConnect System Database Schema
-- Generated from Supabase on 2025-08-22
-- This file contains the complete database structure for the EduConnect educational management system

-- =============================================
-- ENUMS AND CUSTOM TYPES
-- =============================================

-- User roles enum
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');

-- User status enum  
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'locked');

-- Violation severity enum
CREATE TYPE violation_severity AS ENUM ('minor', 'moderate', 'serious', 'severe');

-- Subject category enum
CREATE TYPE subject_category AS ENUM ('core', 'specialized');

-- Term type enum
CREATE TYPE term_type AS ENUM ('semester_1', 'semester_2', 'summer', 'full_year');

-- Grade component type enum
CREATE TYPE grade_component_type AS ENUM (
    'regular_1', 'regular_2', 'regular_3', 'regular_4', 
    'midterm', 'final', 'semester_1', 'semester_2', 'yearly'
);

-- Grade submission status enum
CREATE TYPE grade_submission_status AS ENUM ('draft', 'submitted', 'sent_to_teacher', 'sent_to_parent');

-- Grade type enum
CREATE TYPE grade_type AS ENUM ('midterm', 'final', 'average', 'quiz', 'assignment');

-- Schedule exchange status enum
CREATE TYPE schedule_exchange_status AS ENUM ('pending', 'approved', 'rejected');

-- =============================================
-- CORE TABLES
-- =============================================

-- Academic Years
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Semesters
CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    name VARCHAR(50) NOT NULL,
    semester_number INTEGER NOT NULL CHECK (semester_number IN (1, 2)),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    weeks_count INTEGER NOT NULL CHECK (weeks_count > 0),
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_semester_date_range CHECK (end_date > start_date)
);

-- Class Blocks (Grade levels like 10, 11, 12)
CREATE TABLE class_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Subjects
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name_vietnamese TEXT NOT NULL,
    name_english TEXT NOT NULL,
    category subject_category NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name TEXT,
    student_id VARCHAR(20),
    role user_role NOT NULL,
    status user_status DEFAULT 'active',
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Classes
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    class_block_id UUID REFERENCES class_blocks(id),
    academic_year_id UUID REFERENCES academic_years(id),
    semester_id UUID REFERENCES semesters(id),
    homeroom_teacher_id UUID REFERENCES profiles(id),
    is_subject_combination BOOLEAN DEFAULT false,
    subject_combination_type VARCHAR(50),
    subject_combination_variant VARCHAR(50),
    max_students INTEGER DEFAULT 40,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_subject_combination CHECK (
        (is_subject_combination = false AND subject_combination_type IS NULL AND subject_combination_variant IS NULL) OR
        (is_subject_combination = true AND subject_combination_type IS NOT NULL AND subject_combination_variant IS NOT NULL)
    ),
    CONSTRAINT valid_subject_combination_type CHECK (
        subject_combination_type IS NULL OR 
        subject_combination_type IN ('khoa-hoc-tu-nhien', 'khoa-hoc-xa-hoi')
    )
);

-- Classrooms
CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    building VARCHAR(50),
    floor INTEGER,
    capacity INTEGER,
    room_type VARCHAR(30) CHECK (room_type IN ('standard', 'lab', 'computer', 'auditorium', 'gym', 'library')),
    equipment_description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- RELATIONSHIP TABLES
-- =============================================

-- Parent-Student Relationships
CREATE TABLE parent_student_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES profiles(id),
    student_id UUID REFERENCES profiles(id),
    relationship_type VARCHAR(20) NOT NULL CHECK (relationship_type IN ('father', 'mother', 'guardian')),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Class Assignments (Students and Teachers to Classes)
CREATE TABLE class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('student', 'teacher', 'homeroom')),
    user_id UUID NOT NULL REFERENCES profiles(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    assigned_by UUID REFERENCES profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher Class Assignments (Subject-specific)
CREATE TABLE teacher_class_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    is_active BOOLEAN DEFAULT true,
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TIMETABLE AND SCHEDULING
-- =============================================

-- Timetable Events
CREATE TABLE timetable_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID REFERENCES classes(id),
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES profiles(id),
    classroom_id UUID REFERENCES classrooms(id),
    semester_id UUID REFERENCES semesters(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
    notes TEXT,
    substitute_teacher_id UUID REFERENCES profiles(id),
    substitute_date DATE,
    exchange_request_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Schedule Exchange Requests
CREATE TABLE schedule_exchange_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_teacher_id UUID NOT NULL REFERENCES profiles(id),
    target_teacher_id UUID NOT NULL REFERENCES profiles(id),
    timetable_event_id UUID NOT NULL REFERENCES timetable_events(id),
    exchange_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status schedule_exchange_status NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    response_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT different_teachers CHECK (requester_teacher_id <> target_teacher_id),
    CONSTRAINT valid_exchange_date CHECK (exchange_date >= CURRENT_DATE)
);

-- Equipment Types
CREATE TABLE equipment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Classroom Equipment
CREATE TABLE classroom_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id),
    equipment_type_id UUID NOT NULL REFERENCES equipment_types(id),
    quantity INTEGER DEFAULT 1,
    condition VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- GRADING SYSTEM
-- =============================================

-- Grade Reporting Periods
CREATE TABLE grade_reporting_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    semester_id UUID NOT NULL REFERENCES semesters(id),
    period_type TEXT CHECK (period_type IN ('midterm_1', 'final_1', 'semester_1_summary', 'midterm_2', 'final_2', 'semester_2_summary', 'yearly_summary')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    import_deadline DATE NOT NULL,
    edit_deadline DATE NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'reopened')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date > start_date),
    CONSTRAINT valid_deadline_order CHECK (edit_deadline >= import_deadline)
);

-- Student Detailed Grades
CREATE TABLE student_detailed_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES grade_reporting_periods(id),
    student_id UUID NOT NULL REFERENCES profiles(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    component_type grade_component_type NOT NULL,
    grade_value NUMERIC(4,2) CHECK (grade_value >= 0 AND grade_value <= 10),
    grade_text VARCHAR(10),
    weight NUMERIC(3,2) DEFAULT 1.0,
    notes TEXT,
    is_exempted BOOLEAN DEFAULT false,
    exemption_reason TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grade Period Submissions
CREATE TABLE grade_period_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES grade_reporting_periods(id),
    teacher_id UUID NOT NULL REFERENCES profiles(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submission_notes TEXT,
    approval_notes TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grade Submission Details
CREATE TABLE grade_submission_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES grade_period_submissions(id),
    student_id UUID NOT NULL,
    grade_data JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- VIOLATIONS AND DISCIPLINARY SYSTEM
-- =============================================

-- Violation Categories
CREATE TABLE violation_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Violation Types
CREATE TABLE violation_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES violation_categories(id),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    default_severity VARCHAR(20) DEFAULT 'minor' CHECK (default_severity IN ('minor', 'moderate', 'serious', 'severe')),
    points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Student Violations
CREATE TABLE student_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    violation_type_id UUID NOT NULL REFERENCES violation_types(id),
    severity violation_severity NOT NULL,
    recorded_by UUID NOT NULL REFERENCES profiles(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    semester_id UUID NOT NULL REFERENCES semesters(id),
    violation_date DATE NOT NULL,
    points INTEGER NOT NULL CHECK (points >= 0),
    description TEXT,
    location TEXT,
    witness TEXT,
    evidence_url TEXT,
    sent_status VARCHAR(10) DEFAULT 'unsent' CHECK (sent_status IN ('unsent', 'sent')),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Disciplinary Action Types
CREATE TABLE disciplinary_action_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    severity_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Student Disciplinary Cases
CREATE TABLE student_disciplinary_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id),
    class_id UUID REFERENCES classes(id),
    semester_id UUID NOT NULL REFERENCES semesters(id),
    week_index INTEGER NOT NULL,
    action_type_id UUID REFERENCES disciplinary_action_types(id),
    total_points INTEGER NOT NULL,
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent_to_homeroom', 'acknowledged', 'meeting_scheduled', 'resolved')),
    meeting_date TIMESTAMPTZ,
    resolution_notes TEXT,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case Violations (Link violations to disciplinary cases)
CREATE TABLE case_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    disciplinary_case_id UUID NOT NULL REFERENCES student_disciplinary_cases(id),
    violation_id UUID NOT NULL REFERENCES student_violations(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Unified Violation Reports
CREATE TABLE unified_violation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(50) NOT NULL,
    report_period VARCHAR(50) NOT NULL,
    student_id UUID REFERENCES profiles(id),
    class_id UUID REFERENCES classes(id),
    academic_year_id UUID REFERENCES academic_years(id),
    semester_id UUID REFERENCES semesters(id),
    period_start DATE,
    period_end DATE,
    violation_count INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    severity_breakdown JSONB,
    violation_details JSONB,
    alert_level VARCHAR(20),
    is_alert_sent BOOLEAN DEFAULT false,
    alert_sent_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- NOTIFICATION SYSTEM
-- =============================================

-- Notification Types
CREATE TABLE notification_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    notification_type VARCHAR(50),
    sender_id UUID NOT NULL REFERENCES profiles(id),
    recipient_id UUID REFERENCES profiles(id),
    target_roles TEXT[] NOT NULL,
    target_classes UUID[],
    priority VARCHAR(20) DEFAULT 'normal',
    is_urgent BOOLEAN DEFAULT false,
    scheduled_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Reads
CREATE TABLE notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    read_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Target Classes
CREATE TABLE notification_target_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id),
    class_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Target Roles
CREATE TABLE notification_target_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id),
    role_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Notification Attachments
CREATE TABLE notification_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID NOT NULL REFERENCES notifications(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    public_url TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- STUDENT FEEDBACK SYSTEM
-- =============================================

-- Student Feedback
CREATE TABLE student_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES profiles(id),
    student_id UUID NOT NULL REFERENCES profiles(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    timetable_event_id UUID NOT NULL REFERENCES timetable_events(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    feedback_text TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('individual', 'group', 'class')),
    is_positive BOOLEAN,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feedback Notifications
CREATE TABLE feedback_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_feedback_id UUID NOT NULL REFERENCES student_feedback(id),
    parent_id UUID NOT NULL REFERENCES profiles(id),
    student_id UUID NOT NULL REFERENCES profiles(id),
    teacher_id UUID NOT NULL REFERENCES profiles(id),
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- LEAVE APPLICATIONS
-- =============================================

-- Leave Applications
CREATE TABLE leave_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id),
    parent_id UUID NOT NULL REFERENCES profiles(id),
    class_id UUID REFERENCES classes(id),
    academic_year_id UUID REFERENCES academic_years(id),
    homeroom_teacher_id UUID REFERENCES profiles(id),
    leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('sick', 'family', 'emergency', 'vacation', 'other')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- MEETINGS AND COMMUNICATIONS
-- =============================================

-- Unified Meetings
CREATE TABLE unified_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    meeting_type VARCHAR(50),
    organizer_id UUID NOT NULL REFERENCES profiles(id),
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER,
    location VARCHAR(200),
    meeting_url TEXT,
    status VARCHAR(50) DEFAULT 'scheduled',
    recipients JSONB,
    metadata JSONB,
    meeting_class_id UUID REFERENCES classes(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- REPORTING SYSTEM
-- =============================================

-- Report Periods
CREATE TABLE report_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    semester_id UUID NOT NULL REFERENCES semesters(id),
    created_by UUID NOT NULL REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Student Reports
CREATE TABLE student_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_period_id UUID NOT NULL REFERENCES report_periods(id),
    student_id UUID NOT NULL REFERENCES profiles(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    homeroom_teacher_id UUID NOT NULL REFERENCES profiles(id),
    academic_performance TEXT,
    behavior_assessment TEXT,
    attendance_summary TEXT,
    achievements TEXT,
    areas_for_improvement TEXT,
    teacher_comments TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'sent')),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parent Report Responses
CREATE TABLE parent_report_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_report_id UUID NOT NULL REFERENCES student_reports(id),
    parent_id UUID NOT NULL REFERENCES profiles(id),
    agreement_status TEXT CHECK (agreement_status IN ('agree', 'disagree')),
    parent_comments TEXT,
    concerns TEXT,
    suggestions TEXT,
    meeting_requested BOOLEAN DEFAULT false,
    responded_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Report Notifications
CREATE TABLE report_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_report_id UUID NOT NULL REFERENCES student_reports(id),
    parent_id UUID NOT NULL REFERENCES profiles(id),
    homeroom_teacher_id UUID NOT NULL REFERENCES profiles(id),
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- AUDIT AND TRACKING SYSTEM
-- =============================================

-- Unified Audit Logs
CREATE TABLE unified_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    user_id UUID REFERENCES profiles(id),
    old_values JSONB,
    new_values JSONB,
    changes_summary TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit Changes (Detailed field-level changes)
CREATE TABLE audit_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_log_id UUID NOT NULL REFERENCES unified_audit_logs(id),
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    value_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Unified Read Tracking
CREATE TABLE unified_read_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tracking_type VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id),
    reference_id UUID NOT NULL,
    reference_table VARCHAR(100) NOT NULL,
    read_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- AI AND AUTOMATION FEATURES
-- =============================================

-- AI Grade Feedback
CREATE TABLE ai_grade_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES profiles(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    period_id UUID NOT NULL REFERENCES grade_reporting_periods(id),
    feedback_content TEXT NOT NULL,
    feedback_style TEXT NOT NULL CHECK (feedback_style IN ('friendly', 'serious', 'encouraging', 'understanding')),
    feedback_length TEXT NOT NULL CHECK (feedback_length IN ('short', 'medium', 'long')),
    version_number INTEGER DEFAULT 1,
    reason_for_revision TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent_to_parents')),
    sent_at TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Conversations (AI Assistant)
CREATE TABLE chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES profiles(id),
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_archived BOOLEAN DEFAULT false
);

-- Chat Messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    context_used JSONB,
    function_calls INTEGER DEFAULT 0,
    prompt_strength NUMERIC(3,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat Feedback
CREATE TABLE chat_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id),
    parent_id UUID NOT NULL REFERENCES profiles(id),
    is_helpful BOOLEAN,
    rating TEXT NOT NULL CHECK (rating IN ('excellent', 'good', 'average', 'poor', 'very_poor')),
    comment TEXT,
    user_question TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Message Context
CREATE TABLE message_context (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES chat_messages(id),
    context_type VARCHAR(50),
    context_data JSONB,
    relevance_score NUMERIC(3,2),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- SYSTEM CONFIGURATION AND UTILITIES
-- =============================================

-- System Configuration
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_category VARCHAR(50) NOT NULL CHECK (config_category IN ('grade', 'violation', 'notification', 'system')),
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(config_category, config_key)
);

-- Grade Improvement Requests
CREATE TABLE grade_improvement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    improvement_period_id UUID NOT NULL,
    student_id UUID NOT NULL REFERENCES profiles(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unified Submissions (Generic submission tracking)
CREATE TABLE unified_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_type VARCHAR(50) NOT NULL,
    submitter_id UUID NOT NULL REFERENCES profiles(id),
    target_id UUID,
    target_type VARCHAR(50),
    academic_year_id UUID REFERENCES academic_years(id),
    semester_id UUID REFERENCES semesters(id),
    period_id UUID,
    subject_id UUID REFERENCES subjects(id),
    class_id UUID REFERENCES classes(id),
    status VARCHAR(50) DEFAULT 'pending',
    submitted_at TIMESTAMPTZ DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Academic Monthly Violation Alerts
CREATE TABLE academic_monthly_violation_alerts (
    id UUID,
    student_id UUID,
    semester_id UUID,
    academic_month INTEGER,
    total_violations INTEGER,
    is_seen BOOLEAN,
    seen_by UUID,
    seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
);

-- Admin Student Submissions
CREATE TABLE admin_student_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES grade_reporting_periods(id),
    student_id UUID NOT NULL REFERENCES profiles(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    admin_id UUID NOT NULL REFERENCES profiles(id),
    homeroom_teacher_id UUID NOT NULL REFERENCES profiles(id),
    submission_count INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'received', 'processed')),
    submission_reason TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    received_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- ADDITIONAL SPECIALIZED TABLES
-- =============================================

-- Grade Submissions (Homeroom teacher submissions)
CREATE TABLE grade_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL REFERENCES grade_reporting_periods(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    homeroom_teacher_id UUID NOT NULL REFERENCES profiles(id),
    status TEXT NOT NULL CHECK (status IN ('pending_review', 'reviewed', 'sent_to_parents')),
    total_students INTEGER,
    submission_summary TEXT,
    sent_by UUID NOT NULL REFERENCES profiles(id),
    sent_at TIMESTAMPTZ NOT NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student Grade Submissions
CREATE TABLE student_grade_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    semester_id UUID NOT NULL REFERENCES semesters(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    student_id UUID NOT NULL REFERENCES profiles(id),
    submission_name VARCHAR(200) NOT NULL,
    submission_data JSONB,
    status VARCHAR(50) DEFAULT 'draft',
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Class Grade Summaries
CREATE TABLE class_grade_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    semester_id UUID NOT NULL REFERENCES semesters(id),
    class_id UUID NOT NULL REFERENCES classes(id),
    summary_name VARCHAR(200) NOT NULL,
    summary_data JSONB,
    is_sent BOOLEAN DEFAULT false,
    sent_by UUID REFERENCES profiles(id),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Homeroom Parent Submissions
CREATE TABLE homeroom_parent_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_id UUID NOT NULL,
    class_id UUID NOT NULL,
    student_id UUID NOT NULL,
    homeroom_teacher_id UUID NOT NULL,
    submission_data JSONB,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- VIEWS AND MATERIALIZED VIEWS
-- =============================================

-- Available Subjects for Class (View)
CREATE VIEW available_subjects_for_class AS
SELECT
    s.id,
    s.code,
    s.name_vietnamese,
    s.name_english,
    s.category,
    s.description,
    c.id as class_id,
    c.name as class_name,
    c.academic_year_id
FROM subjects s
CROSS JOIN classes c
WHERE s.is_active = true AND c.is_active = true;

-- Timetable Events Detailed (View)
CREATE VIEW timetable_events_detailed AS
SELECT
    te.id,
    te.class_id,
    te.subject_id,
    te.teacher_id,
    te.classroom_id,
    te.semester_id,
    te.day_of_week,
    te.start_time,
    te.end_time,
    te.week_number,
    te.notes,
    te.created_at,
    te.updated_at,
    c.name as class_name,
    s.code as subject_code,
    s.name_vietnamese as subject_name,
    p.full_name as teacher_name,
    cr.name as classroom_name,
    cr.building,
    cr.floor,
    cr.room_type,
    sem.name as semester_name,
    ay.name as academic_year_name
FROM timetable_events te
LEFT JOIN classes c ON te.class_id = c.id
LEFT JOIN subjects s ON te.subject_id = s.id
LEFT JOIN profiles p ON te.teacher_id = p.id
LEFT JOIN classrooms cr ON te.classroom_id = cr.id
LEFT JOIN semesters sem ON te.semester_id = sem.id
LEFT JOIN academic_years ay ON sem.academic_year_id = ay.id;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Core entity indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_student_id ON profiles(student_id);

-- Academic structure indexes
CREATE INDEX idx_classes_academic_year ON classes(academic_year_id);
CREATE INDEX idx_classes_semester ON classes(semester_id);
CREATE INDEX idx_classes_homeroom_teacher ON classes(homeroom_teacher_id);

-- Violation system indexes
CREATE INDEX idx_student_violations_student ON student_violations(student_id);
CREATE INDEX idx_student_violations_date ON student_violations(violation_date);
CREATE INDEX idx_student_violations_semester ON student_violations(semester_id);
CREATE INDEX idx_student_violations_sent_status ON student_violations(sent_status);

-- Grade system indexes
CREATE INDEX idx_student_detailed_grades_student ON student_detailed_grades(student_id);
CREATE INDEX idx_student_detailed_grades_period ON student_detailed_grades(period_id);
CREATE INDEX idx_student_detailed_grades_subject ON student_detailed_grades(subject_id);

-- Notification indexes
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_sender ON notifications(sender_id);
CREATE INDEX idx_notification_reads_user ON notification_reads(user_id);

-- Timetable indexes
CREATE INDEX idx_timetable_events_class ON timetable_events(class_id);
CREATE INDEX idx_timetable_events_teacher ON timetable_events(teacher_id);
CREATE INDEX idx_timetable_events_day_time ON timetable_events(day_of_week, start_time);

-- =============================================
-- ADDITIONAL CONSTRAINTS
-- =============================================

-- Add foreign key constraint that was missing
ALTER TABLE student_disciplinary_cases
ADD CONSTRAINT student_disciplinary_cases_action_type_id_fkey
FOREIGN KEY (action_type_id) REFERENCES disciplinary_action_types(id);

-- Add foreign key constraint for timetable events exchange requests
ALTER TABLE timetable_events
ADD CONSTRAINT timetable_events_exchange_request_id_fkey
FOREIGN KEY (exchange_request_id) REFERENCES schedule_exchange_requests(id);

-- Add foreign key constraint for unified meetings class
ALTER TABLE unified_meetings
ADD CONSTRAINT fk_unified_meetings_meeting_class_id
FOREIGN KEY (meeting_class_id) REFERENCES classes(id);

-- =============================================
-- COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON DATABASE postgres IS 'EduConnect Educational Management System Database';

COMMENT ON TABLE profiles IS 'User profiles for all system users (admin, teachers, students, parents)';
COMMENT ON TABLE student_violations IS 'Records of student disciplinary violations with individual sent status tracking';
COMMENT ON TABLE student_disciplinary_cases IS 'Disciplinary cases created from accumulated violations';
COMMENT ON TABLE unified_violation_reports IS 'Aggregated violation reports for different time periods';

-- =============================================
-- END OF SCHEMA
-- =============================================
