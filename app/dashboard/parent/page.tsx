'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import { useAuth } from '@/hooks/use-auth'
import {
  getParentStudentsAction,
  getParentStudentsByYearAction,
  getAcademicYearsAction,
  type StudentInfo
} from '@/lib/actions/parent-actions'
import { Users, GraduationCap, Calendar, Plus, AlertCircle, User, School } from 'lucide-react'

export default function ParentDashboard() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  const [students, setStudents] = useState<StudentInfo[]>([])
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; is_current: boolean }[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [studentsLoading, setStudentsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'parent')) {
      router.push('/dashboard')
    }
  }, [loading, user, profile, router])

  useEffect(() => {
    if (!loading && user && profile?.role === 'parent') {
      loadInitialData()
    }
  }, [loading, user, profile])

  useEffect(() => {
    if (selectedYear && selectedYear !== 'all') {
      loadStudentsByYear(selectedYear)
    } else {
      loadAllStudents()
    }
  }, [selectedYear])

  const loadInitialData = async () => {
    // Load academic years
    const yearsResult = await getAcademicYearsAction()
    if (yearsResult.success && yearsResult.data) {
      setAcademicYears(yearsResult.data)
      // Set current year as default
      const currentYear = yearsResult.data.find(year => year.is_current)
      if (currentYear) {
        setSelectedYear(currentYear.id)
      }
    }
  }

  const loadAllStudents = async () => {
    setStudentsLoading(true)
    const result = await getParentStudentsAction()
    if (result.success && result.data) {
      setStudents(result.data)
    } else {
      setError(result.error || 'Failed to load students')
    }
    setStudentsLoading(false)
  }

  const loadStudentsByYear = async (yearId: string) => {
    setStudentsLoading(true)
    const result = await getParentStudentsByYearAction(yearId)
    if (result.success && result.data) {
      setStudents(result.data)
    } else {
      setError(result.error || 'Failed to load students')
    }
    setStudentsLoading(false)
  }

  // Show loading state
  if (loading) {
    return (
      <SidebarLayout role="parent" title="Parent Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </SidebarLayout>
    )
  }

  // Show access denied if no permission
  if (!user || profile?.role !== 'parent') {
    return (
      <SidebarLayout role="parent" title="Access Denied">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout role="parent" title="Parent Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, {profile.full_name || 'Parent'}!
            </h1>
            <p className="text-muted-foreground">
              Manage your children&apos;s school activities and stay connected with their education.
            </p>
          </div>
          <Button onClick={() => router.push('/dashboard/parent/leave-application')}>
            <Plus className="mr-2 h-4 w-4" />
            Create Leave Application
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Academic Year Filter */}
        <div className="flex items-center gap-4">
          <label htmlFor="academic-year" className="text-sm font-medium">
            Academic Year:
          </label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {academicYears.map(year => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name} {year.is_current && '(Current)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Children</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">
                {selectedYear && selectedYear !== 'all' ? 'In selected year' : 'Total children'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter(s => s.current_class).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently enrolled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Academic Years</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{academicYears.length}</div>
              <p className="text-xs text-muted-foreground">
                Available years
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Students List */}
        <Card>
          <CardHeader>
            <CardTitle>My Children</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedYear && selectedYear !== 'all'
                ? `Students in ${academicYears.find(y => y.id === selectedYear)?.name || 'selected year'}`
                : 'All your children across all academic years'
              }
            </p>
          </CardHeader>
          <CardContent>
            {studentsLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No children found</p>
                <p className="text-sm text-gray-400">
                  {selectedYear && selectedYear !== 'all' ? 'No children in the selected academic year' : 'No children registered'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{student.full_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Student ID: {student.student_id}
                        </p>
                        {student.current_class && (
                          <div className="flex items-center gap-2 mt-1">
                            <School className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-600">
                              {student.current_class.name} - {student.current_class.academic_year}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {student.current_class ? (
                        <Badge variant="default">Enrolled</Badge>
                      ) : (
                        <Badge variant="secondary">Not Enrolled</Badge>
                      )}
                      {student.current_class?.homeroom_teacher && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Homeroom Teacher</p>
                          <p className="text-sm font-medium">
                            {student.current_class.homeroom_teacher.full_name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}
