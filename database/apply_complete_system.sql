-- Complete Educational System Database Setup
-- Apply this script in Supabase SQL Editor to set up the complete system

-- Step 1: Apply core educational schema (classes, students, etc.)
\i core_educational_schema.sql

-- Step 2: Apply violation system schema
\i violation_system_schema.sql

-- Step 3: Apply core educational seed data
\i core_educational_seeds.sql

-- Step 4: Apply violation system seed data
\i violation_system_seeds.sql

-- Verification queries
SELECT 'Complete system setup finished successfully' as status;

-- Show all created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name NOT IN ('profiles', 'subjects')
ORDER BY table_name;

-- Show student-class assignments count
SELECT 
  c.name as class_name,
  COUNT(sca.student_id) as student_count
FROM classes c
LEFT JOIN student_class_assignments sca ON sca.class_id = c.id AND sca.is_active = true
GROUP BY c.id, c.name
ORDER BY c.name;

-- Show violation categories and types count
SELECT 
  vc.name as category,
  COUNT(vt.id) as type_count
FROM violation_categories vc
LEFT JOIN violation_types vt ON vt.category_id = vc.id
GROUP BY vc.id, vc.name
ORDER BY vc.name;

-- Show parent-student relationships
SELECT 
  p.full_name as parent_name,
  s.full_name as student_name,
  psr.relationship_type
FROM parent_student_relationships psr
JOIN profiles p ON p.id = psr.parent_id
JOIN profiles s ON s.id = psr.student_id
WHERE psr.is_active = true
ORDER BY p.full_name, s.full_name;
