import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List users with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user for authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '10')
    const sort_by = searchParams.get('sort_by') || 'created_at'
    const sort_order = searchParams.get('sort_order') || 'desc'
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    
    // Build query
    let query = supabase
      .from('users')
      .select('id, phone, full_name, role, status, gender, date_of_birth, avatar_url, created_at', { count: 'exact' })
    
    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    
    if (role) {
      query = query.eq('role', role)
    }
    
    if (status) {
      query = query.eq('status', status)
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
      console.error('Error fetching users:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch users' },
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
    console.error('Users API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new user (admin only)
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
    
    // TODO: Check if user has admin role
    // For now, we'll allow any authenticated user
    
    // Parse request body
    const body = await request.json()
    const { 
      phone, 
      full_name, 
      role, 
      email, 
      password,
      gender,
      date_of_birth,
      address,
      avatar_url 
    } = body
    
    // Validate required fields
    if (!phone || !full_name || !role || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Phone, full name, role, email, and password are required' },
        { status: 400 }
      )
    }
    
    // Validate role
    const validRoles = ['admin', 'school_administrator', 'homeroom_teacher', 'subject_teacher', 'parent', 'student']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      )
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: authCreateError } = await supabase.auth.admin.createUser({
      email,
      password,
      phone,
      user_metadata: {
        full_name,
        role,
      }
    })
    
    if (authCreateError) {
      console.error('Error creating auth user:', authCreateError)
      return NextResponse.json(
        { success: false, error: 'Failed to create user account' },
        { status: 500 }
      )
    }
    
    // Create user profile in users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        phone,
        full_name,
        role,
        gender,
        date_of_birth,
        address,
        avatar_url,
        created_by: user.id,
      })
      .select()
      .single()
    
    if (userError) {
      console.error('Error creating user profile:', userError)
      
      // Cleanup: delete auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      
      return NextResponse.json(
        { success: false, error: 'Failed to create user profile' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: userData,
      message: 'User created successfully',
    })
  } catch (error) {
    console.error('Users POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 