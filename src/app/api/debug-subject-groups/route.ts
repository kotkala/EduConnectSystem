import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PREDEFINED_SUBJECT_GROUPS } from '@/lib/constants/subject-groups'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'debug'
    
    if (action === 'debug') {
      return await debugSubjectGroupSelections(supabase)
    } else if (action === 'fix') {
      return await fixStudentSubjectGroup(supabase, request)
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

async function debugSubjectGroupSelections(supabase: any) {
  console.log('=== DEBUGGING SUBJECT GROUP SELECTIONS ===')
  
  // Get all students in the academic year
  const { data: enrollments, error: enrollError } = await supabase
    .from('student_enrollments')
    .select(`
      id,
      student_id,
      class_id,
      academic_year_id,
      student:users(
        id,
        full_name,
        phone,
        metadata
      ),
      class:classes!class_id(
        id,
        name,
        code,
        is_combined,
        grade_level_id
      )
    `)
    .eq('academic_year_id', 'fb68bb4c-0750-4669-86a1-22cd00b8e893')
    .eq('is_active', true)

  if (enrollError) {
    console.error('Error fetching enrollments:', enrollError)
    return NextResponse.json({ success: false, error: 'Failed to fetch enrollments' }, { status: 500 })
  }

  // Filter by grade level (Lớp 12)
  const grade12Students = enrollments?.filter((enrollment: any) => {
    return enrollment.class?.grade_level_id === '7882db51-2e72-44fe-bc89-1394986e607f'
  }) || []

  // Analyze each student's metadata
  const studentAnalysis = grade12Students.map((enrollment: any, index: number) => {
    const student = enrollment.student
    const classInfo = enrollment.class
    
    // Extract subject group code
    const metadata = student?.metadata || {}
    let selectedGroupCode = null
    
    if (metadata.selected_subject_group_code) {
      selectedGroupCode = metadata.selected_subject_group_code
    } else if (typeof metadata === 'string') {
      try {
        const parsedMetadata = JSON.parse(metadata)
        selectedGroupCode = parsedMetadata.selected_subject_group_code
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    return {
      index: index + 1,
      student_id: student?.id,
      student_name: student?.full_name,
      class_name: classInfo?.name,
      class_is_combined: classInfo?.is_combined,
      raw_metadata: metadata,
      selected_subject_group_code: selectedGroupCode,
      is_nguyen_van_a: student?.full_name?.includes('Nguyễn Văn A'),
      expected_khxh3: selectedGroupCode === 'KHXH3'
    }
  })

  // Check available subject groups
  const availableGroups = PREDEFINED_SUBJECT_GROUPS.map(group => ({
    code: group.code,
    name: group.name,
    type: group.type
  }))

  return NextResponse.json({
    success: true,
    data: {
      total_enrollments: enrollments?.length || 0,
      grade_12_students: grade12Students.length,
      student_analysis: studentAnalysis,
      available_subject_groups: availableGroups,
      summary: {
        students_with_selections: studentAnalysis.filter((s: any) => s.selected_subject_group_code).length,
        students_without_selections: studentAnalysis.filter((s: any) => !s.selected_subject_group_code).length,
        students_with_khxh3: studentAnalysis.filter((s: any) => s.selected_subject_group_code === 'KHXH3').length,
        nguyen_van_a_found: studentAnalysis.filter((s: any) => s.is_nguyen_van_a).length > 0
      }
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { student_id, subject_group_code } = body
    
    if (!student_id || !subject_group_code) {
      return NextResponse.json({ 
        success: false, 
        error: 'student_id and subject_group_code are required' 
      }, { status: 400 })
    }
    
    // Validate subject group code
    const validGroup = PREDEFINED_SUBJECT_GROUPS.find(group => group.code === subject_group_code)
    if (!validGroup) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid subject group code' 
      }, { status: 400 })
    }
    
    // Get current student data
    const { data: currentStudent, error: fetchError } = await supabase
      .from('users')
      .select('id, full_name, metadata')
      .eq('id', student_id)
      .eq('role', 'student')
      .single()
    
    if (fetchError || !currentStudent) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found' 
      }, { status: 404 })
    }
    
    // Update metadata
    const updatedMetadata = {
      ...currentStudent.metadata,
      selected_subject_group_code: subject_group_code
    }
    
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({ 
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', student_id)
      .select()
    
    if (updateError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update student: ' + updateError.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      data: {
        student: currentStudent,
        updated_metadata: updatedMetadata,
        subject_group: validGroup
      },
      message: `Successfully updated ${currentStudent.full_name} to subject group ${subject_group_code}`
    })
    
  } catch (error) {
    console.error('Fix API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

async function fixStudentSubjectGroup(supabase: any, request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const student_name = searchParams.get('student_name') || 'Nguyễn Văn A'
  const subject_group_code = searchParams.get('subject_group_code') || 'KHXH3'
  
  // Find student by name
  const { data: students, error: studentError } = await supabase
    .from('users')
    .select('id, full_name, metadata')
    .eq('role', 'student')
    .ilike('full_name', `%${student_name}%`)

  if (studentError) {
    return NextResponse.json({ 
      success: false, 
      error: 'Error finding student: ' + studentError.message 
    }, { status: 500 })
  }

  if (!students || students.length === 0) {
    return NextResponse.json({ 
      success: false, 
      error: `Student "${student_name}" not found` 
    }, { status: 404 })
  }

  const student = students[0]
  
  // Update metadata
  const updatedMetadata = {
    ...student.metadata,
    selected_subject_group_code: subject_group_code
  }

  const { data: updateResult, error: updateError } = await supabase
    .from('users')
    .update({ 
      metadata: updatedMetadata,
      updated_at: new Date().toISOString()
    })
    .eq('id', student.id)
    .select()

  if (updateError) {
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update student: ' + updateError.message 
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    data: {
      student: student,
      old_metadata: student.metadata,
      new_metadata: updatedMetadata,
      update_result: updateResult
    },
    message: `Successfully updated ${student.full_name} to subject group ${subject_group_code}`
  })
} 