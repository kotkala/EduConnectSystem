-- Optimized PostgreSQL function for class progress aggregation
-- Replaces multiple client-side queries with single server-side aggregation
-- Based on Context7 Supabase RPC patterns for performance

CREATE OR REPLACE FUNCTION get_class_progress_counts(
  report_period_id_param UUID,
  class_ids_param UUID[]
)
RETURNS TABLE (
  class_id UUID,
  total_students INTEGER,
  sent_reports INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH student_counts AS (
    SELECT 
      sca.class_id,
      COUNT(*)::INTEGER as total_students
    FROM student_class_assignments sca
    WHERE sca.class_id = ANY(class_ids_param)
      AND sca.is_active = true
    GROUP BY sca.class_id
  ),
  report_counts AS (
    SELECT 
      sr.class_id,
      COUNT(*)::INTEGER as sent_reports
    FROM student_reports sr
    WHERE sr.report_period_id = report_period_id_param
      AND sr.class_id = ANY(class_ids_param)
      AND sr.status = 'sent'
    GROUP BY sr.class_id
  )
  SELECT 
    c.class_id,
    COALESCE(sc.total_students, 0) as total_students,
    COALESCE(rc.sent_reports, 0) as sent_reports
  FROM (
    SELECT UNNEST(class_ids_param) as class_id
  ) c
  LEFT JOIN student_counts sc ON c.class_id = sc.class_id
  LEFT JOIN report_counts rc ON c.class_id = rc.class_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_class_progress_counts(UUID, UUID[]) TO authenticated;

-- Add function comment for documentation
COMMENT ON FUNCTION get_class_progress_counts(UUID, UUID[]) IS 
'Optimized aggregation function for class progress counts. Returns student counts and sent report counts for given classes and report period. Replaces multiple client-side queries with single server-side aggregation for better performance.';
