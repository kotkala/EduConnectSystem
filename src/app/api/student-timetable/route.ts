import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is a student
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Student access required' }, { status: 403 })
    }

    // ✅ FIXED: Remove non-existent columns and simplify query
    const { data: classAssignments, error: classError } = await supabase
      .from('class_assignments')
      .select(`
        class_id,
        assignment_type,
        classes!inner(
          id,
          name
        )
      `)
      .eq('user_id', user.id)
      .in('assignment_type', ['student', 'main']) // Support both new and legacy types
      .eq('is_active', true)

    if (classError) {
      console.error('Error fetching class assignments:', classError)
      return NextResponse.json({
        success: false,
        error: 'Error fetching student class assignments'
      }, { status: 500 })
    }

    if (!classAssignments || classAssignments.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Student class assignment not found. Please contact your administrator to assign you to a class.'
      }, { status: 404 })
    }

    // Return student's class info for timetable filtering
    // Prefer 'student' type assignments over 'main' type (legacy)
    const preferredAssignment = classAssignments.find(a => a.assignment_type === 'student') || classAssignments[0]
    const classInfo = Array.isArray(preferredAssignment.classes) ? preferredAssignment.classes[0] : preferredAssignment.classes

    return NextResponse.json({
      success: true,
      data: {
        class_id: preferredAssignment.class_id,
        class_info: classInfo
      }
    })
  } catch (error) {
    console.error('Error in student timetable API:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
