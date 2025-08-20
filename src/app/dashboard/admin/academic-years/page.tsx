"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Plus, Calendar, Clock, RefreshCw, BookOpen, AlertCircle, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { AcademicYearForm } from "@/shared/components/admin/academic-year-form"
import { SemesterForm } from "@/shared/components/admin/semester-form"
import { AcademicDeleteDialog } from "@/shared/components/admin/academic-delete-dialog"
import { useAcademicYear } from "@/contexts/academic-year-context"
import { getAcademicYearsAction, getSemestersAction } from "@/lib/actions/academic-actions"
import {
  type AcademicYearWithSemesters,
  type SemesterWithAcademicYear,
  type AcademicYear,
  type Semester,
  type AcademicFilters
} from "@/lib/validations/academic-validations"

export default function AcademicYearsManagementPage() {
  // Global academic year context
  const { refreshAcademicYears } = useAcademicYear()

  // Academic Years State
  const [academicYears, setAcademicYears] = useState<AcademicYearWithSemesters[]>([])
  const [academicYearsLoading, setAcademicYearsLoading] = useState(true)
  const [academicYearsError, setAcademicYearsError] = useState<string | null>(null)
  const [academicYearsTotal, setAcademicYearsTotal] = useState(0)

  const [academicYearsFilters] = useState<AcademicFilters>({ page: 1, limit: 20 }) // Increased limit for better UX

  // Semesters State
  const [semesters, setSemesters] = useState<SemesterWithAcademicYear[]>([])
  const [semestersLoading, setSemestersLoading] = useState(true)
  const [semestersError, setSemestersError] = useState<string | null>(null)
  const [semestersTotal, setSemestersTotal] = useState(0)
  const [semestersFilters] = useState<AcademicFilters>({ page: 1, limit: 20 }) // Increased limit for better UX

  // Dialog States
  const [showCreateAcademicYearDialog, setShowCreateAcademicYearDialog] = useState(false)
  const [showEditAcademicYearDialog, setShowEditAcademicYearDialog] = useState(false)
  const [editingAcademicYear, setEditingAcademicYear] = useState<AcademicYear | null>(null)
  
  const [showCreateSemesterDialog, setShowCreateSemesterDialog] = useState(false)
  const [showEditSemesterDialog, setShowEditSemesterDialog] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingItem, setDeletingItem] = useState<{ type: 'academic-years' | 'semesters'; item: AcademicYear | Semester } | null>(null)

  // Fetch Academic Years
  const fetchAcademicYears = useCallback(async () => {
    setAcademicYearsLoading(true)
    setAcademicYearsError(null)

    try {
      const result = await getAcademicYearsAction(academicYearsFilters)
      
      if (result.success) {
        setAcademicYears(result.data)
        setAcademicYearsTotal(result.total)
      } else {
        setAcademicYearsError(result.error || "Không thể tải danh sách năm học")
      }
    } catch (err) {
      setAcademicYearsError(err instanceof Error ? err.message : "Không thể tải danh sách năm học")
    } finally {
      setAcademicYearsLoading(false)
    }
  }, [academicYearsFilters])

  // Fetch Semesters
  const fetchSemesters = useCallback(async () => {
    setSemestersLoading(true)
    setSemestersError(null)

    try {
      const result = await getSemestersAction(semestersFilters)
      
      if (result.success) {
        setSemesters(result.data)
        setSemestersTotal(result.total)
      } else {
        setSemestersError(result.error || "Không thể tải danh sách học kỳ")
      }
    } catch (err) {
      setSemestersError(err instanceof Error ? err.message : "Không thể tải danh sách học kỳ")
    } finally {
      setSemestersLoading(false)
    }
  }, [semestersFilters])

  useEffect(() => {
    fetchAcademicYears()
  }, [fetchAcademicYears])

  useEffect(() => {
    fetchSemesters()
  }, [fetchSemesters])

  // Event Handlers
  const handleRefresh = () => {
    fetchAcademicYears()
    fetchSemesters()
    refreshAcademicYears() // Update global context
  }

  const handleCreateAcademicYearSuccess = () => {
    setShowCreateAcademicYearDialog(false)
    handleRefresh()
  }

  const handleEditAcademicYearSuccess = () => {
    setShowEditAcademicYearDialog(false)
    setEditingAcademicYear(null)
    handleRefresh()
  }

  const handleCreateSemesterSuccess = () => {
    setShowCreateSemesterDialog(false)
    handleRefresh()
  }

  const handleEditSemesterSuccess = () => {
    setShowEditSemesterDialog(false)
    setEditingSemester(null)
    handleRefresh()
  }

  const handleDeleteSuccess = () => {
    setShowDeleteDialog(false)
    setDeletingItem(null)
    handleRefresh()
  }

  const handleEditAcademicYear = (year: AcademicYear) => {
    setEditingAcademicYear(year)
    setShowEditAcademicYearDialog(true)
  }

  const handleDeleteAcademicYear = (year: AcademicYear) => {
    setDeletingItem({ type: 'academic-years', item: year })
    setShowDeleteDialog(true)
  }

  const handleEditSemester = (semester: Semester) => {
    setEditingSemester(semester)
    setShowEditSemesterDialog(true)
  }

  const handleDeleteSemester = (semester: Semester) => {
    setDeletingItem({ type: 'semesters', item: semester })
    setShowDeleteDialog(true)
  }

  // Stats
  const currentYear = academicYears.find(year => year.is_current)
  const currentSemester = semesters.find(semester => semester.is_current)

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quản lý năm học & học kỳ</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Quản lý toàn bộ năm học và học kỳ trong hệ thống
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowCreateAcademicYearDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Thêm năm học
            </Button>
            <Button
              onClick={() => setShowCreateSemesterDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Thêm học kỳ
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={academicYearsLoading || semestersLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${(academicYearsLoading || semestersLoading) ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Năm học hiện tại</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">
                {currentYear?.name || 'Không có'}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentYear ? `${new Date(currentYear.start_date).getFullYear()} - ${new Date(currentYear.end_date).getFullYear()}` : 'Chưa thiết lập'}
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
                {currentSemester?.name || 'Không có'}
              </div>
              <p className="text-xs text-muted-foreground">
                {currentSemester ? `${currentSemester.weeks_count} tuần` : 'Chưa thiết lập'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Tổng năm học</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{academicYearsTotal}</div>
              <p className="text-xs text-muted-foreground">
                Trong hệ thống
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Tổng học kỳ</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{semestersTotal}</div>
              <p className="text-xs text-muted-foreground">
                Trong hệ thống
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Alerts */}
        {academicYearsError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{academicYearsError}</AlertDescription>
          </Alert>
        )}

        {semestersError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{semestersError}</AlertDescription>
          </Alert>
        )}

        {/* Tabs */}
        <Tabs defaultValue="years" className="space-y-4">
          <TabsList>
            <TabsTrigger value="years">Năm học ({academicYearsTotal})</TabsTrigger>
            <TabsTrigger value="semesters">Học kỳ ({semestersTotal})</TabsTrigger>
          </TabsList>

          <TabsContent value="years" className="space-y-4">
            {academicYearsLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <span className="ml-2">Đang tải năm học...</span>
              </div>
            ) : (
              <div className="grid gap-4">
                {academicYears.map((year) => (
                  <Card key={year.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{year.name}</h3>
                              {year.is_current && (
                                <Badge variant="secondary">Hiện tại</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {new Date(year.start_date).toLocaleDateString('vi-VN')} - {new Date(year.end_date).toLocaleDateString('vi-VN')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {year.semesters?.length || 0} học kỳ
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleEditAcademicYear(year)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteAcademicYear(year)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="semesters" className="space-y-4">
            {semestersLoading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <span className="ml-2">Đang tải học kỳ...</span>
              </div>
            ) : (
              <div className="grid gap-4">
                {semesters.map((semester) => (
                  <Card key={semester.id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{semester.name}</h3>
                              {semester.is_current && (
                                <Badge variant="secondary">Hiện tại</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Năm học: {semester.academic_year?.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {semester.weeks_count} tuần
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleEditSemester(semester)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteSemester(semester)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Create Academic Year Dialog */}
        <Dialog open={showCreateAcademicYearDialog} onOpenChange={setShowCreateAcademicYearDialog}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm năm học mới</DialogTitle>
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
              <DialogTitle>Chỉnh sửa năm học</DialogTitle>
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
              <DialogTitle>Thêm học kỳ mới</DialogTitle>
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
              <DialogTitle>Chỉnh sửa học kỳ</DialogTitle>
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

        {/* Delete Dialog */}
        {deletingItem && (
          <AcademicDeleteDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            type={deletingItem.type}
            item={deletingItem.item}
            onSuccess={handleDeleteSuccess}
          />
        )}
      </div>
    </div>
  )
}
