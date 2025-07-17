import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get grade level by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data, error } = await supabase
      .from('grade_levels')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Grade level not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching grade level:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch grade level' },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Grade level GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update grade level by ID
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
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
    // Update grade level
    const { data, error } = await supabase
      .from('grade_levels')
      .update({
        name,
        level,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Grade level not found' },
          { status: 404 }
        );
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Grade level name or level already exists' },
          { status: 409 }
        );
      }
      console.error('Error updating grade level:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update grade level' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      data,
      message: 'Grade level updated successfully',
    });
  } catch (error) {
    console.error('Grade level PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete grade level by ID
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    // Check if grade level exists
    const { data: gradeLevel, error: fetchError } = await supabase
      .from('grade_levels')
      .select('*')
      .eq('id', id)
      .single();
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Grade level not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching grade level:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch grade level' },
        { status: 500 }
      );
    }
    // Check if grade level is referenced by any classes
    const { data: relatedClasses, error: classError } = await supabase
      .from('classes')
      .select('id')
      .eq('grade_level_id', id)
      .limit(1);
    if (classError) {
      console.error('Error checking related classes:', classError);
      return NextResponse.json(
        { success: false, error: 'Failed to check related classes' },
        { status: 500 }
      );
    }
    if (relatedClasses && relatedClasses.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete grade level with associated classes' },
        { status: 400 }
      );
    }
    // Delete grade level
    const { error } = await supabase
      .from('grade_levels')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting grade level:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete grade level' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Grade level deleted successfully',
    });
  } catch (error) {
    console.error('Grade level DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 