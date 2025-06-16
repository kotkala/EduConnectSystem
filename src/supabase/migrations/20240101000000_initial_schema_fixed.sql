-- Initial schema for EduConnect System (SQL Editor Compatible)
-- This migration creates tables, RLS policies, and functions
-- Fixed for Supabase SQL Editor compatibility

-- Enable necessary extensions first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (SQL Editor compatible)
CREATE TYPE public.user_role AS ENUM ('student', 'teacher', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role public.user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    CONSTRAINT username_length CHECK (char_length(full_name) >= 2)
);

-- Create courses table
CREATE TABLE public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    instructor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create enrollments table
CREATE TABLE public.enrollments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    
    UNIQUE(student_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance (Context7 best practices)
CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX idx_courses_instructor ON public.courses USING btree (instructor_id);
CREATE INDEX idx_enrollments_student ON public.enrollments USING btree (student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments USING btree (course_id);

-- Security definer functions for RLS (optimized with SELECT wrappers)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE auth.uid() = id AND role = 'admin'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE auth.uid() = id AND role IN ('teacher', 'admin')
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM public.profiles 
    WHERE id = user_id;
    
    RETURN COALESCE(user_role, 'student');
END;
$$;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin());

-- RLS Policies for courses
CREATE POLICY "Courses are viewable by authenticated users"
ON public.courses FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers can create courses"
ON public.courses FOR INSERT
TO authenticated
WITH CHECK (public.is_teacher());

CREATE POLICY "Instructors can update their own courses"
ON public.courses FOR UPDATE
TO authenticated
USING (instructor_id = auth.uid())
WITH CHECK (instructor_id = auth.uid());

CREATE POLICY "Admins can update any course"
ON public.courses FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Instructors can delete their own courses"
ON public.courses FOR DELETE
TO authenticated
USING (instructor_id = auth.uid());

CREATE POLICY "Admins can delete any course"
ON public.courses FOR DELETE
TO authenticated
USING (public.is_admin());

-- RLS Policies for enrollments
CREATE POLICY "Users can view their own enrollments"
ON public.enrollments FOR SELECT
TO authenticated
USING (
    student_id = auth.uid() OR
    course_id IN (
        SELECT id FROM public.courses 
        WHERE instructor_id = auth.uid()
    ) OR
    public.is_admin()
);

CREATE POLICY "Students can enroll themselves"
ON public.enrollments FOR INSERT
TO authenticated
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Students can update their own enrollments"
ON public.enrollments FOR UPDATE
TO authenticated
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

CREATE POLICY "Instructors can update enrollments for their courses"
ON public.enrollments FOR UPDATE
TO authenticated
USING (
    course_id IN (
        SELECT id FROM public.courses 
        WHERE instructor_id = auth.uid()
    )
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Note: Storage setup should be done via Dashboard
-- Note: Realtime setup should be done via Dashboard or separate script

-- Uncomment the following lines if you want to include Realtime setup:
-- DROP PUBLICATION IF EXISTS supabase_realtime;
-- CREATE PUBLICATION supabase_realtime;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.enrollments; 