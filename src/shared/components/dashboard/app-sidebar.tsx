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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleChatbotOpen = () => {
    setIsChatbotOpen(true)
  }

  return (
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
                EduConnect
              </h1>
            </Link>
          </Button>
          <Menu
            isOpen={getOpenState()}
            role={role}
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
