import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Standard Vietnamese high school time slots
const DEFAULT_TIME_SLOTS = [
  { name: 'Tiết 1', start_time: '07:00', end_time: '07:45', slot_order: 1, is_break: false },
  { name: 'Tiết 2', start_time: '07:50', end_time: '08:35', slot_order: 2, is_break: false },
  { name: 'Giải lao', start_time: '08:35', end_time: '08:45', slot_order: 3, is_break: true },
  { name: 'Tiết 3', start_time: '08:45', end_time: '09:30', slot_order: 4, is_break: false },
  { name: 'Tiết 4', start_time: '09:35', end_time: '10:20', slot_order: 5, is_break: false },
  { name: 'Giải lao', start_time: '10:20', end_time: '10:30', slot_order: 6, is_break: true },
  { name: 'Tiết 5', start_time: '10:30', end_time: '11:15', slot_order: 7, is_break: false },
  { name: 'Nghỉ trưa', start_time: '11:15', end_time: '13:30', slot_order: 8, is_break: true },
  { name: 'Tiết 6', start_time: '13:30', end_time: '14:15', slot_order: 9, is_break: false },
  { name: 'Tiết 7', start_time: '14:20', end_time: '15:05', slot_order: 10, is_break: false },
  { name: 'Giải lao', start_time: '15:05', end_time: '15:15', slot_order: 11, is_break: true },
  { name: 'Tiết 8', start_time: '15:15', end_time: '16:00', slot_order: 12, is_break: false },
  { name: 'Tiết 9', start_time: '16:05', end_time: '16:50', slot_order: 13, is_break: false },
  { name: 'Tiết 10', start_time: '16:55', end_time: '17:40', slot_order: 14, is_break: false }
]

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const include_breaks = searchParams.get('include_breaks') !== 'false'
    const only_teaching = searchParams.get('only_teaching') === 'true'

    let query = supabase
      .from('time_slots')
      .select('*')
      .order('slot_order', { ascending: true })

    // Filter based on parameters
    if (!include_breaks || only_teaching) {
      query = query.eq('is_break', false)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching time slots:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by type for summary
    const teaching_slots = data?.filter(slot => !slot.is_break) || []
    const break_slots = data?.filter(slot => slot.is_break) || []

    return NextResponse.json({
      data,
      summary: {
        total: data?.length || 0,
        teaching_slots: teaching_slots.length,
        break_slots: break_slots.length,
        first_period: teaching_slots[0]?.start_time,
        last_period: teaching_slots[teaching_slots.length - 1]?.end_time
      }
    })

  } catch (error) {
    console.error('Error in time slots GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { action } = body

    if (action === 'initialize_default') {
      return await initializeDefaultTimeSlots(supabase)
    }

    if (action === 'bulk_create') {
      return await bulkCreateTimeSlots(supabase, body.time_slots)
    }

    // Regular create single time slot
    const { 
      name, 
      start_time, 
      end_time, 
      slot_order,
      is_break = false
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

    // Check for duplicate slot_order
    const { data: existingOrder } = await supabase
      .from('time_slots')
      .select('id')
      .eq('slot_order', slot_order)
      .single()

    if (existingOrder) {
      return NextResponse.json({ 
        error: 'A time slot with this order already exists' 
      }, { status: 409 })
    }

    // Check for time conflicts
    const conflict = await checkTimeConflict(supabase, start_time, end_time)
    if (conflict) {
      return NextResponse.json({ 
        error: 'Time slot conflicts with existing slot: ' + conflict.name 
      }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('time_slots')
      .insert({
        name,
        start_time,
        end_time,
        slot_order,
        is_break
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating time slot:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Error in time slots POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to initialize default time slots
async function initializeDefaultTimeSlots(supabase: any) {
  try {
    // Check if time slots already exist
    const { data: existing, error: checkError } = await supabase
      .from('time_slots')
      .select('id')
      .limit(1)

    if (checkError) throw checkError

    if (existing && existing.length > 0) {
      return NextResponse.json({ 
        message: 'Time slots already exist',
        count: existing.length
      })
    }

    // Insert default time slots
    const { data, error } = await supabase
      .from('time_slots')
      .insert(DEFAULT_TIME_SLOTS)
      .select()

    if (error) throw error

    return NextResponse.json({ 
      message: 'Default time slots created successfully',
      count: data.length,
      data 
    }, { status: 201 })

  } catch (error) {
    console.error('Error initializing default time slots:', error)
    return NextResponse.json({ error: 'Failed to initialize time slots' }, { status: 500 })
  }
}

// Helper function to bulk create time slots
async function bulkCreateTimeSlots(supabase: any, timeSlots: any[]) {
  try {
    // Validate all time slots
    for (const slot of timeSlots) {
      if (!slot.name || !slot.start_time || !slot.end_time || slot.slot_order === undefined) {
        throw new Error('All time slots must have name, start_time, end_time, and slot_order')
      }
      if (slot.start_time >= slot.end_time) {
        throw new Error(`Invalid time range for ${slot.name}: start_time must be before end_time`)
      }
    }

    // Check for duplicate slot orders
    const orders = timeSlots.map(slot => slot.slot_order)
    const duplicateOrders = orders.filter((order, index) => orders.indexOf(order) !== index)
    if (duplicateOrders.length > 0) {
      throw new Error('Duplicate slot orders found: ' + duplicateOrders.join(', '))
    }

    // Insert all time slots
    const { data, error } = await supabase
      .from('time_slots')
      .insert(timeSlots.map(slot => ({
        ...slot,
        is_break: slot.is_break || false
      })))
      .select()

    if (error) throw error

    return NextResponse.json({ 
      message: 'Time slots created successfully',
      count: data.length,
      data 
    }, { status: 201 })

  } catch (error) {
    console.error('Error bulk creating time slots:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
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