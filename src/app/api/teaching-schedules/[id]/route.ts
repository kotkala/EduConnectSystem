import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { id } = params;

  try {
    const { data, error } = await supabase
      .from('teaching_schedules')
      .select(`
        *,
        academic_term:academic_terms!academic_term_id(name, start_date, end_date),
        class:classes!class_id(name, grade_level:grade_levels!grade_level_id(name)),
        teacher:users!teacher_id(full_name),
        subject:subjects!subject_id(name, code),
        time_slot:time_slots!time_slot_id(name, start_time, end_time, order_index)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Teaching schedule not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch teaching schedule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { id } = params;

  try {
    const body = await request.json();
    const {
      academic_term_id,
      class_id,
      teacher_id,
      subject_id,
      time_slot_id,
      day_of_week,
      week_number = 1,
      room_number,
      notes
    } = body;

    // Check if schedule exists
    const { data: existingSchedule, error: checkError } = await supabase
      .from('teaching_schedules')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (!existingSchedule) {
      return NextResponse.json(
        { error: 'Teaching schedule not found' },
        { status: 404 }
      );
    }

    // Check for conflicts (excluding current schedule)
    const conflicts = await checkScheduleConflicts(supabase, {
      academic_term_id,
      class_id,
      teacher_id,
      time_slot_id,
      day_of_week,
      week_number,
      excludeId: id
    });

    if (conflicts.length > 0) {
      return NextResponse.json(
        { error: 'Schedule conflicts detected', conflicts },
        { status: 409 }
      );
    }

    // Update the schedule
    const { data, error } = await supabase
      .from('teaching_schedules')
      .update({
        academic_term_id,
        class_id,
        teacher_id,
        subject_id,
        time_slot_id,
        day_of_week,
        week_number,
        room_number,
        notes
      })
      .eq('id', id)
      .select(`
        *,
        academic_term:academic_terms!academic_term_id(name, start_date, end_date),
        class:classes!class_id(name, grade_level:grade_levels!grade_level_id(name)),
        teacher:users!teacher_id(full_name),
        subject:subjects!subject_id(name, code),
        time_slot:time_slots!time_slot_id(name, start_time, end_time, order_index)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update teaching schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { id } = params;

  try {
    const { error } = await supabase
      .from('teaching_schedules')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Teaching schedule deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete teaching schedule' },
      { status: 500 }
    );
  }
}

// Helper function to convert day number to day_of_week enum
function mapDayToEnum(day: number): string {
  const dayMap: { [key: number]: string } = {
    1: 'monday',
    2: 'tuesday', 
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    7: 'sunday'
  };
  return dayMap[day] || 'monday';
}

// Check for schedule conflicts (with optional exclude ID)
async function checkScheduleConflicts(supabase: any, scheduleData: any) {
  const conflicts = [];
  
  // Convert day_of_week to enum string if it's a number
  const dayOfWeek = typeof scheduleData.day_of_week === 'number' ? mapDayToEnum(scheduleData.day_of_week) : scheduleData.day_of_week;
  
  // Check teacher conflict
  let teacherQuery = supabase
    .from('teaching_schedules')
    .select('*')
    .eq('academic_term_id', scheduleData.academic_term_id)
    .eq('teacher_id', scheduleData.teacher_id)
    .eq('time_slot_id', scheduleData.time_slot_id)
    .eq('day_of_week', dayOfWeek)
    .eq('week_number', scheduleData.week_number || 1);
    
  if (scheduleData.excludeId) {
    teacherQuery = teacherQuery.neq('id', scheduleData.excludeId);
  }
  
  const { data: teacherConflict } = await teacherQuery;
  
  if (teacherConflict && teacherConflict.length > 0) {
    conflicts.push('Teacher already has a class at this time');
  }
  
  // Check class conflict
  let classQuery = supabase
    .from('teaching_schedules')
    .select('*')
    .eq('academic_term_id', scheduleData.academic_term_id)
    .eq('class_id', scheduleData.class_id)
    .eq('time_slot_id', scheduleData.time_slot_id)
    .eq('day_of_week', dayOfWeek)
    .eq('week_number', scheduleData.week_number || 1);
    
  if (scheduleData.excludeId) {
    classQuery = classQuery.neq('id', scheduleData.excludeId);
  }
  
  const { data: classConflict } = await classQuery;
  
  if (classConflict && classConflict.length > 0) {
    conflicts.push('Class already has a lesson at this time');
  }
  
  return conflicts;
} 