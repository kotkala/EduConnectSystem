import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List all classes with filtering and joins
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
    const academic_year_id = searchParams.get('academic_year_id')
    const grade_level_id = searchParams.get('grade_level_id')
    
    // Build query with joins
    let query = supabase
      .from('classes')
      .select(`
        *,
        academic_year:academic_years(id, name, is_current),
        grade_level:grade_levels(id, name, level)
      `, { count: 'exact' })
    
    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    }
    
    if (academic_year_id) {
      query = query.eq('academic_year_id', academic_year_id)
    }
    
    if (grade_level_id) {
      query = query.eq('grade_level_id', grade_level_id)
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
      console.error('Error fetching classes:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch classes' },
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
    console.error('Classes API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new class
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
    const { 
      academic_year_id, 
      grade_level_id, 
      name, 
      code, 
      capacity, 
      room_number, 
      is_combined 
    } = body
    
    // Validate required fields
    if (!academic_year_id || !grade_level_id || !name || !code) {
      return NextResponse.json(
        { success: false, error: 'Academic year, grade level, name, and code are required' },
        { status: 400 }
      )
    }
    
    // Validate capacity
    if (capacity && (capacity < 1 || capacity > 100)) {
      return NextResponse.json(
        { success: false, error: 'Capacity must be between 1 and 100' },
        { status: 400 }
      )
    }
    
    // Check if academic year exists
    const { data: academicYear, error: yearError } = await supabase
      .from('academic_years')
      .select('id')
      .eq('id', academic_year_id)
      .single()
    
    if (yearError || !academicYear) {
      return NextResponse.json(
        { success: false, error: 'Invalid academic year' },
        { status: 400 }
      )
    }
    
    // Check if grade level exists
    const { data: gradeLevel, error: gradeError } = await supabase
      .from('grade_levels')
      .select('id')
      .eq('id', grade_level_id)
      .single()
    
    if (gradeError || !gradeLevel) {
      return NextResponse.json(
        { success: false, error: 'Invalid grade level' },
        { status: 400 }
      )
    }
    
    // Create new class
    const { data, error } = await supabase
      .from('classes')
      .insert({
        academic_year_id,
        grade_level_id,
        name,
        code,
        capacity: capacity || 30,
        room_number,
        is_combined: is_combined || false,
        created_by: user.id,
      })
      .select(`
        *,
        academic_year:academic_years(id, name, is_current),
        grade_level:grade_levels(id, name, level)
      `)
      .single()
    
    if (error) {
      console.error('Error creating class:', error)
      
      // Handle duplicate code error
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Class with this code already exists in this academic year' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create class' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: 'Class created successfully',
    })
  } catch (error) {
    console.error('Classes POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 