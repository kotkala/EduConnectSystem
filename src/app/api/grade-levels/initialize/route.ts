import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GRADE_LEVELS = [
  { name: 'Lớp 10', level: 10, description: 'Khối lớp 10 - Trung học phổ thông' },
  { name: 'Lớp 11', level: 11, description: 'Khối lớp 11 - Trung học phổ thông' },
  { name: 'Lớp 12', level: 12, description: 'Khối lớp 12 - Trung học phổ thông' }
]

// POST - Initialize grade levels
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
    
    // Check existing grade levels
    const { data: existing } = await supabase
      .from('grade_levels')
      .select('level')
    
    const existingLevels = existing?.map(g => g.level) || []
    const toCreate = GRADE_LEVELS.filter(g => !existingLevels.includes(g.level))
    
    if (toCreate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Grade levels already initialized',
        data: existing
      })
    }
    
    // Create grade levels
    const { data, error } = await supabase
      .from('grade_levels')
      .insert(toCreate)
      .select()
    
    if (error) {
      console.error('Error creating grade levels:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create grade levels' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data,
      message: `Successfully initialized ${toCreate.length} grade levels`
    })
  } catch (error) {
    console.error('Initialize grade levels error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
} 