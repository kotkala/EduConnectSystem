import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'


import {
  UserCheck, GraduationCap, BookOpen, Heart, TrendingUp, TrendingDown,
  Bell, Activity, Database,
  Users, Calendar, BarChart3, CheckCircle
} from 'lucide-react'


// Animated Counter Component (Simple version without motion)
function AnimatedCounter({ end }: { readonly end: number }) {
  return <span className="transition-all duration-500">{end}</span>
}

// Trend Indicator Component
function TrendIndicator({ value, isPositive }: { readonly value: number; readonly isPositive: boolean }) {
  const Icon = isPositive ? TrendingUp : TrendingDown
  const colorClass = isPositive ? 'text-emerald-600' : 'text-red-600'

  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">{value}%</span>
    </div>
  )
}



// Helper functions
function getTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Vừa xong'
  if (diffInMinutes < 60) return `${diffInMinutes} phút trước`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours} giờ trước`

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} ngày trước`
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
      label: 'Quản trị viên',
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
    <div className="space-y-6 lg:space-y-8 p-6">
        {/* Enhanced Header */}
        <div className="space-y-2 sm:space-y-3 animate-in fade-in duration-700">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            {greeting}, Quản trị viên!
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Tổng quan toàn diện về nền tảng EduConnect dành cho bạn.
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {roleConfig.map(({ role, label, icon: Icon, gradient, trend }) => (
            <div
              key={role}
              className="cursor-pointer hover:scale-[1.02] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
            >
              <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">{label}</CardTitle>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                        <AnimatedCounter end={stats[role] || 0} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Tổng số {label.toLowerCase()}
                      </p>
                    </div>
                    <TrendIndicator value={trend.value} isPositive={trend.isPositive} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Phân tích nền tảng
              </CardTitle>
              <CardDescription>
                Tương tác người dùng và thống kê sử dụng nền tảng
              </CardDescription>
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
                  <span className="text-sm font-medium">Active Subjects</span>
                  <span className="text-sm text-muted-foreground">{totalSubjects > 0 ? Math.round((activeSubjects / totalSubjects) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full" style={{ width: `${totalSubjects > 0 ? Math.round((activeSubjects / totalSubjects) * 100) : 0}%` }}></div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">{totalStudentsEnrolled}</div>
                      <div className="text-xs text-muted-foreground">Học sinh đã ghi danh</div>
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
              <CardDescription>
                Trạng thái hệ thống theo thời gian thực
              </CardDescription>
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
                    Đã kết nối
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm">Tổng người dùng</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    {Object.values(stats).reduce((sum, count) => sum + count, 0)} đang hoạt động
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm">Môn học</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {activeSubjects}/{totalSubjects} đang hoạt động
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm">Lớp học</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {activeClasses}/{totalClasses} đang hoạt động
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
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Hoạt động gần đây
              </CardTitle>
              <CardDescription>
                Đăng ký người dùng mới và hoạt động trên nền tảng
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity && recentActivity.length > 0 ? recentActivity.slice(0, 4).map((activity, index) => {
                  const isNewUser = new Date(activity.created_at).getTime() === new Date(activity.updated_at).getTime()
                  const actionText = isNewUser ? 'Tạo tài khoản mới' : 'Cập nhật hồ sơ'
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

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Sự kiện sắp tới
              </CardTitle>
              <CardDescription>
                Ngày quan trọng và hoạt động đã lên lịch
              </CardDescription>
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
  )
}
