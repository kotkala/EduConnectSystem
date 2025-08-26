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
  if (!sidebar) return null
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
