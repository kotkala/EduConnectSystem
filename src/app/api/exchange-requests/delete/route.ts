import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const deleteRequestSchema = z.object({
  request_id: z.string().uuid('Invalid request ID')
})

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = deleteRequestSchema.parse(body)
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Get the exchange request to verify ownership and status
    const { data: exchangeRequest, error: requestError } = await supabase
      .from('schedule_exchange_requests')
      .select('requester_teacher_id, status')
      .eq('id', validatedData.request_id)
      .single()

    if (requestError || !exchangeRequest) {
      return NextResponse.json({ success: false, error: 'Exchange request not found' }, { status: 404 })
    }

    // Check if user is the requester or an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    const isAdmin = profile.role === 'admin'
    const isRequester = exchangeRequest.requester_teacher_id === user.id

    if (!isAdmin && !isRequester) {
      return NextResponse.json({ success: false, error: 'You can only delete your own exchange requests' }, { status: 403 })
    }

    // Only allow deletion of pending requests
    if (exchangeRequest.status !== 'pending') {
      return NextResponse.json({ success: false, error: 'Only pending requests can be deleted' }, { status: 400 })
    }

    // Delete the exchange request
    const { error: deleteError } = await supabase
      .from('schedule_exchange_requests')
      .delete()
      .eq('id', validatedData.request_id)

    if (deleteError) {
      console.error('Error deleting exchange request:', deleteError)
      return NextResponse.json({ success: false, error: 'Failed to delete exchange request' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Exchange request deleted successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues[0].message }, { status: 400 })
    }
    
    console.error('Error in delete exchange request API:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
