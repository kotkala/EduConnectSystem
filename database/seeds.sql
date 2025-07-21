-- Seeds for EduConnect Authentication System
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure user_role enum exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student', 'parent');
    END IF;
END $$;

-- Insert sample users into auth.users (for testing only)
DO $$
BEGIN
  -- Admin User
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, email_change_confirm_status
  ) VALUES (
    '11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'admin@educonnect.com',
    crypt('admin123', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "System Administrator", "role": "admin"}',
    NOW(), NOW(), '', '', '', '', '', 0
  ) ON CONFLICT (id) DO NOTHING;

  -- Teacher User
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, email_change_confirm_status
  ) VALUES (
    '22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'teacher@educonnect.com',
    crypt('teacher123', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Jane Smith", "role": "teacher"}',
    NOW(), NOW(), '', '', '', '', '', 0
  ) ON CONFLICT (id) DO NOTHING;

  -- Student User
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, email_change_confirm_status
  ) VALUES (
    '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'student@educonnect.com',
    crypt('student123', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "John Doe", "role": "student"}',
    NOW(), NOW(), '', '', '', '', '', 0
  ) ON CONFLICT (id) DO NOTHING;

  -- Parent User
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change,
    email_change_token_current, email_change_confirm_status
  ) VALUES (
    '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'parent@educonnect.com',
    crypt('parent123', gen_salt('bf')), NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Mary Johnson", "role": "parent"}',
    NOW(), NOW(), '', '', '', '', '', 0
  ) ON CONFLICT (id) DO NOTHING;

EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error inserting auth users: %', SQLERRM;
END $$;

-- Insert corresponding profiles
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at) VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@educonnect.com', 'System Administrator', 'admin', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'teacher@educonnect.com', 'Jane Smith', 'teacher', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'student@educonnect.com', 'John Doe', 'student', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'parent@educonnect.com', 'Mary Johnson', 'parent', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = NOW();
