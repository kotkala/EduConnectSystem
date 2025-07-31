-- Add AI summary functionality to feedback system
-- This migration adds AI summary columns to support AI-generated feedback summaries

-- Add AI summary column to feedback_notifications table
ALTER TABLE feedback_notifications 
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS use_ai_summary BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_generated_at TIMESTAMP WITH TIME ZONE;

-- Add index for AI summary queries
CREATE INDEX IF NOT EXISTS feedback_notifications_ai_summary_idx ON feedback_notifications(use_ai_summary, ai_generated_at);

-- Add comment to explain the new columns
COMMENT ON COLUMN feedback_notifications.ai_summary IS 'AI-generated summary of daily feedback for parents';
COMMENT ON COLUMN feedback_notifications.use_ai_summary IS 'Whether to show AI summary instead of detailed feedback to parents';
COMMENT ON COLUMN feedback_notifications.ai_generated_at IS 'Timestamp when AI summary was generated';

-- Create a view for parent feedback with AI summary support
CREATE OR REPLACE VIEW parent_feedback_with_ai_summary AS
SELECT 
  fn.id as notification_id,
  fn.student_id,
  fn.parent_id,
  fn.teacher_id,
  fn.student_feedback_id,
  fn.sent_at,
  fn.is_read,
  fn.ai_summary,
  fn.use_ai_summary,
  fn.ai_generated_at,
  sf.rating,
  sf.feedback_text as comment,
  sf.created_at as feedback_created_at,
  te.start_time,
  te.end_time,
  te.day_of_week,
  te.week_number,
  s.name_vietnamese as subject_name,
  s.code as subject_code,
  teacher.full_name as teacher_name,
  student.full_name as student_name,
  student.email as student_email,
  c.name as class_name
FROM feedback_notifications fn
JOIN student_feedback sf ON fn.student_feedback_id = sf.id
JOIN timetable_events te ON sf.timetable_event_id = te.id
JOIN subjects s ON sf.subject_id = s.id
JOIN profiles teacher ON sf.teacher_id = teacher.id
JOIN profiles student ON sf.student_id = student.id
JOIN classes c ON sf.class_id = c.id
WHERE fn.sent_at IS NOT NULL;

-- Grant permissions for the view
GRANT SELECT ON parent_feedback_with_ai_summary TO authenticated;

-- Add RLS policy for the view (parents can only see their own children's feedback)
CREATE POLICY "Parents can view their children's feedback with AI summary" ON feedback_notifications
FOR SELECT USING (
  parent_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM parent_student_relationships psr 
    WHERE psr.parent_id = auth.uid() 
    AND psr.student_id = feedback_notifications.student_id
  )
);
