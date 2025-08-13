import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Ensure authenticated access only
    redirect('/')
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // If no profile exists, redirect to pending approval (awaiting admin role assignment)
    redirect('/pending-approval')
  }

  // Only teacher/admin stay under /dashboard. Student and parent go to their portals.
  if (profile.role === 'admin') {
    redirect('/dashboard/admin')
  } else if (profile.role === 'teacher') {
    redirect('/dashboard/teacher')
  } else if (profile.role === 'student') {
    redirect('/student')
  } else if (profile.role === 'parent') {
    redirect('/dashboard/parent')
  } else {
    redirect('/')
  }
}
