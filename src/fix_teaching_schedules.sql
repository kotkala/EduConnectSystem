-- ============================================
-- EDUCONNECT FIXES - COMPREHENSIVE UPDATE (FIXED)
-- ============================================

-- 1. Fix teaching_schedules table by adding notes column
ALTER TABLE public.teaching_schedules ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add week_number column to support weekly timetables
ALTER TABLE public.teaching_schedules ADD COLUMN IF NOT EXISTS week_number INTEGER NOT NULL DEFAULT 1;

-- 3. Add constraint to ensure week_number is valid (1-35 weeks)
ALTER TABLE public.teaching_schedules ADD CONSTRAINT chk_week_number CHECK (week_number >= 1 AND week_number <= 35);

-- 4. Add comment for the week_number column
COMMENT ON COLUMN public.teaching_schedules.week_number IS 'Week number within the academic term (1-35, semester 1: 1-18, semester 2: 19-35)';

-- 5. Add comment for the notes column
COMMENT ON COLUMN public.teaching_schedules.notes IS 'Additional notes for the teaching schedule';

-- 6. Drop existing unique constraints that don't include week_number
ALTER TABLE public.teaching_schedules DROP CONSTRAINT IF EXISTS teaching_schedules_academic_term_id_day_of_week_time_slot_id_teacher_id_key;
ALTER TABLE public.teaching_schedules DROP CONSTRAINT IF EXISTS teaching_schedules_academic_term_id_day_of_week_time_slot_id_class_id_key;

-- 7. Add new unique constraints that include week_number
ALTER TABLE public.teaching_schedules ADD CONSTRAINT teaching_schedules_academic_term_id_day_of_week_time_slot_id_teacher_id_week_number_key 
    UNIQUE(academic_term_id, day_of_week, time_slot_id, teacher_id, week_number);

ALTER TABLE public.teaching_schedules ADD CONSTRAINT teaching_schedules_academic_term_id_day_of_week_time_slot_id_class_id_week_number_key 
    UNIQUE(academic_term_id, day_of_week, time_slot_id, class_id, week_number);

-- 8. Update any existing teaching_schedules with missing notes
UPDATE public.teaching_schedules
SET notes = COALESCE(notes, '')
WHERE notes IS NULL;

-- 9. Update any existing teaching_schedules with default week_number
UPDATE public.teaching_schedules
SET week_number = 1
WHERE week_number IS NULL;

-- 10. Create index for better performance on week_number queries
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_week_number ON public.teaching_schedules(academic_term_id, week_number);

-- 11. Create index for notes column
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_notes ON public.teaching_schedules(notes) WHERE notes IS NOT NULL;

-- ============================================
-- Additional improvements for teaching schedules
-- ============================================

-- 12. Add index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_class_term_week ON public.teaching_schedules(class_id, academic_term_id, week_number);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_teacher_term_week ON public.teaching_schedules(teacher_id, academic_term_id, week_number);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_day_time ON public.teaching_schedules(day_of_week, time_slot_id);

-- 13. Add function to get week range for semester
CREATE OR REPLACE FUNCTION get_semester_week_range(semester_type term_type)
RETURNS TABLE(start_week INTEGER, end_week INTEGER) AS $$
BEGIN
    CASE semester_type
        WHEN 'semester_1' THEN
            RETURN QUERY SELECT 1::INTEGER, 18::INTEGER;
        WHEN 'semester_2' THEN
            RETURN QUERY SELECT 19::INTEGER, 35::INTEGER;
        WHEN 'summer' THEN
            RETURN QUERY SELECT 1::INTEGER, 8::INTEGER;
        WHEN 'full_year' THEN
            RETURN QUERY SELECT 1::INTEGER, 35::INTEGER;
        ELSE
            RETURN QUERY SELECT 1::INTEGER, 35::INTEGER;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- 14. Add function to validate week number for academic term
CREATE OR REPLACE FUNCTION validate_week_for_term(term_id UUID, week_num INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    term_type_val term_type;
    week_range RECORD;
BEGIN
    -- Get the term type
    SELECT type INTO term_type_val
    FROM public.academic_terms
    WHERE id = term_id;
    
    -- Get valid week range for this term type
    SELECT * INTO week_range
    FROM get_semester_week_range(term_type_val);
    
    -- Check if week is in valid range
    RETURN week_num >= week_range.start_week AND week_num <= week_range.end_week;
END;
$$ LANGUAGE plpgsql;

-- 15. Add trigger to validate week_number before insert/update
CREATE OR REPLACE FUNCTION validate_teaching_schedule_week()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT validate_week_for_term(NEW.academic_term_id, NEW.week_number) THEN
        RAISE EXCEPTION 'Week number % is not valid for this academic term', NEW.week_number;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 16. Create trigger
DROP TRIGGER IF EXISTS trg_validate_teaching_schedule_week ON public.teaching_schedules;
CREATE TRIGGER trg_validate_teaching_schedule_week
    BEFORE INSERT OR UPDATE ON public.teaching_schedules
    FOR EACH ROW
    EXECUTE FUNCTION validate_teaching_schedule_week();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if changes were applied successfully
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'teaching_schedules'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check constraints
SELECT 
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.teaching_schedules'::regclass
ORDER BY conname;

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'teaching_schedules'
AND schemaname = 'public'
ORDER BY indexname;

-- ============================================
-- CHANGELOG
-- ============================================

/*
✅ Added notes column to teaching_schedules
✅ Added week_number column to teaching_schedules with constraint (1-35)
✅ Updated unique constraints to include week_number
✅ Added indexes for better performance
✅ Added functions for semester week range validation
✅ Added trigger for week number validation
✅ Added comprehensive verification queries
*/

-- 2. Ensure time_slots has order_index column
ALTER TABLE public.time_slots ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Update order_index to match slot_order for existing data
UPDATE public.time_slots 
SET order_index = slot_order 
WHERE order_index = 0;

-- 3. Create curriculum_distribution view if not exists
DROP VIEW IF EXISTS public.curriculum_distribution;
CREATE VIEW public.curriculum_distribution AS 
SELECT 
    sa.*,
    s.name as subject_name,
    s.code as subject_code,
    gl.name as grade_level_name,
    c.name as class_name
FROM public.subject_assignments sa
LEFT JOIN public.subjects s ON sa.subject_id = s.id
LEFT JOIN public.grade_levels gl ON sa.grade_level_id = gl.id
LEFT JOIN public.classes c ON sa.class_id = c.id;

-- 4. Insert default time slots if none exist (with proper TIME casting)
INSERT INTO public.time_slots (name, start_time, end_time, slot_order, order_index, is_break)
SELECT name, start_time::TIME, end_time::TIME, slot_order, order_index, is_break
FROM (VALUES
    ('Tiết 1', '07:00', '07:45', 1, 1, false),
    ('Tiết 2', '07:45', '08:30', 2, 2, false),
    ('Tiết 3', '08:30', '09:15', 3, 3, false),
    ('Giải lao 1', '09:15', '09:30', 4, 4, true),
    ('Tiết 4', '09:30', '10:15', 5, 5, false),
    ('Tiết 5', '10:15', '11:00', 6, 6, false),
    ('Giải lao 2', '11:00', '11:15', 7, 7, true),
    ('Tiết 6', '11:15', '12:00', 8, 8, false),
    ('Tiết 7', '13:30', '14:15', 9, 9, false),
    ('Tiết 8', '14:15', '15:00', 10, 10, false),
    ('Giải lao 3', '15:00', '15:15', 11, 11, true),
    ('Tiết 9', '15:15', '16:00', 12, 12, false),
    ('Tiết 10', '16:00', '16:45', 13, 13, false)
) AS v(name, start_time, end_time, slot_order, order_index, is_break)
WHERE NOT EXISTS (SELECT 1 FROM public.time_slots LIMIT 1);

-- 5. Insert default subjects if none exist
INSERT INTO public.subjects (code, name, description, credits)
SELECT code, name, description, credits
FROM (VALUES
    ('MATH', 'Toán học', 'Môn Toán học', 3),
    ('LIT', 'Ngữ văn', 'Môn Ngữ văn', 3),
    ('ENG', 'Tiếng Anh', 'Môn Tiếng Anh', 3),
    ('PHYS', 'Vật lý', 'Môn Vật lý', 2),
    ('CHEM', 'Hóa học', 'Môn Hóa học', 2),
    ('BIO', 'Sinh học', 'Môn Sinh học', 2),
    ('HIST', 'Lịch sử', 'Môn Lịch sử', 2),
    ('GEO', 'Địa lý', 'Môn Địa lý', 2),
    ('PE', 'Thể dục', 'Môn Thể dục', 2),
    ('MUSIC', 'Âm nhạc', 'Môn Âm nhạc', 1),
    ('ART', 'Mỹ thuật', 'Môn Mỹ thuật', 1),
    ('TECH', 'Công nghệ', 'Môn Công nghệ', 1)
) AS v(code, name, description, credits)
WHERE NOT EXISTS (SELECT 1 FROM public.subjects LIMIT 1);

-- 6. Insert default grade levels if none exist
INSERT INTO public.grade_levels (name, level, description)
SELECT name, level, description
FROM (VALUES
    ('Lớp 10', 10, 'Khối lớp 10'),
    ('Lớp 11', 11, 'Khối lớp 11'),
    ('Lớp 12', 12, 'Khối lớp 12')
) AS v(name, level, description)
WHERE NOT EXISTS (SELECT 1 FROM public.grade_levels LIMIT 1);

-- 7. Update any existing teaching_schedules with missing notes
UPDATE public.teaching_schedules 
SET notes = CASE 
    WHEN notes IS NULL THEN 'Tự động tạo'
    ELSE notes
END;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_combined ON public.classes(is_combined) WHERE is_combined = true;
CREATE INDEX IF NOT EXISTS idx_classes_metadata ON public.classes USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_teaching_schedules_notes ON public.teaching_schedules(notes) WHERE notes IS NOT NULL;

-- 9. Create current academic year and term if none exist
DO $$
DECLARE
    current_year_id UUID;
    current_term_id UUID;
BEGIN
    -- Check if any academic year exists
    IF NOT EXISTS (SELECT 1 FROM public.academic_years LIMIT 1) THEN
        INSERT INTO public.academic_years (name, start_date, end_date, is_current, description)
        VALUES ('Năm học 2024-2025', '2024-09-01', '2025-07-31', true, 'Năm học hiện tại')
        RETURNING id INTO current_year_id;
        
        -- Create academic terms for this year
        INSERT INTO public.academic_terms (academic_year_id, name, type, start_date, end_date, is_current)
        VALUES 
            (current_year_id, 'Học kỳ 1', 'semester_1', '2024-09-01', '2025-01-31', true),
            (current_year_id, 'Học kỳ 2', 'semester_2', '2025-02-01', '2025-07-31', false);
            
        RAISE NOTICE 'Created default academic year and terms';
    END IF;
END $$;

-- 10. Create sample classes if none exist
DO $$
DECLARE
    current_year_id UUID;
    grade_10_id UUID;
    grade_11_id UUID;
    grade_12_id UUID;
BEGIN
    -- Get current academic year
    SELECT id INTO current_year_id FROM public.academic_years WHERE is_current = true LIMIT 1;
    
    -- Get grade levels
    SELECT id INTO grade_10_id FROM public.grade_levels WHERE level = 10 LIMIT 1;
    SELECT id INTO grade_11_id FROM public.grade_levels WHERE level = 11 LIMIT 1;
    SELECT id INTO grade_12_id FROM public.grade_levels WHERE level = 12 LIMIT 1;
    
    -- Create sample classes if none exist
    IF NOT EXISTS (SELECT 1 FROM public.classes LIMIT 1) AND current_year_id IS NOT NULL THEN
        INSERT INTO public.classes (academic_year_id, grade_level_id, name, code, capacity, is_combined, metadata)
        VALUES 
            -- Base classes (lớp tách)
            (current_year_id, grade_10_id, '10A1', '10A1-2024', 35, false, '{"class_type": "base_class"}'),
            (current_year_id, grade_10_id, '10A2', '10A2-2024', 35, false, '{"class_type": "base_class"}'),
            (current_year_id, grade_11_id, '11A1', '11A1-2024', 35, false, '{"class_type": "base_class"}'),
            (current_year_id, grade_11_id, '11A2', '11A2-2024', 35, false, '{"class_type": "base_class"}'),
            (current_year_id, grade_12_id, '12A1', '12A1-2024', 35, false, '{"class_type": "base_class"}'),
            (current_year_id, grade_12_id, '12A2', '12A2-2024', 35, false, '{"class_type": "base_class"}'),
            
            -- Combined classes (lớp ghép)
            (current_year_id, grade_10_id, 'KHTN-10-1', 'KHTN-10-1-2024', 30, true, '{"class_type": "combined_class", "subject_group_code": "KHTN", "subject_group_name": "Khoa học tự nhiên"}'),
            (current_year_id, grade_10_id, 'KHXH-10-1', 'KHXH-10-1-2024', 30, true, '{"class_type": "combined_class", "subject_group_code": "KHXH", "subject_group_name": "Khoa học xã hội"}'),
            (current_year_id, grade_11_id, 'KHTN-11-1', 'KHTN-11-1-2024', 30, true, '{"class_type": "combined_class", "subject_group_code": "KHTN", "subject_group_name": "Khoa học tự nhiên"}'),
            (current_year_id, grade_11_id, 'KHXH-11-1', 'KHXH-11-1-2024', 30, true, '{"class_type": "combined_class", "subject_group_code": "KHXH", "subject_group_name": "Khoa học xã hội"}');
            
        RAISE NOTICE 'Created sample classes';
    END IF;
END $$;

-- ============================================
-- COMPLETED FIXES
-- ============================================
-- ✅ Added notes column to teaching_schedules
-- ✅ Added order_index column to time_slots
-- ✅ Created curriculum_distribution view
-- ✅ Added default data with proper type casting
-- ✅ Created sample academic year, terms, and classes
-- ✅ Added performance indexes
-- ✅ Skipped creating existing tables (teacher_assignments, schedule_constraints)

SELECT 'MIGRATION COMPLETED SUCCESSFULLY!' as status; 