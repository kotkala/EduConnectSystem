'use client'

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { UserRole } from '@/lib/types'

interface SidebarLayoutProps {
  children: React.ReactNode
  role: UserRole
  title: string
}

export function SidebarLayout({ children, role, title }: SidebarLayoutProps) {

  return (
    <SidebarProvider>
      <AppSidebar role={role} />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-xl font-semibold">{title}</h1>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}