import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get students in a class
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id: class_id } = await params
    
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
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '50')
    
    // Check if class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, code, academic_year_id')
      .eq('id', class_id)
      .single()
    
    if (classError || !classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }
    
    // Build query for students in this class
    let query = supabase
      .from('student_enrollments')
      .select(`
        id,
        enrollment_date,
        is_active,
        student:users(
          id,
          full_name,
          phone,
          gender,
          date_of_birth,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('class_id', class_id)
      .eq('academic_year_id', classData.academic_year_id)
      .eq('is_active', true)
    
    // Apply search filter
    if (search) {
      const { data: searchResults } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'student')
        .or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`)
      
      if (searchResults && searchResults.length > 0) {
        const studentIds = searchResults.map(s => s.id)
        query = query.in('student_id', studentIds)
      } else {
        // No matching students found
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, per_page, total: 0, total_pages: 0 },
          class_info: classData
        })
      }
    }
    
    // Apply pagination
    const from = (page - 1) * per_page
    const to = from + per_page - 1
    query = query.range(from, to)
    
    const { data, error, count } = await query
    
    if (error) {
      console.error('Error fetching students:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch students' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: data || [],
      pagination: {
        page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page),
      },
      class_info: classData
    })
  } catch (error) {
    console.error('Students GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Import students into class
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id: class_id } = await params
    
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
    const { student_ids, enrollment_date } = body
    
    // Validate input
    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student IDs array is required' },
        { status: 400 }
      )
    }
    
    // Check if class exists and get its academic year
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, code, academic_year_id, capacity')
      .eq('id', class_id)
      .single()
    
    if (classError || !classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }
    
    // Check current enrollment count
    const { count: currentCount } = await supabase
      .from('student_enrollments')
      .select('id', { count: 'exact' })
      .eq('class_id', class_id)
      .eq('academic_year_id', classData.academic_year_id)
      .eq('is_active', true)
    
    // Check capacity
    const newTotal = (currentCount || 0) + student_ids.length
    if (newTotal > classData.capacity) {
      return NextResponse.json(
        { success: false, error: `Cannot enroll ${student_ids.length} students. Class capacity: ${classData.capacity}, current enrollment: ${currentCount || 0}` },
        { status: 400 }
      )
    }
    
    // Validate that all student IDs exist and are students
    const { data: students, error: studentsError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .in('id', student_ids)
      .eq('role', 'student')
    
    if (studentsError) {
      console.error('Error validating students:', studentsError)
      return NextResponse.json(
        { success: false, error: 'Failed to validate students' },
        { status: 500 }
      )
    }
    
    if (!students || students.length !== student_ids.length) {
      const validIds = students?.map(s => s.id) || []
      const invalidIds = student_ids.filter(id => !validIds.includes(id))
      return NextResponse.json(
        { success: false, error: `Invalid student IDs: ${invalidIds.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Check for existing enrollments in this academic year
    const { data: existingEnrollments } = await supabase
      .from('student_enrollments')
      .select('student_id, class_id')
      .in('student_id', student_ids)
      .eq('academic_year_id', classData.academic_year_id)
      .eq('is_active', true)
    
    if (existingEnrollments && existingEnrollments.length > 0) {
      const alreadyEnrolled = existingEnrollments.map(e => {
        const student = students.find(s => s.id === e.student_id)
        return `${student?.full_name} (already in class)`
      })
      return NextResponse.json(
        { success: false, error: `Students already enrolled in this academic year: ${alreadyEnrolled.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Prepare enrollment data
    const enrollmentData = student_ids.map(student_id => ({
      student_id,
      class_id,
      academic_year_id: classData.academic_year_id,
      enrollment_date: enrollment_date || new Date().toISOString().split('T')[0],
      is_active: true
    }))
    
    // Insert enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('student_enrollments')
      .insert(enrollmentData)
      .select(`
        id,
        enrollment_date,
        student:users!student_id(
          id,
          full_name,
          phone,
          gender
        )
      `)
    
    if (enrollError) {
      console.error('Error creating enrollments:', enrollError)
      return NextResponse.json(
        { success: false, error: 'Failed to enroll students' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: enrollments,
      message: `Successfully enrolled ${student_ids.length} students into ${classData.name}`,
      class_info: classData
    })
  } catch (error) {
    console.error('Students POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove students from class
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id: class_id } = await params
    
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
    const { student_ids } = body
    
    // Validate input
    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Student IDs array is required' },
        { status: 400 }
      )
    }
    
    // Check if class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, academic_year_id')
      .eq('id', class_id)
      .single()
    
    if (classError || !classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }
    
    // Remove students from class (set is_active to false)
    const { data, error } = await supabase
      .from('student_enrollments')
      .update({ 
        is_active: false,
        withdrawal_date: new Date().toISOString().split('T')[0]
      })
      .eq('class_id', class_id)
      .eq('academic_year_id', classData.academic_year_id)
      .in('student_id', student_ids)
      .select(`
        id,
        student:users!student_id(
          id,
          full_name
        )
      `)
    
    if (error) {
      console.error('Error removing students:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to remove students' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: `Successfully removed ${student_ids.length} students from ${classData.name}`
    })
  } catch (error) {
    console.error('Students DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 