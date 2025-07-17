import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get homeroom teacher assignment for a class
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
    
    // Get current homeroom assignment
    const { data: assignment, error } = await supabase
      .from('homeroom_assignments')
      .select(`
        id,
        teacher_id,
        assigned_date,
        end_date,
        is_active,
        teacher:users!homeroom_assignments_teacher_id_fkey(
          id,
          full_name,
          phone,
          role
        )
      `)
      .eq('class_id', class_id)
      .eq('is_active', true)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching homeroom assignment:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch homeroom assignment' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ 
      success: true, 
      data: assignment || null 
    })
    
  } catch (error) {
    console.error('Error in homeroom teacher GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Assign homeroom teacher to class
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
    
    const body = await request.json()
    const { teacher_id, academic_year_id } = body
    
    if (!teacher_id || !academic_year_id) {
      return NextResponse.json(
        { success: false, error: 'teacher_id and academic_year_id are required' },
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
    
    // Validate academic year matches
    if (classData.academic_year_id !== academic_year_id) {
      return NextResponse.json(
        { success: false, error: 'Academic year mismatch' },
        { status: 400 }
      )
    }
    
    // Check if teacher exists and has appropriate role
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('id', teacher_id)
      .single()
    
    if (teacherError || !teacher) {
      return NextResponse.json(
        { success: false, error: 'Teacher not found' },
        { status: 404 }
      )
    }
    
    if (!['homeroom_teacher', 'subject_teacher', 'school_administrator'].includes(teacher.role)) {
      return NextResponse.json(
        { success: false, error: 'Teacher must have homeroom_teacher, subject_teacher, or school_administrator role' },
        { status: 400 }
      )
    }
    
    // Check if teacher already has homeroom assignment for this academic year
    const { data: existingAssignment, error: existingError } = await supabase
      .from('homeroom_assignments')
      .select('id, class_id')
      .eq('teacher_id', teacher_id)
      .eq('academic_year_id', academic_year_id)
      .eq('is_active', true)
      .single()
    
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing assignment:', existingError)
      return NextResponse.json(
        { success: false, error: 'Failed to check existing assignments' },
        { status: 500 }
      )
    }
    
    if (existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Teacher already assigned as homeroom teacher for another class this academic year' },
        { status: 409 }
      )
    }
    
    // Check if class already has homeroom teacher
    const { data: classAssignment, error: classAssignmentError } = await supabase
      .from('homeroom_assignments')
      .select('id, teacher_id')
      .eq('class_id', class_id)
      .eq('academic_year_id', academic_year_id)
      .eq('is_active', true)
      .single()
    
    if (classAssignmentError && classAssignmentError.code !== 'PGRST116') {
      console.error('Error checking class assignment:', classAssignmentError)
      return NextResponse.json(
        { success: false, error: 'Failed to check class assignments' },
        { status: 500 }
      )
    }
    
    if (classAssignment) {
      // End current assignment
      await supabase
        .from('homeroom_assignments')
        .update({ 
          is_active: false, 
          end_date: new Date().toISOString().split('T')[0] 
        })
        .eq('id', classAssignment.id)
    }
    
    // Create new homeroom assignment
    const { data: newAssignment, error: insertError } = await supabase
      .from('homeroom_assignments')
      .insert({
        teacher_id,
        class_id,
        academic_year_id,
        assigned_date: new Date().toISOString().split('T')[0],
        is_active: true,
        created_by: user.id
      })
      .select(`
        id,
        teacher_id,
        assigned_date,
        is_active,
        teacher:users!homeroom_assignments_teacher_id_fkey(
          id,
          full_name,
          phone,
          role
        )
      `)
      .single()
    
    if (insertError) {
      console.error('Error creating homeroom assignment:', insertError)
      return NextResponse.json(
        { success: false, error: 'Failed to create homeroom assignment' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: newAssignment,
      message: 'Homeroom teacher assigned successfully'
    })
    
  } catch (error) {
    console.error('Error in homeroom teacher POST:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove homeroom teacher assignment
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
    
    // Check if class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name')
      .eq('id', class_id)
      .single()
    
    if (classError || !classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }
    
    // Get current homeroom assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('homeroom_assignments')
      .select('id')
      .eq('class_id', class_id)
      .eq('is_active', true)
      .single()
    
    if (assignmentError) {
      if (assignmentError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'No active homeroom assignment found' },
          { status: 404 }
        )
      }
      console.error('Error fetching homeroom assignment:', assignmentError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch homeroom assignment' },
        { status: 500 }
      )
    }
    
    // Deactivate homeroom assignment
    const { error: updateError } = await supabase
      .from('homeroom_assignments')
      .update({ 
        is_active: false, 
        end_date: new Date().toISOString().split('T')[0] 
      })
      .eq('id', assignment.id)
    
    if (updateError) {
      console.error('Error removing homeroom assignment:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to remove homeroom assignment' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Homeroom teacher assignment removed successfully'
    })
    
  } catch (error) {
    console.error('Error in homeroom teacher DELETE:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 