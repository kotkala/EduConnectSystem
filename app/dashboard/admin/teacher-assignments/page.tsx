import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function TeacherAssignmentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Redirect to class management page for teacher assignments
  redirect('/dashboard/admin/classes')
}
