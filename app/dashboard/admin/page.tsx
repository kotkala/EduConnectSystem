import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UserCheck, GraduationCap, BookOpen, Heart } from 'lucide-react'

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

  // Get user statistics
  const { data: userStats } = await supabase
    .from('profiles')
    .select('role')

  const stats = userStats?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}

  const roleConfig = [
    { role: 'admin', label: 'Administrators', icon: UserCheck, color: 'bg-red-500' },
    { role: 'teacher', label: 'Teachers', icon: GraduationCap, color: 'bg-blue-500' },
    { role: 'student', label: 'Students', icon: BookOpen, color: 'bg-green-500' },
    { role: 'parent', label: 'Parents', icon: Heart, color: 'bg-purple-500' },
  ]

  return (
    <SidebarLayout role="admin" title="Admin Dashboard">
      <div className="space-y-6">
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Welcome back, Administrator!</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Here&apos;s an overview of your EduConnect platform.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {roleConfig.map(({ role, label, icon: Icon, color }) => (
            <Card key={role} className="p-3 sm:p-4 md:p-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                <CardTitle className="text-[10px] sm:text-xs font-medium flex-1 leading-tight">{label}</CardTitle>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg ${color} flex items-center justify-center shrink-0 ml-2`}>
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xl sm:text-2xl font-bold">{stats[role] || 0}</div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Total {label.toLowerCase()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest user registrations and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New student registered</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Teacher created new course</p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Parent account activated</p>
                    <p className="text-xs text-muted-foreground">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Current system health and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Database</span>
                  <Badge variant="default" className="bg-green-500">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Authentication</span>
                  <Badge variant="default" className="bg-green-500">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">File Storage</span>
                  <Badge variant="default" className="bg-green-500">Operational</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Email Service</span>
                  <Badge variant="default" className="bg-green-500">Operational</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  )
}
