-- Initialize Classes Database Tables
-- Run this script in Supabase SQL Editor to create the required tables

-- Create class_blocks table
CREATE TABLE IF NOT EXISTS class_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
  is_subject_combination BOOLEAN DEFAULT false,
  subject_combination_type VARCHAR(50),
  subject_combination_variant VARCHAR(100),
  homeroom_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  max_students INTEGER DEFAULT 40,
  current_students INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_subject_combination CHECK (
    (is_subject_combination = false AND subject_combination_type IS NULL AND subject_combination_variant IS NULL) OR
    (is_subject_combination = true AND subject_combination_type IS NOT NULL AND subject_combination_variant IS NOT NULL)
  ),
  CONSTRAINT valid_subject_combination_type CHECK (
    subject_combination_type IS NULL OR 
    subject_combination_type IN ('khoa-hoc-tu-nhien', 'khoa-hoc-xa-hoi')
  )
);

-- Create student_class_assignments table
CREATE TABLE IF NOT EXISTS student_class_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('main', 'combined')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, assignment_type),
  UNIQUE(student_id, class_id)
);

-- Add homeroom_enabled column to profiles table for teachers
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS homeroom_enabled BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS classes_academic_year_idx ON classes(academic_year_id);
CREATE INDEX IF NOT EXISTS classes_semester_idx ON classes(semester_id);
CREATE INDEX IF NOT EXISTS classes_homeroom_teacher_idx ON classes(homeroom_teacher_id);
CREATE INDEX IF NOT EXISTS classes_subject_combination_idx ON classes(is_subject_combination, subject_combination_type);
CREATE INDEX IF NOT EXISTS student_class_assignments_student_idx ON student_class_assignments(student_id);
CREATE INDEX IF NOT EXISTS student_class_assignments_class_idx ON student_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS student_class_assignments_type_idx ON student_class_assignments(assignment_type);
CREATE INDEX IF NOT EXISTS profiles_homeroom_enabled_idx ON profiles(homeroom_enabled) WHERE role = 'teacher';

-- Enable RLS for classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- RLS policies for classes
DROP POLICY IF EXISTS "Admin can manage classes" ON classes;
CREATE POLICY "Admin can manage classes" ON classes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Teachers can view classes" ON classes;
CREATE POLICY "Teachers can view classes" ON classes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role IN ('teacher', 'student', 'parent')
    )
  );

DROP POLICY IF EXISTS "Homeroom teachers can update their classes" ON classes;
CREATE POLICY "Homeroom teachers can update their classes" ON classes
  FOR UPDATE TO authenticated
  USING (
    homeroom_teacher_id = (SELECT auth.uid())
  );

-- Enable RLS for student_class_assignments
ALTER TABLE student_class_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_class_assignments
DROP POLICY IF EXISTS "Admin can manage student class assignments" ON student_class_assignments;
CREATE POLICY "Admin can manage student class assignments" ON student_class_assignments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view their own class assignments" ON student_class_assignments;
CREATE POLICY "Users can view their own class assignments" ON student_class_assignments
  FOR SELECT TO authenticated
  USING (
    student_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN parent_student_relationships psr ON p.id = psr.parent_id
      WHERE p.id = (SELECT auth.uid()) AND psr.student_id = student_class_assignments.student_id
    ) OR
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = class_id AND c.homeroom_teacher_id = (SELECT auth.uid())
    )
  );

-- Update existing teachers to have homeroom_enabled = false by default
UPDATE profiles SET homeroom_enabled = false WHERE role = 'teacher' AND homeroom_enabled IS NULL;
