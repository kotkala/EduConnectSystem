import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get academic year by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Academic year not found' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching academic year:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch academic year' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Academic year GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update academic year by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { name, start_date, end_date, description, is_current } = body
    
    // Validate required fields
    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { success: false, error: 'Name, start_date, and end_date are required' },
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
    
    // If setting as current, unset other current years
    if (is_current) {
      const { error: updateError } = await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('is_current', true)
        .neq('id', id)
      
      if (updateError) {
        console.error('Error updating current academic years:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update current academic years' },
          { status: 500 }
        )
      }
    }
    
    // Update academic year
    const { data, error } = await supabase
      .from('academic_years')
      .update({
        name,
        start_date,
        end_date,
        description,
        is_current: is_current || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Academic year not found' },
          { status: 404 }
        )
      }
      
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Academic year with this name already exists' },
          { status: 409 }
        )
      }
      
      console.error('Error updating academic year:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update academic year' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Academic year updated successfully',
    })
  } catch (error) {
    console.error('Academic year PUT error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete academic year by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Check if academic year exists and get its data
    const { data: academicYear, error: fetchError } = await supabase
      .from('academic_years')
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Academic year not found' },
          { status: 404 }
        )
      }
      
      console.error('Error fetching academic year:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch academic year' },
        { status: 500 }
      )
    }
    
    // Check if this is the current academic year
    if (academicYear.is_current) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the current academic year' },
        { status: 400 }
      )
    }
    
    // Check if academic year has associated data (classes, terms, etc.)
    const { data: relatedData, error: relationError } = await supabase
      .from('academic_terms')
      .select('id')
      .eq('academic_year_id', id)
      .limit(1)
    
    if (relationError) {
      console.error('Error checking related data:', relationError)
      return NextResponse.json(
        { success: false, error: 'Failed to check related data' },
        { status: 500 }
      )
    }
    
    if (relatedData && relatedData.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete academic year with associated terms or classes' },
        { status: 400 }
      )
    }
    
    // Delete academic year
    const { error } = await supabase
      .from('academic_years')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting academic year:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete academic year' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Academic year deleted successfully',
    })
  } catch (error) {
    console.error('Academic year DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 