import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { VIOLATION_CATEGORIES, VIOLATION_SEVERITIES } from '@/lib/constants/violation-types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search')

    let query = supabase
      .from('violation_rules')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Filter by category if provided
    if (category) {
      query = query.eq('category', category)
    }

    // Search functionality
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching violation rules:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in violation rules GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { 
      code,
      name, 
      description, 
      category, 
      severity, 
      default_action,
      is_active = true
    } = body

    // Validation
    if (!code || !name || !category || !severity) {
      return NextResponse.json({ 
        error: 'Code, name, category and severity are required' 
      }, { status: 400 })
    }

    // Validate category
    const validCategories = Object.values(VIOLATION_CATEGORIES)
    if (!validCategories.includes(category)) {
      return NextResponse.json({ 
        error: 'Invalid category. Must be one of: ' + validCategories.join(', ') 
      }, { status: 400 })
    }

    // Validate severity level
    const validSeverities = Object.values(VIOLATION_SEVERITIES)
    if (!validSeverities.includes(severity)) {
      return NextResponse.json({ 
        error: 'Invalid severity. Must be: ' + validSeverities.join(', ') 
      }, { status: 400 })
    }

    // Check for duplicate code
    const { data: existingCode } = await supabase
      .from('violation_rules')
      .select('id')
      .eq('code', code)
      .single()

    if (existingCode) {
      return NextResponse.json({ 
        error: 'A violation rule with this code already exists' 
      }, { status: 409 })
    }

    // Check for duplicate names within the same category
    const { data: existingName } = await supabase
      .from('violation_rules')
      .select('id')
      .eq('name', name)
      .eq('category', category)
      .single()

    if (existingName) {
      return NextResponse.json({ 
        error: 'A violation rule with this name already exists in this category' 
      }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('violation_rules')
      .insert({
        code,
        name,
        description,
        category,
        severity,
        default_action,
        is_active
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating violation rule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Error in violation rules POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Get all categories and severities
export async function OPTIONS() {
  return NextResponse.json({
    categories: VIOLATION_CATEGORIES,
    severities: VIOLATION_SEVERITIES
  })
} 