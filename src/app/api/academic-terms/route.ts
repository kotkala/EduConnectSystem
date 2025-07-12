import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List all academic terms with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '10')
    const sort_by = searchParams.get('sort_by') || 'start_date'
    const sort_order = searchParams.get('sort_order') || 'asc'
    const academic_year_id = searchParams.get('academic_year_id')
    const is_current = searchParams.get('is_current')

    // Build query
    let query = supabase
      .from('academic_terms')
      .select('*', { count: 'exact' })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    if (academic_year_id) {
      query = query.eq('academic_year_id', academic_year_id)
    }
    if (is_current !== null) {
      query = query.eq('is_current', is_current === 'true')
    }
    // Sorting
    const ascending = sort_order === 'asc'
    query = query.order(sort_by, { ascending })
    // Pagination
    const from = (page - 1) * per_page
    const to = from + per_page - 1
    query = query.range(from, to)
    const { data, error, count } = await query
    if (error) {
      console.error('Error fetching academic terms:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch academic terms' },
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
    console.error('Academic terms API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new academic term
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
      if (updateError) {
        console.error('Error updating current academic terms:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update current academic terms' },
          { status: 500 }
        )
      }
    }
    // Create new academic term
    const { data, error } = await supabase
      .from('academic_terms')
      .insert({
        academic_year_id,
        name,
        type,
        start_date,
        end_date,
        is_current: is_current || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) {
      console.error('Error creating academic term:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Term type already exists for this academic year' },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { success: false, error: 'Failed to create academic term' },
        { status: 500 }
      )
    }
    return NextResponse.json({
      success: true,
      data,
      message: 'Academic term created successfully',
    })
  } catch (error) {
    console.error('Academic terms POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 