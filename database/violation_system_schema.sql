-- Student Violation Tracking System Schema
-- Following Supabase best practices with RLS policies

-- Create violation severity enum
DROP TYPE IF EXISTS violation_severity CASCADE;
CREATE TYPE violation_severity AS ENUM ('minor', 'moderate', 'serious', 'severe');

-- Create violation categories table
CREATE TABLE IF NOT EXISTS violation_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for violation_categories
ALTER TABLE violation_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for violation_categories
CREATE POLICY "All users can view active violation categories"
  ON violation_categories
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all violation categories"
  ON violation_categories
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert violation categories"
  ON violation_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update violation categories"
  ON violation_categories
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Create violation types table
CREATE TABLE IF NOT EXISTS violation_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES violation_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_severity violation_severity NOT NULL DEFAULT 'minor',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Enable RLS for violation_types
ALTER TABLE violation_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for violation_types
CREATE POLICY "All users can view active violation types"
  ON violation_types
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can view all violation types"
  ON violation_types
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert violation types"
  ON violation_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update violation types"
  ON violation_types
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- Create student violations table
CREATE TABLE IF NOT EXISTS student_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE NOT NULL,
  violation_type_id UUID REFERENCES violation_types(id) ON DELETE CASCADE NOT NULL,
  severity violation_severity NOT NULL,
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  recorded_by UUID REFERENCES profiles(id) NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  academic_year_id UUID REFERENCES academic_years(id) NOT NULL,
  semester_id UUID REFERENCES semesters(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for student_violations
ALTER TABLE student_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for student_violations
CREATE POLICY "Admins can view all student violations"
  ON student_violations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can view homeroom student violations"
  ON student_violations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN classes c ON c.homeroom_teacher_id = p.id
      WHERE p.id = (SELECT auth.uid()) 
      AND p.role = 'teacher'
      AND c.id = student_violations.class_id
    )
  );

CREATE POLICY "Parents can view their children violations"
  ON student_violations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM parent_student_relationships psr
      JOIN profiles p ON p.id = psr.parent_id
      WHERE p.id = (SELECT auth.uid())
      AND p.role = 'parent'
      AND psr.student_id = student_violations.student_id
    )
  );

CREATE POLICY "Admins and teachers can insert student violations"
  ON student_violations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Admins and teachers can update student violations"
  ON student_violations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'teacher')
    )
  );

-- Create violation notifications table
CREATE TABLE IF NOT EXISTS violation_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  violation_id UUID REFERENCES student_violations(id) ON DELETE CASCADE NOT NULL,
  parent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sent_by UUID REFERENCES profiles(id) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for violation_notifications
ALTER TABLE violation_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for violation_notifications
CREATE POLICY "Parents can view their violation notifications"
  ON violation_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) 
      AND role = 'parent'
      AND id = violation_notifications.parent_id
    )
  );

CREATE POLICY "Admins and teachers can view violation notifications"
  ON violation_notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Admins and teachers can insert violation notifications"
  ON violation_notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) 
      AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Parents can update their violation notifications"
  ON violation_notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = (SELECT auth.uid()) 
      AND role = 'parent'
      AND id = violation_notifications.parent_id
    )
  );

-- Create updated_at triggers
CREATE TRIGGER update_violation_categories_updated_at
  BEFORE UPDATE ON violation_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_violation_types_updated_at
  BEFORE UPDATE ON violation_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_violations_updated_at
  BEFORE UPDATE ON student_violations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_violation_notifications_updated_at
  BEFORE UPDATE ON violation_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS violation_categories_is_active_idx ON violation_categories(is_active);
CREATE INDEX IF NOT EXISTS violation_types_category_id_idx ON violation_types(category_id);
CREATE INDEX IF NOT EXISTS violation_types_is_active_idx ON violation_types(is_active);
CREATE INDEX IF NOT EXISTS student_violations_student_id_idx ON student_violations(student_id);
CREATE INDEX IF NOT EXISTS student_violations_class_id_idx ON student_violations(class_id);
CREATE INDEX IF NOT EXISTS student_violations_violation_type_id_idx ON student_violations(violation_type_id);
CREATE INDEX IF NOT EXISTS student_violations_recorded_at_idx ON student_violations(recorded_at);
CREATE INDEX IF NOT EXISTS student_violations_is_resolved_idx ON student_violations(is_resolved);
CREATE INDEX IF NOT EXISTS violation_notifications_parent_id_idx ON violation_notifications(parent_id);
CREATE INDEX IF NOT EXISTS violation_notifications_violation_id_idx ON violation_notifications(violation_id);
CREATE INDEX IF NOT EXISTS violation_notifications_is_read_idx ON violation_notifications(is_read);
