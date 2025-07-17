import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get class by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data, error } = await supabase
      .from('classes')
      .select(`*, academic_year:academic_years(id, name, is_current), grade_level:grade_levels(id, name, level)`)
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Class not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching class:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch class' },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Class GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update class by ID
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
    const { academic_year_id, grade_level_id, name, code, capacity, room_number, is_combined } = body;
    // Validate required fields
    if (!academic_year_id || !grade_level_id || !name || !code) {
      return NextResponse.json(
        { success: false, error: 'Academic year, grade level, name, and code are required' },
        { status: 400 }
      );
    }
    // Validate capacity
    if (capacity && (capacity < 1 || capacity > 100)) {
      return NextResponse.json(
        { success: false, error: 'Capacity must be between 1 and 100' },
        { status: 400 }
      );
    }
    // Check if academic year exists
    const { data: academicYear, error: yearError } = await supabase
      .from('academic_years')
      .select('id')
      .eq('id', academic_year_id)
      .single();
    if (yearError || !academicYear) {
      return NextResponse.json(
        { success: false, error: 'Invalid academic year' },
        { status: 400 }
      );
    }
    // Check if grade level exists
    const { data: gradeLevel, error: gradeError } = await supabase
      .from('grade_levels')
      .select('id')
      .eq('id', grade_level_id)
      .single();
    if (gradeError || !gradeLevel) {
      return NextResponse.json(
        { success: false, error: 'Invalid grade level' },
        { status: 400 }
      );
    }
    // Update class
    const { data, error } = await supabase
      .from('classes')
      .update({
        academic_year_id,
        grade_level_id,
        name,
        code,
        capacity: capacity || 30,
        room_number,
        is_combined: is_combined || false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select(`*, academic_year:academic_years(id, name, is_current), grade_level:grade_levels(id, name, level)`)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Class not found' },
          { status: 404 }
        );
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Class with this code already exists in this academic year' },
          { status: 409 }
        );
      }
      console.error('Error updating class:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update class' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      data,
      message: 'Class updated successfully',
    });
  } catch (error) {
    console.error('Class PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete class by ID
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
    // Check if class exists
    const { data: classData, error: fetchError } = await supabase
      .from('classes')
      .select('id')
      .eq('id', id)
      .single();
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'Class not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching class:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch class' },
        { status: 500 }
      );
    }
    // Check if class is referenced by student_enrollments
    const { data: enrollments, error: enrollError } = await supabase
      .from('student_enrollments')
      .select('id')
      .eq('class_id', id)
      .limit(1);
    if (enrollError) {
      console.error('Error checking enrollments:', enrollError);
      return NextResponse.json(
        { success: false, error: 'Failed to check enrollments' },
        { status: 500 }
      );
    }
    if (enrollments && enrollments.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete class with enrolled students' },
        { status: 400 }
      );
    }
    // Delete class
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting class:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete class' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      message: 'Class deleted successfully',
    });
  } catch (error) {
    console.error('Class DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 