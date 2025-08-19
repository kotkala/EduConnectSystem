import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const approveRejectRequestSchema = z.object({
  request_id: z.string().uuid('Invalid request ID'),
  status: z.enum(['approved', 'rejected'], { message: 'Status is required' }),
  admin_response: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = approveRejectRequestSchema.parse(body)
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 })
    }

    // Get the exchange request details
    const { data: exchangeRequest, error: requestError } = await supabase
      .from('schedule_exchange_requests')
      .select('*')
      .eq('id', validatedData.request_id)
      .single()

    if (requestError || !exchangeRequest) {
      return NextResponse.json({ success: false, error: 'Exchange request not found' }, { status: 404 })
    }

    if (exchangeRequest.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Request has already been processed' }, { status: 400 })
    }

    // Update the exchange request
    const { error: updateError } = await supabase
      .from('schedule_exchange_requests')
      .update({
        status: validatedData.status,
        admin_response: validatedData.admin_response,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', validatedData.request_id)

    if (updateError) {
      console.error('Error updating exchange request:', updateError)
      return NextResponse.json({ success: false, error: 'Failed to update request' }, { status: 500 })
    }

    // If approved, update the timetable event with substitute teacher
    if (validatedData.status === 'approved') {
      const { error: timetableError } = await supabase
        .from('timetable_events')
        .update({
          substitute_teacher_id: exchangeRequest.target_teacher_id,
          substitute_date: exchangeRequest.exchange_date,
          exchange_request_id: exchangeRequest.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', exchangeRequest.timetable_event_id)

      if (timetableError) {
        console.error('Error updating timetable:', timetableError)
        // Note: We don't return error here as the main request was processed
      }
    }

    const message = validatedData.status === 'approved' 
      ? 'Exchange request approved successfully'
      : 'Exchange request rejected'

    return NextResponse.json({ success: true, message })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    
    console.error('Error in approve exchange request API:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
