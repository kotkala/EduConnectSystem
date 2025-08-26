"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu } from "@/shared/components/dashboard/menu"
import { SidebarToggle } from "@/shared/components/dashboard/sidebar-toggle"
import { Button } from "@/shared/components/ui/button"
import { useSidebar } from "@/shared/hooks/use-sidebar"
import { useStore } from "@/shared/hooks/use-store"
import { cn } from "@/lib/utils"

import { UserRole } from "@/lib/types"
import dynamic from "next/dynamic"

interface AppSidebarProps {
  role: UserRole
}

export function AppSidebar({ role }: AppSidebarProps) {
  const sidebar = useStore(useSidebar, (x) => x)
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isChatbotMinimized, setIsChatbotMinimized] = useState(false)

  // Dynamic import for parent chatbot
  const ParentChatbot = dynamic(() => import('@/features/parent-dashboard/components/parent-chatbot/parent-chatbot'), {
    ssr: false,
    loading: () => null
  })

  if (!sidebar) return null
  
  const { isOpen, toggleOpen, getOpenState, setIsHover, settings } = sidebar

  const handleChatbotOpen = () => {
    setIsChatbotOpen(true)
  }

  return (
<<<<<<< Updated upstream
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4 border-b border-sidebar-border/30">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          {/* Logo Icon - Modern Minimalist Design */}
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 border border-orange-100 shrink-0">
            <Image
              src="/Edu Connect.svg"
              alt="EduConnect Logo"
              width={24}
              height={24}
              className="h-6 w-6 object-contain"
            />
          </div>

          {/* Brand Text - Modern Typography */}
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">
=======
    <>
      <aside
        className={cn(
          "fixed top-0 left-0 z-20 h-screen -translate-x-full lg:translate-x-0 transition-[width] ease-in-out duration-300",
          !getOpenState() ? "w-[90px]" : "w-72",
          settings.disabled && "hidden"
        )}
      >
        <SidebarToggle isOpen={isOpen} setIsOpen={toggleOpen} />
        <div
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
          className="relative h-full flex flex-col px-3 py-4 overflow-y-auto shadow-md dark:shadow-zinc-800 bg-sidebar-background border-r border-sidebar-border"
        >
          <Button
            className={cn(
              "transition-transform ease-in-out duration-300 mb-1",
              !getOpenState() ? "translate-x-1" : "translate-x-0"
            )}
            variant="link"
            asChild
          >
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Image
                  src="/Edu icon.svg"
                  alt="EduConnect"
                  width={16}
                  height={16}
                  className="size-4"
                />
              </div>
              <h1
                className={cn(
                  "font-bold text-lg whitespace-nowrap transition-[transform,opacity,display] ease-in-out duration-300",
                  !getOpenState()
                    ? "-translate-x-96 opacity-0 hidden"
                    : "translate-x-0 opacity-100"
                )}
              >
>>>>>>> Stashed changes
                EduConnect
              </h1>
            </Link>
          </Button>
          <Menu
            isOpen={getOpenState()}
            role={role}
            onChatbotOpen={role === 'parent' ? handleChatbotOpen : undefined}
          />
        </div>
      </aside>

      {/* Chatbot for parent role */}
      {role === 'parent' && ParentChatbot && (
        <ParentChatbot
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
          isMinimized={isChatbotMinimized}
          onMinimize={() => setIsChatbotMinimized(!isChatbotMinimized)}
        />
      )}
    </>
  )
}
