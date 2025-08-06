import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'
import { UserRole } from '@/lib/types'

export default async function DashboardLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
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
    redirect('/profile/setup')
  }

  const role = profile.role as UserRole

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar role={role} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
