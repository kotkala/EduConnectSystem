import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Initialize current academic year
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
    
    // Get current date and determine academic year
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1 // JavaScript months are 0-indexed
    
    // Academic year typically starts in September
    // If current month is Sep-Dec, academic year is current year - next year
    // If current month is Jan-Aug, academic year is previous year - current year
    let academicYearStart: number
    let academicYearEnd: number
    
    if (currentMonth >= 9) {
      academicYearStart = currentYear
      academicYearEnd = currentYear + 1
    } else {
      academicYearStart = currentYear - 1
      academicYearEnd = currentYear
    }
    
    const academicYearName = `${academicYearStart}-${academicYearEnd}`
    const startDate = `${academicYearStart}-09-01`
    const endDate = `${academicYearEnd}-06-30`
    
    // Check if this academic year already exists
    const { data: existing } = await supabase
      .from('academic_years')
      .select('id, name, is_current')
      .eq('name', academicYearName)
      .single()
    
    if (existing) {
      // Update to set as current if not already
      if (!existing.is_current) {
        // First, set all others as not current
        await supabase
          .from('academic_years')
          .update({ is_current: false })
          .neq('id', existing.id)
        
        // Set this one as current
        const { data: updated } = await supabase
          .from('academic_years')
          .update({ is_current: true })
          .eq('id', existing.id)
          .select()
          .single()
        
        return NextResponse.json({
          success: true,
          data: updated,
          message: `Academic year ${academicYearName} set as current`
        })
      }
      
      return NextResponse.json({
        success: true,
        data: existing,
        message: `Academic year ${academicYearName} already exists and is current`
      })
    }
    
    // Create new academic year and set as current
    // First, set all existing years as not current
    await supabase
      .from('academic_years')
      .update({ is_current: false })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all
    
    // Create the new academic year
    const { data, error } = await supabase
      .from('academic_years')
      .insert({
        name: academicYearName,
        start_date: startDate,
        end_date: endDate,
        is_current: true,
        description: `Năm học ${academicYearName}`,
        created_by: user.id
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating academic year:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create academic year' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: `Successfully created academic year ${academicYearName}`
    })
  } catch (error) {
    console.error('Initialize academic year error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 