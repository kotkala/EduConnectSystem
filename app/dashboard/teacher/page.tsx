import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Users, Calendar, Plus } from 'lucide-react'

export default async function TeacherDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is teacher
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    redirect('/dashboard')
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2 sm:space-y-3">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {profile.full_name || 'Teacher'}!
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your courses and track student progress.
            </p>
          </div>
          <Button className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-sm sm:text-base">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Create Course
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="p-3 sm:p-4 md:p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">My Courses</CardTitle>
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Active courses
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Total Students</CardTitle>
              <Users className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">47</div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Enrolled students
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">This Week</CardTitle>
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">5</div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Upcoming classes
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>
                Your active courses and enrollment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Introduction to Mathematics</h4>
                    <p className="text-sm text-muted-foreground">15 students enrolled</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Advanced Physics</h4>
                    <p className="text-sm text-muted-foreground">12 students enrolled</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Chemistry Basics</h4>
                    <p className="text-sm text-muted-foreground">20 students enrolled</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest student submissions and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New assignment submitted</p>
                    <p className="text-xs text-muted-foreground">John Doe - Math Assignment 3</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Student question posted</p>
                    <p className="text-xs text-muted-foreground">Sarah Smith - Physics Discussion</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Assignment due reminder</p>
                    <p className="text-xs text-muted-foreground">Chemistry Lab Report - Due tomorrow</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
