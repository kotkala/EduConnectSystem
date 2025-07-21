import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // If no profile exists, redirect to profile setup
    redirect('/profile/setup')
  }

  // Redirect to role-specific dashboard
  switch (profile.role) {
    case 'admin':
      redirect('/dashboard/admin')
    case 'teacher':
      redirect('/dashboard/teacher')
    case 'student':
      redirect('/dashboard/student')
    case 'parent':
      redirect('/dashboard/parent')
    default:
      redirect('/dashboard/student')
  }
}
