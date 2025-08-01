-- Core Educational System Seed Data
-- Sample data for testing the educational system

-- Insert academic years
INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES
('2023-2024', '2023-09-01', '2024-06-30', false),
('2024-2025', '2024-09-01', '2025-06-30', true),
('2025-2026', '2025-09-01', '2026-06-30', false)
ON CONFLICT (name) DO NOTHING;

-- Get current academic year ID
DO $$
DECLARE
    current_academic_year_id UUID;
    semester1_id UUID;
    semester2_id UUID;
    khoi10_id UUID;
    khoi11_id UUID;
    khoi12_id UUID;
    class10a1_id UUID;
    class10a2_id UUID;
    class11a1_id UUID;
    class12a1_id UUID;
BEGIN
    SELECT id INTO current_academic_year_id FROM academic_years WHERE name = '2024-2025';

    -- Insert semesters for current academic year
    INSERT INTO semesters (academic_year_id, name, semester_number, start_date, end_date, weeks_count, is_current) VALUES
    (current_academic_year_id, 'Học kỳ 1', 1, '2024-09-01', '2025-01-15', 18, true),
    (current_academic_year_id, 'Học kỳ 2', 2, '2025-01-16', '2025-06-30', 17, false)
    ON CONFLICT (academic_year_id, semester_number) DO NOTHING;

    SELECT id INTO semester1_id FROM semesters WHERE academic_year_id = current_academic_year_id AND semester_number = 1;
    SELECT id INTO semester2_id FROM semesters WHERE academic_year_id = current_academic_year_id AND semester_number = 2;

    -- Insert class blocks (Khối)
    INSERT INTO class_blocks (name, display_name, description, is_active, sort_order) VALUES
    ('10', 'Khối 10', 'Lớp 10 - Năm đầu cấp trung học phổ thông', true, 1),
    ('11', 'Khối 11', 'Lớp 11 - Năm thứ hai cấp trung học phổ thông', true, 2),
    ('12', 'Khối 12', 'Lớp 12 - Năm cuối cấp trung học phổ thông', true, 3)
    ON CONFLICT (name) DO NOTHING;

    SELECT id INTO khoi10_id FROM class_blocks WHERE name = '10';
    SELECT id INTO khoi11_id FROM class_blocks WHERE name = '11';
    SELECT id INTO khoi12_id FROM class_blocks WHERE name = '12';

    -- Insert classrooms
    INSERT INTO classrooms (name, building, floor, capacity, room_type, equipment, is_active) VALUES
    ('A101', 'Tòa A', 1, 40, 'standard', '{"projector", "whiteboard", "air_conditioner"}', true),
    ('A102', 'Tòa A', 1, 40, 'standard', '{"projector", "whiteboard", "air_conditioner"}', true),
    ('A201', 'Tòa A', 2, 40, 'standard', '{"projector", "whiteboard", "air_conditioner"}', true),
    ('A202', 'Tòa A', 2, 40, 'standard', '{"projector", "whiteboard", "air_conditioner"}', true),
    ('B101', 'Tòa B', 1, 35, 'lab', '{"computers", "projector", "lab_equipment"}', true),
    ('B102', 'Tòa B', 1, 35, 'computer', '{"computers", "projector", "network"}', true),
    ('C101', 'Tòa C', 1, 200, 'auditorium', '{"sound_system", "projector", "stage"}', true),
    ('GYM01', 'Nhà thi đấu', 1, 100, 'gym', '{"sports_equipment", "sound_system"}', true)
    ON CONFLICT (name) DO NOTHING;

    -- Insert classes
    INSERT INTO classes (name, class_block_id, class_suffix, auto_generated_name, academic_year_id, semester_id, is_subject_combination, homeroom_teacher_id, max_students, current_students, description) VALUES
    ('10A1', khoi10_id, 'A1', true, current_academic_year_id, semester1_id, false, NULL, 40, 0, 'Lớp 10A1 - Lớp học cơ bản khối 10'),
    ('10A2', khoi10_id, 'A2', true, current_academic_year_id, semester1_id, false, NULL, 40, 0, 'Lớp 10A2 - Lớp học cơ bản khối 10'),
    ('10A3', khoi10_id, 'A3', true, current_academic_year_id, semester1_id, false, NULL, 40, 0, 'Lớp 10A3 - Lớp học cơ bản khối 10'),
    ('11A1', khoi11_id, 'A1', true, current_academic_year_id, semester1_id, false, NULL, 38, 0, 'Lớp 11A1 - Lớp học cơ bản khối 11'),
    ('11A2', khoi11_id, 'A2', true, current_academic_year_id, semester1_id, false, NULL, 38, 0, 'Lớp 11A2 - Lớp học cơ bản khối 11'),
    ('12A1', khoi12_id, 'A1', true, current_academic_year_id, semester1_id, false, NULL, 35, 0, 'Lớp 12A1 - Lớp học cơ bản khối 12'),
    ('12A2', khoi12_id, 'A2', true, current_academic_year_id, semester1_id, false, NULL, 35, 0, 'Lớp 12A2 - Lớp học cơ bản khối 12')
    ON CONFLICT (name, academic_year_id, semester_id) DO NOTHING;

    -- Get class IDs for student assignments
    SELECT id INTO class10a1_id FROM classes WHERE name = '10A1' AND academic_year_id = current_academic_year_id;
    SELECT id INTO class10a2_id FROM classes WHERE name = '10A2' AND academic_year_id = current_academic_year_id;
    SELECT id INTO class11a1_id FROM classes WHERE name = '11A1' AND academic_year_id = current_academic_year_id;
    SELECT id INTO class12a1_id FROM classes WHERE name = '12A1' AND academic_year_id = current_academic_year_id;

    -- Create sample student profiles (only if they don't exist)
    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'student1@example.com', 'Nguyễn Văn An', 'student'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'student1@example.com');

    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'student2@example.com', 'Trần Thị Bình', 'student'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'student2@example.com');

    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'student3@example.com', 'Lê Văn Cường', 'student'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'student3@example.com');

    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'student4@example.com', 'Phạm Thị Dung', 'student'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'student4@example.com');

    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'student5@example.com', 'Hoàng Văn Em', 'student'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'student5@example.com');

    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'student6@example.com', 'Vũ Thị Phương', 'student'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'student6@example.com');

    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'student7@example.com', 'Đặng Văn Giang', 'student'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'student7@example.com');

    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'student8@example.com', 'Bùi Thị Hoa', 'student'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'student8@example.com');

    -- Create sample parent profiles
    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'parent1@example.com', 'Nguyễn Văn Bình (Phụ huynh)', 'parent'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'parent1@example.com');

    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'parent2@example.com', 'Trần Thị Cúc (Phụ huynh)', 'parent'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'parent2@example.com');

    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'parent3@example.com', 'Lê Văn Dũng (Phụ huynh)', 'parent'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'parent3@example.com');

    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'parent4@example.com', 'Phạm Thị Ế (Phụ huynh)', 'parent'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'parent4@example.com');

    -- Create teacher profiles
    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'teacher1@example.com', 'Cô Nguyễn Thị Lan (Giáo viên)', 'teacher'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'teacher1@example.com');

    INSERT INTO profiles (id, email, full_name, role) 
    SELECT gen_random_uuid(), 'teacher2@example.com', 'Thầy Trần Văn Minh (Giáo viên)', 'teacher'
    WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'teacher2@example.com');

    -- Insert student class assignments
    INSERT INTO student_class_assignments (student_id, class_id, academic_year_id, semester_id, enrollment_date, is_active)
    SELECT 
        p.id,
        CASE 
            WHEN p.email = 'student1@example.com' THEN class10a1_id
            WHEN p.email = 'student2@example.com' THEN class10a1_id
            WHEN p.email = 'student3@example.com' THEN class10a2_id
            WHEN p.email = 'student4@example.com' THEN class10a2_id
            WHEN p.email = 'student5@example.com' THEN class11a1_id
            WHEN p.email = 'student6@example.com' THEN class11a1_id
            WHEN p.email = 'student7@example.com' THEN class12a1_id
            WHEN p.email = 'student8@example.com' THEN class12a1_id
        END,
        current_academic_year_id,
        semester1_id,
        '2024-09-01',
        true
    FROM profiles p
    WHERE p.role = 'student' 
    AND p.email IN ('student1@example.com', 'student2@example.com', 'student3@example.com', 'student4@example.com', 'student5@example.com', 'student6@example.com', 'student7@example.com', 'student8@example.com')
    ON CONFLICT (student_id, class_id, academic_year_id, semester_id) DO NOTHING;

    -- Insert parent-student relationships
    INSERT INTO parent_student_relationships (parent_id, student_id, relationship_type, is_primary, is_active)
    SELECT 
        parent.id,
        student.id,
        'parent',
        true,
        true
    FROM profiles parent, profiles student
    WHERE parent.role = 'parent' 
    AND student.role = 'student'
    AND (
        (parent.email = 'parent1@example.com' AND student.email IN ('student1@example.com', 'student2@example.com')) OR
        (parent.email = 'parent2@example.com' AND student.email IN ('student3@example.com', 'student4@example.com')) OR
        (parent.email = 'parent3@example.com' AND student.email IN ('student5@example.com', 'student6@example.com')) OR
        (parent.email = 'parent4@example.com' AND student.email IN ('student7@example.com', 'student8@example.com'))
    )
    ON CONFLICT (parent_id, student_id) DO NOTHING;

    -- Update class current_students count
    UPDATE classes SET current_students = (
        SELECT COUNT(*)
        FROM student_class_assignments sca
        WHERE sca.class_id = classes.id 
        AND sca.is_active = true
        AND sca.academic_year_id = current_academic_year_id
        AND sca.semester_id = semester1_id
    );

END $$;
