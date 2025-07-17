import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - List student violations with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Query parameters
    const student_id = searchParams.get('student_id')
    const class_id = searchParams.get('class_id')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '20')
    const search = searchParams.get('search')

    // Build query
    let query = supabase
      .from('student_violations')
      .select(`
        *,
        student:users!student_id(id, full_name, phone),
        violation_rule:violation_rules!violation_rule_id(id, code, name, description, severity, category),
        class:classes!class_id(id, name, code),
        reporter:users!reported_by(id, full_name)
      `)
      .order('violation_date', { ascending: false })

    // Apply filters
    if (student_id) {
      query = query.eq('student_id', student_id)
    }
    if (class_id) {
      query = query.eq('class_id', class_id)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('student_violations')
      .select('*', { count: 'exact', head: true })

    // Apply pagination
    const from = (page - 1) * per_page
    const to = from + per_page - 1
    query = query.range(from, to)

    const { data: violations, error } = await query

    if (error) {
      console.error('Error fetching violations:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch violations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: violations,
      pagination: {
        page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page)
      }
    })
  } catch (error) {
    console.error('Violations GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new student violation
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

    // Check if user is school_administrator
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'school_administrator') {
      return NextResponse.json(
        { success: false, error: 'Only school administrators can record violations' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      student_id,
      violation_rule_id,
      class_id,
      violation_date,
      violation_time,
      location,
      description,
      witnesses,
      evidence
    } = body

    // Validate required fields
    if (!student_id || !violation_rule_id || !description) {
      return NextResponse.json(
        { success: false, error: 'Student, violation rule, and description are required' },
        { status: 400 }
      )
    }

    // Verify student exists and is enrolled
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', student_id)
      .eq('role', 'student')
      .single()

    if (studentError || !student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      )
    }

    // Verify violation rule exists
    const { data: violationRule, error: ruleError } = await supabase
      .from('violation_rules')
      .select('id, code, name, severity')
      .eq('id', violation_rule_id)
      .eq('is_active', true)
      .single()

    if (ruleError || !violationRule) {
      return NextResponse.json(
        { success: false, error: 'Violation rule not found' },
        { status: 404 }
      )
    }

    // Create violation record
    const { data: violation, error: violationError } = await supabase
      .from('student_violations')
      .insert({
        student_id,
        violation_rule_id,
        class_id,
        violation_date: violation_date || new Date().toISOString().split('T')[0],
        violation_time: violation_time || new Date().toTimeString().split(' ')[0],
        location,
        description,
        witnesses: witnesses || [],
        evidence: evidence || [],
        reported_by: user.id,
        status: 'reported'
      })
      .select(`
        *,
        student:users!student_id(id, full_name, phone),
        violation_rule:violation_rules!violation_rule_id(id, code, name, description, severity, category),
        class:classes!class_id(id, name, code),
        reporter:users!reported_by(id, full_name)
      `)
      .single()

    if (violationError) {
      console.error('Error creating violation:', violationError)
      return NextResponse.json(
        { success: false, error: 'Failed to create violation record' },
        { status: 500 }
      )
    }

    // Get homeroom teacher for notification
    if (class_id) {
      const { data: homeroomAssignment } = await supabase
        .from('homeroom_assignments')
        .select(`
          teacher_id,
          teacher:users!teacher_id(id, full_name)
        `)
        .eq('class_id', class_id)
        .eq('is_active', true)
        .single()

      // Send notification to homeroom teacher
      if (homeroomAssignment) {
        await supabase
          .from('notifications')
          .insert({
            sender_id: user.id,
            recipient_id: homeroomAssignment.teacher_id,
            type: 'behavior',
            title: 'Thông báo vi phạm học sinh',
            content: `Học sinh ${student.full_name} đã có vi phạm: ${violationRule.name}. Chi tiết: ${description}`,
            metadata: {
              violation_id: violation.id,
              student_id: student_id,
              violation_rule_id: violation_rule_id,
              severity: violationRule.severity
            }
          })
      }
    }

    return NextResponse.json({
      success: true,
      data: violation,
      message: 'Violation recorded successfully'
    })
  } catch (error) {
    console.error('Violations POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 