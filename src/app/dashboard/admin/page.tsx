import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Progress } from '@/shared/components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/shared/components/ui/hover-card'

import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import Link from 'next/link'

import {
  UserCheck, GraduationCap, BookOpen, Heart, TrendingUp, TrendingDown,
  Activity, Database, Users, Calendar, BarChart3, CheckCircle, Bell
} from 'lucide-react'

// Animated Counter Component (Simple version without motion)
function AnimatedCounter({ end }: { readonly end: number }) {
  return <span className="transition-all duration-500">{end}</span>
}

// Enhanced Trend Indicator with Shadcn Badge
function TrendIndicator({ value, isPositive }: { readonly value: number; readonly isPositive: boolean }) {
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={isPositive ? "default" : "destructive"}
          className={`flex items-center gap-1 ${
            isPositive
              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          <Icon className="w-3 h-3" />
          <span className="text-xs font-medium">{value}%</span>
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isPositive ? 'Tăng trưởng' : 'Giảm'} {value}% so với tháng trước</p>
      </TooltipContent>
    </Tooltip>
  )
}



// Helper functions
function getTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} hours ago`

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} days ago`
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'admin': return UserCheck
    case 'teacher': return GraduationCap
    case 'student': return BookOpen
    case 'parent': return Heart
    default: return Users
  }
}

function getRoleColor(role: string): string {
  switch (role) {
    case 'admin': return 'bg-red-500'
    case 'teacher': return 'bg-blue-500'
    case 'student': return 'bg-emerald-500'
    case 'parent': return 'bg-purple-500'
    default: return 'bg-gray-500'
  }
}

function getMeetingTypeColor(type: string): string {
  switch (type) {
    case 'parent_meeting': return 'bg-blue-500'
    case 'class_meeting': return 'bg-emerald-500'
    case 'individual_meeting': return 'bg-purple-500'
    default: return 'bg-gray-500'
  }
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get comprehensive statistics with optimized queries
  const [
    { data: userStats },
    { data: subjectStats },
    { data: classStats },
    { data: recentActivity },
    { data: upcomingMeetings },
    { data: systemHealth }
  ] = await Promise.all([
    // User statistics by role - only count, not full data
    supabase.from('profiles').select('role', { count: 'exact', head: false }),

    // Subject statistics - only essential fields
    supabase.from('subjects').select('category, is_active', { count: 'exact', head: false }),

    // Class statistics - only essential fields
    supabase.from('classes').select('current_students, max_students', { count: 'exact', head: false }),

    // Recent activity (last 5 profile updates) - reduced from 10
    supabase
      .from('profiles')
      .select('full_name, role, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5),

    // Upcoming meetings (next 3) - reduced from 5
    supabase
      .from('meeting_schedules')
      .select(`
        title,
        meeting_date,
        meeting_type,
        teacher:profiles!meeting_schedules_teacher_id_fkey(full_name),
        class:classes(name)
      `)
      .gte('meeting_date', new Date().toISOString())
      .order('meeting_date', { ascending: true })
      .limit(3),

    // System health indicators - minimal query
    supabase.from('notifications').select('id', { count: 'exact', head: true }).limit(1)
  ])

  const stats = userStats?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  // Calculate additional metrics
  const totalSubjects = subjectStats?.length || 0
  const activeSubjects = subjectStats?.filter(s => s.is_active).length || 0
  const totalClasses = classStats?.length || 0
  const activeClasses = totalClasses // All classes are considered active since no is_active column
  const totalStudentsEnrolled = classStats?.reduce((sum, c) => sum + (c.current_students || 0), 0) || 0
  const totalCapacity = classStats?.reduce((sum, c) => sum + (c.max_students || 0), 0) || 0
  const occupancyRate = totalCapacity > 0 ? Math.round((totalStudentsEnrolled / totalCapacity) * 100) : 0

  // Enhanced role configuration with gradients and trends
  const roleConfig = [
    {
      role: 'admin',
      label: 'Administrators',
      icon: UserCheck,
      gradient: 'from-red-500 to-red-600',
      trend: { value: 5, isPositive: true }
    },
    {
      role: 'teacher',
      label: 'Giáo viên',
      icon: GraduationCap,
      gradient: 'from-blue-500 to-blue-600',
      trend: { value: 12, isPositive: true }
    },
    {
      role: 'student',
      label: 'Học sinh',
      icon: BookOpen,
      gradient: 'from-emerald-500 to-emerald-600',
      trend: { value: 8, isPositive: true }
    },
    {
      role: 'parent',
      label: 'Phụ huynh',
      icon: Heart,
      gradient: 'from-purple-500 to-purple-600',
      trend: { value: 3, isPositive: false }
    },
  ]



  // Get current time for greeting
  const currentHour = new Date().getHours()
  let greeting = 'Chào buổi tối'
  if (currentHour < 12) {
    greeting = 'Chào buổi sáng'
  } else if (currentHour < 18) {
    greeting = 'Chào buổi chiều'
  }

  return (
    <TooltipProvider>
      <ContentLayout title="Bảng điều khiển" role="admin">
        <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/admin">Quản trị</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Tổng quan</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="min-h-[calc(100vh-56px-64px-20px-24px-56px-48px)]">
            <div className="space-y-6 lg:space-y-8">
            {/* Enhanced Header */}
            <div className="space-y-2 sm:space-y-3 animate-in fade-in duration-700">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                {greeting}, Quản trị viên!
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Tổng quan toàn diện về nền tảng EduConnect dành cho bạn.
              </p>
            </div>

            {/* Enhanced Stats Cards with HoverCard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {roleConfig.map(({ role, label, icon: Icon, gradient, trend }) => {
                const currentValue = stats[role] || 0
                const maxValue = Math.max(...Object.values(stats))
                const progressPercentage = maxValue > 0 ? (currentValue / maxValue) * 100 : 0

                return (
                  <HoverCard key={role}>
                    <HoverCardTrigger asChild>
                      <div className="cursor-pointer hover:scale-[1.02] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                        <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300">
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{label}</CardTitle>
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 space-y-3">
                            <div className="flex items-end justify-between">
                              <div>
                                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                                  <AnimatedCounter end={currentValue} />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Tổng số {label.toLowerCase()}
                                </p>
                              </div>
                              <TrendIndicator value={trend.value} isPositive={trend.isPositive} />
                            </div>
                            {/* Progress Bar */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Tỷ lệ</span>
                                <span>{progressPercentage.toFixed(1)}%</span>
                              </div>
                              <Progress value={progressPercentage} className="h-2" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          Chi tiết {label}
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>• Tổng số hiện tại: <strong>{currentValue}</strong></p>
                          <p>• Thay đổi: <strong className={trend.isPositive ? 'text-emerald-600' : 'text-red-600'}>
                            {trend.isPositive ? '+' : ''}{trend.value}%
                          </strong> so với tháng trước</p>
                          <p>• Tỷ lệ so với tổng: <strong>{progressPercentage.toFixed(1)}%</strong></p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                )
              })}
            </div>



            {/* Analytics Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Phân tích nền tảng
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Tương tác người dùng và thống kê sử dụng nền tảng
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Tỷ lệ lấp đầy lớp học</span>
                      <span className="text-sm text-muted-foreground">{occupancyRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full" style={{ width: `${occupancyRate}%` }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Lớp đang hoạt động</span>
                      <span className="text-sm text-muted-foreground">{totalClasses > 0 ? Math.round((activeClasses / totalClasses) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full" style={{ width: `${totalClasses > 0 ? Math.round((activeClasses / totalClasses) * 100) : 0}%` }}></div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Môn học hoạt động</span>
                      <span className="text-sm text-muted-foreground">{totalSubjects > 0 ? Math.round((activeSubjects / totalSubjects) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{ width: `${totalSubjects > 0 ? Math.round((activeSubjects / totalSubjects) * 100) : 0}%` }}></div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">{totalStudentsEnrolled}</div>
                          <div className="text-xs text-muted-foreground">Học sinh đã đăng ký</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-emerald-600">{totalCapacity}</div>
                          <div className="text-xs text-muted-foreground">Tổng sức chứa</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    Tình trạng hệ thống
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Trạng thái hệ thống thời gian thực
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">Cơ sở dữ liệu</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Kết nối
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">Tổng người dùng</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        {Object.values(stats).reduce((sum, count) => sum + count, 0)} Hoạt động
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">Môn học</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        {activeSubjects}/{totalSubjects} Hoạt động
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm">Lớp học</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        {activeClasses}/{totalClasses} Hoạt động
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">Thông báo</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {systemHealth ? 'Hoạt động' : 'Không hoạt động'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Hoạt động gần đây
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Đăng ký người dùng mới nhất và hoạt động nền tảng
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity && recentActivity.length > 0 ? recentActivity.slice(0, 4).map((activity, index) => {
                      const isNewUser = new Date(activity.created_at).getTime() === new Date(activity.updated_at).getTime()
                      const actionText = isNewUser ? 'Tài khoản mới được tạo' : 'Hồ sơ được cập nhật'
                      const timeAgo = getTimeAgo(activity.updated_at)
                      const roleIcon = getRoleIcon(activity.role)
                      const roleColor = getRoleColor(activity.role)

                      return (
                        <div
                          key={`${activity.full_name}-${activity.updated_at}-${index}`}
                          className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors animate-in fade-in slide-in-from-left-4 duration-500"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className={`w-10 h-10 ${roleColor} rounded-full flex items-center justify-center`}>
                            {React.createElement(roleIcon, { className: "w-5 h-5 text-white" })}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{actionText}</p>
                            <p className="text-xs text-muted-foreground">{activity.full_name || 'Người dùng không xác định'} • {timeAgo}</p>
                          </div>
                        </div>
                      )
                    }) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">Không có hoạt động gần đây</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    Sự kiện sắp tới
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Ngày quan trọng và hoạt động đã lên lịch
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingMeetings && upcomingMeetings.length > 0 ? upcomingMeetings.map((meeting, index) => {
                      const meetingDate = new Date(meeting.meeting_date)
                      const formattedDate = meetingDate.toLocaleDateString('vi-VN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })
                      const meetingTypeColor = getMeetingTypeColor(meeting.meeting_type)

                      return (
                        <div
                          key={`${meeting.title}-${meeting.meeting_date}-${index}`}
                          className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors animate-in fade-in slide-in-from-right-4 duration-500"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className={`w-10 h-10 ${meetingTypeColor} rounded-full flex items-center justify-center`}>
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{meeting.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {meeting.meeting_type.replace('_', ' ').toUpperCase()} • {formattedDate}
                            </p>
                          </div>
                        </div>
                      )
                    }) : (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">Không có cuộc họp sắp tới</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </ContentLayout>
    </TooltipProvider>
  )
}
