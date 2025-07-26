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
  BarChart3,
  Settings2,
  ChevronDown,
  ChevronUp,
  User2,
  UserCheck,
  Building,
  Bell,
  Clock
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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { UserRole } from '@/lib/types'
import { type AdminType } from '@/lib/admin-utils'
import { NotificationBadge } from '@/components/notifications/notification-badge'

// Platform items for each role
const platformItems = {
  admin: [
    { title: "Dashboard", url: "/dashboard/admin", icon: Home },
    { title: "Users", url: "/dashboard/admin/users", icon: Users },
    { title: "Analytics", url: "/dashboard/admin/analytics", icon: BarChart3 },
    { title: "Settings", url: "/dashboard/admin/settings", icon: Settings2 },
  ],
  school_admin: [
    { title: "Dashboard", url: "/dashboard/admin", icon: Home },
    { title: "Notifications", url: "/dashboard/admin/notifications", icon: Bell },
    { title: "Academic", url: "/dashboard/admin/academic", icon: Calendar },
    { title: "Classes", url: "/dashboard/admin/classes", icon: GraduationCap },
    { title: "Subjects", url: "/dashboard/admin/subjects", icon: BookOpen },
    { title: "Classrooms", url: "/dashboard/admin/classrooms", icon: Building },
    { title: "Timetable", url: "/dashboard/admin/timetable", icon: Calendar },
    { title: "Teacher Assignments", url: "/dashboard/admin/teacher-assignments", icon: UserCheck },
    { title: "Analytics", url: "/dashboard/admin/analytics", icon: BarChart3 },
    { title: "Settings", url: "/dashboard/admin/settings", icon: Settings2 },
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
    { title: "Analytics", url: "/dashboard/admin/analytics", icon: BarChart3 },
    { title: "Settings", url: "/dashboard/admin/settings", icon: Settings2 },
  ],
  teacher: [
    { title: "Dashboard", url: "/dashboard/teacher", icon: Home },
    { title: "Notifications", url: "/dashboard/teacher/notifications", icon: Bell },
    { title: "Lịch Giảng Dạy", url: "/dashboard/teacher/schedule", icon: Calendar },
    { title: "Họp Phụ Huynh", url: "/dashboard/teacher/meetings", icon: Users },
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
    { title: "Meeting Schedules", url: "/dashboard/parent/meetings", icon: Calendar },
    { title: "Leave Application", url: "/dashboard/parent/leave-application", icon: FileText },
    { title: "Leave Status", url: "/dashboard/parent/leave-status", icon: Clock },
    { title: "My Children", url: "/dashboard/parent/children", icon: Heart },
    { title: "Messages", url: "/dashboard/parent/messages", icon: MessageSquare },
  ],
}

// Projects items
const projects = [
  { name: "Course Management", url: "#", icon: BookOpen },
  { name: "Student Progress", url: "#", icon: BarChart3 },
  { name: "Communication", url: "#", icon: MessageSquare },
]

interface AppSidebarProps {
  role: UserRole
  adminType?: AdminType
}

export function AppSidebar({ role, adminType }: AppSidebarProps) {
  // Determine which items to show based on role and admin type
  let items: typeof platformItems.admin = []

  if (role === 'admin') {
    if (adminType === null) {
      // Full access for backwards compatibility
      items = platformItems.admin_full
    } else if (adminType === 'admin') {
      // User management admin
      items = platformItems.admin
    } else if (adminType === 'school_admin') {
      // School admin
      items = platformItems.school_admin
    } else {
      // Default to full access
      items = platformItems.admin_full
    }
  } else {
    items = platformItems[role] || []
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  EduConnect Inc
                  <ChevronDown className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem>
                  <span>EduConnect Inc</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>EduConnect Pro</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
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
                      {item.title === 'Notifications' && <NotificationBadge />}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                Projects
                <ChevronDown className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {projects.map((project) => (
                    <SidebarMenuItem key={project.name}>
                      <SidebarMenuButton asChild>
                        <a href={project.url}>
                          <project.icon />
                          <span>{project.name}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> Username
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
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
