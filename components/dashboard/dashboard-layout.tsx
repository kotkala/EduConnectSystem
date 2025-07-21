'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/lib/types'
import { 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  Users,
  BookOpen,
  GraduationCap,
  Heart
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: UserRole
  title: string
}

const roleConfig = {
  admin: {
    color: 'bg-red-500',
    icon: Users,
    label: 'Administrator'
  },
  teacher: {
    color: 'bg-blue-500',
    icon: GraduationCap,
    label: 'Teacher'
  },
  student: {
    color: 'bg-green-500',
    icon: BookOpen,
    label: 'Student'
  },
  parent: {
    color: 'bg-purple-500',
    icon: Heart,
    label: 'Parent'
  }
}

export function DashboardLayout({ children, role, title }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  
  const config = roleConfig[role]
  const RoleIcon = config.icon

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg lg:translate-x-0 lg:static lg:inset-0"
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center`}>
              <RoleIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">EduConnect</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Avatar className="w-10 h-10">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback>
                {profile?.full_name ? getInitials(profile.full_name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {profile?.full_name || user?.email}
              </p>
              <Badge variant="secondary" className="text-xs">
                {config.label}
              </Badge>
            </div>
          </div>
        </div>

        <nav className="px-4 space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => router.push('/dashboard')}
          >
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          
          {role === 'admin' && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/admin/users')}
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
            </>
          )}
          
          {role === 'teacher' && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/teacher/courses')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                My Courses
              </Button>
            </>
          )}
          
          {role === 'student' && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/student/courses')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                My Courses
              </Button>
            </>
          )}
          
          {role === 'parent' && (
            <>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push('/dashboard/parent/children')}
              >
                <Heart className="w-4 h-4 mr-2" />
                My Children
              </Button>
            </>
          )}
        </nav>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
