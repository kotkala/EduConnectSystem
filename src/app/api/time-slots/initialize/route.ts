import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Standard Vietnamese high school time slots
const DEFAULT_TIME_SLOTS = [
  // Morning teaching periods
  { name: 'Tiết 1', start_time: '07:00', end_time: '07:45', slot_order: 1, is_break: false },
  { name: 'Tiết 2', start_time: '07:50', end_time: '08:35', slot_order: 2, is_break: false },
  { name: 'Giải lao', start_time: '08:35', end_time: '08:45', slot_order: 3, is_break: true },
  { name: 'Tiết 3', start_time: '08:45', end_time: '09:30', slot_order: 4, is_break: false },
  { name: 'Tiết 4', start_time: '09:35', end_time: '10:20', slot_order: 5, is_break: false },
  { name: 'Tiết 5', start_time: '10:25', end_time: '11:10', slot_order: 6, is_break: false },
  
  // Lunch break
  { name: 'Nghỉ trưa', start_time: '11:10', end_time: '13:30', slot_order: 7, is_break: true },
  
  // Afternoon teaching periods
  { name: 'Tiết 6', start_time: '13:30', end_time: '14:15', slot_order: 8, is_break: false },
  { name: 'Tiết 7', start_time: '14:20', end_time: '15:05', slot_order: 9, is_break: false },
  { name: 'Giải lao', start_time: '15:05', end_time: '15:15', slot_order: 10, is_break: true },
  { name: 'Tiết 8', start_time: '15:15', end_time: '16:00', slot_order: 11, is_break: false },
  { name: 'Tiết 9', start_time: '16:05', end_time: '16:50', slot_order: 12, is_break: false },
  { name: 'Tiết 10', start_time: '16:55', end_time: '17:40', slot_order: 13, is_break: false }
];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if time slots already exist
    const { data: existing, error: checkError } = await supabase
      .from('time_slots')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing time slots:', checkError);
      return NextResponse.json(
        { error: 'Error checking existing time slots' },
        { status: 500 }
      );
    }

    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        message: 'Time slots already exist',
        existingCount: existing.length
      });
    }

    // Insert default time slots
    const { data, error } = await supabase
      .from('time_slots')
      .insert(DEFAULT_TIME_SLOTS)
      .select();

    if (error) {
      console.error('Error creating time slots:', error);
      return NextResponse.json(
        { error: 'Failed to create time slots: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: 'Default time slots created successfully',
      totalSlots: DEFAULT_TIME_SLOTS.length,
      teachingSlots: DEFAULT_TIME_SLOTS.filter(slot => !slot.is_break).length,
      breakSlots: DEFAULT_TIME_SLOTS.filter(slot => slot.is_break).length,
      data
    }, { status: 201 });

  } catch (error) {
    console.error('Error initializing time slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 