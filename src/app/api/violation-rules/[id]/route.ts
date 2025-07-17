import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('violation_rules')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching violation rule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Violation rule not found' }, { status: 404 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Error in violation rule GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { 
      code,
      name, 
      description, 
      category, 
      severity, 
      default_action,
      is_active
    } = body

    // Validation
    if (!code || !name || !category || !severity) {
      return NextResponse.json({ 
        error: 'Code, name, category and severity are required' 
      }, { status: 400 })
    }

    // Validate severity level
    const validSeverities = ['minor', 'moderate', 'major', 'critical']
    if (!validSeverities.includes(severity)) {
      return NextResponse.json({ 
        error: 'Invalid severity. Must be: ' + validSeverities.join(', ') 
      }, { status: 400 })
    }

    // Check if violation rule exists
    const { data: existing } = await supabase
      .from('violation_rules')
      .select('id, code, name, category')
      .eq('id', params.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Violation rule not found' }, { status: 404 })
    }

    // Check for duplicate code (excluding current record)
    if (code !== existing.code) {
      const { data: duplicateCode } = await supabase
        .from('violation_rules')
        .select('id')
        .eq('code', code)
        .neq('id', params.id)
        .single()

      if (duplicateCode) {
        return NextResponse.json({ 
          error: 'A violation rule with this code already exists' 
        }, { status: 409 })
      }
    }

    // Check for duplicate names within the same category (excluding current record)
    if (name !== existing.name || category !== existing.category) {
      const { data: duplicateName } = await supabase
        .from('violation_rules')
        .select('id')
        .eq('name', name)
        .eq('category', category)
        .neq('id', params.id)
        .single()

      if (duplicateName) {
        return NextResponse.json({ 
          error: 'A violation rule with this name already exists in this category' 
        }, { status: 409 })
      }
    }

    const { data, error } = await supabase
      .from('violation_rules')
      .update({
        code,
        name,
        description,
        category,
        severity,
        default_action,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating violation rule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })

  } catch (error) {
    console.error('Error in violation rule PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    
    // Check if violation rule exists
    const { data: existing } = await supabase
      .from('violation_rules')
      .select('id')
      .eq('id', params.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Violation rule not found' }, { status: 404 })
    }

    // TODO: Check if violation rule is being used in any records before deletion
    // This would require checking related tables like student_violations, etc.

    const { error } = await supabase
      .from('violation_rules')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting violation rule:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Violation rule deleted successfully' })

  } catch (error) {
    console.error('Error in violation rule DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 