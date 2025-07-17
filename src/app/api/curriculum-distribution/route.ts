import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Curriculum distribution based on Vietnamese THPT 2018 program
const DEFAULT_CURRICULUM = {
  // Mandatory subjects (8 subjects, 18 credits, 630 periods/year)
  mandatory: [
    { code: 'LIT', weekly_periods: 3, credits: 3 }, // Literature
    { code: 'MATH', weekly_periods: 3, credits: 3 }, // Mathematics  
    { code: 'ENG', weekly_periods: 3, credits: 3 }, // English
    { code: 'HIST', weekly_periods: 2, credits: 2 }, // History
    { code: 'NDSE', weekly_periods: 1, credits: 1 }, // National Defense & Security Education
    { code: 'EXPR', weekly_periods: 3, credits: 3 }, // Experiential Activities - Career Orientation
    { code: 'LOCAL', weekly_periods: 1, credits: 1 }, // Local Education
    { code: 'PE', weekly_periods: 2, credits: 2 } // Physical Education
  ],
  // Elective subjects (9 subjects, choose 4, 8 credits, 280 periods/year)
  elective: [
    { code: 'GEO', weekly_periods: 2, credits: 2 }, // Geography
    { code: 'ECON', weekly_periods: 2, credits: 2 }, // Economics & Law Education
    { code: 'PHYS', weekly_periods: 2, credits: 2 }, // Physics
    { code: 'CHEM', weekly_periods: 2, credits: 2 }, // Chemistry
    { code: 'BIO', weekly_periods: 2, credits: 2 }, // Biology
    { code: 'TECH', weekly_periods: 2, credits: 2 }, // Technology
    { code: 'CS', weekly_periods: 2, credits: 2 }, // Computer Science
    { code: 'MUSIC', weekly_periods: 2, credits: 2 }, // Music
    { code: 'ART', weekly_periods: 2, credits: 2 } // Fine Arts
  ]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const academic_term_id = searchParams.get('academic_term_id')
    const grade_level_id = searchParams.get('grade_level_id')
    const class_id = searchParams.get('class_id')
    const scope = searchParams.get('scope') || 'all' // 'school', 'grade', 'class', 'all'

    if (!academic_term_id) {
      return NextResponse.json({ 
        error: 'academic_term_id is required' 
      }, { status: 400 })
    }

    // Build query based on scope
    let query = supabase
      .from('subject_assignments')
      .select(`
        *,
        subject:subjects!subject_id(*),
        grade_level:grade_levels!grade_level_id(*),
        class:classes!class_id(*),
        academic_term:academic_terms!academic_term_id(*)
      `)
      .eq('academic_term_id', academic_term_id)

    // Apply filters based on scope
    if (scope === 'grade' && grade_level_id) {
      query = query.eq('grade_level_id', grade_level_id).is('class_id', null)
    } else if (scope === 'class' && class_id) {
      query = query.eq('class_id', class_id).is('grade_level_id', null)
    } else if (scope === 'school') {
      query = query.is('class_id', null).is('grade_level_id', null)
    }

    const { data: assignments, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching curriculum distribution:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Group by type and calculate totals
    const mandatory = assignments?.filter(a => a.type === 'mandatory') || []
    const elective = assignments?.filter(a => a.type === 'elective') || []

    const summary = {
      mandatory: {
        count: mandatory.length,
        total_periods: mandatory.reduce((sum, a) => sum + (a.weekly_periods || 0), 0),
        total_credits: mandatory.reduce((sum, a) => sum + (a.subject?.credits || 0), 0)
      },
      elective: {
        count: elective.length,
        total_periods: elective.reduce((sum, a) => sum + (a.weekly_periods || 0), 0),
        total_credits: elective.reduce((sum, a) => sum + (a.subject?.credits || 0), 0)
      }
    }

    return NextResponse.json({
      data: assignments,
      summary,
      scope,
      filters: {
        academic_term_id,
        grade_level_id,
        class_id
      }
    })

  } catch (error) {
    console.error('Error in curriculum distribution GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { 
      action,
      academic_term_id,
      grade_level_id,
      class_id,
      assignments
    } = body

    if (action === 'initialize_default') {
      return await initializeDefaultCurriculum(supabase, academic_term_id, grade_level_id)
    }

    if (action === 'apply_to_school') {
      return await applyToSchool(supabase, academic_term_id, assignments)
    }

    if (action === 'apply_to_grade') {
      return await applyToGrade(supabase, academic_term_id, grade_level_id, assignments)
    }

    if (action === 'apply_to_class') {
      return await applyToClass(supabase, academic_term_id, class_id, assignments)
    }

    // Regular create assignment
    const { 
      subject_id,
      type = 'mandatory',
      weekly_periods = 1
    } = body

    if (!academic_term_id || !subject_id) {
      return NextResponse.json({ 
        error: 'academic_term_id and subject_id are required' 
      }, { status: 400 })
    }

    // Check for existing assignment
    const existing = await checkExistingAssignment(supabase, {
      academic_term_id,
      subject_id,
      grade_level_id,
      class_id
    })

    if (existing) {
      return NextResponse.json({ 
        error: 'Assignment already exists for this subject in this scope' 
      }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('subject_assignments')
      .insert({
        academic_term_id,
        subject_id,
        grade_level_id,
        class_id,
        type,
        weekly_periods
      })
      .select(`
        *,
        subject:subjects!subject_id(*),
        grade_level:grade_levels!grade_level_id(*),
        class:classes!class_id(*)
      `)
      .single()

    if (error) {
      console.error('Error creating curriculum assignment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })

  } catch (error) {
    console.error('Error in curriculum distribution POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to initialize default curriculum for a grade level
async function initializeDefaultCurriculum(supabase: any, academic_term_id: string, grade_level_id?: string) {
  try {
    // Get all subjects
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')

    if (subjectsError) throw subjectsError

    const assignments = []

    // Create mandatory subject assignments
    for (const mandatorySubject of DEFAULT_CURRICULUM.mandatory) {
      const subject = subjects.find((s: any) => s.code === mandatorySubject.code)
      if (subject) {
        assignments.push({
          academic_term_id,
          subject_id: subject.id,
          grade_level_id,
          class_id: null,
          type: 'mandatory',
          weekly_periods: mandatorySubject.weekly_periods
        })
      }
    }

    // Insert assignments
    const { data, error } = await supabase
      .from('subject_assignments')
      .insert(assignments)
      .select()

    if (error) throw error

    return NextResponse.json({ 
      message: 'Default curriculum initialized successfully',
      count: data.length,
      data 
    }, { status: 201 })

  } catch (error) {
    console.error('Error initializing default curriculum:', error)
    return NextResponse.json({ error: 'Failed to initialize curriculum' }, { status: 500 })
  }
}

// Helper function to apply curriculum to entire school
async function applyToSchool(supabase: any, academic_term_id: string, assignments: any[]) {
  try {
    // Clear existing school-level assignments
    await supabase
      .from('subject_assignments')
      .delete()
      .eq('academic_term_id', academic_term_id)
      .is('grade_level_id', null)
      .is('class_id', null)

    // Insert new assignments
    const schoolAssignments = assignments.map(a => ({
      ...a,
      academic_term_id,
      grade_level_id: null,
      class_id: null
    }))

    const { data, error } = await supabase
      .from('subject_assignments')
      .insert(schoolAssignments)
      .select()

    if (error) throw error

    return NextResponse.json({ 
      message: 'Curriculum applied to school successfully',
      count: data.length,
      data 
    })

  } catch (error) {
    console.error('Error applying curriculum to school:', error)
    return NextResponse.json({ error: 'Failed to apply curriculum' }, { status: 500 })
  }
}

// Helper function to apply curriculum to specific grade
async function applyToGrade(supabase: any, academic_term_id: string, grade_level_id: string, assignments: any[]) {
  try {
    // Clear existing grade-level assignments
    await supabase
      .from('subject_assignments')
      .delete()
      .eq('academic_term_id', academic_term_id)
      .eq('grade_level_id', grade_level_id)
      .is('class_id', null)

    // Insert new assignments
    const gradeAssignments = assignments.map(a => ({
      ...a,
      academic_term_id,
      grade_level_id,
      class_id: null
    }))

    const { data, error } = await supabase
      .from('subject_assignments')
      .insert(gradeAssignments)
      .select()

    if (error) throw error

    return NextResponse.json({ 
      message: 'Curriculum applied to grade successfully',
      count: data.length,
      data 
    })

  } catch (error) {
    console.error('Error applying curriculum to grade:', error)
    return NextResponse.json({ error: 'Failed to apply curriculum' }, { status: 500 })
  }
}

// Helper function to apply curriculum to specific class
async function applyToClass(supabase: any, academic_term_id: string, class_id: string, assignments: any[]) {
  try {
    // Clear existing class-level assignments
    await supabase
      .from('subject_assignments')
      .delete()
      .eq('academic_term_id', academic_term_id)
      .eq('class_id', class_id)
      .is('grade_level_id', null)

    // Insert new assignments
    const classAssignments = assignments.map(a => ({
      ...a,
      academic_term_id,
      grade_level_id: null,
      class_id
    }))

    const { data, error } = await supabase
      .from('subject_assignments')
      .insert(classAssignments)
      .select()

    if (error) throw error

    return NextResponse.json({ 
      message: 'Curriculum applied to class successfully',
      count: data.length,
      data 
    })

  } catch (error) {
    console.error('Error applying curriculum to class:', error)
    return NextResponse.json({ error: 'Failed to apply curriculum' }, { status: 500 })
  }
}

// Helper function to check existing assignment
async function checkExistingAssignment(supabase: any, params: any) {
  const { academic_term_id, subject_id, grade_level_id, class_id } = params

  let query = supabase
    .from('subject_assignments')
    .select('id')
    .eq('academic_term_id', academic_term_id)
    .eq('subject_id', subject_id)

  if (grade_level_id) {
    query = query.eq('grade_level_id', grade_level_id).is('class_id', null)
  } else if (class_id) {
    query = query.eq('class_id', class_id).is('grade_level_id', null)
  } else {
    query = query.is('grade_level_id', null).is('class_id', null)
  }

  const { data } = await query.single()
  return data
} 