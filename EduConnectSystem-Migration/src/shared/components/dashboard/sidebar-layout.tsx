'use client'

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/shared/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { UserRole } from '@/lib/types'

interface SidebarLayoutProps {
  readonly children: React.ReactNode
  readonly role: UserRole
  readonly title: string
}

export function SidebarLayout({ children, role, title }: SidebarLayoutProps) {

  return (
    <SidebarProvider>
      <AppSidebar role={role} />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-14 sm:h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
          <SidebarTrigger className="-ml-1" />
          <h1 className="text-lg sm:text-xl font-semibold truncate">{title}</h1>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
