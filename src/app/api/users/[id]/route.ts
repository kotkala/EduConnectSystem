import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Get user by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user' },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('User GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user by ID
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
    const {
      phone,
      full_name,
      role,
      status,
      gender,
      date_of_birth,
      address,
      avatar_url
    } = body;
    // Validate required fields
    if (!phone || !full_name || !role) {
      return NextResponse.json(
        { success: false, error: 'Phone, full name, and role are required' },
        { status: 400 }
      );
    }
    // Validate role
    const validRoles = ['admin', 'school_administrator', 'homeroom_teacher', 'subject_teacher', 'parent', 'student'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }
    // Validate status
    const validStatus = ['active', 'inactive', 'suspended', 'locked'];
    if (status && !validStatus.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }
    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({
        phone,
        full_name,
        role,
        status,
        gender,
        date_of_birth,
        address,
        avatar_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Phone already exists' },
          { status: 409 }
        );
      }
      console.error('Error updating user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update user' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      data,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('User PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user by ID
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
    // Check if user exists
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', id)
      .single();
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching user:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user' },
        { status: 500 }
      );
    }
    // Prevent deleting self or admin (optional, can be adjusted)
    if (user.id === id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete yourself' },
        { status: 400 }
      );
    }
    if (userData.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete admin user' },
        { status: 400 }
      );
    }
    // Check if user is referenced in other tables (student_enrollments, parent_student_relationships, etc.)
    // (Optional: implement logic to check and prevent deletion if referenced)
    // Delete user profile
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete user' },
        { status: 500 }
      );
    }
    // Optionally: delete from Supabase Auth
    // await supabase.auth.admin.deleteUser(id)
    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('User DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 