import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching time slot:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Time slot not found' }, { status: 404 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Error in time slot GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { 
      name, 
      start_time, 
      end_time, 
      slot_order,
      is_break
    } = body

    // Validation
    if (!name || !start_time || !end_time || slot_order === undefined) {
      return NextResponse.json({ 
        error: 'Name, start_time, end_time, and slot_order are required' 
      }, { status: 400 })
    }

    // Validate time format and logic
    if (start_time >= end_time) {
      return NextResponse.json({ 
        error: 'start_time must be before end_time' 
      }, { status: 400 })
    }

    // Check if time slot exists
    const { data: existing } = await supabase
      .from('time_slots')
      .select('id, slot_order')
      .eq('id', params.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Time slot not found' }, { status: 404 })
    }

    // Check for duplicate slot_order (excluding current record)
    if (slot_order !== existing.slot_order) {
      const { data: duplicateOrder } = await supabase
        .from('time_slots')
        .select('id')
        .eq('slot_order', slot_order)
        .neq('id', params.id)
        .single()

      if (duplicateOrder) {
        return NextResponse.json({ 
          error: 'A time slot with this order already exists' 
        }, { status: 409 })
      }
    }

    // Check for time conflicts (excluding current record)
    const conflict = await checkTimeConflict(supabase, start_time, end_time, params.id)
    if (conflict) {
      return NextResponse.json({ 
        error: 'Time slot conflicts with existing slot: ' + conflict.name 
      }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('time_slots')
      .update({
        name,
        start_time,
        end_time,
        slot_order,
        is_break
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating time slot:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Error in time slot PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Check if time slot exists
    const { data: existing } = await supabase
      .from('time_slots')
      .select('id, name')
      .eq('id', params.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Time slot not found' }, { status: 404 })
    }

    // Check if time slot is being used in schedules
    const { data: schedules } = await supabase
      .from('teaching_schedules')
      .select('id')
      .eq('time_slot_id', params.id)
      .limit(1)

    if (schedules && schedules.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete time slot that is being used in schedules' 
      }, { status: 409 })
    }

    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting time slot:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Time slot deleted successfully',
      deleted: existing
    })

  } catch (error) {
    console.error('Error in time slot DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to check time conflicts
async function checkTimeConflict(supabase: any, start_time: string, end_time: string, excludeId?: string) {
  let query = supabase
    .from('time_slots')
    .select('id, name, start_time, end_time')
    .or(`and(start_time.lt.${end_time},end_time.gt.${start_time})`)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data } = await query.single()
  return data
} 