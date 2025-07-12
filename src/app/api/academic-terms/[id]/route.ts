import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get academic term by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { data, error } = await supabase
      .from('academic_terms')
      .select('*')
      .eq('id', id)
      .single()
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Academic term not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching academic term:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch academic term' },
        { status: 500 }
      )
    }
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Academic term GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update academic term by ID
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    // Parse request body
    const body = await request.json()
    const { academic_year_id, name, type, start_date, end_date, is_current } = body
    // Validate required fields
    if (!academic_year_id || !name || !type || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'Academic year, name, type, start_date, and end_date are required' },
        { status: 400 }
      )
    }
    // Validate date range
    if (new Date(start_date) >= new Date(end_date)) {
      return NextResponse.json(
        { success: false, error: 'Start date must be before end date' },
        { status: 400 }
      )
    }
    // If setting as current, unset other current terms in the same year
    if (is_current) {
      const { error: updateError } = await supabase
        .from('academic_terms')
        .update({ is_current: false })
        .eq('is_current', true)
        .eq('academic_year_id', academic_year_id)
        .neq('id', id)
      if (updateError) {
        console.error('Error updating current academic terms:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update current academic terms' },
          { status: 500 }
        )
      }
    }
    // Update academic term
    const { data, error } = await supabase
      .from('academic_terms')
      .update({
        academic_year_id,
        name,
        type,
        start_date,
        end_date,
        is_current: is_current || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Academic term not found' },
          { status: 404 }
        )
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Term type already exists for this academic year' },
          { status: 409 }
        )
      }
      console.error('Error updating academic term:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update academic term' },
        { status: 500 }
      )
    }
    return NextResponse.json({
      success: true,
      data,
      message: 'Academic term updated successfully',
    })
  } catch (error) {
    console.error('Academic term PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete academic term by ID
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await params
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    // Check if academic term exists
    const { data: term, error: fetchError } = await supabase
      .from('academic_terms')
      .select('*')
      .eq('id', id)
      .single()
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Academic term not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching academic term:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch academic term' },
        { status: 500 }
      )
    }
    // Check if this is the current academic term
    if (term.is_current) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the current academic term' },
        { status: 400 }
      )
    }
    // Check if term has associated subject assignments or exam schedules
    const { data: relatedSubjects, error: subjectError } = await supabase
      .from('subject_assignments')
      .select('id')
      .eq('academic_term_id', id)
      .limit(1)
    if (subjectError) {
      console.error('Error checking related subject assignments:', subjectError)
      return NextResponse.json(
        { success: false, error: 'Failed to check related subject assignments' },
        { status: 500 }
      )
    }
    if (relatedSubjects && relatedSubjects.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete academic term with associated subject assignments' },
        { status: 400 }
      )
    }
    // Delete academic term
    const { error } = await supabase
      .from('academic_terms')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('Error deleting academic term:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete academic term' },
        { status: 500 }
      )
    }
    return NextResponse.json({
      success: true,
      message: 'Academic term deleted successfully',
    })
  } catch (error) {
    console.error('Academic term DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 