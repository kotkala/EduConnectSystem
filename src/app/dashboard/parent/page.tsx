'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'

import { useAuth } from '@/features/authentication/hooks/use-auth'
import {
  getParentStudentsAction,
  getParentStudentsByYearAction,
  getAcademicYearsAction,
  type StudentInfo
} from '@/features/parent-dashboard/actions/parent-actions'
import { Users, GraduationCap, Calendar, Plus, AlertCircle, User, School } from 'lucide-react'
import { ParentMeetingSchedules } from '@/features/parent-dashboard/components/parent-dashboard/parent-meeting-schedules'


export default function ParentDashboard() {
  // ðŸš€ MIGRATION: Replace scattered loading with global system

  
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  const [students, setStudents] = useState<StudentInfo[]>([])
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string; is_current: boolean }[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [error, setError] = useState<string | null>(null)

  // Loading state
  const [isLoading, setIsLoading] = useState(false)

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

  const loadAllStudents = useCallback(async () => {
    setIsLoading(true)
    const result = await getParentStudentsAction()
    if (result.success && result.data) {
      setStudents(result.data)
    } else {
      setError(result.error || 'Không thể tải danh sách học sinh')
    }
    setIsLoading(false)
  }, [])

  const loadStudentsByYear = useCallback(async (yearId: string) => {
    setIsLoading(true)
    const result = await getParentStudentsByYearAction(yearId)
    if (result.success && result.data) {
      setStudents(result.data)
    } else {
      setError(result.error || 'Không thể tải danh sách học sinh')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (selectedYear && selectedYear !== 'all') {
      loadStudentsByYear(selectedYear)
    } else {
      loadAllStudents()
    }
  }, [selectedYear, loadAllStudents, loadStudentsByYear])

  // ðŸŽ¯ FIXED: Removed individual auth loading UI - handled by CoordinatedLoadingOverlay
  // Context7 principle: Prevents triple loading conflict (auth + global + custom spinner)

  // Show access denied if no permission
  if (!user || profile?.role !== 'parent') {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 md:w-20 lg:w-24 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Từ chối truy cập</h2>
          <p className="text-gray-600">Bạn không có quyền truy cập trang này.</p>
          <Button onClick={() => router.push('/dashboard')}>
            Quay lại bảng điều khiển
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ContentLayout title="Tổng quan" role="parent">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Tổng quan</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="space-y-8">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 md:h-14 lg:h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    Chào mừng trở lại!
                  </h1>
                  <p className="text-lg text-muted-foreground font-medium">
                    {profile.full_name || 'Phụ huynh'}
                  </p>
                </div>
              </div>
              <p className="text-muted-foreground max-w-2xl leading-relaxed">
                Quản lý hoạt động học tập của con em và luôn đồng hành cùng các em trong hành trình phát triển.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <ParentMeetingSchedules showUnreadCount={true} />
              <Button
                onClick={() => router.push('/dashboard/parent/leave-application')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl px-6 py-3 font-medium"
              >
                <Plus className="mr-2 h-5 w-5" />
                Tạo đơn xin nghỉ
              </Button>
            </div>
          </div>
        </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Modern Academic Year Filter */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-white/20 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <label htmlFor="academic-year" className="font-semibold text-gray-700">
                  Niên khóa học:
                </label>
              </div>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[240px] bg-white border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors">
                  <SelectValue placeholder="Chọn niên khóa" />
                </SelectTrigger>
                <SelectContent className="rounded-lg border-gray-200">
                  <SelectItem value="all" className="rounded-md">Tất cả niên khóa</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id} className="rounded-md">
                      {year.name} {year.is_current && '(Hiện tại)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Modern Summary Cards */}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200/50 shadow-lg shadow-blue-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 md:h-14 lg:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{students.length}</div>
                  <p className="text-sm text-blue-600 font-medium">
                    {selectedYear && selectedYear !== 'all' ? 'Trong niên khóa' : 'Tổng số con em'}
                  </p>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800">Con em của tôi</h3>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-2xl p-6 border border-emerald-200/50 shadow-lg shadow-emerald-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 md:h-14 lg:h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">
                    {students.filter(s => s.current_class).length}
                  </div>
                  <p className="text-sm text-emerald-600 font-medium">
                    Đang theo học
                  </p>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800">Lớp học hiện tại</h3>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 border border-purple-200/50 shadow-lg shadow-purple-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 md:h-14 lg:h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900">{academicYears.length}</div>
                  <p className="text-sm text-purple-600 font-medium">
                    Niên khóa có sẵn
                  </p>
                </div>
              </div>
              <h3 className="font-semibold text-gray-800">Niên khóa học</h3>
            </div>
          </div>

          {/* Modern Students List */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5">
            <div className="p-6 sm:p-8 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <School className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Con em của tôi</h2>
              </div>
              <p className="text-gray-600">
                {selectedYear && selectedYear !== 'all'
                  ? `Học sinh trong ${academicYears.find(y => y.id === selectedYear)?.name || 'niên khóa đã chọn'}`
                  : 'Tất cả con em qua các niên khóa học'
                }
              </p>
            </div>
            <div className="p-6 sm:p-8">
              {(() => {
                if (isLoading && students.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="space-y-4 mb-4">
          <Skeleton className="h-12 md:h-14 lg:h-16 w-12 rounded-full mx-auto"  aria-label="Loading content" role="status" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px] mx-auto"  aria-label="Loading content" role="status" />
            <Skeleton className="h-4 w-[150px] mx-auto"  aria-label="Loading content" role="status" />
          </div>
        </div>
                      <p className="text-gray-600 font-medium">Đang tải thông tin học sinh...</p>
                    </div>
                  )
                }

                if (students.length === 0) {
                  const noChildrenMessage = selectedYear && selectedYear !== 'all'
                    ? 'Không có con em nào trong niên khóa đã chọn'
                    : 'Chưa có con em nào được đăng ký'

                  return (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-16 md:w-20 lg:w-24 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 md:h-9 lg:h-10 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Không tìm thấy học sinh</h3>
                      <p className="text-gray-500 text-center">{noChildrenMessage}</p>
                    </div>
                  )
                }

                return (
                  <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                    {students
                      .filter((student, index, self) =>
                        index === self.findIndex(s => s.id === student.id)
                      )
                      .map((student) => (
                      <div key={student.id} className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200/50 p-6 shadow-lg shadow-gray-500/5 hover:shadow-xl hover:shadow-gray-500/10 transition-all duration-300">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                            <User className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-gray-900 mb-1">{student.full_name}</h4>
                            <p className="text-sm text-gray-600 mb-3">
                              Mã học sinh: <span className="font-mono font-medium">{student.student_id}</span>
                            </p>

                            {student.current_class && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <School className="w-4 h-4 text-indigo-600" />
                                  <span className="text-sm font-medium text-gray-700">
                                    {student.current_class.name} - {student.current_class.academic_year}
                                  </span>
                                </div>

                                {student.current_class?.homeroom_teacher && (
                                  <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-emerald-600" />
                                    <span className="text-sm text-gray-600">
                                      GVCN: <span className="font-medium">{student.current_class.homeroom_teacher.full_name}</span>
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="mt-4 flex items-center justify-between">
                              {student.current_class ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                  Đang theo học
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  Chưa ghi danh
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          </div>
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
