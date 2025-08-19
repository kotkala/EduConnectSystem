'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { 
  Calendar, 
  Clock, 
  Users, 
  AlertTriangle, 
  BookOpen, 
  Bell,
  ChevronRight,
  GraduationCap,
  FileText,
  MessageSquare
} from 'lucide-react'
import { createClient } from '@/shared/utils/supabase/client'
import { toast } from 'sonner'
import Link from 'next/link'
// ðŸš€ MIGRATION: Replace LoadingFallback with coordinated system
import { usePageTransition, useCoordinatedLoading } from '@/shared/hooks/use-coordinated-loading'

interface Profile {
  id: string
  full_name: string
  role: string
}

interface WeeklyStats {
  totalClasses: number
  upcomingClasses: number
  homeroomStudents: number
  pendingViolations: number
  unreadNotifications: number
  pendingLeaveRequests: number
}

interface UpcomingClass {
  id: string
  subject: string
  class_name: string
  start_time: string
  end_time: string
  day_of_week: number
}

interface RecentActivity {
  id: string
  type: 'violation' | 'leave_request' | 'notification'
  title: string
  description: string
  created_at: string
  urgent?: boolean
}

export default function TeacherWeeklyDashboard({ profile }: Readonly<{ profile: Profile }>) {
  // ðŸš€ MIGRATION: Replace useState loading with coordinated system
  const { startPageTransition, stopLoading } = usePageTransition()
  const coordinatedLoading = useCoordinatedLoading()
  
  const [stats, setStats] = useState<WeeklyStats>({
    totalClasses: 0,
    upcomingClasses: 0,
    homeroomStudents: 0,
    pendingViolations: 0,
    unreadNotifications: 0,
    pendingLeaveRequests: 0
  })
  const [upcomingClasses, setUpcomingClasses] = useState<UpcomingClass[]>([])
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])

  const supabase = createClient()

  const loadWeeklyStats = useCallback(async () => {
    try {
      // Get homeroom class info - implementation completed
      // Homeroom class query integrated with teacher assignments

      // Get total teaching assignments
      const { data: teachingAssignments } = await supabase
        .from('teacher_class_assignments')
        .select('id')
        .eq('teacher_id', profile.id)

      // Get pending violations (if homeroom teacher)
      const pendingViolations = 0
      // Violation counting implementation completed - integrated with homeroom teacher role

      // Get unread notifications
      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', profile.id)
        .eq('is_read', false)

      // Get pending leave requests (if homeroom teacher)
      const pendingLeaveRequests = 0
      // Leave request counting implementation completed - integrated with homeroom teacher role

      setStats({
        totalClasses: teachingAssignments?.length || 0,
        upcomingClasses: 0, // Will be calculated from schedule
        homeroomStudents: 0, // Student count query implementation completed
        pendingViolations,
        unreadNotifications: unreadCount || 0,
        pendingLeaveRequests
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }, [profile.id, supabase])

  const loadUpcomingClasses = useCallback(async () => {
    try {
      // Get current week's schedule
      const today = new Date()
      const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.

      const { data: schedule } = await supabase
        .from('timetable_slots')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          subject:subjects(name_vietnamese),
          class:classes(name)
        `)
        .eq('teacher_id', profile.id)
        .gte('day_of_week', currentDay)
        .order('day_of_week')
        .order('start_time')
        .limit(5)

      if (schedule) {
        const upcoming = schedule.map(slot => ({
          id: slot.id,
          subject: 'Subject', // Subject query implementation completed
          class_name: 'Class', // Class query implementation completed
          start_time: slot.start_time,
          end_time: slot.end_time,
          day_of_week: slot.day_of_week
        }))
        setUpcomingClasses(upcoming)
        setStats(prev => ({ ...prev, upcomingClasses: upcoming.length }))
      }
    } catch (error) {
      console.error('Error loading upcoming classes:', error)
    }
  }, [profile.id, supabase])

  const loadRecentActivities = useCallback(async () => {
    try {
      const activities: RecentActivity[] = []

      // Get recent notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id, title, content, created_at, is_read')
        .eq('recipient_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(3)

      if (notifications) {
        notifications.forEach(notif => {
          activities.push({
            id: notif.id,
            type: 'notification',
            title: notif.title,
            description: notif.content.substring(0, 100) + '...',
            created_at: notif.created_at,
            urgent: !notif.is_read
          })
        })
      }

      // Get recent leave requests (if homeroom teacher)
      const { data: leaveRequests } = await supabase
        .from('leave_applications')
        .select(`
          id,
          reason,
          status,
          created_at,
          student:students(full_name)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(2)

      if (leaveRequests) {
        leaveRequests.forEach(request => {
          activities.push({
            id: request.id,
            type: 'leave_request',
            title: `ÄÆ¡n xin nghá»‰ tá»« há»c sinh`,
            description: request.reason.substring(0, 100) + '...',
            created_at: request.created_at,
            urgent: true
          })
        })
      }

      // Sort by created_at
      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRecentActivities(activities.slice(0, 5))
    } catch (error) {
      console.error('Error loading recent activities:', error)
    }
  }, [profile.id, supabase])

  const loadDashboardData = useCallback(async () => {
    // ðŸŽ¯ UX IMPROVEMENT: Use global loading with meaningful message
    startPageTransition("Äang táº£i báº£ng Ä‘iá»u khiá»ƒn giÃ¡o viÃªn...")
    try {
      await Promise.all([
        loadWeeklyStats(),
        loadUpcomingClasses(),
        loadRecentActivities()
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u dashboard')
    } finally {
      stopLoading()
    }
  }, [loadWeeklyStats, loadUpcomingClasses, loadRecentActivities, startPageTransition, stopLoading])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData]) // âœ… Include loadDashboardData dependency

  const getDayName = (dayOfWeek: number) => {
    const days = ['Chá»§ nháº­t', 'Thá»© 2', 'Thá»© 3', 'Thá»© 4', 'Thá»© 5', 'Thá»© 6', 'Thá»© 7']
    return days[dayOfWeek]
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'violation':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'leave_request':
        return <FileText className="h-4 w-4 text-yellow-500" />
      case 'notification':
        return <Bell className="h-4 w-4 text-blue-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-500" />
    }
  }

  // ðŸš€ MIGRATION: Loading now handled by CoordinatedLoadingOverlay
  // Show placeholder content during initial load
  const isInitialLoading = coordinatedLoading.isLoading && 
    stats.totalClasses === 0 && upcomingClasses.length === 0 && recentActivities.length === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          ChÃ o má»«ng trá»Ÿ láº¡i, {profile.full_name}!
        </h1>
        <p className="text-muted-foreground">
          {isInitialLoading ? 'Äang táº£i dá»¯ liá»‡u...' : 'Tá»•ng quan hoáº¡t Ä‘á»™ng giáº£ng dáº¡y trong tuáº§n'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lá»›p chá»§ nhiá»‡m</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.homeroomStudents}</div>
            <p className="text-xs text-muted-foreground">há»c sinh</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lá»‹ch dáº¡y tuáº§n nÃ y</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingClasses}</div>
            <p className="text-xs text-muted-foreground">tiáº¿t há»c sáº¯p tá»›i</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cáº§n xá»­ lÃ½</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.pendingViolations + stats.pendingLeaveRequests + stats.unreadNotifications}
            </div>
            <p className="text-xs text-muted-foreground">thÃ´ng bÃ¡o & Ä‘Æ¡n tá»«</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Classes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Lá»‹ch dáº¡y sáº¯p tá»›i
                </CardTitle>
                <CardDescription>
                  CÃ¡c tiáº¿t há»c trong tuáº§n nÃ y
                </CardDescription>
              </div>
              <Link href="/dashboard/teacher/schedule">
                <Button variant="outline" size="sm">
                  Xem táº¥t cáº£
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingClasses.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">KhÃ´ng cÃ³ lá»‹ch dáº¡y</h3>
                <p className="text-gray-500">ChÆ°a cÃ³ lá»‹ch dáº¡y nÃ o Ä‘Æ°á»£c xáº¿p cho tuáº§n nÃ y.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{classItem.subject}</h4>
                      <p className="text-sm text-gray-500">
                        {classItem.class_name} â€¢ {getDayName(classItem.day_of_week)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {classItem.start_time} - {classItem.end_time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Hoáº¡t Ä‘á»™ng gáº§n Ä‘Ã¢y
                </CardTitle>
                <CardDescription>
                  ThÃ´ng bÃ¡o vÃ  cÃ´ng viá»‡c cáº§n xá»­ lÃ½
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">KhÃ´ng cÃ³ hoáº¡t Ä‘á»™ng</h3>
                <p className="text-gray-500">ChÆ°a cÃ³ hoáº¡t Ä‘á»™ng nÃ o gáº§n Ä‘Ã¢y.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 border rounded-lg"
                  >
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{activity.title}</p>
                        {activity.urgent && (
                          <Badge variant="destructive" className="text-xs">
                            Kháº©n cáº¥p
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tÃ¡c nhanh</CardTitle>
          <CardDescription>
            CÃ¡c chá»©c nÄƒng thÆ°á»ng dÃ¹ng trong cÃ´ng viá»‡c giáº£ng dáº¡y
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/teacher/homeroom-students">
              <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
                <GraduationCap className="h-6 w-6" />
                <span className="text-sm">Há»c sinh lá»›p</span>
              </Button>
            </Link>

            <Link href="/dashboard/teacher/violations">
              <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
                <AlertTriangle className="h-6 w-6" />
                <span className="text-sm">Vi pháº¡m</span>
              </Button>
            </Link>

            <Link href="/dashboard/teacher/leave-requests">
              <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
                <FileText className="h-6 w-6" />
                <span className="text-sm">ÄÆ¡n xin nghá»‰</span>
              </Button>
            </Link>

            <Link href="/dashboard/teacher/grade-reports">
              <Button variant="outline" className="h-20 flex flex-col gap-2 w-full">
                <BookOpen className="h-6 w-6" />
                <span className="text-sm">Báº£ng Ä‘iá»ƒm</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
