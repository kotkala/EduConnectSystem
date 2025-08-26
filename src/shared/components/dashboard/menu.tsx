"use client"

import Link from "next/link"
import { Ellipsis } from "lucide-react"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { getMenuList } from "@/lib/menu-list"
import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { CollapseMenuButton } from "@/shared/components/dashboard/collapse-menu-button"
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/shared/components/ui/tooltip"
import { Badge } from "@/shared/components/ui/badge"
import { useNotificationCount } from "@/features/notifications/hooks/use-notification-count"
import { useAuth } from "@/features/authentication/hooks/use-auth"
import { UserRole } from "@/lib/types"

interface MenuProps {
  isOpen: boolean | undefined
  role: UserRole
  onChatbotOpen?: () => void
}

export function Menu({ isOpen, role, onChatbotOpen }: MenuProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { counts: notificationCounts } = useNotificationCount(role, user?.id)
  const menuList = getMenuList(pathname, role, onChatbotOpen)

  return (
    <ScrollArea className="[&>div>div[style]]:!block">
      <nav className="mt-8 h-full w-full">
        <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
          {menuList.map(({ groupLabel, menus }, index) => (
            <li className={cn("w-full", groupLabel ? "pt-5" : "")} key={index}>
              {(isOpen && groupLabel) || isOpen === undefined ? (
                <p className="text-sm font-medium text-muted-foreground px-4 pb-2 max-w-[248px] truncate">
                  {groupLabel}
                </p>
              ) : !isOpen && isOpen !== undefined && groupLabel ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger className="w-full">
                      <div className="w-full flex justify-center items-center">
                        <Ellipsis className="h-5 w-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{groupLabel}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <p className="pb-2"></p>
              )}
              {menus.map(
                ({ href, label, icon: Icon, active, submenus, onClick }, index) =>
                  !submenus || submenus.length === 0 ? (
                    <div className="w-full" key={index}>
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              variant={
                                (active === undefined &&
                                  pathname.startsWith(href)) ||
                                active
                                  ? "secondary"
                                  : "ghost"
                              }
                              className="w-full justify-start h-10 mb-1"
                              asChild={!onClick}
                              onClick={onClick}
                            >
                              {onClick ? (
                                <div className="flex items-center">
                                  <span
                                    className={cn(isOpen === false ? "" : "mr-4")}
                                  >
                                    <Icon size={18} />
                                  </span>
                                  <p
                                    className={cn(
                                      "max-w-[200px] truncate",
                                      isOpen === false
                                        ? "-translate-x-96 opacity-0"
                                        : "translate-x-0 opacity-100"
                                    )}
                                  >
                                    {label}
                                  </p>
                                  {/* Notification badge for notifications menu */}
                                  {href.includes('/notifications') && notificationCounts.unread > 0 && (
                                    <Badge 
                                      variant="destructive" 
                                      className={cn(
                                        "ml-auto size-5 flex items-center justify-center p-0 text-xs",
                                        isOpen === false ? "opacity-0" : "opacity-100"
                                      )}
                                    >
                                      {notificationCounts.unread > 99 ? '99+' : notificationCounts.unread}
                                    </Badge>
                                  )}
                                </div>
                              ) : (
                                <Link href={href}>
                                  <span
                                    className={cn(isOpen === false ? "" : "mr-4")}
                                  >
                                    <Icon size={18} />
                                  </span>
                                  <p
                                    className={cn(
                                      "max-w-[200px] truncate",
                                      isOpen === false
                                        ? "-translate-x-96 opacity-0"
                                        : "translate-x-0 opacity-100"
                                    )}
                                  >
                                    {label}
                                  </p>
                                  {/* Notification badge for notifications menu */}
                                  {href.includes('/notifications') && notificationCounts.unread > 0 && (
                                    <Badge 
                                      variant="destructive" 
                                      className={cn(
                                        "ml-auto size-5 flex items-center justify-center p-0 text-xs",
                                        isOpen === false ? "opacity-0" : "opacity-100"
                                      )}
                                    >
                                      {notificationCounts.unread > 99 ? '99+' : notificationCounts.unread}
                                    </Badge>
                                  )}
                                </Link>
                              )}
                            </Button>
                          </TooltipTrigger>
                          {isOpen === false && (
                            <TooltipContent side="right">
                              <div className="flex items-center gap-2">
                                {label}
                                {href.includes('/notifications') && notificationCounts.unread > 0 && (
                                  <Badge variant="destructive" className="size-5 flex items-center justify-center p-0 text-xs">
                                    {notificationCounts.unread > 99 ? '99+' : notificationCounts.unread}
                                  </Badge>
                                )}
                              </div>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div className="w-full" key={index}>
                      <CollapseMenuButton
                        icon={Icon}
                        label={label}
                        active={
                          active === undefined
                            ? pathname.startsWith(href)
                            : active
                        }
                        submenus={submenus}
                        isOpen={isOpen}
                      />
                    </div>
                  )
              )}
            </li>
          ))}
        </ul>
      </nav>
    </ScrollArea>
  )
}
