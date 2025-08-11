-- Schema mở rộng cho hệ thống vi phạm với disciplinary actions và báo cáo

-- Bảng hình thức kỷ luật
CREATE TABLE IF NOT EXISTS disciplinary_action_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng case kỷ luật
CREATE TABLE IF NOT EXISTS student_disciplinary_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  week_index INTEGER NOT NULL,
  total_points INTEGER DEFAULT 0,
  action_type_id UUID NOT NULL REFERENCES disciplinary_action_types(id) ON DELETE CASCADE,
  notes TEXT,
  violation_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent_to_homeroom', 'acknowledged', 'meeting_scheduled', 'resolved')),
  meeting_notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bảng theo dõi cảnh báo đã xem (để tránh spam)
CREATE TABLE IF NOT EXISTS monthly_violation_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  month_index INTEGER NOT NULL,
  total_violations INTEGER NOT NULL,
  is_seen BOOLEAN DEFAULT false,
  seen_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  seen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, semester_id, month_index)
);

-- Indexes cho performance
CREATE INDEX IF NOT EXISTS idx_disciplinary_cases_student_semester ON student_disciplinary_cases(student_id, semester_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_cases_status ON student_disciplinary_cases(status);
CREATE INDEX IF NOT EXISTS idx_disciplinary_cases_week ON student_disciplinary_cases(semester_id, week_index);
CREATE INDEX IF NOT EXISTS idx_monthly_alerts_student_month ON monthly_violation_alerts(student_id, semester_id, month_index);
CREATE INDEX IF NOT EXISTS idx_monthly_alerts_unseen ON monthly_violation_alerts(is_seen, semester_id, month_index);

-- RLS Policies
ALTER TABLE disciplinary_action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_disciplinary_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_violation_alerts ENABLE ROW LEVEL SECURITY;

-- Policies cho disciplinary_action_types
CREATE POLICY "Admin can manage disciplinary action types" ON disciplinary_action_types
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'admin_full')
    )
  );

CREATE POLICY "Teachers can view disciplinary action types" ON disciplinary_action_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'teacher'
    )
  );

-- Policies cho student_disciplinary_cases
CREATE POLICY "Admin can manage disciplinary cases" ON student_disciplinary_cases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'admin_full')
    )
  );

CREATE POLICY "Homeroom teachers can view their class cases" ON student_disciplinary_cases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN classes c ON c.homeroom_teacher_id = p.id
      WHERE p.id = auth.uid() 
      AND p.role = 'teacher'
      AND c.id = student_disciplinary_cases.class_id
    )
  );

CREATE POLICY "Homeroom teachers can update case status" ON student_disciplinary_cases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN classes c ON c.homeroom_teacher_id = p.id
      WHERE p.id = auth.uid() 
      AND p.role = 'teacher'
      AND c.id = student_disciplinary_cases.class_id
    )
  );

-- Policies cho monthly_violation_alerts
CREATE POLICY "Admin can manage monthly alerts" ON monthly_violation_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'admin_full')
    )
  );

CREATE POLICY "Teachers can view alerts for their students" ON monthly_violation_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN classes c ON c.homeroom_teacher_id = p.id
      JOIN student_class_assignments sca ON sca.class_id = c.id
      WHERE p.id = auth.uid() 
      AND p.role = 'teacher'
      AND sca.student_id = monthly_violation_alerts.student_id
    )
  );

-- Insert default disciplinary action types
INSERT INTO disciplinary_action_types (name, description) VALUES
  ('Khiển trách trước lớp', 'Khiển trách trước tập thể lớp'),
  ('Khiển trách trước hội đồng', 'Khiển trách trước hội đồng kỷ luật'),
  ('Khiển trách trước toàn trường (tạm dừng học tập có thời hạn)', 'Biện pháp kỷ luật mức cao'),
  ('Ghi học bạ (ghi vào bảng điểm cuối kì)', 'Ghi nhận vào học bạ và bảng điểm cuối kì')
ON CONFLICT DO NOTHING;

-- Trigger để tự động cập nhật updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_disciplinary_action_types_updated_at 
  BEFORE UPDATE ON disciplinary_action_types 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_disciplinary_cases_updated_at 
  BEFORE UPDATE ON student_disciplinary_cases 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function để tự động tạo monthly alerts khi có vi phạm mới
CREATE OR REPLACE FUNCTION check_monthly_violation_threshold()
RETURNS TRIGGER AS $$
DECLARE
  month_index INTEGER;
  violation_count INTEGER;
BEGIN
  -- Tính tháng dựa trên tuần (mỗi tháng = 4 tuần)
  month_index := CEIL(NEW.week_index::FLOAT / 4);
  
  -- Đếm tổng vi phạm của học sinh trong tháng
  SELECT COUNT(*) INTO violation_count
  FROM student_violations
  WHERE student_id = NEW.student_id
    AND semester_id = NEW.semester_id
    AND week_index >= (month_index - 1) * 4 + 1
    AND week_index <= month_index * 4;
  
  -- Nếu đạt ngưỡng 3+ vi phạm, tạo alert
  IF violation_count >= 3 THEN
    INSERT INTO monthly_violation_alerts (
      student_id, 
      semester_id, 
      month_index, 
      total_violations
    ) VALUES (
      NEW.student_id, 
      NEW.semester_id, 
      month_index, 
      violation_count
    )
    ON CONFLICT (student_id, semester_id, month_index) 
    DO UPDATE SET 
      total_violations = violation_count,
      is_seen = false; -- Reset seen status if count increases
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger để tự động tạo alerts
CREATE TRIGGER auto_create_monthly_alerts
  AFTER INSERT ON student_violations
  FOR EACH ROW EXECUTE FUNCTION check_monthly_violation_threshold();

-- View để dễ dàng query báo cáo tuần
CREATE OR REPLACE VIEW weekly_violation_summary AS
SELECT 
  sv.student_id,
  sv.semester_id,
  sv.week_index,
  p.full_name as student_name,
  p.student_id as student_code,
  c.name as class_name,
  COUNT(sv.id) as total_violations,
  SUM(sv.points) as total_points,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'id', sv.id,
      'name', vt.name,
      'points', sv.points,
      'date', sv.recorded_at,
      'description', sv.description
    )
  ) as violations
FROM student_violations sv
JOIN profiles p ON p.id = sv.student_id
JOIN classes c ON c.id = sv.class_id
JOIN violation_types vt ON vt.id = sv.violation_type_id
GROUP BY sv.student_id, sv.semester_id, sv.week_index, p.full_name, p.student_id, c.name;

-- View để dễ dàng query báo cáo tháng
CREATE OR REPLACE VIEW monthly_violation_ranking AS
SELECT 
  sv.student_id,
  sv.semester_id,
  CEIL(sv.week_index::FLOAT / 4) as month_index,
  p.full_name as student_name,
  p.student_id as student_code,
  c.name as class_name,
  COUNT(sv.id) as total_violations,
  SUM(sv.points) as total_points
FROM student_violations sv
JOIN profiles p ON p.id = sv.student_id
JOIN classes c ON c.id = sv.class_id
GROUP BY sv.student_id, sv.semester_id, CEIL(sv.week_index::FLOAT / 4), p.full_name, p.student_id, c.name
ORDER BY total_violations DESC, total_points DESC;

-- Grant permissions
GRANT ALL ON disciplinary_action_types TO authenticated;
GRANT ALL ON student_disciplinary_cases TO authenticated;
GRANT ALL ON monthly_violation_alerts TO authenticated;
GRANT SELECT ON weekly_violation_summary TO authenticated;
GRANT SELECT ON monthly_violation_ranking TO authenticated;
