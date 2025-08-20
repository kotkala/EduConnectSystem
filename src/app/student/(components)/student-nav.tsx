'use client'

import Link from 'next/link'
import { Bell, Home, BookOpen, FileText, Award, User, LogOut, Settings, TrendingUp, Calendar } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/shared/components/ui/dropdown-menu'
import { useAuth } from '@/features/authentication/hooks/use-auth'

const links = [
  { href: '/student', icon: Home, label: 'Tổng quan' },
  { href: '/student/notifications', icon: Bell, label: 'Thông báo' },
  { href: '/student/courses', icon: BookOpen, label: 'Khoá học' },
  { href: '/student/assignments', icon: FileText, label: 'Bài tập' },
  { href: '/student/grades', icon: Award, label: 'Điểm số' },
  { href: '/student/timetable', icon: Calendar, label: 'Thời khóa biểu' },
  { href: '/student/grade-improvement', icon: TrendingUp, label: 'Cải thiện điểm' },
]

export function StudentNav() {
  const pathname = usePathname()
  const { user, profile, signOut } = useAuth()

  return (
    <nav className="sticky top-0 z-40 -mx-3 sm:-mx-4 md:-mx-6 mb-4 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="mx-auto max-w-[1600px] px-3 sm:px-4 md:px-6">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm border',
                  'hover:bg-accent transition-colors whitespace-nowrap',
                  pathname === l.href ? 'bg-accent text-foreground' : 'bg-background'
                )}
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </Link>
            ))}
          </div>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={profile?.avatar_url || ''}
                    alt={profile?.full_name || 'Student'}
                  />
                  <AvatarFallback className="bg-blue-500 text-white">
                    {profile?.full_name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{profile?.full_name}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Hồ sơ</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile?tab=settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Cài đặt</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={signOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Đăng xuất</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}


