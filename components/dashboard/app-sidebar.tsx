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
  User2
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { UserRole } from '@/lib/types'
import { LogOut, Settings } from 'lucide-react'

// Platform items for each role
const platformItems = {
  admin: [
    { title: "Dashboard", url: "/dashboard/admin", icon: Home },
    { title: "Users", url: "/dashboard/admin/users", icon: Users },
    { title: "Analytics", url: "/dashboard/admin/analytics", icon: BarChart3 },
    { title: "Settings", url: "/dashboard/admin/settings", icon: Settings2 },
  ],
  teacher: [
    { title: "Dashboard", url: "/dashboard/teacher", icon: Home },
    { title: "My Courses", url: "/dashboard/teacher/courses", icon: BookOpen },
    { title: "Students", url: "/dashboard/teacher/students", icon: GraduationCap },
    { title: "Schedule", url: "/dashboard/teacher/schedule", icon: Calendar },
  ],
  student: [
    { title: "Dashboard", url: "/dashboard/student", icon: Home },
    { title: "My Courses", url: "/dashboard/student/courses", icon: BookOpen },
    { title: "Assignments", url: "/dashboard/student/assignments", icon: FileText },
    { title: "Grades", url: "/dashboard/student/grades", icon: Award },
  ],
  parent: [
    { title: "Dashboard", url: "/dashboard/parent", icon: Home },
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
}

export function AppSidebar({ role }: AppSidebarProps) {
  const items = platformItems[role] || []
  const { user, profile, signOut } = useAuth()
  const router = useRouter()

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
                <SidebarMenuButton className="h-12">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} alt="Avatar" />
                    <AvatarFallback>
                      {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium">
                      {profile?.full_name || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto" />
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
                <DropdownMenuItem onClick={() => router.push('/settings')}>
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
