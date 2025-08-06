CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');
CREATE TYPE subject_category AS ENUM ('core', 'specialized');
CREATE TYPE assignment_type AS ENUM ('homeroom', 'subject_combination');
CREATE TYPE leave_type AS ENUM ('sick', 'personal', 'family', 'other');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE exchange_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE meeting_type AS ENUM ('parent_meeting', 'class_meeting', 'individual_meeting');
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian', 'other');

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL,
    employee_id TEXT,
    student_id TEXT,
    phone_number TEXT,
    address TEXT,
    date_of_birth DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE class_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    class_block_id UUID REFERENCES class_blocks(id),
    class_suffix TEXT,
    auto_generated_name BOOLEAN DEFAULT false,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    is_subject_combination BOOLEAN DEFAULT false,
    subject_combination_type TEXT,
    subject_combination_variant TEXT,
    homeroom_teacher_id UUID REFERENCES profiles(id),
    max_students INTEGER DEFAULT 40,
    current_students INTEGER DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL,
    name_vietnamese TEXT NOT NULL,
    name_english TEXT NOT NULL,
    category subject_category NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE classrooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    building TEXT,
    floor INTEGER,
    room_type TEXT NOT NULL,
    capacity INTEGER,
    equipment TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE timetable_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE teacher_class_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE student_class_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    assignment_type assignment_type NOT NULL,
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE parent_student_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    relationship_type relationship_type NOT NULL,
    is_primary_contact BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE schedule_exchange_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    timetable_event_id UUID NOT NULL REFERENCES timetable_events(id) ON DELETE CASCADE,
    exchange_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status exchange_status DEFAULT 'pending',
    admin_response TEXT,
    approved_by UUID REFERENCES profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE feedback_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    timetable_event_id UUID REFERENCES timetable_events(id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    ai_summary TEXT,
    use_ai_summary BOOLEAN DEFAULT false,
    ai_generated_at TIMESTAMP WITH TIME ZONE,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_roles user_role[],
    target_classes UUID[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notification_reads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(notification_id, user_id)
);

CREATE TABLE meeting_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_location TEXT,
    duration_minutes INTEGER DEFAULT 60,
    meeting_type meeting_type DEFAULT 'parent_meeting',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE meeting_schedule_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_schedule_id UUID NOT NULL REFERENCES meeting_schedules(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    homeroom_teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status leave_status DEFAULT 'pending',
    teacher_response TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE student_grade_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    submission_type TEXT NOT NULL,
    submitted_by UUID NOT NULL REFERENCES profiles(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_finalized BOOLEAN DEFAULT false,
    finalized_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE individual_subject_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES student_grade_submissions(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade_15_min DECIMAL(3,1)[],
    grade_45_min DECIMAL(3,1)[],
    grade_midterm DECIMAL(3,1),
    grade_final DECIMAL(3,1),
    grade_average DECIMAL(3,1),
    conduct_score INTEGER CHECK (conduct_score >= 0 AND conduct_score <= 100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE violation_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    severity_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE violation_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES violation_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    default_penalty_points INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE student_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    violation_type_id UUID NOT NULL REFERENCES violation_types(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    violation_date DATE NOT NULL,
    description TEXT,
    penalty_points INTEGER DEFAULT 0,
    is_resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_student_id ON profiles(student_id);
CREATE INDEX idx_profiles_employee_id ON profiles(employee_id);
CREATE INDEX idx_academic_years_active ON academic_years(is_active);
CREATE INDEX idx_semesters_academic_year ON semesters(academic_year_id);
CREATE INDEX idx_semesters_active ON semesters(is_active);
CREATE INDEX idx_classes_academic_year ON classes(academic_year_id);
CREATE INDEX idx_classes_semester ON classes(semester_id);
CREATE INDEX idx_classes_homeroom_teacher ON classes(homeroom_teacher_id);
CREATE INDEX idx_classes_active ON classes(is_active);
CREATE INDEX idx_subjects_category ON subjects(category);
CREATE INDEX idx_subjects_active ON subjects(is_active);
CREATE INDEX idx_classrooms_active ON classrooms(is_active);
CREATE INDEX idx_timetable_events_class ON timetable_events(class_id);
CREATE INDEX idx_timetable_events_teacher ON timetable_events(teacher_id);
CREATE INDEX idx_timetable_events_subject ON timetable_events(subject_id);
CREATE INDEX idx_timetable_events_classroom ON timetable_events(classroom_id);
CREATE INDEX idx_timetable_events_semester ON timetable_events(semester_id);
CREATE INDEX idx_timetable_events_week ON timetable_events(week_number);
CREATE INDEX idx_timetable_events_day ON timetable_events(day_of_week);
CREATE INDEX idx_teacher_assignments_teacher ON teacher_class_assignments(teacher_id);
CREATE INDEX idx_teacher_assignments_class ON teacher_class_assignments(class_id);
CREATE INDEX idx_teacher_assignments_subject ON teacher_class_assignments(subject_id);
CREATE INDEX idx_teacher_assignments_active ON teacher_class_assignments(is_active);
CREATE INDEX idx_student_assignments_student ON student_class_assignments(student_id);
CREATE INDEX idx_student_assignments_class ON student_class_assignments(class_id);
CREATE INDEX idx_student_assignments_active ON student_class_assignments(is_active);
CREATE INDEX idx_parent_student_parent ON parent_student_relationships(parent_id);
CREATE INDEX idx_parent_student_student ON parent_student_relationships(student_id);
CREATE INDEX idx_parent_student_active ON parent_student_relationships(is_active);
CREATE INDEX idx_exchange_requests_requester ON schedule_exchange_requests(requester_teacher_id);
CREATE INDEX idx_exchange_requests_target ON schedule_exchange_requests(target_teacher_id);
CREATE INDEX idx_exchange_requests_status ON schedule_exchange_requests(status);
CREATE INDEX idx_feedback_teacher ON feedback_notifications(teacher_id);
CREATE INDEX idx_feedback_student ON feedback_notifications(student_id);
CREATE INDEX idx_feedback_subject ON feedback_notifications(subject_id);
CREATE INDEX idx_feedback_week ON feedback_notifications(week_number);
CREATE INDEX idx_feedback_sent ON feedback_notifications(is_sent);
CREATE INDEX idx_notifications_sender ON notifications(sender_id);
CREATE INDEX idx_notifications_active ON notifications(is_active);
CREATE INDEX idx_notification_reads_notification ON notification_reads(notification_id);
CREATE INDEX idx_notification_reads_user ON notification_reads(user_id);
CREATE INDEX idx_meeting_schedules_teacher ON meeting_schedules(teacher_id);
CREATE INDEX idx_meeting_schedules_class ON meeting_schedules(class_id);
CREATE INDEX idx_meeting_schedules_date ON meeting_schedules(meeting_date);
CREATE INDEX idx_meeting_recipients_meeting ON meeting_schedule_recipients(meeting_schedule_id);
CREATE INDEX idx_meeting_recipients_parent ON meeting_schedule_recipients(parent_id);
CREATE INDEX idx_leave_applications_student ON leave_applications(student_id);
CREATE INDEX idx_leave_applications_parent ON leave_applications(parent_id);
CREATE INDEX idx_leave_applications_teacher ON leave_applications(homeroom_teacher_id);
CREATE INDEX idx_leave_applications_status ON leave_applications(status);
CREATE INDEX idx_grade_submissions_student ON student_grade_submissions(student_id);
CREATE INDEX idx_grade_submissions_class ON student_grade_submissions(class_id);
CREATE INDEX idx_individual_grades_submission ON individual_subject_grades(submission_id);
CREATE INDEX idx_individual_grades_subject ON individual_subject_grades(subject_id);
CREATE INDEX idx_violation_categories_active ON violation_categories(is_active);
CREATE INDEX idx_violation_types_category ON violation_types(category_id);
CREATE INDEX idx_violation_types_active ON violation_types(is_active);
CREATE INDEX idx_student_violations_student ON student_violations(student_id);
CREATE INDEX idx_student_violations_type ON student_violations(violation_type_id);
CREATE INDEX idx_student_violations_date ON student_violations(violation_date);

CREATE VIEW student_class_assignments_view AS
SELECT
    sca.id,
    sca.student_id,
    sca.class_id,
    sca.academic_year_id,
    sca.assignment_type,
    sca.is_active,
    s.full_name as student_name,
    s.student_id as student_code,
    s.email as student_email,
    c.name as class_name,
    ay.name as academic_year_name,
    sem.name as semester_name
FROM student_class_assignments sca
JOIN profiles s ON sca.student_id = s.id
JOIN classes c ON sca.class_id = c.id
JOIN academic_years ay ON sca.academic_year_id = ay.id
LEFT JOIN semesters sem ON c.semester_id = sem.id
WHERE sca.is_active = true;

CREATE VIEW parent_feedback_with_ai_summary AS
SELECT
    fn.*,
    s.full_name as student_name,
    s.student_id as student_code,
    subj.name_vietnamese as subject_name,
    subj.code as subject_code,
    t.full_name as teacher_name,
    c.name as class_name
FROM feedback_notifications fn
JOIN profiles s ON fn.student_id = s.id
JOIN subjects subj ON fn.subject_id = subj.id
JOIN profiles t ON fn.teacher_id = t.id
JOIN timetable_events te ON fn.timetable_event_id = te.id
JOIN classes c ON te.class_id = c.id;

-- Remove duplicate indexes - keeping only the first set of indexes defined above

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_class_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_schedule_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_grade_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_subject_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE violation_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_violations ENABLE ROW LEVEL SECURITY;
