"use client"

import { useState, useEffect, useCallback, useMemo } from "react"

import { Button } from "@/shared/components/ui/button"
import { AdminPageTemplate } from "@/shared/components/dashboard/admin-page-template"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Progress } from "@/shared/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/shared/components/ui/hover-card"
import { Badge } from "@/shared/components/ui/badge"
import { Plus, GraduationCap, Users, BookOpen,  } from "lucide-react"
import { ClassTable } from "@/features/admin-management/components/admin/class-table"
import { ClassForm } from "@/features/admin-management/components/admin/class-form"
import { getClassesAction, getHomeroomEnabledTeachersAction } from "@/features/admin-management/actions/class-actions"
import { getAcademicYearsAction, getSemestersAction } from "@/features/admin-management/actions/academic-actions"
import {
  type ClassWithDetails,
  type ClassFilters
} from "@/lib/validations/class-validations"
import { type AcademicYear, type Semester } from "@/lib/validations/academic-validations"



// Simple teacher interface for dropdown
interface SimpleTeacher {
  id: string
  full_name: string
  employee_id: string
}

export default function ClassManagementPage() {
  // Loading States
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  
  // Classes State
  const [classes, setClasses] = useState<ClassWithDetails[]>([])
  const [classesError, setClassesError] = useState<string | null>(null)
  const [classesTotal, setClassesTotal] = useState(0)
  const [classesPage, setClassesPage] = useState(1)
  const [classesFilters, setClassesFilters] = useState<ClassFilters>({ page: 1, limit: 10 })

  // Form Data State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [teachers, setTeachers] = useState<SimpleTeacher[]>([])

  // Dialog States
  const [showCreateClassDialog, setShowCreateClassDialog] = useState(false)

  // Fetch Classes
  const fetchClasses = useCallback(async () => {
    setIsLoadingClasses(true)
    setClassesError(null)

    try {
      const result = await getClassesAction(classesFilters)

      if (result.success) {
        setClasses(result.data)
        setClassesTotal(result.total)
        setClassesPage(result.page || 1)
      } else {
        const errorMessage = result.error || "Không thể tải danh sách lớp học"
        setClassesError(errorMessage)
        console.error("Lỗi tải danh sách lớp:", errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Không thể tải danh sách lớp học"
      setClassesError(errorMessage)
      console.error("Classes fetch exception:", err)
    } finally {
      setIsLoadingClasses(false)
    }
  }, [classesFilters])

  // Fetch Form Data with optimized loading
  const fetchFormData = useCallback(async () => {
    // Only fetch if data is not already loaded (simple caching)
    if (academicYears.length > 0 && semesters.length > 0 && teachers.length > 0) {
      return
    }

    try {
      const [academicYearsResult, semestersResult, teachersResult] = await Promise.all([
        getAcademicYearsAction({ page: 1, limit: 50 }),
        getSemestersAction({ page: 1, limit: 50 }),
        getHomeroomEnabledTeachersAction()
      ])

      if (academicYearsResult.success) {
        setAcademicYears(academicYearsResult.data)
      }

      if (semestersResult.success) {
        setSemesters(semestersResult.data)
      }

      if (teachersResult.success) {
        setTeachers(teachersResult.data)
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu biểu mẫu:", error)
    }
  }, [academicYears.length, semesters.length, teachers.length])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    fetchFormData()
  }, [fetchFormData])

  // Event Handlers
  const handleClassPageChange = (page: number) => {
    setClassesFilters(prev => ({ ...prev, page }))
  }

  const handleClassFiltersChange = (newFilters: Partial<ClassFilters>) => {
    setClassesFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleCreateClassSuccess = () => {
    setShowCreateClassDialog(false)
    fetchClasses()
  }

  const handleRefresh = () => {
    fetchClasses()
    fetchFormData()
  }

  // Calculate stats with memoization for performance
  const classStats = useMemo(() => {
    const mainClasses = classes.filter(c => !c.is_subject_combination)
    const combinedClasses = classes.filter(c => c.is_subject_combination)
    const totalStudents = classes.reduce((sum, c) => sum + c.current_students, 0)
    const totalCapacity = classes.reduce((sum, c) => sum + c.max_students, 0)

    return {
      mainClasses,
      combinedClasses,
      totalStudents,
      totalCapacity
    }
  }, [classes])

  // Show loading skeleton when initially loading classes
  if (isLoadingClasses && classes.length === 0) {
    return (
      <AdminPageTemplate
        title="Quản lý lớp học"
        description="Quản lý lớp chính và lớp tổ hợp môn"
        actions={
          <Skeleton className="h-10 w-32" />
        }
        showCard={true}
      >
        <div className="space-y-6">
          {/* Stats Cards Skeleton */}
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {[...Array(4)].map((_, i) => (
              <Card
                key={i}
                className="animate-in fade-in slide-in-from-bottom-4"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Table Skeleton */}
          <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center space-x-4 animate-in fade-in"
                    style={{ animationDelay: `${(i + 4) * 100}ms` }}
                  >
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminPageTemplate>
    )
  }

  return (
    <AdminPageTemplate
      title="Quản lý lớp học"
      description="Quản lý lớp chính và lớp tổ hợp môn"
      actions={
        <Button onClick={() => setShowCreateClassDialog(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Thêm lớp
        </Button>
      }
      showCard={true}
    >
      <TooltipProvider>
        <div className="space-y-6">

        {/* Enhanced Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Card
                className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 cursor-pointer"
                style={{ animationDelay: '0ms' }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Tổng số lớp</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-orange-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-lg sm:text-2xl font-bold text-orange-600">{classesTotal}</div>
                  <p className="text-xs text-muted-foreground">
                    Tất cả lớp trong hệ thống
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Hoạt động</span>
                      <span>100%</span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Thống kê lớp học
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Tổng số lớp: <strong>{classesTotal}</strong></p>
                  <p>• Lớp chính: <strong>{classStats.mainClasses.length}</strong></p>
                  <p>• Lớp tổ hợp: <strong>{classStats.subjectClasses.length}</strong></p>
                  <p>• Trạng thái: <strong className="text-green-600">Hoạt động tốt</strong></p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <Card
                className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 cursor-pointer"
                style={{ animationDelay: '100ms' }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Lớp chính</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">{classStats.mainClasses.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Lớp chủ nhiệm thông thường
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tỷ lệ</span>
                      <span>{classesTotal > 0 ? Math.round((classStats.mainClasses.length / classesTotal) * 100) : 0}%</span>
                    </div>
                    <Progress value={classesTotal > 0 ? (classStats.mainClasses.length / classesTotal) * 100 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Chi tiết lớp chính
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Số lượng: <strong>{classStats.mainClasses.length}</strong></p>
                  <p>• Tỷ lệ: <strong>{classesTotal > 0 ? Math.round((classStats.mainClasses.length / classesTotal) * 100) : 0}%</strong></p>
                  <p>• Loại: <strong>Lớp chủ nhiệm</strong></p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <Card
                className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 cursor-pointer"
                style={{ animationDelay: '200ms' }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Lớp tổ hợp môn</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-lg sm:text-2xl font-bold text-green-600">{classStats.combinedClasses.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Lớp theo tổ hợp môn
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tỷ lệ</span>
                      <span>{classesTotal > 0 ? Math.round((classStats.combinedClasses.length / classesTotal) * 100) : 0}%</span>
                    </div>
                    <Progress value={classesTotal > 0 ? (classStats.combinedClasses.length / classesTotal) * 100 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Chi tiết lớp tổ hợp
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Số lượng: <strong>{classStats.combinedClasses.length}</strong></p>
                  <p>• Tỷ lệ: <strong>{classesTotal > 0 ? Math.round((classStats.combinedClasses.length / classesTotal) * 100) : 0}%</strong></p>
                  <p>• Loại: <strong>Lớp tổ hợp môn</strong></p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>

          <HoverCard>
            <HoverCardTrigger asChild>
              <Card
                className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 cursor-pointer"
                style={{ animationDelay: '300ms' }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Tổng số học sinh</CardTitle>
                  <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-lg sm:text-2xl font-bold text-purple-600">{classStats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    {classStats.totalCapacity > 0 ? `${Math.round((classStats.totalStudents / classStats.totalCapacity) * 100)}% công suất` : "Chưa có sức chứa"}
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Công suất</span>
                      <span>{classStats.totalCapacity > 0 ? Math.round((classStats.totalStudents / classStats.totalCapacity) * 100) : 0}%</span>
                    </div>
                    <Progress value={classStats.totalCapacity > 0 ? (classStats.totalStudents / classStats.totalCapacity) * 100 : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Thống kê học sinh
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Tổng học sinh: <strong>{classStats.totalStudents}</strong></p>
                  <p>• Sức chứa: <strong>{classStats.totalCapacity}</strong></p>
                  <p>• Công suất: <strong>{classStats.totalCapacity > 0 ? Math.round((classStats.totalStudents / classStats.totalCapacity) * 100) : 0}%</strong></p>
                  <p>• Trạng thái: <strong className="text-green-600">Bình thường</strong></p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

      {/* Error Alert */}
      {classesError && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Lỗi tải danh sách lớp:</p>
              <p>{classesError}</p>
              {classesError.includes("does not exist") && (
                <div className="mt-2 p-2 bg-red-50 rounded border">
                  <p className="text-sm">
                    <strong>Cần thiết lập cơ sở dữ liệu:</strong> Bảng classes chưa được tạo.
                    Vui lòng liên hệ quản trị hệ thống để chạy thiết lập cơ sở dữ liệu.
                  </p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Classes Table */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <ClassTable
        data={classes}
        total={classesTotal}
        currentPage={classesPage}
        limit={classesFilters.limit}
        onPageChange={handleClassPageChange}
        onFiltersChange={handleClassFiltersChange}
        onRefresh={handleRefresh}
        academicYears={academicYears}
        semesters={semesters}
        teachers={teachers}
      />
      </div>

      {/* Create Class Dialog */}
      <Dialog open={showCreateClassDialog} onOpenChange={setShowCreateClassDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Thêm lớp mới</DialogTitle>
          </DialogHeader>
          <ClassForm
            onSuccess={handleCreateClassSuccess}
            onCancel={() => setShowCreateClassDialog(false)}
          />
        </DialogContent>
      </Dialog>

        </TooltipProvider>
      </div>
    </AdminPageTemplate>
  )
}
