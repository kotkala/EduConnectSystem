import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return NextResponse.json({ user: data.user });
} 