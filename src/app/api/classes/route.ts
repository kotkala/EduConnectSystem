import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PREDEFINED_SUBJECT_GROUPS } from '@/lib/constants/subject-groups'
import { CLASS_TYPES, CLASS_TYPE_LABELS } from '@/lib/constants/class-types'

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
    const class_type = searchParams.get('class_type') // base_class, combined_class
    const subject_group_code = searchParams.get('subject_group_code')
    
    // Build query with joins (only using existing tables)
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
    
    if (class_type) {
      if (class_type === 'base_class') {
        query = query.eq('is_combined', false)
      } else if (class_type === 'combined_class') {
        query = query.eq('is_combined', true)
      }
    }
    
    if (subject_group_code) {
      query = query.contains('metadata', { subject_group_code })
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

    // Enrich data with subject group information for combined classes
    const enrichedData = data?.map(classItem => {
      if (classItem.is_combined && classItem.metadata?.subject_group_code) {
        const subjectGroup = PREDEFINED_SUBJECT_GROUPS.find(
          sg => sg.code === classItem.metadata.subject_group_code
        )
        return {
          ...classItem,
          subject_group: subjectGroup || null,
          class_type: CLASS_TYPES.COMBINED_CLASS
        }
      }
      return {
        ...classItem,
        class_type: CLASS_TYPES.BASE_CLASS
      }
    })
    
    return NextResponse.json({
      success: true,
      data: enrichedData,
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
      class_type,
      subject_group_code, // Use code instead of ID since we don't have a subject_groups table
      description,
      // Legacy support
      is_combined 
    } = body
    
    // Determine class type (support legacy is_combined)
    const finalClassType = class_type || (is_combined ? CLASS_TYPES.COMBINED_CLASS : CLASS_TYPES.BASE_CLASS)
    const isCombined = finalClassType === CLASS_TYPES.COMBINED_CLASS
    
    // Validate required fields
    if (!academic_year_id || !grade_level_id || !name || !code) {
      return NextResponse.json(
        { success: false, error: 'Academic year, grade level, name, and code are required' },
        { status: 400 }
      )
    }
    
    // Validate class type
    if (!Object.values(CLASS_TYPES).includes(finalClassType as any)) {
      return NextResponse.json(
        { success: false, error: 'Invalid class type' },
        { status: 400 }
      )
    }
    
    // For combined classes, subject_group_code is required
    if (isCombined && !subject_group_code) {
      return NextResponse.json(
        { success: false, error: 'Subject group code is required for combined classes' },
        { status: 400 }
      )
    }
    
    // Validate subject group code if provided
    if (isCombined && subject_group_code) {
      const validSubjectGroup = PREDEFINED_SUBJECT_GROUPS.find(sg => sg.code === subject_group_code)
      if (!validSubjectGroup) {
        return NextResponse.json(
          { success: false, error: 'Invalid subject group code' },
          { status: 400 }
        )
      }
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
    
    // Prepare metadata
    const metadata: any = {
      class_type: finalClassType,
      description: description || ''
    }
    
    if (isCombined && subject_group_code) {
      const subjectGroup = PREDEFINED_SUBJECT_GROUPS.find(sg => sg.code === subject_group_code)
      metadata.subject_group_code = subject_group_code
      metadata.subject_group_name = subjectGroup?.name
      metadata.subject_group_type = subjectGroup?.type
      metadata.subject_codes = subjectGroup?.subject_codes
      metadata.specialization_subjects = subjectGroup?.specialization_subjects
    }
    
        // Create new class
    console.log('Creating class with data:', {
      academic_year_id,
      grade_level_id,
      name,
      code,
      capacity: capacity || 30,
      room_number,
      is_combined: isCombined,
      metadata,
      created_by: user.id,
    })

    const { data, error } = await supabase
      .from('classes')
      .insert({
        academic_year_id,
        grade_level_id,
        name,
        code,
        capacity: capacity || 30,
        room_number,
        is_combined: isCombined,
        metadata,
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
        { success: false, error: 'Failed to create class: ' + error.message },
        { status: 500 }
      )
    }

    console.log('Class created successfully:', data)
    
    // Add subject group info to response
    let enrichedData = { ...data, class_type: finalClassType }
    if (isCombined && subject_group_code) {
      const subjectGroup = PREDEFINED_SUBJECT_GROUPS.find(sg => sg.code === subject_group_code)
      enrichedData.subject_group = subjectGroup || null
    }
    
    return NextResponse.json({
      success: true,
      data: enrichedData,
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