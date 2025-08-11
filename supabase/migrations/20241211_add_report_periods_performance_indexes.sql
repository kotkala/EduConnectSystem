-- Performance optimization indexes for report periods functionality
-- Based on Context7 Supabase performance patterns

-- Index for student class assignments filtering by class_id and is_active
-- Optimizes: student_class_assignments queries in getClassProgressAction
CREATE INDEX IF NOT EXISTS idx_student_class_assignments_class_active 
ON student_class_assignments (class_id, is_active);

-- Composite index for student reports filtering by report_period_id, class_id, and status
-- Optimizes: student_reports queries in getClassProgressAction  
CREATE INDEX IF NOT EXISTS idx_student_reports_period_class_status 
ON student_reports (report_period_id, class_id, status);

-- Index for classes filtering by semester_id
-- Optimizes: classes queries when filtering by semester
CREATE INDEX IF NOT EXISTS idx_classes_semester 
ON classes (semester_id);

-- Index for classes filtering by class_block_id
-- Optimizes: classes queries when filtering by class block
CREATE INDEX IF NOT EXISTS idx_classes_block 
ON classes (class_block_id);

-- Index for report periods filtering by is_active and ordering by created_at
-- Optimizes: getReportPeriodsAction query
CREATE INDEX IF NOT EXISTS idx_report_periods_active_created 
ON report_periods (is_active, created_at DESC);

-- Partial index for active class blocks (smaller, faster for dropdown queries)
-- Optimizes: getActiveClassBlocksAction query
CREATE INDEX IF NOT EXISTS idx_class_blocks_active 
ON class_blocks (name) 
WHERE is_active = true;

-- Add statistics update for query planner optimization
ANALYZE student_class_assignments;
ANALYZE student_reports;
ANALYZE classes;
ANALYZE report_periods;
ANALYZE class_blocks;
