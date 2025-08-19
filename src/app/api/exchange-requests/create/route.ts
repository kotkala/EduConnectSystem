import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const createRequestSchema = z.object({
  timetable_event_id: z.string().uuid('Invalid timetable event ID'),
  target_teacher_id: z.string().uuid('Invalid target teacher ID'),
  exchange_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must be less than 500 characters')
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = createRequestSchema.parse(body)
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is a teacher
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ success: false, error: 'Teacher access required' }, { status: 403 })
    }

    // Verify the timetable event belongs to the requesting teacher
    const { data: timetableEvent, error: eventError } = await supabase
      .from('timetable_events')
      .select('teacher_id, subject_id')
      .eq('id', validatedData.timetable_event_id)
      .single()

    if (eventError || !timetableEvent) {
      return NextResponse.json({ success: false, error: 'Timetable event not found' }, { status: 404 })
    }

    if (timetableEvent.teacher_id !== user.id) {
      return NextResponse.json({ success: false, error: 'You can only create exchange requests for your own teaching slots' }, { status: 403 })
    }

    // Verify target teacher teaches the same subject
    const { data: targetAssignments, error: assignmentError } = await supabase
      .from('teacher_class_assignments')
      .select('subject_id')
      .eq('teacher_id', validatedData.target_teacher_id)
      .eq('subject_id', timetableEvent.subject_id)

    if (assignmentError || !targetAssignments || targetAssignments.length === 0) {
      return NextResponse.json({ success: false, error: 'Target teacher does not teach this subject' }, { status: 400 })
    }

    // Check for duplicate requests
    const { data: existingRequest, error: duplicateError } = await supabase
      .from('schedule_exchange_requests')
      .select('id')
      .eq('timetable_event_id', validatedData.timetable_event_id)
      .eq('exchange_date', validatedData.exchange_date)
      .eq('status', 'pending')

    if (duplicateError) {
      console.error('Error checking for duplicates:', duplicateError)
    }

    if (existingRequest && existingRequest.length > 0) {
      return NextResponse.json({ success: false, error: 'A pending exchange request already exists for this slot and date' }, { status: 400 })
    }

    // Create the exchange request
    const { data: newRequest, error: createError } = await supabase
      .from('schedule_exchange_requests')
      .insert({
        requester_teacher_id: user.id,
        target_teacher_id: validatedData.target_teacher_id,
        timetable_event_id: validatedData.timetable_event_id,
        exchange_date: validatedData.exchange_date,
        reason: validatedData.reason,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating exchange request:', createError)
      return NextResponse.json({ success: false, error: 'Failed to create exchange request' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Exchange request submitted successfully',
      data: newRequest 
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    
    console.error('Error in create exchange request API:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
