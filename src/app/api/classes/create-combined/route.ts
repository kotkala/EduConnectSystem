import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PREDEFINED_SUBJECT_GROUPS } from '@/lib/constants/subject-groups'

// Utility function to shuffle array (for random distribution)
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Utility function to distribute students into groups of max 35
function distributeStudents(students: any[], maxPerClass: number = 35): any[][] {
  if (students.length === 0) return []
  
  const shuffledStudents = shuffleArray(students)
  const groups: any[][] = []
  
  for (let i = 0; i < shuffledStudents.length; i += maxPerClass) {
    groups.push(shuffledStudents.slice(i, i + maxPerClass))
  }
  
  return groups
}

// POST - Create combined classes based on subject group selections
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
      subject_group_code,
      class_name_prefix,
      max_students_per_class,
      source_class_ids // Optional: specific classes to pull students from
    } = body
    
    console.log('=== COMBINED CLASS CREATION REQUEST ===')
    console.log('Body:', JSON.stringify(body, null, 2))
    
    // Validate required fields
    if (!academic_year_id || !grade_level_id || !subject_group_code) {
      return NextResponse.json(
        { success: false, error: 'Academic year, grade level, and subject group are required' },
        { status: 400 }
      )
    }
    
    // Validate subject group
    const subjectGroup = PREDEFINED_SUBJECT_GROUPS.find((sg: any) => sg.code === subject_group_code)
    if (!subjectGroup) {
      return NextResponse.json(
        { success: false, error: 'Invalid subject group code' },
        { status: 400 }
      )
    }
    
    console.log('Selected subject group:', JSON.stringify(subjectGroup, null, 2))
    
    // Validate academic year and grade level
    const [academicYearResult, gradeLevelResult] = await Promise.all([
      supabase.from('academic_years').select('id, name').eq('id', academic_year_id).single(),
      supabase.from('grade_levels').select('id, name, level').eq('id', grade_level_id).single()
    ])
    
    if (academicYearResult.error || !academicYearResult.data) {
      return NextResponse.json(
        { success: false, error: 'Invalid academic year' },
        { status: 400 }
      )
    }
    
    if (gradeLevelResult.error || !gradeLevelResult.data) {
      return NextResponse.json(
        { success: false, error: 'Invalid grade level' },
        { status: 400 }
      )
    }
    
    const academicYear = academicYearResult.data
    const gradeLevel = gradeLevelResult.data
    const maxPerClass = max_students_per_class || 35
    
    console.log('Academic Year:', academicYear)
    console.log('Grade Level:', gradeLevel)
    
    // Get all students who selected this subject group
    let studentsQuery = supabase
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
          gender,
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
      .eq('academic_year_id', academic_year_id)
      .eq('is_active', true)
    
    // Filter by source classes if specified
    if (source_class_ids && Array.isArray(source_class_ids) && source_class_ids.length > 0) {
      studentsQuery = studentsQuery.in('class_id', source_class_ids)
      console.log('Filtering by source_class_ids:', source_class_ids)
    }
    
    // Also filter by grade level through the class relationship
    const { data: enrollments, error: enrollError } = await studentsQuery
    
    if (enrollError) {
      console.error('Error fetching students:', enrollError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch students' },
        { status: 500 }
      )
    }
    
    console.log(`=== RAW ENROLLMENT DATA ===`)
    console.log(`Total enrollments found: ${enrollments?.length || 0}`)
    
    // Filter by grade level first
    const enrollmentsInGrade = enrollments?.filter((enrollment: any) => {
      const classInfo = enrollment.class
      return classInfo?.grade_level_id === grade_level_id
    }) || []
    
    console.log(`Enrollments in grade ${gradeLevel.level}: ${enrollmentsInGrade.length}`)
    
    // Log all students and their metadata for debugging
    enrollmentsInGrade.forEach((enrollment: any, index: number) => {
      const student = enrollment.student
      const classInfo = enrollment.class
      console.log(`\n--- Student ${index + 1} ---`)
      console.log(`Name: ${student?.full_name}`)
      console.log(`Class: ${classInfo?.name} (Combined: ${classInfo?.is_combined})`)
      console.log(`Full metadata:`, JSON.stringify(student?.metadata, null, 2))
      console.log(`Selected subject group code: ${student?.metadata?.selected_subject_group_code}`)
      console.log(`Target subject group: ${subject_group_code}`)
      console.log(`Match: ${student?.metadata?.selected_subject_group_code === subject_group_code}`)
    })
    
    // Filter students who selected the specified subject group and are in base classes
    const eligibleStudents = enrollmentsInGrade.filter((enrollment: any) => {
      const student = enrollment.student
      const classInfo = enrollment.class
      
      // Try multiple ways to access the selected subject group code
      const metadata = student?.metadata || {}
      let selectedGroupCode = null
      
      // Method 1: Direct access
      if (metadata.selected_subject_group_code) {
        selectedGroupCode = metadata.selected_subject_group_code
      }
      // Method 2: Check if metadata is stringified
      else if (typeof metadata === 'string') {
        try {
          const parsedMetadata = JSON.parse(metadata)
          selectedGroupCode = parsedMetadata.selected_subject_group_code
        } catch (e) {
          // Ignore parse errors
        }
      }
      // Method 3: Check alternative field names
      else if (metadata.subject_group_code) {
        selectedGroupCode = metadata.subject_group_code
      }
      else if (metadata.subjectGroupCode) {
        selectedGroupCode = metadata.subjectGroupCode
      }
      
      const hasSubjectGroup = selectedGroupCode === subject_group_code
      const isBaseClass = !classInfo?.is_combined
      
      console.log(`\n=== ELIGIBILITY CHECK ===`)
      console.log(`Student: ${student?.full_name}`)
      console.log(`- Raw metadata:`, metadata)
      console.log(`- Extracted subject group code: ${selectedGroupCode}`)
      console.log(`- Target subject group: ${subject_group_code}`)
      console.log(`- Has correct subject group: ${hasSubjectGroup}`)
      console.log(`- Class: ${classInfo?.name}`)
      console.log(`- Is combined class: ${classInfo?.is_combined}`)
      console.log(`- Is base class: ${isBaseClass}`)
      console.log(`- ELIGIBLE: ${hasSubjectGroup && isBaseClass}`)
      
      return hasSubjectGroup && isBaseClass
    })
    
    console.log(`\n=== FINAL RESULTS ===`)
    console.log(`Total enrollments: ${enrollments?.length || 0}`)
    console.log(`Enrollments in target grade: ${enrollmentsInGrade.length}`)
    console.log(`Eligible students: ${eligibleStudents.length}`)
    
    if (eligibleStudents.length > 0) {
      console.log('Eligible students details:')
      eligibleStudents.forEach((e: any, index: number) => {
        console.log(`  ${index + 1}. ${e.student?.full_name} - Class: ${e.class?.name} - Group: ${e.student?.metadata?.selected_subject_group_code}`)
      })
    }
    
    if (eligibleStudents.length === 0) {
      // For testing purposes, create a combined class without students
      // This allows users to create the class structure first, then add students later
      console.log('No eligible students found. Creating empty combined class for testing.')
      
      const className = class_name_prefix 
        ? `${class_name_prefix}-1`
        : `${subject_group_code}-${gradeLevel.level}-1`
      const classCode = `${subject_group_code}-${academicYear.name.replace(/\s+/g, '')}-1`
      
      // Create empty combined class
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({
          academic_year_id,
          grade_level_id,
          name: className,
          code: classCode,
          capacity: maxPerClass,
          is_combined: true,
          metadata: {
            class_type: 'combined_class',
            subject_group_code: subject_group_code,
            subject_group_name: subjectGroup.name,
            subject_group_type: subjectGroup.type,
            subject_codes: subjectGroup.subject_codes,
            specialization_subjects: subjectGroup.specialization_subjects,
            created_from_selection: true,
            created_empty: true // Flag to indicate this was created without students
          },
          created_by: user.id
        })
        .select(`
          *,
          academic_year:academic_years(id, name),
          grade_level:grade_levels(id, name, level)
        `)
        .single()
      
      if (classError) {
        console.error('Error creating empty combined class:', classError)
        return NextResponse.json(
          { success: false, error: 'Failed to create combined class: ' + classError.message },
          { status: 500 }
        )
      }
      
      console.log('Empty combined class created successfully:', newClass)
      
      return NextResponse.json({
        success: true,
        data: {
          created_classes: [newClass],
          enrollment_results: [],
          summary: {
            total_classes_created: 1,
            total_students_enrolled: 0,
            message: 'Combined class created successfully. You can add students later through the class management interface.'
          }
        },
        message: 'Combined class created successfully (empty - add students later)'
      })
    }
    
    // Distribute students into groups
    const studentGroups = distributeStudents(eligibleStudents, maxPerClass)
    const createdClasses: any[] = []
    const enrollmentResults: any[] = []
    
    // Create combined classes and enroll students
    for (let i = 0; i < studentGroups.length; i++) {
      const group = studentGroups[i]
      const classNumber = i + 1
      const className = class_name_prefix 
        ? `${class_name_prefix}-${classNumber}`
        : `${subject_group_code}-${gradeLevel.level}-${classNumber}`
      const classCode = `${subject_group_code}-${academicYear.name.replace(/\s+/g, '')}-${classNumber}`
      
      console.log(`Creating combined class ${classNumber}: ${className}`)
      
      // Create combined class
      const { data: newClass, error: classError } = await supabase
        .from('classes')
        .insert({
          academic_year_id,
          grade_level_id,
          name: className,
          code: classCode,
          capacity: maxPerClass,
          is_combined: true,
          metadata: {
            class_type: 'combined_class',
            subject_group_code: subject_group_code,
            subject_group_name: subjectGroup.name,
            subject_group_type: subjectGroup.type,
            subject_codes: subjectGroup.subject_codes,
            specialization_subjects: subjectGroup.specialization_subjects,
            created_from_selection: true,
            source_classes: group.map((s: any) => s.class_id)
          },
          created_by: user.id
        })
        .select(`
          *,
          academic_year:academic_years(id, name),
          grade_level:grade_levels(id, name, level)
        `)
        .single()
      
      if (classError) {
        console.error('Error creating combined class:', classError)
        // Continue with next group, don't fail entire operation
        continue
      }
      
      createdClasses.push(newClass)
      
      // Create new enrollments for the combined class (keeping students in both base and combined classes)
      const enrollmentData = group.map((enrollment: any) => ({
        student_id: enrollment.student_id,
        class_id: newClass.id,
        academic_year_id,
        enrollment_date: new Date().toISOString().split('T')[0],
        is_active: true
      }))
      
      console.log(`Adding ${enrollmentData.length} students to combined class ${className}`)
      console.log(`Students will remain in their base classes and also join the combined class`)
      
      const { data: enrollments, error: enrollError } = await supabase
        .from('student_enrollments')
        .insert(enrollmentData)
        .select(`
          id,
          enrollment_date,
          student:users(
            id,
            full_name,
            phone
          )
        `)
      
      if (enrollError) {
        console.error('Error creating combined class enrollments:', enrollError)
        // Rollback: delete the class if enrollment creation failed
        await supabase.from('classes').delete().eq('id', newClass.id)
        continue
      }
      
      enrollmentResults.push({
        class: newClass,
        enrollments: enrollments,
        student_count: group.length
      })
    }
    
    if (createdClasses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Failed to create any combined classes' },
        { status: 500 }
      )
    }
    
    // Summary statistics
    const totalStudentsEnrolled = enrollmentResults.reduce((sum, result) => sum + result.student_count, 0)
    
    console.log(`=== SUCCESS SUMMARY ===`)
    console.log(`Created ${createdClasses.length} combined classes`)
    console.log(`Enrolled ${totalStudentsEnrolled} students total`)
    
    return NextResponse.json({
      success: true,
      data: {
        created_classes: createdClasses,
        enrollment_results: enrollmentResults,
        statistics: {
          total_classes_created: createdClasses.length,
          total_students_enrolled: totalStudentsEnrolled,
          subject_group: subjectGroup,
          academic_year: academicYear,
          grade_level: gradeLevel
        }
      },
      message: `Successfully created ${createdClasses.length} combined classes for ${subject_group_code} with ${totalStudentsEnrolled} students`
    })
  } catch (error) {
    console.error('Create combined classes error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 

// GET - Get student subject group statistics for combined class creation preview
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user - authentication required
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const { searchParams } = new URL(request.url)
    const academic_year_id = searchParams.get('academic_year_id')
    const grade_level_id = searchParams.get('grade_level_id')
    const subject_group_code = searchParams.get('subject_group_code')
    
    if (!academic_year_id) {
      return NextResponse.json(
        { success: false, error: 'academic_year_id is required' },
        { status: 400 }
      )
    }
    
    console.log('=== GET STUDENT STATISTICS REQUEST ===')
    console.log('Params:', { academic_year_id, grade_level_id, subject_group_code })
    
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
          gender,
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
      .eq('academic_year_id', academic_year_id)
      .eq('is_active', true)
    
    if (enrollError) {
      console.error('Error fetching enrollments:', enrollError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch students' },
        { status: 500 }
      )
    }
    
    console.log(`Total enrollments found: ${enrollments?.length || 0}`)
    
    // Filter by grade level if specified
    let filteredEnrollments = enrollments || []
    if (grade_level_id) {
      filteredEnrollments = filteredEnrollments.filter((enrollment: any) => {
        return enrollment.class?.grade_level_id === grade_level_id
      })
    }
    
    console.log(`Enrollments after grade filter: ${filteredEnrollments.length}`)
    
    // Process student data
    const processedStudents = filteredEnrollments.map((enrollment: any) => {
      const student = enrollment.student
      const classInfo = enrollment.class
      const metadata = student?.metadata || {}
      
      // Extract subject group code using multiple methods
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
      } else if (metadata.subject_group_code) {
        selectedGroupCode = metadata.subject_group_code
      } else if (metadata.subjectGroupCode) {
        selectedGroupCode = metadata.subjectGroupCode
      }
      
      return {
        enrollment_id: enrollment.id,
        student_id: student?.id,
        student_name: student?.full_name,
        class_name: classInfo?.name,
        class_is_combined: classInfo?.is_combined,
        class_grade_level_id: classInfo?.grade_level_id,
        selected_subject_group_code: selectedGroupCode,
        is_eligible_for_combined: !classInfo?.is_combined && !!selectedGroupCode
      }
    })
    
    // Calculate statistics
    const totalStudents = processedStudents.length
    const studentsWithSelections = processedStudents.filter((s: any) => s.selected_subject_group_code).length
    const studentsWithoutSelections = totalStudents - studentsWithSelections
    
    // Group students by subject group
    const subjectGroupCounts = processedStudents
      .filter((s: any) => s.selected_subject_group_code)
      .reduce((acc: any, student: any) => {
        const group = student.selected_subject_group_code
        acc[group] = (acc[group] || 0) + 1
        return acc
      }, {})
    
    console.log('Subject group distribution:', subjectGroupCounts)
    
    // Create selections by group array with full subject group info
    const selectionsByGroup = PREDEFINED_SUBJECT_GROUPS.map((group: any) => ({
      subject_group: group,
      student_count: subjectGroupCounts[group.code] || 0
    }))
    
    console.log('Selections by group:', selectionsByGroup.map(g => `${g.subject_group.code}: ${g.student_count}`))
    
    // Return data in the format expected by the UI
    return NextResponse.json({
      success: true,
      data: {
        total_students: totalStudents,
        with_selection: studentsWithSelections,
        without_selection: studentsWithoutSelections,
        selections_by_group: selectionsByGroup,
        // Debug info
        debug_info: {
          filters: {
            academic_year_id,
            grade_level_id,
            subject_group_code
          },
          subject_group_distribution: subjectGroupCounts,
          student_details: processedStudents.map((s: any) => ({
            name: s.student_name,
            class: s.class_name,
            selected_group: s.selected_subject_group_code
          }))
        }
      }
    })
  } catch (error) {
    console.error('GET student statistics error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 