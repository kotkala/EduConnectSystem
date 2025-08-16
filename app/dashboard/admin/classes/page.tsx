"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useCoordinatedLoading, usePageTransition } from '@/components/ui/global-loading-provider'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, GraduationCap, Users, BookOpen, RefreshCw } from "lucide-react"
import { ClassTable } from "@/components/admin/class-table"
import { ClassForm } from "@/components/admin/class-form"
import { getClassesAction, getHomeroomEnabledTeachersAction } from "@/lib/actions/class-actions"
import { getAcademicYearsAction, getSemestersAction } from "@/lib/actions/academic-actions"
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
  // 🚀 MIGRATION: Replace scattered loading with coordinated system
  const { startPageTransition, stopLoading } = usePageTransition()
  const coordinatedLoading = useCoordinatedLoading()
  
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
    // 🎯 UX IMPROVEMENT: Use global loading with meaningful message
    startPageTransition("Đang tải danh sách lớp học...")
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
      stopLoading()
    }
  }, [classesFilters, startPageTransition, stopLoading])

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

  if (coordinatedLoading.isLoading && classes.length === 0) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quản lý lớp học</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Quản lý lớp chính và lớp tổ hợp môn
          </p>
        </div>
        <Button onClick={() => setShowCreateClassDialog(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Thêm lớp
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Tổng số lớp</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{classesTotal}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả lớp trong hệ thống
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Lớp chính</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{classStats.mainClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              Lớp chủ nhiệm thông thường
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Lớp tổ hợp môn</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{classStats.combinedClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              Lớp theo tổ hợp môn
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Tổng số học sinh</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{classStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {classStats.totalCapacity > 0 ? `${Math.round((classStats.totalStudents / classStats.totalCapacity) * 100)}% công suất` : "Chưa có sức chứa"}
            </p>
          </CardContent>
        </Card>
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


      </div>
    </div>
  )
}
