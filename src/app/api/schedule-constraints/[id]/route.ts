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
      .from('schedule_constraints')
      .select(`
        *,
        teacher:users!teacher_id(full_name),
        class:classes!class_id(name),
        subject:subjects!subject_id(name),
        time_slot:time_slots!time_slot_id(name, start_time, end_time)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Schedule constraint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch schedule constraint' },
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
      constraint_type,
      teacher_id,
      class_id,
      subject_id,
      time_slot_id,
      day_of_week,
      description,
      priority,
      is_active
    } = body;

    // Validate constraint type if provided
    if (constraint_type) {
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
    }

    // Check if constraint exists
    const { data: existingConstraint, error: checkError } = await supabase
      .from('schedule_constraints')
      .select('*')
      .eq('id', id)
      .single();

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (!existingConstraint) {
      return NextResponse.json(
        { error: 'Schedule constraint not found' },
        { status: 404 }
      );
    }

    // Update the constraint
    const { data, error } = await supabase
      .from('schedule_constraints')
      .update({
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
      .eq('id', id)
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

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update schedule constraint' },
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