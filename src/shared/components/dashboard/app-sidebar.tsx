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
  // MessageSquare removed
  Award,
  Building,
  Bell,
  Clock,
  ChevronUp,
  User2,
  BarChart3,
  // ArrowLeftRight removed
  ClipboardList,
  Bot,
  AlertTriangle,
  LogOut,
  Settings,
  FileBarChart,
  BookCheck,
  Calculator,
  TrendingUp,
  CalendarClock,
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

// Exchange requests hook removed
import { useNotificationCount } from '@/features/notifications/hooks/use-notification-count'
import { Badge } from '@/shared/components/ui/badge'
import dynamic from 'next/dynamic'
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
    { title: "Tổng quan", url: "/dashboard/admin", icon: Home },
    { title: "Thông báo", url: "/dashboard/admin/notifications", icon: Bell },

    // User Management
    { title: "Quản lý người dùng", url: "/dashboard/admin/users", icon: Users },

    // Academic Structure
    { title: "Năm học", url: "/dashboard/admin/academic-years", icon: Calendar },
    { title: "Lớp học", url: "/dashboard/admin/classes", icon: GraduationCap },
    { title: "Môn học", url: "/dashboard/admin/subjects", icon: BookOpen },
    { title: "Phòng học", url: "/dashboard/admin/classrooms", icon: Building },

    // Schedule & Timetable
    { title: "Thời khóa biểu", url: "/dashboard/admin/timetable", icon: Clock },
    { title: "Đơn thay đổi lịch", url: "/dashboard/admin/schedule-change", icon: CalendarClock },
    // Exchange requests menu item removed

    // Academic Performance
    { title: "Kỳ báo cáo điểm", url: "/dashboard/admin/grade-periods", icon: Calculator },
    { title: "Theo dõi điểm số", url: "/dashboard/admin/grade-tracking", icon: BarChart3 },
    { title: "Báo cáo học tập", url: "/dashboard/admin/report-periods", icon: FileBarChart },
    { title: "Cải thiện điểm số", url: "/dashboard/admin/grade-improvement", icon: TrendingUp },

    // Student Management
    { title: "Vi phạm học sinh", url: "/dashboard/admin/violations", icon: AlertTriangle },
  ],

  teacher: [
    { title: "Tổng quan", url: "/dashboard/teacher", icon: Home },
    { title: "Thông báo", url: "/dashboard/teacher/notifications", icon: Bell },
    { title: "Lịch giảng dạy", url: "/dashboard/teacher/schedule", icon: Calendar },
    { title: "Đơn thay đổi lịch", url: "/dashboard/teacher/schedule-change", icon: CalendarClock },
    { title: "Nhập điểm số", url: "/dashboard/teacher/grade-management", icon: Calculator },
    { title: "Bảng điểm", url: "/dashboard/teacher/grade-reports", icon: ClipboardList },
    { title: "Báo cáo học tập", url: "/dashboard/teacher/reports", icon: BookCheck },
    { title: "Họp phụ huynh", url: "/dashboard/teacher/meetings", icon: Users },
    { title: "Học sinh chủ nhiệm", url: "/dashboard/teacher/homeroom-students", icon: Heart },
    { title: "Điểm lớp chủ nhiệm", url: "/dashboard/teacher/homeroom-grades", icon: Award },
    { title: "Đơn xin nghỉ", url: "/dashboard/teacher/leave-requests", icon: FileText },
  ],
  student: [
    { title: "Tổng quan", url: "/student", icon: Home },
    { title: "Thông báo", url: "/student/notifications", icon: Bell },
    { title: "Khóa học", url: "/student/courses", icon: BookOpen },
    { title: "Bài tập", url: "/student/assignments", icon: FileText },
    { title: "Điểm số", url: "/student/grades", icon: Award },
    { title: "Thời khóa biểu", url: "/student/timetable", icon: Calendar },
    { title: "Cải thiện điểm", url: "/student/grade-improvement", icon: TrendingUp },
  ],
  parent: [
    { title: "Tổng quan", url: "/dashboard/parent", icon: Home },
    { title: "Thông báo", url: "/dashboard/parent/notifications", icon: Bell },
    { title: "Trợ lý AI", url: "/dashboard/parent/chatbot", icon: Bot },
    { title: "Bảng điểm con em", url: "/dashboard/parent/grades", icon: Award },
    { title: "Báo cáo học tập", url: "/dashboard/parent/reports", icon: BookCheck },
    { title: "Phản hồi học tập", url: "/dashboard/parent/feedback", icon: BarChart3 },
    { title: "Vi phạm con em", url: "/dashboard/parent/violations", icon: AlertTriangle },
    { title: "Lịch họp", url: "/dashboard/parent/meetings", icon: Calendar },
    { title: "Đơn xin nghỉ", url: "/dashboard/parent/leave-application", icon: FileText },
  ],
}



interface AppSidebarProps {
  readonly role: UserRole
}

export function AppSidebar({ role }: AppSidebarProps) {
  const baseItems = platformItems[role] || []
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  // Exchange requests count removed
  const { counts: notificationCounts } = useNotificationCount(role, user?.id)

  // Chatbot state for parent role
  const [isChatbotOpen, setIsChatbotOpen] = useState(false)
  const [isChatbotMinimized, setIsChatbotMinimized] = useState(false)

  // Note: Previously checked homeroom teacher status, now showing feedback/violations for all teachers

  // Add feedback and violations links for all teachers (always visible)
  const items: PlatformItem[] = role === 'teacher'
    ? [
        ...baseItems.slice(0, 6), // Keep first 6 items (Dashboard, Notifications, Schedule, Schedule Change, Grade Management, Grade Reports)
        { title: "Phản Hồi Học Sinh", url: "/dashboard/teacher/feedback", icon: BarChart3 },
        { title: "Vi Phạm Học Sinh", url: "/dashboard/teacher/violations", icon: AlertTriangle },
        ...baseItems.slice(6) // Add remaining items
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
      case 'admin': return 'Quản trị viên'
      case 'teacher': return 'Giáo viên'
      case 'parent': return 'Phụ huynh'
      default: return 'Học sinh'
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
            Quản lý học vụ
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
            Lịch trình & Đánh giá
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.slice(8).map((item) => (
                <SidebarMenuItem key={item.title}>
                  {/* Special handling for chatbot button */}
                  {item.isSpecial && item.title === "Trợ Lý AI" ? (
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
                        {/* Exchange request badge removed */}
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
                  <span className="font-medium">Hồ sơ cá nhân</span>
                </DropdownMenuItem>

                {/* Theme Toggle in Dropdown */}
                <div className="mx-1 my-1 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Giao diện</span>
                    <ThemeToggle />
                  </div>
                </div>

                <DropdownMenuItem
                  onClick={() => router.push('/profile?tab=settings')}
                  className="rounded-xl mx-1 my-1 h-10 px-3 hover:bg-orange-50 hover:text-orange-700 transition-colors duration-200"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  <span className="font-medium">Cài đặt</span>
                </DropdownMenuItem>
                <div className="h-px bg-border mx-2 my-2" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-xl mx-1 my-1 h-10 px-3 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-medium">Đăng xuất</span>
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
