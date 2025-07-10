import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../lib/supabase/server';

// Zod schema for academic_years
const academicYearSchema = z.object({
  name: z.string().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_current: z.boolean().optional(),
  description: z.string().optional(),
});

// Helper: Check if user is admin or school_administrator
async function requireAdminRole(supabase: any) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return false;
  // Lấy role từ bảng users
  const { data, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  if (userError || !data) return false;
  return data.role === 'admin' || data.role === 'school_administrator';
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  // Lấy danh sách năm học
  const { data, error } = await supabase
    .from('academic_years')
    .select('*')
    .order('start_date', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  if (!(await requireAdminRole(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const body = await req.json();
  const parse = academicYearSchema.safeParse(body);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const { name, start_date, end_date, is_current, description } = parse.data;
  const { data, error } = await supabase
    .from('academic_years')
    .insert([
      { name, start_date, end_date, is_current: !!is_current, description },
    ])
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  if (!(await requireAdminRole(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const body = await req.json();
  const { id, ...rest } = body;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const parse = academicYearSchema.partial().safeParse(rest);
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const { data, error } = await supabase
    .from('academic_years')
    .update(parse.data)
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  if (!(await requireAdminRole(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { error } = await supabase
    .from('academic_years')
    .delete()
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
} 