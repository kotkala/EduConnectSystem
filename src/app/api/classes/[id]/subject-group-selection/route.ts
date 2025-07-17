import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PREDEFINED_SUBJECT_GROUPS } from '@/lib/constants/subject-groups'

// GET - Get subject group selections for students in a class
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
      .select(`
        id, name, code, academic_year_id, is_combined,
        academic_year:academic_years(id, name, is_current),
        grade_level:grade_levels(id, name, level)
      `)
      .eq('id', class_id)
      .single()
    
    if (classError || !classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }
    
    // Get students in this class with their subject group selections
    const { data: enrollments, error: enrollError } = await supabase
      .from('student_enrollments')
      .select(`
        id,
        student_id,
        enrollment_date,
        student:users(
          id,
          full_name,
          phone,
          gender,
          metadata
        )
      `)
      .eq('class_id', class_id)
      .eq('academic_year_id', classData.academic_year_id)
      .eq('is_active', true)
    
    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch students' },
        { status: 500 }
      )
    }
    
    // Process students with their subject group selections
    const studentsWithSelections = enrollments?.map((enrollment: any) => {
      const student = enrollment.student
      const subjectGroupCode = student?.metadata?.selected_subject_group_code
      const subjectGroup = subjectGroupCode 
        ? PREDEFINED_SUBJECT_GROUPS.find((sg: any) => sg.code === subjectGroupCode)
        : null
      
      return {
        enrollment_id: enrollment.id,
        student_id: student?.id,
        full_name: student?.full_name,
        phone: student?.phone,
        gender: student?.gender,
        enrollment_date: enrollment.enrollment_date,
        selected_subject_group: subjectGroup,
        has_selection: !!subjectGroup
      }
    }) || []
    
    // Get statistics
    const totalStudents = studentsWithSelections.length
    const studentsWithSelection = studentsWithSelections.filter(s => s.has_selection).length
    const studentsWithoutSelection = totalStudents - studentsWithSelection
    
    // Group by subject group
    const selectionsByGroup = PREDEFINED_SUBJECT_GROUPS.map((group: any) => {
      const students = studentsWithSelections.filter(s => 
        s.selected_subject_group?.code === group.code
      )
      return {
        subject_group: group,
        student_count: students.length,
        students: students
      }
    })
    
    return NextResponse.json({
      success: true,
      data: {
        class_info: classData,
        students: studentsWithSelections,
        statistics: {
          total_students: totalStudents,
          with_selection: studentsWithSelection,
          without_selection: studentsWithoutSelection
        },
        selections_by_group: selectionsByGroup,
        available_subject_groups: PREDEFINED_SUBJECT_GROUPS
      }
    })
  } catch (error) {
    console.error('Subject group selections GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Set subject group selections for students
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
    const { selections } = body
    
    // Validate input
    if (!selections || !Array.isArray(selections)) {
      return NextResponse.json(
        { success: false, error: 'Selections array is required' },
        { status: 400 }
      )
    }
    
    // Check if class exists
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, academic_year_id, is_combined')
      .eq('id', class_id)
      .single()
    
    if (classError || !classData) {
      return NextResponse.json(
        { success: false, error: 'Class not found' },
        { status: 404 }
      )
    }
    
    // Only allow selections for base classes (not combined classes)
    if (classData.is_combined) {
      return NextResponse.json(
        { success: false, error: 'Cannot set subject group selections for combined classes' },
        { status: 400 }
      )
    }
    
    // Validate selections format and subject group codes
    const validationErrors: string[] = []
    const validatedSelections: Array<{ student_id: string; subject_group_code: string | null }> = []
    
    for (const selection of selections) {
      if (!selection.student_id) {
        validationErrors.push('Student ID is required for each selection')
        continue
      }
      
             if (selection.subject_group_code) {
         const validGroup = PREDEFINED_SUBJECT_GROUPS.find((sg: any) => sg.code === selection.subject_group_code)
         if (!validGroup) {
           validationErrors.push(`Invalid subject group code: ${selection.subject_group_code}`)
           continue
         }
       }
      
      validatedSelections.push({
        student_id: selection.student_id,
        subject_group_code: selection.subject_group_code || null
      })
    }
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: validationErrors.join('; ') },
        { status: 400 }
      )
    }
    
    // Verify all students are enrolled in this class
    const studentIds = validatedSelections.map(s => s.student_id)
    const { data: enrollments, error: enrollError } = await supabase
      .from('student_enrollments')
      .select('student_id')
      .eq('class_id', class_id)
      .eq('academic_year_id', classData.academic_year_id)
      .eq('is_active', true)
      .in('student_id', studentIds)
    
    if (enrollError) {
      console.error('Error validating enrollments:', enrollError)
      return NextResponse.json(
        { success: false, error: 'Failed to validate student enrollments' },
        { status: 500 }
      )
    }
    
    const enrolledStudentIds = enrollments?.map(e => e.student_id) || []
    const invalidStudentIds = studentIds.filter(id => !enrolledStudentIds.includes(id))
    
    if (invalidStudentIds.length > 0) {
      return NextResponse.json(
        { success: false, error: `Students not enrolled in this class: ${invalidStudentIds.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Update student metadata with subject group selections
    const updatePromises = validatedSelections.map(async (selection) => {
      // First get current student metadata
      const { data: currentStudent } = await supabase
        .from('users')
        .select('metadata')
        .eq('id', selection.student_id)
        .eq('role', 'student')
        .single()
      
      // Merge new selection with existing metadata
      const currentMetadata = currentStudent?.metadata || {}
      const updatedMetadata = {
        ...currentMetadata,
        selected_subject_group_code: selection.subject_group_code
      }
      
      // If no subject group is selected, remove the field
      if (!selection.subject_group_code) {
        delete updatedMetadata.selected_subject_group_code
      }
      
      return await supabase
        .from('users')
        .update({ 
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', selection.student_id)
        .eq('role', 'student')
    })
    
    const results = await Promise.allSettled(updatePromises)
    
    // Check for errors
    const errors = results
      .map((result, index) => ({ result, index }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ result, index }) => `Student ${validatedSelections[index].student_id}: ${(result as PromiseRejectedResult).reason}`)
    
    if (errors.length > 0) {
      console.error('Error updating selections:', errors)
      return NextResponse.json(
        { success: false, error: `Failed to update some selections: ${errors.join('; ')}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated subject group selections for ${validatedSelections.length} students`,
      updated_count: validatedSelections.length
    })
  } catch (error) {
    console.error('Subject group selections POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 