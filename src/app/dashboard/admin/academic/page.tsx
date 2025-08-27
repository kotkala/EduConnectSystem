"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { AdminPageTemplate } from "@/shared/components/dashboard/admin-page-template"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Plus, Calendar, Clock, BookOpen, AlertCircle } from "lucide-react"
import { AcademicTable } from "@/features/admin-management/components/admin/academic-table"
import { AcademicYearForm } from "@/features/admin-management/components/admin/academic-year-form"
import { SemesterForm } from "@/features/admin-management/components/admin/semester-form"

import { useAuth } from "@/features/authentication/hooks/use-auth"
import { getAcademicYearsAction, getSemestersAction } from "@/features/admin-management/actions/academic-actions"

import { Skeleton } from "@/shared/components/ui/skeleton";import {
  type AcademicYearWithSemesters,
  type SemesterWithAcademicYear,
  type AcademicYear,
  type Semester,
  type AcademicFilters
} from "@/lib/validations/academic-validations"

export default function AcademicManagementPage() {
  const router = useRouter()
  const { profile, loading } = useAuth()
  const isAdmin = profile?.role === 'admin'

  // Academic Years State
  const [academicYears, setAcademicYears] = useState<AcademicYearWithSemesters[]>([])
  const [academicYearsLoading, setAcademicYearsLoading] = useState(true)
  const [academicYearsError, setAcademicYearsError] = useState<string | null>(null)
  const [academicYearsTotal, setAcademicYearsTotal] = useState(0)
  const [academicYearsPage, setAcademicYearsPage] = useState(1)
  const [academicYearsFilters, setAcademicYearsFilters] = useState<AcademicFilters>({ page: 1, limit: 10 })

  // Semesters State
  const [semesters, setSemesters] = useState<SemesterWithAcademicYear[]>([])
  const [semestersError, setSemestersError] = useState<string | null>(null)
  const [semestersTotal, setSemestersTotal] = useState(0)
  const [semestersPage, setSemestersPage] = useState(1)
  const [semestersFilters, setSemestersFilters] = useState<AcademicFilters>({ page: 1, limit: 10 })

  // Dialog States
  const [showCreateAcademicYearDialog, setShowCreateAcademicYearDialog] = useState(false)
  const [showEditAcademicYearDialog, setShowEditAcademicYearDialog] = useState(false)
  const [editingAcademicYear, setEditingAcademicYear] = useState<AcademicYear | null>(null)
  
  const [showCreateSemesterDialog, setShowCreateSemesterDialog] = useState(false)
  const [showEditSemesterDialog, setShowEditSemesterDialog] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)



  // Fetch Academic Years
  const fetchAcademicYears = useCallback(async () => {
    setAcademicYearsLoading(true)
    setAcademicYearsError(null)

    try {
      const result = await getAcademicYearsAction(academicYearsFilters)
      
      if (result.success) {
        setAcademicYears(result.data)
        setAcademicYearsTotal(result.total)
        setAcademicYearsPage(result.page || 1)
      } else {
        setAcademicYearsError(result.error || "Không thể tải danh sách niên khóa")
      }
    } catch (err) {
      setAcademicYearsError(err instanceof Error ? err.message : "Không thể tải danh sách niên khóa")
    } finally {
      setAcademicYearsLoading(false)
    }
  }, [academicYearsFilters])

  // Fetch Semesters
  const fetchSemesters = useCallback(async () => {
    setSemestersError(null)

    try {
      const result = await getSemestersAction(semestersFilters)
      
      if (result.success) {
        setSemesters(result.data)
        setSemestersTotal(result.total)
        setSemestersPage(result.page || 1)
      } else {
        setSemestersError(result.error || "Không thể tải danh sách học kỳ")
      }
    } catch (err) {
      setSemestersError(err instanceof Error ? err.message : "Không thể tải danh sách học kỳ")
    }
  }, [semestersFilters])

  useEffect(() => {
    fetchAcademicYears()
  }, [fetchAcademicYears])

  useEffect(() => {
    fetchSemesters()
  }, [fetchSemesters])

  // Event Handlers
  const handleAcademicYearPageChange = (page: number) => {
    setAcademicYearsFilters(prev => ({ ...prev, page }))
  }

  const handleAcademicYearFiltersChange = (newFilters: Partial<AcademicFilters>) => {
    setAcademicYearsFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleSemesterPageChange = (page: number) => {
    setSemestersFilters(prev => ({ ...prev, page }))
  }

  const handleSemesterFiltersChange = (newFilters: Partial<AcademicFilters>) => {
    setSemestersFilters(prev => ({ ...prev, ...newFilters }))
  }



  const handleCreateAcademicYearSuccess = () => {
    setShowCreateAcademicYearDialog(false)
    fetchAcademicYears()
    fetchSemesters() // Refresh semesters as well since new ones are auto-created
  }

  const handleEditAcademicYearSuccess = () => {
    setShowEditAcademicYearDialog(false)
    setEditingAcademicYear(null)
    fetchAcademicYears()
  }

  const handleCreateSemesterSuccess = () => {
    setShowCreateSemesterDialog(false)
    fetchSemesters()
  }

  const handleEditSemesterSuccess = () => {
    setShowEditSemesterDialog(false)
    setEditingSemester(null)
    fetchSemesters()
  }

  const handleRefresh = () => {
    fetchAcademicYears()
    fetchSemesters()
  }

  // Calculate stats
  const currentAcademicYear = academicYears.find(year => year.is_current)
  const currentSemester = semesters.find(semester => semester.is_current)
  const totalSemesters = semesters.length

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard/admin')
    }
  }, [loading, isAdmin, router])

  // Show loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  // Show access denied if no permission
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 md:w-20 lg:w-24 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Từ chối truy cập</h2>
          <p className="text-gray-600">Bạn không có quyền truy cập khu vực Niên khóa.</p>
          <Button onClick={() => router.push('/dashboard/admin')}>
            Quay lại trang tổng quan
          </Button>
        </div>
      </div>
    )
  }

  if (academicYearsLoading && academicYears.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <AdminPageTemplate
      title="Tổng quan học thuật"
      description="Tổng quan về hoạt động học thuật"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          <Button
            onClick={() => setShowCreateSemesterDialog(true)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Thêm học kỳ</span>
            <span className="sm:hidden">Học kỳ</span>
          </Button>
          <Button
            onClick={() => setShowCreateAcademicYearDialog(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Thêm năm học</span>
            <span className="sm:hidden">Năm học</span>
          </Button>
        </div>
      }
      showCard={true}
    >
      <div className="space-y-6">

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Năm học hiện tại</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {currentAcademicYear?.name || "Không có"}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentAcademicYear ? "Đang áp dụng" : "Chưa có năm học hoạt động"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Học kỳ hiện tại</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {currentSemester?.name || "Không có"}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentSemester ? `${currentSemester.weeks_count} tuần` : "Chưa có học kỳ hoạt động"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tổng số năm học</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{academicYearsTotal}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả năm học
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tổng số học kỳ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{totalSemesters}</div>
            <p className="text-xs text-muted-foreground">
              Tất cả học kỳ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Academic Years and Semesters */}
      <Tabs defaultValue="academic-years" className="space-y-4">
        <TabsList>
          <TabsTrigger value="academic-years">Năm học</TabsTrigger>
          <TabsTrigger value="semesters">Học kỳ</TabsTrigger>
        </TabsList>

        <TabsContent value="academic-years" className="space-y-4">
          {academicYearsError && (
            <Alert variant="destructive">
              <AlertDescription>{academicYearsError}</AlertDescription>
            </Alert>
          )}

          <AcademicTable
            data={academicYears}
            type="academic-years"
            total={academicYearsTotal}
            currentPage={academicYearsPage}
            limit={academicYearsFilters.limit}
            onPageChange={handleAcademicYearPageChange}
            onFiltersChange={handleAcademicYearFiltersChange}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="semesters" className="space-y-4">
          {semestersError && (
            <Alert variant="destructive">
              <AlertDescription>{semestersError}</AlertDescription>
            </Alert>
          )}

          <AcademicTable
            data={semesters}
            type="semesters"
            total={semestersTotal}
            currentPage={semestersPage}
            limit={semestersFilters.limit}
            onPageChange={handleSemesterPageChange}
            onFiltersChange={handleSemesterFiltersChange}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>

      {/* Create Academic Year Dialog */}
      <Dialog open={showCreateAcademicYearDialog} onOpenChange={setShowCreateAcademicYearDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Thêm năm học mới</DialogTitle>
          </DialogHeader>
          <AcademicYearForm
            onSuccess={handleCreateAcademicYearSuccess}
            onCancel={() => setShowCreateAcademicYearDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Academic Year Dialog */}
      <Dialog open={showEditAcademicYearDialog} onOpenChange={setShowEditAcademicYearDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Chỉnh sửa năm học</DialogTitle>
          </DialogHeader>
          {editingAcademicYear && (
            <AcademicYearForm
              academicYear={editingAcademicYear}
              onSuccess={handleEditAcademicYearSuccess}
              onCancel={() => {
                setShowEditAcademicYearDialog(false)
                setEditingAcademicYear(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Semester Dialog */}
      <Dialog open={showCreateSemesterDialog} onOpenChange={setShowCreateSemesterDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Thêm học kỳ mới</DialogTitle>
          </DialogHeader>
          <SemesterForm
            onSuccess={handleCreateSemesterSuccess}
            onCancel={() => setShowCreateSemesterDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Semester Dialog */}
      <Dialog open={showEditSemesterDialog} onOpenChange={setShowEditSemesterDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Chỉnh sửa học kỳ</DialogTitle>
          </DialogHeader>
          {editingSemester && (
            <SemesterForm
              semester={editingSemester}
              onSuccess={handleEditSemesterSuccess}
              onCancel={() => {
                setShowEditSemesterDialog(false)
                setEditingSemester(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AdminPageTemplate>
  )
}
