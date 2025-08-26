import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanelLayout from '@/shared/components/dashboard/admin-panel-layout'
import { AcademicYearProvider } from '@/providers/academic-year-context'
import { UserRole } from '@/lib/types'

export default async function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Get user profile to determine role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/pending-approval')
  }

  const role = profile.role as UserRole

  // Only Teacher and Admin are allowed to use the /dashboard area.
  // Student portal lives at /student. Parent portal lives at /dashboard/parent.
  if (role === 'student') {
    redirect('/student')
  }
  // Parent can access /dashboard/parent - no redirect needed

  return (
    <>
      {role === 'admin' ? (
        <AcademicYearProvider>
          <AdminPanelLayout role={role}>
            {children}
          </AdminPanelLayout>
        </AcademicYearProvider>
      ) : (
        <AdminPanelLayout role={role}>
          {children}
        </AdminPanelLayout>
      )}
    </>
  )
}
