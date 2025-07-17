import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get students available for class enrollment
export async function GET(request: NextRequest) {
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const academic_year_id = searchParams.get('academic_year_id')
    const grade_level_id = searchParams.get('grade_level_id')
    const exclude_class_id = searchParams.get('exclude_class_id')
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '50')
    
    // Get current academic year if not specified
    let currentAcademicYear = academic_year_id
    if (!currentAcademicYear) {
      const { data: academicYear } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single()
      
      if (academicYear) {
        currentAcademicYear = academicYear.id
      }
    }
    
    // Build base query for students
    let query = supabase
      .from('users')
      .select(`
        id,
        full_name,
        phone,
        gender,
        date_of_birth,
        created_at
      `, { count: 'exact' })
      .eq('role', 'student')
      .eq('status', 'active')
    
    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
    }
    
    // Get students already enrolled in classes for current academic year
    const { data: enrolledStudents, error: enrolledError } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('academic_year_id', currentAcademicYear)
      .eq('is_active', true)
    
    if (enrolledError) {
      console.error('Error fetching enrolled students:', enrolledError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch enrolled students' },
        { status: 500 }
      )
    }
    
    // Exclude already enrolled students (except those from excluded class)
    const enrolledStudentIds = enrolledStudents?.map(e => e.student_id) || []
    
    if (exclude_class_id && enrolledStudentIds.length > 0) {
      // Get students from excluded class to include them back
      const { data: excludedClassStudents } = await supabase
        .from('student_enrollments')
        .select('student_id')
        .eq('class_id', exclude_class_id)
        .eq('academic_year_id', currentAcademicYear)
        .eq('is_active', true)
      
      const excludedStudentIds = excludedClassStudents?.map(e => e.student_id) || []
      const finalExcludedIds = enrolledStudentIds.filter(id => !excludedStudentIds.includes(id))
      
      if (finalExcludedIds.length > 0) {
        query = query.not('id', 'in', `(${finalExcludedIds.join(',')})`)
      }
    } else if (enrolledStudentIds.length > 0) {
      query = query.not('id', 'in', `(${enrolledStudentIds.join(',')})`)
    }
    
    // Apply sorting and pagination
    query = query.order('full_name', { ascending: true })
    
    const from = (page - 1) * per_page
    const to = from + per_page - 1
    query = query.range(from, to)
    
    const { data: students, error, count } = await query
    
    if (error) {
      console.error('Error fetching available students:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch available students' },
        { status: 500 }
      )
    }
    
    // Add enrollment status info
    const enrichedStudents = students?.map(student => ({
      ...student,
      is_available: true,
      enrollment_status: 'available'
    })) || []
    
    return NextResponse.json({
      success: true,
      data: enrichedStudents,
      pagination: {
        page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page)
      },
      filters: {
        academic_year_id: currentAcademicYear,
        grade_level_id,
        exclude_class_id,
        search
      }
    })
    
  } catch (error) {
    console.error('Error in available students GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 