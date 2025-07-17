import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - List all grade levels with filtering
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '10');
    const sort_by = searchParams.get('sort_by') || 'level';
    const sort_order = searchParams.get('sort_order') || 'asc';

    // Build query
    let query = supabase
      .from('grade_levels')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    // Sorting
    const ascending = sort_order === 'asc';
    query = query.order(sort_by, { ascending });
    // Pagination
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;
    query = query.range(from, to);
    const { data, error, count } = await query;
    if (error) {
      console.error('Error fetching grade levels:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch grade levels' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page),
      },
    });
  } catch (error) {
    console.error('Grade levels API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new grade level
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    // Parse request body
    const body = await request.json();
    const { name, level, description } = body;
    // Validate required fields
    if (!name || !level) {
      return NextResponse.json(
        { success: false, error: 'Name and level are required' },
        { status: 400 }
      );
    }
    // Validate level range
    if (typeof level !== 'number' || level < 1 || level > 12) {
      return NextResponse.json(
        { success: false, error: 'Level must be an integer between 1 and 12' },
        { status: 400 }
      );
    }
    // Create new grade level
    const { data, error } = await supabase
      .from('grade_levels')
      .insert({
        name,
        level,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) {
      console.error('Error creating grade level:', error);
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Grade level name or level already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: 'Failed to create grade level' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      data,
      message: 'Grade level created successfully',
    });
  } catch (error) {
    console.error('Grade levels POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 