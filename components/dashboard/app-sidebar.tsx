'use client'

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
import { LogOut, Settings } from 'lucide-react'
import { useHomeroomTeacher } from '@/hooks/use-homeroom-teacher'

// Platform items for each role
const platformItems = {
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
  ],
  teacher: [
    { title: "Dashboard", url: "/dashboard/teacher", icon: Home },
    { title: "Notifications", url: "/dashboard/teacher/notifications", icon: Bell },
    { title: "Lịch Giảng Dạy", url: "/dashboard/teacher/schedule", icon: Calendar },
    { title: "Họp Phụ Huynh", url: "/dashboard/teacher/meetings", icon: Users },
    { title: "Homeroom Students", url: "/dashboard/teacher/homeroom-students", icon: Heart },
    { title: "Leave Requests", url: "/dashboard/teacher/leave-requests", icon: FileText },
    { title: "My Courses", url: "/dashboard/teacher/courses", icon: BookOpen },
    { title: "Students", url: "/dashboard/teacher/students", icon: GraduationCap },
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
    { title: "Phản Hồi Học Tập", url: "/dashboard/parent/feedback", icon: BarChart3 },
    { title: "Meeting Schedules", url: "/dashboard/parent/meetings", icon: Calendar },
    { title: "Leave Application", url: "/dashboard/parent/leave-application", icon: FileText },
    { title: "Leave Status", url: "/dashboard/parent/leave-status", icon: Clock },
    { title: "My Children", url: "/dashboard/parent/children", icon: Heart },
    { title: "Messages", url: "/dashboard/parent/messages", icon: MessageSquare },
  ],
}



interface AppSidebarProps {
  role: UserRole
}

export function AppSidebar({ role }: AppSidebarProps) {
  const baseItems = platformItems[role] || []
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const { isHomeroomTeacher } = useHomeroomTeacher()

  // Add feedback link for homeroom teachers
  const items = role === 'teacher' && isHomeroomTeacher
    ? [
        ...baseItems.slice(0, 4), // Keep first 4 items (Dashboard, Notifications, Schedule, Meetings)
        { title: "Phản Hồi Học Sinh", url: "/dashboard/teacher/feedback", icon: BarChart3 },
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
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
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
    </Sidebar>
  )
}