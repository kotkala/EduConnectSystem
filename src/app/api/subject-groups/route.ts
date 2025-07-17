import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SUBJECT_GROUP_TYPES, PREDEFINED_SUBJECT_GROUPS } from '@/lib/constants/subject-groups'

// GET - List all subject groups with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Query parameters
    const type = searchParams.get('type') // natural_sciences, social_sciences
    const search = searchParams.get('search')
    const include_subjects = searchParams.get('include_subjects') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // For now, return predefined subject groups with optional subject details
    let filteredGroups = PREDEFINED_SUBJECT_GROUPS

    // Apply filters
    if (type) {
      filteredGroups = filteredGroups.filter(group => group.type === type)
    }
    if (search) {
      const searchLower = search.toLowerCase()
      filteredGroups = filteredGroups.filter(group => 
        group.name.toLowerCase().includes(searchLower) ||
        group.code.toLowerCase().includes(searchLower) ||
        group.description.toLowerCase().includes(searchLower)
      )
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedGroups = filteredGroups.slice(startIndex, endIndex)

    // If include_subjects is true, fetch subject details for each group
    if (include_subjects) {
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, code, description, credits, periods_per_week')

      if (subjectsError) {
        console.error('Error fetching subjects:', subjectsError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch subjects' },
          { status: 500 }
        )
      }

      // Map subjects to each group
      const groupsWithSubjects = paginatedGroups.map(group => ({
        ...group,
        subjects: group.subject_codes.map(code => 
          subjects.find(s => s.code === code)
        ).filter(Boolean)
      }))

      return NextResponse.json({
        success: true,
        data: groupsWithSubjects,
        pagination: {
          page,
          limit,
          total: filteredGroups.length,
          total_pages: Math.ceil(filteredGroups.length / limit)
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: paginatedGroups,
      pagination: {
        page,
        limit,
        total: filteredGroups.length,
        total_pages: Math.ceil(filteredGroups.length / limit)
      }
    })

  } catch (error) {
    console.error('Error in subject groups GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new subject group
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, code, type, description, subject_codes, specialization_subjects, max_students, metadata } = body

    // Validation
    if (!name || !code || !type || !subject_codes || !Array.isArray(subject_codes)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, code, type, subject_codes' },
        { status: 400 }
      )
    }

    // Check if code already exists
    const { data: existingGroup, error: checkError } = await supabase
      .from('subject_groups')
      .select('id')
      .eq('code', code)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing group:', checkError)
      return NextResponse.json(
        { success: false, error: 'Database error' },
        { status: 500 }
      )
    }

    if (existingGroup) {
      return NextResponse.json(
        { success: false, error: 'Subject group code already exists' },
        { status: 409 }
      )
    }

    // Create subject group
    const { data: newGroup, error: insertError } = await supabase
      .from('subject_groups')
      .insert({
        name,
        code,
        type,
        description,
        subject_codes,
        specialization_subjects,
        max_students: max_students || 35,
        metadata: metadata || {}
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating subject group:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create subject group' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: newGroup,
      message: 'Subject group created successfully'
    })

  } catch (error) {
    console.error('Error in subject groups POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Initialize predefined subject groups
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Clear existing subject groups
    const { error: deleteError } = await supabase
      .from('subject_groups')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

    if (deleteError) {
      console.error('Error clearing subject groups:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to clear existing subject groups' },
        { status: 500 }
      )
    }

    // Insert predefined subject groups
    const { data: insertedGroups, error: insertError } = await supabase
      .from('subject_groups')
      .insert(PREDEFINED_SUBJECT_GROUPS)
      .select()

    if (insertError) {
      console.error('Error inserting subject groups:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to initialize subject groups' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: insertedGroups,
      message: `Successfully initialized ${insertedGroups.length} subject groups`
    })

  } catch (error) {
    console.error('Error in subject groups PUT:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 