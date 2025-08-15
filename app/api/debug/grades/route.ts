import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check total grades in database
    const { data: allGrades, count: totalGrades } = await supabase
      .from('student_detailed_grades')
      .select('*', { count: 'exact' })
      .limit(10)

    // Check periods
    const { data: periods } = await supabase
      .from('grade_reporting_periods')
      .select('id, name, start_date, end_date')
      .limit(10)

    // Check classes
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .limit(10)

    // Check subjects
    const { data: subjects } = await supabase
      .from('subjects')
      .select('id, name_vietnamese, code')
      .limit(10)

    // Check students
    const { data: students } = await supabase
      .from('profiles')
      .select('id, full_name, student_id')
      .eq('role', 'student')
      .limit(10)

    return NextResponse.json({
      success: true,
      data: {
        totalGrades,
        sampleGrades: allGrades,
        periods,
        classes,
        subjects,
        students
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
