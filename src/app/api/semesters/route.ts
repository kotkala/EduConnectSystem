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

    // Check if user is a student (or allow other roles to access semesters)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ success: false, error: 'Profile not found' }, { status: 404 })
    }

    // Get current semesters - accessible to all authenticated users
    const { data: semesters, error: semestersError } = await supabase
      .from('semesters')
      .select(`
        id,
        name,
        start_date,
        end_date
      `)
      .eq('is_current', true)
      .order('start_date', { ascending: false })

    if (semestersError) {
      console.error('Error fetching semesters:', semestersError)
      return NextResponse.json({
        success: false,
        error: 'Error fetching semesters'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: semesters || []
    })
  } catch (error) {
    console.error('Error in semesters API:', error)
    return NextResponse.json({ success: false, error: 'An unexpected error occurred' }, { status: 500 })
  }
}
