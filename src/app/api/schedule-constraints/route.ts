import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  
  const constraintType = searchParams.get('type');
  const teacherId = searchParams.get('teacher_id');
  const classId = searchParams.get('class_id');
  const subjectId = searchParams.get('subject_id');

  try {
    let query = supabase
      .from('schedule_constraints')
      .select(`
        *,
        teacher:users!teacher_id(full_name),
        class:classes!class_id(name),
        subject:subjects!subject_id(name),
        time_slot:time_slots!time_slot_id(name, start_time, end_time)
      `)
      .order('created_at', { ascending: false });

    if (constraintType) {
      query = query.eq('constraint_type', constraintType);
    }
    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }
    if (classId) {
      query = query.eq('class_id', classId);
    }
    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch schedule constraints' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    const body = await request.json();
    const {
      constraint_type,
      teacher_id,
      class_id,
      subject_id,
      time_slot_id,
      day_of_week,
      description,
      priority = 'medium',
      is_active = true
    } = body;

    // Validate required fields based on constraint type
    if (!constraint_type) {
      return NextResponse.json(
        { error: 'Constraint type is required' },
        { status: 400 }
      );
    }

    // Validate constraint type
    const validTypes = [
      'teacher_unavailable',
      'class_unavailable', 
      'subject_consecutive',
      'subject_not_consecutive',
      'preferred_time',
      'avoid_time',
      'max_daily_lessons',
      'break_between_lessons'
    ];

    if (!validTypes.includes(constraint_type)) {
      return NextResponse.json(
        { error: 'Invalid constraint type' },
        { status: 400 }
      );
    }

    // Check for conflicts
    const { data: existingConstraints, error: checkError } = await supabase
      .from('schedule_constraints')
      .select('*')
      .eq('constraint_type', constraint_type)
      .eq('teacher_id', teacher_id || null)
      .eq('class_id', class_id || null)
      .eq('subject_id', subject_id || null)
      .eq('time_slot_id', time_slot_id || null)
      .eq('day_of_week', day_of_week || null)
      .eq('is_active', true);

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existingConstraints && existingConstraints.length > 0) {
      return NextResponse.json(
        { error: 'Similar constraint already exists' },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('schedule_constraints')
      .insert({
        constraint_type,
        teacher_id,
        class_id,
        subject_id,
        time_slot_id,
        day_of_week,
        description,
        priority,
        is_active
      })
      .select(`
        *,
        teacher:users!teacher_id(full_name),
        class:classes!class_id(name),
        subject:subjects!subject_id(name),
        time_slot:time_slots!time_slot_id(name, start_time, end_time)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create schedule constraint' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Constraint ID is required' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabase
      .from('schedule_constraints')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Constraint deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete constraint' },
      { status: 500 }
    );
  }
} 