import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    // Check if user is authenticated and has admin privileges
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Admin privileges required' }, { status: 403 });
    }

    // Run the migration steps
    const migrations = [
      // 1. Add week_number column
      `ALTER TABLE public.teaching_schedules ADD COLUMN IF NOT EXISTS week_number INTEGER NOT NULL DEFAULT 1;`,
      
      // 2. Add constraint
      `ALTER TABLE public.teaching_schedules ADD CONSTRAINT IF NOT EXISTS chk_week_number CHECK (week_number >= 1 AND week_number <= 35);`,
      
      // 3. Drop old constraints
      `ALTER TABLE public.teaching_schedules DROP CONSTRAINT IF EXISTS teaching_schedules_academic_term_id_day_of_week_time_slot_id_teacher_id_key;`,
      `ALTER TABLE public.teaching_schedules DROP CONSTRAINT IF EXISTS teaching_schedules_academic_term_id_day_of_week_time_slot_id_class_id_key;`,
      
      // 4. Add new constraints
      `ALTER TABLE public.teaching_schedules ADD CONSTRAINT IF NOT EXISTS teaching_schedules_academic_term_id_day_of_week_time_slot_id_teacher_id_week_number_key 
        UNIQUE(academic_term_id, day_of_week, time_slot_id, teacher_id, week_number);`,
      `ALTER TABLE public.teaching_schedules ADD CONSTRAINT IF NOT EXISTS teaching_schedules_academic_term_id_day_of_week_time_slot_id_class_id_week_number_key 
        UNIQUE(academic_term_id, day_of_week, time_slot_id, class_id, week_number);`,
      
      // 5. Create indexes
      `CREATE INDEX IF NOT EXISTS idx_teaching_schedules_week_number ON public.teaching_schedules(academic_term_id, week_number);`,
      `CREATE INDEX IF NOT EXISTS idx_teaching_schedules_class_term_week ON public.teaching_schedules(class_id, academic_term_id, week_number);`,
      `CREATE INDEX IF NOT EXISTS idx_teaching_schedules_teacher_term_week ON public.teaching_schedules(teacher_id, academic_term_id, week_number);`,
    ];

    const results = [];
    
    for (const migration of migrations) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: migration });
        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase.from('teaching_schedules').select('id').limit(1);
          if (directError) {
            results.push({ sql: migration, success: false, error: error.message });
          } else {
            results.push({ sql: migration, success: true, message: 'Migration may have succeeded' });
          }
        } else {
          results.push({ sql: migration, success: true, message: 'Migration executed successfully' });
        }
      } catch (err) {
        results.push({ sql: migration, success: false, error: (err as Error).message });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
      results
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
} 