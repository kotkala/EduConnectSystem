-- Vietnamese High School Subjects Seeds
-- This file contains the standardized Vietnamese high school subjects for EduConnectSystem

-- Insert Core Subjects (8 subjects)
INSERT INTO subjects (code, name_vietnamese, name_english, category, description) VALUES
  ('VAN', 'Văn', 'Vietnamese Literature', 'core', 'Vietnamese language and literature studies'),
  ('TOAN', 'Toán', 'Mathematics', 'core', 'Mathematical concepts and problem solving'),
  ('ANH', 'Tiếng Anh', 'English', 'core', 'English language learning and communication'),
  ('SU', 'Lịch sử', 'History', 'core', 'Vietnamese and world history studies'),
  ('DIA', 'Địa lý', 'Geography', 'core', 'Physical and human geography studies'),
  ('LY', 'Vật lý', 'Physics', 'core', 'Physical sciences and natural phenomena'),
  ('HOA', 'Hóa học', 'Chemistry', 'core', 'Chemical sciences and laboratory work'),
  ('SINH', 'Sinh học', 'Biology', 'core', 'Life sciences and biological studies')
ON CONFLICT (code) DO UPDATE SET
  name_vietnamese = EXCLUDED.name_vietnamese,
  name_english = EXCLUDED.name_english,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Insert Specialized Subjects (9 subjects)
INSERT INTO subjects (code, name_vietnamese, name_english, category, description) VALUES
  ('GDQP', 'Giáo dục quốc phòng - an ninh', 'National Defense and Security Education', 'specialized', 'National defense and security awareness education'),
  ('HDTN', 'Hoạt động trải nghiệm - hướng nghiệp', 'Experiential Activities - Career Guidance', 'specialized', 'Career exploration and experiential learning activities'),
  ('GDDP', 'Giáo dục địa phương', 'Local Education', 'specialized', 'Local history, culture, and community studies'),
  ('GDTC', 'Giáo dục thể chất', 'Physical Education', 'specialized', 'Physical fitness and sports activities'),
  ('GDKT', 'Giáo dục kinh tế - pháp luật', 'Economics and Law Education', 'specialized', 'Basic economics and legal education'),
  ('CN', 'Công nghệ', 'Technology', 'specialized', 'Technology and engineering fundamentals'),
  ('TIN', 'Tin học', 'Computer Science/Informatics', 'specialized', 'Computer science and information technology'),
  ('NHAC', 'Âm nhạc', 'Music', 'specialized', 'Music theory, performance, and appreciation'),
  ('MT', 'Mỹ thuật', 'Fine Arts', 'specialized', 'Visual arts and creative expression')
ON CONFLICT (code) DO UPDATE SET
  name_vietnamese = EXCLUDED.name_vietnamese,
  name_english = EXCLUDED.name_english,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verify the import
DO $$
DECLARE
  core_count INTEGER;
  specialized_count INTEGER;
  total_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO core_count FROM subjects WHERE category = 'core';
  SELECT COUNT(*) INTO specialized_count FROM subjects WHERE category = 'specialized';
  SELECT COUNT(*) INTO total_count FROM subjects;
  
  RAISE NOTICE 'Subject import completed:';
  RAISE NOTICE '- Core subjects: %', core_count;
  RAISE NOTICE '- Specialized subjects: %', specialized_count;
  RAISE NOTICE '- Total subjects: %', total_count;
  
  IF total_count != 17 THEN
    RAISE WARNING 'Expected 17 subjects but found %', total_count;
  END IF;
END $$;
