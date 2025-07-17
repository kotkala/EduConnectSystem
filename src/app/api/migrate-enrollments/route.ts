import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user - only allow admins to run migrations
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Check if user is admin (optional - remove if not needed)
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    console.log('=== RUNNING ENROLLMENT MIGRATION ===')
    
    // Step 1: Check current constraint
    console.log('Checking current constraints...')
    const { data: constraints } = await supabase
      .rpc('sql', {
        query: `
          SELECT conname, contype 
          FROM pg_constraint 
          WHERE conrelid = 'public.student_enrollments'::regclass
          AND conname LIKE '%student%'
        `
      })
    
    console.log('Current constraints:', constraints)
    
    // Step 2: Drop the old constraint
    console.log('Dropping old constraint...')
    const { error: dropError } = await supabase
      .rpc('sql', {
        query: `
          ALTER TABLE public.student_enrollments 
          DROP CONSTRAINT IF EXISTS student_enrollments_student_id_academic_year_id_key;
        `
      })
    
    if (dropError) {
      console.error('Error dropping constraint:', dropError)
      return NextResponse.json(
        { success: false, error: 'Failed to drop old constraint: ' + dropError.message },
        { status: 500 }
      )
    }
    
    // Step 3: Clean up any duplicate records
    console.log('Cleaning up duplicate records...')
    const { error: cleanupError } = await supabase
      .rpc('sql', {
        query: `
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
        `
      })
    
    if (cleanupError) {
      console.error('Error cleaning up duplicates:', cleanupError)
      return NextResponse.json(
        { success: false, error: 'Failed to clean up duplicates: ' + cleanupError.message },
        { status: 500 }
      )
    }
    
    // Step 4: Add new constraint
    console.log('Adding new constraint...')
    const { error: addError } = await supabase
      .rpc('sql', {
        query: `
          ALTER TABLE public.student_enrollments 
          ADD CONSTRAINT student_enrollments_student_class_unique 
          UNIQUE(student_id, class_id, academic_year_id);
        `
      })
    
    if (addError) {
      console.error('Error adding new constraint:', addError)
      return NextResponse.json(
        { success: false, error: 'Failed to add new constraint: ' + addError.message },
        { status: 500 }
      )
    }
    
    // Step 5: Create indexes
    console.log('Creating indexes...')
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_year 
       ON public.student_enrollments(student_id, academic_year_id) 
       WHERE is_active = true;`,
      `CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_year 
       ON public.student_enrollments(class_id, academic_year_id) 
       WHERE is_active = true;`,
      `CREATE INDEX IF NOT EXISTS idx_student_enrollments_active 
       ON public.student_enrollments(is_active) 
       WHERE is_active = true;`
    ]
    
    for (const query of indexQueries) {
      const { error: indexError } = await supabase.rpc('sql', { query })
      if (indexError) {
        console.error('Error creating index:', indexError)
        // Continue with other indexes even if one fails
      }
    }
    
    // Step 6: Verify the changes
    console.log('Verifying changes...')
    const { data: newConstraints } = await supabase
      .rpc('sql', {
        query: `
          SELECT conname, contype 
          FROM pg_constraint 
          WHERE conrelid = 'public.student_enrollments'::regclass
          AND conname LIKE '%student%'
        `
      })
    
    console.log('New constraints:', newConstraints)
    
    console.log('Migration completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      data: {
        old_constraints: constraints,
        new_constraints: newConstraints,
        changes: [
          'Dropped UNIQUE(student_id, academic_year_id) constraint',
          'Added UNIQUE(student_id, class_id, academic_year_id) constraint',
          'Created performance indexes',
          'Cleaned up duplicate records'
        ]
      }
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { success: false, error: 'Migration failed: ' + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
} 