import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List all academic years with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '10')
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const sort_order = searchParams.get('sort_order') || 'desc'
    const is_current = searchParams.get('is_current')
    
    // Build query
    let query = supabase
      .from('academic_years')
      .select('*', { count: 'exact' })
    
    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    
    if (is_current !== null) {
      query = query.eq('is_current', is_current === 'true')
    }
    
    // Apply sorting
    const ascending = sort_order === 'asc'
    query = query.order(sort_by, { ascending })
    
    // Apply pagination
    const from = (page - 1) * per_page
    const to = from + per_page - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error fetching academic years:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch academic years' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page),
      },
    })
  } catch (error) {
    console.error('Academic years API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new academic year
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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
      
      if (updateError) {
        console.error('Error updating current academic years:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update current academic years' },
          { status: 500 }
        )
      }
    }
    
    // Create new academic year
    const { data, error } = await supabase
      .from('academic_years')
      .insert({
        name,
        start_date,
        end_date,
        description,
        is_current: is_current || false,
        created_by: user.id,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating academic year:', error)
      
      // Handle duplicate name error
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Academic year with this name already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create academic year' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Academic year created successfully',
    })
  } catch (error) {
    console.error('Academic years POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 