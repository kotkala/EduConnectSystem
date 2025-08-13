import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { ViolationAlertProvider } from '@/contexts/violation-alert-context'
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
    <SidebarProvider>
      {role === 'admin' ? (
        <ViolationAlertProvider>
          <AppSidebar role={role} />
          <SidebarInset>
            <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
              <SidebarTrigger className="-ml-1" />
              <h1 className="text-lg sm:text-xl font-semibold truncate">Bảng điều khiển</h1>
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </ViolationAlertProvider>
      ) : (
        <>
          <AppSidebar role={role} />
          <SidebarInset>
            <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
              <SidebarTrigger className="-ml-1" />
              <h1 className="text-lg sm:text-xl font-semibold truncate">Bảng điều khiển</h1>
            </header>
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </SidebarInset>
        </>
      )}
    </SidebarProvider>
  )
}
