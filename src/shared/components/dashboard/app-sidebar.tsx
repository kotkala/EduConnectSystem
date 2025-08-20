'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Home,
  Users,
  BookOpen,
  GraduationCap,
  Heart,
  FileText,
  Calendar,
  MessageSquare,
  Award,
  Building,
  Bell,
  Clock,
  ChevronUp,
  User2,
  BarChart3,
  ArrowLeftRight,
  ClipboardList,
  Bot,
  AlertTriangle,
  LogOut,
  Settings,
  FileBarChart,
  BookCheck,
  Calculator,
  TrendingUp,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/components/ui/sidebar"

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"

import { useAuth } from '@/features/authentication/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/lib/types'
// Note: ExtendedUserProfile import removed as no longer needed

import { useExchangeRequestsCount } from '@/shared/hooks/use-exchange-requests-count'
import { useNotificationCount } from '@/features/notifications/hooks/use-notification-count'
import { Badge } from '@/shared/components/ui/badge'
import dynamic from 'next/dynamic'
import ViolationAlertBadge from '@/features/admin-management/components/admin/violations/violation-alert-badge'
import { ThemeToggle } from '@/shared/components/theme-toggle'

// Platform item type
interface PlatformItem {
  title: string
  url: string
  icon: React.ComponentType
  isSpecial?: boolean
}

// Enhanced platform items with better organization and Modern Minimalist design
const platformItems: Record<string, PlatformItem[]> = {
  admin: [
    // Core Dashboard
    { title: "Tá»•ng quan", url: "/dashboard/admin", icon: Home },
    { title: "ThÃ´ng bÃ¡o", url: "/dashboard/admin/notifications", icon: Bell },

    // User Management
    { title: "Quáº£n lÃ½ ngÆ°á»i dÃ¹ng", url: "/dashboard/admin/users", icon: Users },

    // Academic Structure
    { title: "NÄƒm há»c", url: "/dashboard/admin/academic-years", icon: Calendar },
    { title: "Lá»›p há»c", url: "/dashboard/admin/classes", icon: GraduationCap },
    { title: "MÃ´n há»c", url: "/dashboard/admin/subjects", icon: BookOpen },
    { title: "PhÃ²ng há»c", url: "/dashboard/admin/classrooms", icon: Building },

    // Schedule & Timetable
    { title: "Thá»i khÃ³a biá»ƒu", url: "/dashboard/admin/timetable", icon: Clock },
    { title: "YÃªu cáº§u Ä‘á»•i lá»‹ch", url: "/dashboard/admin/exchange-requests", icon: ArrowLeftRight },

    // Academic Performance
    { title: "Ká»³ bÃ¡o cÃ¡o Ä‘iá»ƒm", url: "/dashboard/admin/grade-periods", icon: Calculator },
    { title: "Theo dÃµi Ä‘iá»ƒm sá»‘", url: "/dashboard/admin/grade-tracking", icon: BarChart3 },
    { title: "BÃ¡o cÃ¡o há»c táº­p", url: "/dashboard/admin/report-periods", icon: FileBarChart },
    { title: "Cáº£i thiá»‡n Ä‘iá»ƒm sá»‘", url: "/dashboard/admin/grade-improvement", icon: TrendingUp },

    // Student Management
    { title: "Vi pháº¡m há»c sinh", url: "/dashboard/admin/violations", icon: AlertTriangle },
  ],

  teacher: [
    { title: "Tá»•ng quan", url: "/dashboard/teacher", icon: Home },
    { title: "ThÃ´ng bÃ¡o", url: "/dashboard/teacher/notifications", icon: Bell },
    { title: "Lá»‹ch giáº£ng dáº¡y", url: "/dashboard/teacher/schedule", icon: Calendar },
    { title: "Nháº­p Ä‘iá»ƒm sá»‘", url: "/dashboard/teacher/grade-management", icon: Calculator },
    { title: "Báº£ng Ä‘iá»ƒm", url: "/dashboard/teacher/grade-reports", icon: ClipboardList },
    { title: "BÃ¡o cÃ¡o há»c táº­p", url: "/dashboard/teacher/reports", icon: BookCheck },
    { title: "Há»p phá»¥ huynh", url: "/dashboard/teacher/meetings", icon: Users },
    { title: "Há»c sinh chá»§ nhiá»‡m", url: "/dashboard/teacher/homeroom-students", icon: Heart },
    { title: "Äiá»ƒm lá»›p chá»§ nhiá»‡m", url: "/dashboard/teacher/homeroom-grades", icon: Award },
    { title: "ÄÆ¡n xin nghá»‰", url: "/dashboard/teacher/leave-requests", icon: FileText },
  ],
  student: [
    { title: "Tá»•ng quan", url: "/student", icon: Home },
    { title: "ThÃ´ng bÃ¡o", url: "/student/notifications", icon: Bell },
    { title: "KhÃ³a há»c", url: "/student/courses", icon: BookOpen },
    { title: "BÃ i táº­p", url: "/student/assignments", icon: FileText },
    { title: "Äiá»ƒm sá»‘", url: "/student/grades", icon: Award },
    { title: "Thá»i khÃ³a biá»ƒu", url: "/student/timetable", icon: Calendar },
    { title: "Cáº£i thiá»‡n Ä‘iá»ƒm", url: "/student/grade-improvement", icon: TrendingUp },
  ],
  parent: [
    { title: "Tá»•ng quan", url: "/dashboard/parent", icon: Home },
    { title: "ThÃ´ng bÃ¡o", url: "/dashboard/parent/notifications", icon: Bell },
    { title: "Trá»£ lÃ½ AI", url: "/dashboard/parent/chatbot", icon: Bot },
    { title: "Báº£ng Ä‘iá»ƒm con em", url: "/dashboard/parent/grades", icon: Award },
    { title: "BÃ¡o cÃ¡o há»c táº­p", url: "/dashboard/parent/reports", icon: BookCheck },
    { title: "Pháº£n há»“i há»c táº­p", url: "/dashboard/parent/feedback", icon: BarChart3 },
    { title: "Vi pháº¡m con em", url: "/dashboard/parent/violations", icon: AlertTriangle },
    { title: "Lá»‹ch há»p", url: "/dashboard/parent/meetings", icon: Calendar },
    { title: "ÄÆ¡n xin nghá»‰", url: "/dashboard/parent/leave-application", icon: FileText },
    { title: "Tráº¡ng thÃ¡i nghá»‰", url: "/parent/leave-status", icon: Clock },
    { title: "Con cá»§a tÃ´i", url: "/parent/children", icon: Heart },
    { title: "Tin nháº¯n", url: "/parent/messages", icon: MessageSquare },
  ],
}



interface AppSidebarProps {
  readonly role: UserRole
}

export function AppSidebar({ role }: AppSidebarProps) {
  const baseItems = platformItems[role] || []
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const { counts } = useExchangeRequestsCount(role, user?.id)
  const { counts: notificationCounts } = useNotificationCount(role, user?.id)

  // Chatbot state for parent role
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isChatbotMinimized, setIsChatbotMinimized] = useState(false)

  // Note: Previously checked homeroom teacher status, now showing feedback/violations for all teachers

  // Add feedback and violations links for all teachers (always visible)
  const items: PlatformItem[] = role === 'teacher'
    ? [
        ...baseItems.slice(0, 5), // Keep first 5 items (Dashboard, Notifications, Schedule, Grade Management, Grade Reports)
        { title: "Pháº£n Há»“i Há»c Sinh", url: "/dashboard/teacher/feedback", icon: BarChart3 },
        { title: "Vi Pháº¡m Há»c Sinh", url: "/dashboard/teacher/violations", icon: AlertTriangle },
        ...baseItems.slice(5) // Add remaining items
      ]
    : baseItems

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleDisplayName = (userRole: string) => {
    switch (userRole) {
      case 'admin': return 'Quáº£n trá»‹ viÃªn'
      case 'teacher': return 'GiÃ¡o viÃªn'
      case 'parent': return 'Phá»¥ huynh'
      default: return 'Há»c sinh'
    }
  }

  // Handle chatbot toggle for parent role
  const handleChatbotClick = () => {
    if (role === 'parent') {
      setIsChatbotOpen(true)
      setIsChatbotMinimized(false)
    }
  }

  // Only create dynamic import for parent role to keep other bundles lean
  const ParentChatbot = role === 'parent'
    ? dynamic(() => import('@/features/parent-dashboard/components/parent-chatbot/parent-chatbot'), { ssr: false })
    : null

  return (
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
                EduConnect
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-xl border border-orange-100">
                  {role === 'admin' ? 'Admin Portal' : 'Portal'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 py-2">
        {/* Core Dashboard Section */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2 mb-1">
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.slice(0, 2).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="rounded-xl h-11 px-3 hover:bg-orange-50 hover:text-orange-700 data-[active=true]:bg-orange-100 data-[active=true]:text-orange-800 transition-all duration-200">
                    <Link href={item.url}>
                      <item.icon />
                      <span className="font-medium">{item.title}</span>
                      {/* Notification badge */}
                      {(item.url.includes('/notifications') && notificationCounts.unread > 0) && (
                        <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
                          {notificationCounts.unread > 99 ? '99+' : notificationCounts.unread}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User & Academic Management */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2 mb-1">
            Quáº£n lÃ½ há»c vá»¥
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.slice(2, 8).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="rounded-xl h-11 px-3 hover:bg-orange-50 hover:text-orange-700 data-[active=true]:bg-orange-100 data-[active=true]:text-orange-800 transition-all duration-200">
                    <Link href={item.url}>
                      <item.icon />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Schedule & Performance */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-2 mb-1">
            Lá»‹ch trÃ¬nh & ÄÃ¡nh giÃ¡
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.slice(8).map((item) => (
                <SidebarMenuItem key={item.title}>
                  {/* Special handling for chatbot button */}
                  {item.isSpecial && item.title === "Trá»£ LÃ½ AI" ? (
                    <SidebarMenuButton onClick={handleChatbotClick} className="cursor-pointer rounded-xl h-11 px-3 hover:bg-orange-50 hover:text-orange-700 transition-all duration-200">
                      <item.icon />
                      <span className="font-medium">{item.title}</span>
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      </div>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton asChild className="rounded-xl h-11 px-3 hover:bg-orange-50 hover:text-orange-700 data-[active=true]:bg-orange-100 data-[active=true]:text-orange-800 transition-all duration-200">
                      <Link href={item.url}>
                        <item.icon />
                        <span className="font-medium">{item.title}</span>
                        {/* Exchange request badge */}
                        {(item.url.includes('/exchange-requests') && counts.pending > 0) && (
                          <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full">
                            {counts.pending > 99 ? '99+' : counts.pending}
                          </Badge>
                        )}
                        {/* Violation alert badge */}
                        {(item.url.includes('/violations') && role === 'admin') && (
                          <ViolationAlertBadge className="ml-auto" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border/30">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-14 p-3 rounded-2xl hover:bg-orange-50 transition-all duration-200 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mb-2">
                  <Avatar className="h-10 w-10 shrink-0 ring-2 ring-orange-100">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="Avatar" />
                    <AvatarFallback className="bg-orange-100 text-orange-700 font-semibold">
                      {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left min-w-0 flex-1 group-data-[collapsible=icon]:hidden ml-3">
                    <span className="text-sm font-semibold truncate w-full text-sidebar-foreground">
                      {profile?.full_name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {user?.email}
                    </span>
                    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg mt-1">
                      {getRoleDisplayName(role)}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto shrink-0 h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width] rounded-2xl border-orange-100 shadow-lg"
              >
                <DropdownMenuItem
                  onClick={() => router.push('/profile')}
                  className="rounded-xl mx-1 my-1 h-10 px-3 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200"
                >
                  <User2 className="mr-3 h-4 w-4" />
                  <span className="font-medium">Há»“ sÆ¡ cÃ¡ nhÃ¢n</span>
                </DropdownMenuItem>

                {/* Theme Toggle in Dropdown */}
                <div className="mx-1 my-1 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Giao diá»‡n</span>
                    <ThemeToggle />
                  </div>
                </div>

                <DropdownMenuItem
                  onClick={() => router.push('/profile?tab=settings')}
                  className="rounded-xl mx-1 my-1 h-10 px-3 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  <span className="font-medium">CÃ i Ä‘áº·t</span>
                </DropdownMenuItem>
                <div className="h-px bg-border mx-2 my-2" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-xl mx-1 my-1 h-10 px-3 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium">ÄÄƒng xuáº¥t</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Chatbot for parent role */}
      {role === 'parent' && ParentChatbot && (
        <ParentChatbot
          isOpen={isChatbotOpen}
          onClose={() => setIsChatbotOpen(false)}
          onMinimize={() => setIsChatbotMinimized(!isChatbotMinimized)}
          isMinimized={isChatbotMinimized}
          mode="floating"
        />
      )}
    </Sidebar>
  )
}
