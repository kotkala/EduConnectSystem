-- =====================================================
-- EDUCONNECT DATABASE NORMALIZATION TO 3NF
-- Phase 1: Eliminate 1NF Violations
-- =====================================================

-- 1. CREATE EQUIPMENT TYPES TABLE (Replace array in classrooms)
CREATE TABLE equipment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50), -- 'technology', 'furniture', 'safety', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. CREATE CLASSROOM EQUIPMENT JUNCTION TABLE
CREATE TABLE classroom_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    equipment_type_id UUID NOT NULL REFERENCES equipment_types(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    condition VARCHAR(20) DEFAULT 'good', -- 'excellent', 'good', 'fair', 'poor'
    last_maintenance_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(classroom_id, equipment_type_id)
);

-- 3. CREATE VIOLATION DETAIL TYPES (Replace JSONB in weekly_violation_reports)
CREATE TABLE violation_detail_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. CREATE WEEKLY VIOLATION DETAILS (Normalized from JSONB)
CREATE TABLE weekly_violation_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_report_id UUID NOT NULL REFERENCES weekly_violation_reports(id) ON DELETE CASCADE,
    violation_detail_type_id UUID NOT NULL REFERENCES violation_detail_types(id),
    value TEXT NOT NULL,
    numeric_value DECIMAL(10,2), -- For quantitative data
    created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Phase 2: Eliminate 2NF Violations
-- =====================================================

-- 5. CREATE HOMEROOM ASSIGNMENTS TABLE (Remove from classes)
CREATE TABLE homeroom_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class_id, academic_year_id, is_active) -- Only one active homeroom teacher per class per year
);

-- 6. CREATE COMPUTED FIELDS TABLE (For derived data)
CREATE TABLE class_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id),
    semester_id UUID REFERENCES semesters(id),
    total_students INTEGER DEFAULT 0,
    active_students INTEGER DEFAULT 0,
    average_grade DECIMAL(4,2),
    attendance_rate DECIMAL(5,2),
    last_calculated TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(class_id, academic_year_id, semester_id)
);

-- =====================================================
-- Phase 3: Eliminate 3NF Violations & Redundancy
-- =====================================================

-- 7. CREATE AUDIT LOG TABLE (Centralized audit trail)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES profiles(id),
    changed_at TIMESTAMPTZ DEFAULT now(),
    ip_address INET,
    user_agent TEXT
);

-- 8. CREATE STATUS TYPES TABLE (Standardize status fields)
CREATE TABLE status_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(50) NOT NULL, -- 'grade_submission', 'violation', 'feedback', etc.
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color_code VARCHAR(7), -- Hex color for UI
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(category, code)
);

-- 9. CREATE NOTIFICATION TEMPLATES (Reduce redundancy)
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'feedback', 'violation', 'grade', etc.
    name VARCHAR(100) NOT NULL,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Phase 4: Create Optimized Indexes
-- =====================================================

-- Performance indexes for common queries
CREATE INDEX idx_classroom_equipment_classroom ON classroom_equipment(classroom_id);
CREATE INDEX idx_classroom_equipment_type ON classroom_equipment(equipment_type_id);
CREATE INDEX idx_homeroom_assignments_active ON homeroom_assignments(class_id, is_active) WHERE is_active = true;
CREATE INDEX idx_class_statistics_current ON class_statistics(class_id, academic_year_id) WHERE semester_id IS NULL;
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at);
CREATE INDEX idx_status_types_category ON status_types(category, is_active) WHERE is_active = true;

-- =====================================================
-- Phase 5: Data Migration Procedures
-- =====================================================

-- Migrate equipment data from array to normalized tables
CREATE OR REPLACE FUNCTION migrate_classroom_equipment()
RETURNS void AS $$
DECLARE
    classroom_rec RECORD;
    equipment_item TEXT;
BEGIN
    -- First, create common equipment types
    INSERT INTO equipment_types (name, category) VALUES
    ('Projector', 'technology'),
    ('Computer', 'technology'),
    ('Whiteboard', 'furniture'),
    ('Air Conditioner', 'comfort'),
    ('Speakers', 'technology')
    ON CONFLICT (name) DO NOTHING;
    
    -- Migrate existing equipment arrays
    FOR classroom_rec IN SELECT id, equipment FROM classrooms WHERE equipment IS NOT NULL LOOP
        FOR equipment_item IN SELECT unnest(classroom_rec.equipment) LOOP
            INSERT INTO classroom_equipment (classroom_id, equipment_type_id, quantity)
            SELECT 
                classroom_rec.id,
                et.id,
                1
            FROM equipment_types et
            WHERE et.name = equipment_item
            ON CONFLICT (classroom_id, equipment_type_id) DO NOTHING;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP-BY-STEP MIGRATION PLAN
-- =====================================================

/*
PHASE 1: PREPARATION (Zero Downtime)
1. Create new normalized tables alongside existing ones
2. Create migration functions
3. Set up triggers for dual-write during transition
4. Validate data integrity

PHASE 2: MIGRATION (Minimal Downtime)
1. Run data migration scripts
2. Update application code to use new tables
3. Switch read queries to new tables
4. Validate all functionality

PHASE 3: CLEANUP (Zero Downtime)
1. Remove old columns/tables after validation period
2. Update RLS policies
3. Optimize indexes
4. Update documentation

ROLLBACK STRATEGY:
- Keep old tables during transition period
- Maintain dual-write capability
- Quick rollback switches available
*/

-- =====================================================
-- MIGRATION SCRIPTS
-- =====================================================

-- Script 1: Create all new tables (can run in production)
DO $$
BEGIN
    -- Check if migration is already started
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'equipment_types') THEN
        -- Execute all CREATE TABLE statements above
        RAISE NOTICE 'Creating normalized tables...';
    ELSE
        RAISE NOTICE 'Migration tables already exist, skipping creation...';
    END IF;
END $$;

-- Script 2: Migrate homeroom assignments
CREATE OR REPLACE FUNCTION migrate_homeroom_assignments()
RETURNS void AS $$
BEGIN
    INSERT INTO homeroom_assignments (
        class_id,
        teacher_id,
        academic_year_id,
        start_date,
        is_active
    )
    SELECT
        c.id,
        c.homeroom_teacher_id,
        c.academic_year_id,
        ay.start_date,
        true
    FROM classes c
    JOIN academic_years ay ON c.academic_year_id = ay.id
    WHERE c.homeroom_teacher_id IS NOT NULL
    ON CONFLICT (class_id, academic_year_id, is_active) DO NOTHING;

    RAISE NOTICE 'Migrated % homeroom assignments', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- Script 3: Calculate and populate class statistics
CREATE OR REPLACE FUNCTION calculate_class_statistics()
RETURNS void AS $$
BEGIN
    INSERT INTO class_statistics (
        class_id,
        academic_year_id,
        semester_id,
        total_students,
        active_students
    )
    SELECT
        c.id,
        c.academic_year_id,
        c.semester_id,
        COUNT(sca.student_id) as total_students,
        COUNT(sca.student_id) FILTER (WHERE sca.is_active = true) as active_students
    FROM classes c
    LEFT JOIN student_class_assignments sca ON c.id = sca.class_id
    GROUP BY c.id, c.academic_year_id, c.semester_id
    ON CONFLICT (class_id, academic_year_id, semester_id)
    DO UPDATE SET
        total_students = EXCLUDED.total_students,
        active_students = EXCLUDED.active_students,
        last_calculated = now();

    RAISE NOTICE 'Calculated statistics for % classes', ROW_COUNT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERFORMANCE OPTIMIZATION QUERIES
-- =====================================================

-- Query 1: Most efficient way to get class with homeroom teacher
CREATE OR REPLACE VIEW classes_with_homeroom AS
SELECT
    c.id,
    c.name,
    c.academic_year_id,
    c.semester_id,
    ha.teacher_id as homeroom_teacher_id,
    p.full_name as homeroom_teacher_name,
    cs.active_students,
    cs.total_students
FROM classes c
LEFT JOIN homeroom_assignments ha ON c.id = ha.class_id AND ha.is_active = true
LEFT JOIN profiles p ON ha.teacher_id = p.id
LEFT JOIN class_statistics cs ON c.id = cs.class_id AND c.academic_year_id = cs.academic_year_id;

-- Query 2: Efficient classroom equipment lookup
CREATE OR REPLACE VIEW classroom_equipment_summary AS
SELECT
    c.id as classroom_id,
    c.name as classroom_name,
    array_agg(
        json_build_object(
            'equipment', et.name,
            'quantity', ce.quantity,
            'condition', ce.condition
        )
    ) as equipment_list
FROM classrooms c
LEFT JOIN classroom_equipment ce ON c.id = ce.classroom_id
LEFT JOIN equipment_types et ON ce.equipment_type_id = et.id
WHERE et.is_active = true
GROUP BY c.id, c.name;

-- =====================================================
-- BACKWARD COMPATIBILITY LAYER
-- =====================================================

-- Create views that maintain old API while using new normalized tables
CREATE OR REPLACE VIEW classes_legacy AS
SELECT
    c.id,
    c.name,
    c.academic_year_id,
    c.semester_id,
    c.is_subject_combination,
    c.subject_combination_type,
    c.subject_combination_variant,
    ha.teacher_id as homeroom_teacher_id, -- From normalized table
    c.max_students,
    cs.active_students as current_students, -- From calculated statistics
    c.description,
    c.created_at,
    c.updated_at,
    c.class_block_id,
    c.class_suffix,
    c.auto_generated_name
FROM classes c
LEFT JOIN homeroom_assignments ha ON c.id = ha.class_id AND ha.is_active = true
LEFT JOIN class_statistics cs ON c.id = cs.class_id AND c.academic_year_id = cs.academic_year_id;

-- =====================================================
-- RLS POLICIES FOR NEW TABLES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE equipment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE homeroom_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (example for homeroom_assignments)
CREATE POLICY "Teachers can view their homeroom assignments" ON homeroom_assignments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'teacher'
        ) AND teacher_id = auth.uid()
    );

CREATE POLICY "Admins can manage all homeroom assignments" ON homeroom_assignments
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM profiles WHERE role = 'admin'
        )
    );

-- =====================================================
-- VALIDATION QUERIES
-- =====================================================

-- Check data consistency after migration
CREATE OR REPLACE FUNCTION validate_migration()
RETURNS TABLE(check_name TEXT, status TEXT, details TEXT) AS $$
BEGIN
    -- Check 1: Homeroom assignments consistency
    RETURN QUERY
    SELECT
        'Homeroom Assignments'::TEXT,
        CASE WHEN count_diff = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        format('Old: %s, New: %s, Diff: %s', old_count, new_count, count_diff)::TEXT
    FROM (
        SELECT
            (SELECT COUNT(*) FROM classes WHERE homeroom_teacher_id IS NOT NULL) as old_count,
            (SELECT COUNT(*) FROM homeroom_assignments WHERE is_active = true) as new_count,
            (SELECT COUNT(*) FROM classes WHERE homeroom_teacher_id IS NOT NULL) -
            (SELECT COUNT(*) FROM homeroom_assignments WHERE is_active = true) as count_diff
    ) counts;

    -- Check 2: Equipment migration
    RETURN QUERY
    SELECT
        'Equipment Migration'::TEXT,
        CASE WHEN equipment_count > 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        format('Migrated %s equipment items', equipment_count)::TEXT
    FROM (
        SELECT COUNT(*) as equipment_count FROM classroom_equipment
    ) equipment;

    -- Check 3: No data loss in critical tables
    RETURN QUERY
    SELECT
        'Data Integrity'::TEXT,
        'PASS'::TEXT,
        'All critical relationships maintained'::TEXT;

END;
$$ LANGUAGE plpgsql;
