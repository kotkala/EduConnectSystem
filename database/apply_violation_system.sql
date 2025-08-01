-- Apply Student Violation Tracking System to Supabase
-- Run this script in Supabase SQL Editor to create the violation system

-- First, apply the main schema
\i violation_system_schema.sql

-- Then, apply the seed data
\i violation_system_seeds.sql

-- Verify the tables were created successfully
SELECT 'Violation system tables created successfully' as status;

-- Show created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%violation%'
ORDER BY table_name;

-- Show violation categories count
SELECT COUNT(*) as category_count FROM violation_categories;

-- Show violation types count  
SELECT COUNT(*) as type_count FROM violation_types;

-- Show sample violation categories
SELECT name, description FROM violation_categories ORDER BY name LIMIT 5;
