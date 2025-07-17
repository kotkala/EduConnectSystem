-- Fix student enrollments constraint to allow multiple class enrollments
-- A student can be in multiple classes (base class + combined classes) in the same academic year
-- But cannot be enrolled in the same class twice

-- Drop the existing constraint that prevents multiple enrollments per academic year
ALTER TABLE public.student_enrollments 
DROP CONSTRAINT IF EXISTS student_enrollments_student_id_academic_year_id_key;

-- Add a new constraint that prevents duplicate enrollments in the same class
ALTER TABLE public.student_enrollments 
ADD CONSTRAINT student_enrollments_student_class_unique 
UNIQUE(student_id, class_id, academic_year_id);

-- Add an index for better performance on common queries
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_year 
ON public.student_enrollments(student_id, academic_year_id) 
WHERE is_active = true;

-- Add an index for class-based queries
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_year 
ON public.student_enrollments(class_id, academic_year_id) 
WHERE is_active = true;

-- Optional: Add a check to ensure students don't have too many active enrollments
-- (This is a business logic constraint, adjust the number as needed)
-- ALTER TABLE public.student_enrollments 
-- ADD CONSTRAINT check_max_enrollments_per_year 
-- CHECK (
--     (SELECT COUNT(*) FROM public.student_enrollments se2 
--      WHERE se2.student_id = student_id 
--      AND se2.academic_year_id = academic_year_id 
--      AND se2.is_active = true) <= 5
-- );

-- Update any existing duplicate records (if any)
-- This will keep the most recent enrollment for each student-class combination
WITH ranked_enrollments AS (
    SELECT id, 
           ROW_NUMBER() OVER (
               PARTITION BY student_id, class_id, academic_year_id 
               ORDER BY created_at DESC
           ) as rn
    FROM public.student_enrollments
)
DELETE FROM public.student_enrollments 
WHERE id IN (
    SELECT id FROM ranked_enrollments WHERE rn > 1
); 