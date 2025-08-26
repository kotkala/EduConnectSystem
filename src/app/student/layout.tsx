import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanelLayout from '@/shared/components/dashboard/admin-panel-layout'

export default async function StudentLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/pending-approval')
  if (profile.role !== 'student') redirect('/dashboard')

  return (
    <AdminPanelLayout role="student">
      {children}
    </AdminPanelLayout>
  )
}


