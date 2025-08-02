import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (!profile) {
    // If no profile exists, redirect to profile setup
    redirect('/profile/setup')
  }

  // Redirect to role-specific dashboard
  if (profile.role === 'admin') {
    redirect('/dashboard/admin')
  } else if (profile.role === 'teacher') {
    redirect('/dashboard/teacher')
  } else if (profile.role === 'student') {
    redirect('/dashboard/student')
  } else if (profile.role === 'parent') {
    redirect('/dashboard/parent')
  } else {
    redirect('/dashboard/student')
  }
}
