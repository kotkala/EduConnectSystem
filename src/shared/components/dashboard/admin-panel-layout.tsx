"use client"

import { AppSidebar } from "@/shared/components/dashboard/app-sidebar"
import { useSidebar } from "@/shared/hooks/use-sidebar"
import { useStore } from "@/shared/hooks/use-store"
import { cn } from "@/lib/utils"
import { UserRole } from "@/lib/types"

interface AdminPanelLayoutProps {
  children: React.ReactNode
  role: UserRole
}

export default function AdminPanelLayout({
  children,
  role
}: AdminPanelLayoutProps) {
  const sidebar = useStore(useSidebar, (x) => x)

  // Show loading state instead of null to prevent hydration mismatch
  if (!sidebar) {
    return (
      <>
        <div className="fixed top-0 left-0 z-20 h-screen w-72 bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        <main className="min-h-[calc(100vh_-_56px)] bg-zinc-50 dark:bg-zinc-900 lg:ml-72">
          {children}
        </main>
      </>
    )
  }

  const { getOpenState, settings } = sidebar

  return (
    <>
      <AppSidebar role={role} />
      <main
        className={cn(
          "min-h-[calc(100vh_-_56px)] bg-zinc-50 dark:bg-zinc-900 transition-[margin-left] ease-in-out duration-300",
          !settings.disabled && (!getOpenState() ? "lg:ml-[90px]" : "lg:ml-72")
        )}
      >
        {children}
      </main>
    </>
  )
}
