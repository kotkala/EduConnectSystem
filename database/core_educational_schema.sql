-- Core Educational System Schema Extension
-- This file contains the missing core tables for the educational system
-- Following Supabase best practices with RLS policies

-- Create academic years table
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_academic_year_dates CHECK (end_date > start_date)
);

-- Create trigger for academic_years updated_at
CREATE TRIGGER update_academic_years_updated_at
  BEFORE UPDATE ON academic_years
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for academic_years
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academic_years
CREATE POLICY "All users can view academic years"
  ON academic_years
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage academic years"
  ON academic_years
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Create semesters table
CREATE TABLE IF NOT EXISTS semesters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  semester_number INTEGER NOT NULL CHECK (semester_number IN (1, 2)),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  weeks_count INTEGER NOT NULL CHECK (weeks_count > 0),
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(academic_year_id, semester_number),
  CONSTRAINT valid_semester_dates CHECK (end_date > start_date)
);

-- Create trigger for semesters updated_at
CREATE TRIGGER update_semesters_updated_at
  BEFORE UPDATE ON semesters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for semesters
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for semesters
CREATE POLICY "All users can view semesters"
  ON semesters
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage semesters"
  ON semesters
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Create class blocks table (Khối 10, 11, 12)
CREATE TABLE IF NOT EXISTS class_blocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for class_blocks updated_at
CREATE TRIGGER update_class_blocks_updated_at
  BEFORE UPDATE ON class_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for class_blocks
ALTER TABLE class_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_blocks
CREATE POLICY "All users can view active class blocks"
  ON class_blocks
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all class blocks"
  ON class_blocks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage class blocks"
  ON class_blocks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Create classrooms table
CREATE TABLE IF NOT EXISTS classrooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  building TEXT,
  floor INTEGER CHECK (floor > 0),
  capacity INTEGER NOT NULL DEFAULT 40 CHECK (capacity > 0),
  room_type TEXT NOT NULL DEFAULT 'standard' CHECK (room_type IN ('standard', 'lab', 'computer', 'auditorium', 'gym', 'library')),
  equipment TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for classrooms updated_at
CREATE TRIGGER update_classrooms_updated_at
  BEFORE UPDATE ON classrooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for classrooms
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classrooms
CREATE POLICY "All users can view active classrooms"
  ON classrooms
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all classrooms"
  ON classrooms
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage classrooms"
  ON classrooms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  class_block_id UUID REFERENCES class_blocks(id) ON DELETE SET NULL,
  class_suffix TEXT,
  auto_generated_name BOOLEAN DEFAULT false,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE NOT NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE NOT NULL,
  is_subject_combination BOOLEAN DEFAULT false,
  subject_combination_type TEXT,
  subject_combination_variant TEXT,
  homeroom_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  max_students INTEGER NOT NULL DEFAULT 40 CHECK (max_students > 0),
  current_students INTEGER DEFAULT 0 CHECK (current_students >= 0),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, academic_year_id, semester_id),
  CONSTRAINT valid_student_count CHECK (current_students <= max_students)
);

-- Create trigger for classes updated_at
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for classes
CREATE POLICY "All users can view classes"
  ON classes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage classes"
  ON classes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can view classes"
  ON classes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'teacher'
    )
  );

-- Create student class assignments table
CREATE TABLE IF NOT EXISTS student_class_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE NOT NULL,
  semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE NOT NULL,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id, academic_year_id, semester_id)
);

-- Create trigger for student_class_assignments updated_at
CREATE TRIGGER update_student_class_assignments_updated_at
  BEFORE UPDATE ON student_class_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for student_class_assignments
ALTER TABLE student_class_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_class_assignments
CREATE POLICY "Admins can view all student assignments"
  ON student_class_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can view their class assignments"
  ON student_class_assignments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN classes c ON c.homeroom_teacher_id = p.id
      WHERE p.id = (SELECT auth.uid()) 
      AND p.role = 'teacher'
      AND c.id = student_class_assignments.class_id
    )
  );

CREATE POLICY "Students can view their own assignments"
  ON student_class_assignments
  FOR SELECT
  TO authenticated
  USING (
    student_id = (SELECT auth.uid())
  );

CREATE POLICY "Admins can manage student assignments"
  ON student_class_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Create parent student relationships table
CREATE TABLE IF NOT EXISTS parent_student_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  relationship_type TEXT NOT NULL DEFAULT 'parent' CHECK (relationship_type IN ('parent', 'guardian', 'relative')),
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- Create trigger for parent_student_relationships updated_at
CREATE TRIGGER update_parent_student_relationships_updated_at
  BEFORE UPDATE ON parent_student_relationships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS for parent_student_relationships
ALTER TABLE parent_student_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parent_student_relationships
CREATE POLICY "Parents can view their children"
  ON parent_student_relationships
  FOR SELECT
  TO authenticated
  USING (
    parent_id = (SELECT auth.uid())
  );

CREATE POLICY "Students can view their parents"
  ON parent_student_relationships
  FOR SELECT
  TO authenticated
  USING (
    student_id = (SELECT auth.uid())
  );

CREATE POLICY "Admins can view all relationships"
  ON parent_student_relationships
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage relationships"
  ON parent_student_relationships
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Create performance indexes
CREATE INDEX IF NOT EXISTS academic_years_is_current_idx ON academic_years(is_current);
CREATE INDEX IF NOT EXISTS academic_years_start_date_idx ON academic_years(start_date);

CREATE INDEX IF NOT EXISTS semesters_academic_year_id_idx ON semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS semesters_is_current_idx ON semesters(is_current);
CREATE INDEX IF NOT EXISTS semesters_semester_number_idx ON semesters(semester_number);

CREATE INDEX IF NOT EXISTS class_blocks_is_active_idx ON class_blocks(is_active);
CREATE INDEX IF NOT EXISTS class_blocks_sort_order_idx ON class_blocks(sort_order);

CREATE INDEX IF NOT EXISTS classrooms_is_active_idx ON classrooms(is_active);
CREATE INDEX IF NOT EXISTS classrooms_room_type_idx ON classrooms(room_type);

CREATE INDEX IF NOT EXISTS classes_academic_year_id_idx ON classes(academic_year_id);
CREATE INDEX IF NOT EXISTS classes_semester_id_idx ON classes(semester_id);
CREATE INDEX IF NOT EXISTS classes_class_block_id_idx ON classes(class_block_id);
CREATE INDEX IF NOT EXISTS classes_homeroom_teacher_id_idx ON classes(homeroom_teacher_id);

CREATE INDEX IF NOT EXISTS student_class_assignments_student_id_idx ON student_class_assignments(student_id);
CREATE INDEX IF NOT EXISTS student_class_assignments_class_id_idx ON student_class_assignments(class_id);
CREATE INDEX IF NOT EXISTS student_class_assignments_academic_year_id_idx ON student_class_assignments(academic_year_id);
CREATE INDEX IF NOT EXISTS student_class_assignments_is_active_idx ON student_class_assignments(is_active);

CREATE INDEX IF NOT EXISTS parent_student_relationships_parent_id_idx ON parent_student_relationships(parent_id);
CREATE INDEX IF NOT EXISTS parent_student_relationships_student_id_idx ON parent_student_relationships(student_id);
CREATE INDEX IF NOT EXISTS parent_student_relationships_is_active_idx ON parent_student_relationships(is_active);
