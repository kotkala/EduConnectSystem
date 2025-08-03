'use client'

import { useState } from 'react'
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
  UserCheck,
  Building,
  Bell,
  Clock,
  ChevronUp,
  User2,
  Zap,
  BarChart3,
  ArrowLeftRight,
  ClipboardList,
  Bot,
  AlertTriangle,
  LogOut,
  Settings,
  MessageCircle,
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
} from "@/components/ui/sidebar"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/lib/types'
// Note: ExtendedUserProfile import removed as no longer needed

import { useExchangeRequestsCount } from '@/hooks/use-exchange-requests-count'
import { useNotificationCount } from '@/hooks/use-notification-count'
import { Badge } from '@/components/ui/badge'
import ParentChatbot from '@/components/parent-chatbot/parent-chatbot'

// Platform item type
interface PlatformItem {
  title: string
  url: string
  icon: React.ComponentType
  isSpecial?: boolean
}

// Platform items for each role
const platformItems: Record<string, PlatformItem[]> = {
  admin: [
    { title: "Dashboard", url: "/dashboard/admin", icon: Home },
    { title: "Users", url: "/dashboard/admin/users", icon: Users },
    { title: "Notifications", url: "/dashboard/admin/notifications", icon: Bell },
    { title: "Academic", url: "/dashboard/admin/academic", icon: Calendar },
    { title: "Classes", url: "/dashboard/admin/classes", icon: GraduationCap },
    { title: "Subjects", url: "/dashboard/admin/subjects", icon: BookOpen },
    { title: "Classrooms", url: "/dashboard/admin/classrooms", icon: Building },
    { title: "Timetable", url: "/dashboard/admin/timetable", icon: Calendar },
    { title: "Teacher Assignments", url: "/dashboard/admin/teacher-assignments", icon: UserCheck },
    { title: "Bảng Điểm", url: "/dashboard/admin/grade-reports", icon: ClipboardList },
    { title: "Vi Phạm Học Sinh", url: "/dashboard/admin/violations", icon: AlertTriangle },
    { title: "Exchange Requests", url: "/dashboard/admin/exchange-requests", icon: ArrowLeftRight },
  ],
  admin_full: [
    { title: "Dashboard", url: "/dashboard/admin", icon: Home },
    { title: "Users", url: "/dashboard/admin/users", icon: Users },
    { title: "Notifications", url: "/dashboard/admin/notifications", icon: Bell },
    { title: "Academic", url: "/dashboard/admin/academic", icon: Calendar },
    { title: "Classes", url: "/dashboard/admin/classes", icon: GraduationCap },
    { title: "Subjects", url: "/dashboard/admin/subjects", icon: BookOpen },
    { title: "Classrooms", url: "/dashboard/admin/classrooms", icon: Building },
    { title: "Timetable", url: "/dashboard/admin/timetable", icon: Calendar },
    { title: "Teacher Assignments", url: "/dashboard/admin/teacher-assignments", icon: UserCheck },
    { title: "Bảng Điểm", url: "/dashboard/admin/grade-reports", icon: ClipboardList },
    { title: "Vi Phạm Học Sinh", url: "/dashboard/admin/violations", icon: AlertTriangle },
    { title: "Exchange Requests", url: "/dashboard/admin/exchange-requests", icon: ArrowLeftRight },
  ],
  teacher: [
    { title: "Dashboard", url: "/dashboard/teacher", icon: Home },
    { title: "Notifications", url: "/dashboard/teacher/notifications", icon: Bell },
    { title: "Lịch Giảng Dạy", url: "/dashboard/teacher/schedule", icon: Calendar },
    { title: "Bảng Điểm", url: "/dashboard/teacher/grade-reports", icon: ClipboardList },
    { title: "Họp Phụ Huynh", url: "/dashboard/teacher/meetings", icon: Users },
    { title: "Homeroom Students", url: "/dashboard/teacher/homeroom-students", icon: Heart },
    { title: "Leave Requests", url: "/dashboard/teacher/leave-requests", icon: FileText },
  ],
  student: [
    { title: "Dashboard", url: "/dashboard/student", icon: Home },
    { title: "Notifications", url: "/dashboard/student/notifications", icon: Bell },
    { title: "My Courses", url: "/dashboard/student/courses", icon: BookOpen },
    { title: "Assignments", url: "/dashboard/student/assignments", icon: FileText },
    { title: "Grades", url: "/dashboard/student/grades", icon: Award },
  ],
  parent: [
    { title: "Dashboard", url: "/dashboard/parent", icon: Home },
    { title: "Notifications", url: "/dashboard/parent/notifications", icon: Bell },
    { title: "Trợ Lý AI", url: "#", icon: Bot, isSpecial: true },
    { title: "Trợ Lý AI - Mở Rộng", url: "/dashboard/parent/chatbot", icon: MessageCircle },
    { title: "Bảng Điểm Con Em", url: "/dashboard/parent/grades", icon: Award },
    { title: "Phản Hồi Học Tập", url: "/dashboard/parent/feedback", icon: BarChart3 },
    { title: "Vi Phạm Con Em", url: "/dashboard/parent/violations", icon: AlertTriangle },
    { title: "Meeting Schedules", url: "/dashboard/parent/meetings", icon: Calendar },
    { title: "Leave Application", url: "/dashboard/parent/leave-application", icon: FileText },
    { title: "Leave Status", url: "/dashboard/parent/leave-status", icon: Clock },
    { title: "My Children", url: "/dashboard/parent/children", icon: Heart },
    { title: "Messages", url: "/dashboard/parent/messages", icon: MessageSquare },
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
        ...baseItems.slice(0, 4), // Keep first 4 items (Dashboard, Notifications, Schedule, Grade Reports)
        { title: "Phản Hồi Học Sinh", url: "/dashboard/teacher/feedback", icon: BarChart3 },
        { title: "Vi Phạm Học Sinh", url: "/dashboard/teacher/violations", icon: AlertTriangle },
        ...baseItems.slice(4) // Add remaining items
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

  // Handle chatbot toggle for parent role
  const handleChatbotClick = () => {
    if (role === 'parent') {
      setIsChatbotOpen(true)
      setIsChatbotMinimized(false)
    }
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          {/* Logo Icon - Contained properly */}
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 shrink-0">
            <Zap className="h-4 w-4 text-white" />
          </div>

          {/* Brand Text - Hidden when collapsed */}
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-sidebar-foreground">
                EduConnect
              </h1>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                Portal
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {/* Special handling for chatbot button */}
                  {item.isSpecial && item.title === "Trợ Lý AI" ? (
                    <SidebarMenuButton onClick={handleChatbotClick} className="cursor-pointer">
                      <item.icon />
                      <span>{item.title}</span>
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                        {/* Show notification badge for exchange requests */}
                        {(item.title === "Exchange Requests" && counts.pending > 0) && (
                          <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center text-xs">
                            {counts.pending}
                          </Badge>
                        )}
                        {/* Show notification badge for notifications */}
                        {(item.title === "Notifications" && notificationCounts.unread > 0) && (
                          <Badge variant="destructive" className="ml-auto h-5 w-5 flex items-center justify-center text-xs">
                            {notificationCounts.unread}
                          </Badge>
                        )}
                      </a>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 pb-6 group-data-[collapsible=icon]:pb-8">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:mb-2">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="Avatar" />
                    <AvatarFallback>
                      {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                    <span className="text-sm font-medium truncate w-full">
                      {profile?.full_name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground truncate w-full">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto shrink-0 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <User2 className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push('/profile?tab=settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Chatbot for parent role */}
      {role === 'parent' && (
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