import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

import {
  UserCheck, GraduationCap, BookOpen, Heart, TrendingUp, TrendingDown,
  Plus, Bell, FileText, Settings, Activity, Database,
  Users, Calendar, BarChart3, CheckCircle
} from 'lucide-react'
// Animated Counter Component (Simple version without motion)
function AnimatedCounter({ end }: { end: number }) {
  return <span className="transition-all duration-500">{end}</span>
}

// Trend Indicator Component
function TrendIndicator({ value, isPositive }: { value: number; isPositive: boolean }) {
  const Icon = isPositive ? TrendingUp : TrendingDown
  const colorClass = isPositive ? 'text-emerald-600' : 'text-red-600'

  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      <Icon className="w-3 h-3" />
      <span className="text-xs font-medium">{value}%</span>
    </div>
  )
}

// Quick Action Card Component
function QuickActionCard({
  icon: Icon,
  title,
  description,
  onClick
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick?: () => void
}) {
  return (
    <div
      className="cursor-pointer hover:scale-[1.02] transition-transform duration-200"
      onClick={onClick}
    >
      <Card className="p-4 hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </Card>
    </div>
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

  // Get comprehensive statistics
  const [
    { data: userStats },
    { data: subjectStats },
    { data: classStats },
    { data: recentActivity },
    { data: upcomingMeetings },
    { data: systemHealth }
  ] = await Promise.all([
    // User statistics by role
    supabase.from('profiles').select('role'),

    // Subject statistics
    supabase.from('subjects').select('category, is_active'),

    // Class statistics
    supabase.from('classes').select('current_students, max_students'),

    // Recent activity (last 10 profile updates)
    supabase
      .from('profiles')
      .select('full_name, role, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10),

    // Upcoming meetings
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
      .limit(5),

    // System health indicators
    supabase.from('notifications').select('id, created_at').limit(1)
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
      label: 'Teachers',
      icon: GraduationCap,
      gradient: 'from-blue-500 to-blue-600',
      trend: { value: 12, isPositive: true }
    },
    {
      role: 'student',
      label: 'Students',
      icon: BookOpen,
      gradient: 'from-emerald-500 to-emerald-600',
      trend: { value: 8, isPositive: true }
    },
    {
      role: 'parent',
      label: 'Parents',
      icon: Heart,
      gradient: 'from-purple-500 to-purple-600',
      trend: { value: 3, isPositive: false }
    },
  ]

  // Quick actions configuration
  const quickActions = [
    { icon: Plus, title: 'Add User', description: 'Create new account' },
    { icon: Bell, title: 'Send Notification', description: 'Broadcast message' },
    { icon: FileText, title: 'Generate Report', description: 'Export analytics' },
    { icon: Settings, title: 'System Settings', description: 'Configure platform' },
  ]

  // Get current time for greeting
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <SidebarLayout role="admin" title="Admin Dashboard">
      <div className="space-y-6 lg:space-y-8">
        {/* Enhanced Header */}
        <div className="space-y-2 sm:space-y-3 animate-in fade-in duration-700">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
            {greeting}, Administrator!
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here&apos;s your comprehensive overview of the EduConnect platform.
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
                        Total {label.toLowerCase()}
                      </p>
                    </div>
                    <TrendIndicator value={trend.value} isPositive={trend.isPositive} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.title}
                icon={action.icon}
                title={action.title}
                description={action.description}
              />
            ))}
          </div>
        </div>

        {/* Analytics Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Platform Analytics
              </CardTitle>
              <CardDescription>
                User engagement and platform usage statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Class Occupancy Rate</span>
                  <span className="text-sm text-muted-foreground">{occupancyRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full" style={{ width: `${occupancyRate}%` }}></div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active Classes</span>
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
                      <div className="text-xs text-muted-foreground">Students Enrolled</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-600">{totalCapacity}</div>
                      <div className="text-xs text-muted-foreground">Total Capacity</div>
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
                System Health
              </CardTitle>
              <CardDescription>
                Real-time system status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm">Database</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm">Total Users</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    {Object.values(stats).reduce((sum, count) => sum + count, 0)} Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm">Subjects</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {activeSubjects}/{totalSubjects} Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm">Classes</span>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    {activeClasses}/{totalClasses} Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Notifications</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {systemHealth ? 'Active' : 'Inactive'}
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
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest user registrations and platform activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity && recentActivity.length > 0 ? recentActivity.slice(0, 4).map((activity, index) => {
                  const isNewUser = new Date(activity.created_at).getTime() === new Date(activity.updated_at).getTime()
                  const actionText = isNewUser ? 'New account created' : 'Profile updated'
                  const timeAgo = getTimeAgo(activity.updated_at)
                  const roleIcon = getRoleIcon(activity.role)
                  const roleColor = getRoleColor(activity.role)

                  return (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors animate-in fade-in slide-in-from-left-4 duration-500"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className={`w-10 h-10 ${roleColor} rounded-full flex items-center justify-center`}>
                        {React.createElement(roleIcon, { className: "w-5 h-5 text-white" })}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{actionText}</p>
                        <p className="text-xs text-muted-foreground">{activity.full_name || 'Unknown User'} • {timeAgo}</p>
                      </div>
                    </div>
                  )
                }) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Upcoming Events
              </CardTitle>
              <CardDescription>
                Important dates and scheduled activities
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
                      key={index}
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
                    <p className="text-sm">No upcoming meetings</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  )
}
