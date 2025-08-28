'use client'

import { Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { AdminPageTemplate } from "@/shared/components/dashboard/admin-page-template"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Progress } from "@/shared/components/ui/progress"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/shared/components/ui/hover-card"
import { Plus, Calendar, Clock, BookOpen, AlertCircle, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { AcademicYearForm } from "@/features/admin-management/components/admin/academic-year-form"
import { SemesterForm } from "@/features/admin-management/components/admin/semester-form"
import { AcademicDeleteDialog } from "@/features/admin-management/components/admin/academic-delete-dialog"
import { useAcademicYear } from "@/providers/academic-year-context"
import { getAcademicYearsAction, getSemestersAction } from "@/features/admin-management/actions/academic-actions"


import {
  type AcademicYearWithSemesters,
  type SemesterWithAcademicYear,
  type AcademicYear,
  type Semester,
  type AcademicFilters
} from "@/lib/validations/academic-validations"
import { Provider } from '@radix-ui/react-tooltip'

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

  // Show loading skeleton when initially loading
  if (academicYearsLoading && academicYears.length === 0) {
    return (
      <AdminPageTemplate
        title="Quản lý năm học"
        description="Quản lý năm học và học kỳ"
        showCard={true}
      >
        <div className="space-y-6">
          {/* Enhanced Stats Cards Skeleton */}
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32" />
                  <div className="space-y-1">
                    <Skeleton className="h-2 w-full" />
                    <div className="flex justify-between">
                      <Skeleton className="h-2 w-8" />
                      <Skeleton className="h-2 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Enhanced Tables Skeleton */}
          <div className="grid gap-6 lg:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...Array(4)].map((_, j) => (
                      <div key={j} className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminPageTemplate>
    )
  }

  return (
    <AdminPageTemplate
      title="Quản lý năm học"
      description="Quản lý năm học và học kỳ"
      actions={
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
              Làm mới
            </Button>
        </div>
      }
      showCard={true}
    >
      <div className="space-y-6">
        {/* Enhanced Stats Cards */}
        <Provider>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Năm học hiện tại</CardTitle>
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-lg sm:text-2xl font-bold text-orange-600">
                      {currentYear?.name || 'Không có'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentYear ? `${new Date(currentYear.start_date).getFullYear()} - ${new Date(currentYear.end_date).getFullYear()}` : 'Chưa thiết lập'}
                    </p>
                    {currentYear && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Tiến độ năm học</span>
                          <span>{Math.round(((new Date().getTime() - new Date(currentYear.start_date).getTime()) / (new Date(currentYear.end_date).getTime() - new Date(currentYear.start_date).getTime())) * 100)}%</span>
                        </div>
                        <Progress value={Math.round(((new Date().getTime() - new Date(currentYear.start_date).getTime()) / (new Date(currentYear.end_date).getTime() - new Date(currentYear.start_date).getTime())) * 100)} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Chi tiết năm học
                  </h4>
                  {currentYear ? (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• Tên: <strong>{currentYear.name}</strong></p>
                      <p>• Bắt đầu: <strong>{new Date(currentYear.start_date).toLocaleDateString('vi-VN')}</strong></p>
                      <p>• Kết thúc: <strong>{new Date(currentYear.end_date).toLocaleDateString('vi-VN')}</strong></p>
                      <p>• Trạng thái: <strong className="text-green-600">Đang hoạt động</strong></p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có năm học nào được thiết lập</p>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>

            <HoverCard>
              <HoverCardTrigger asChild>
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Học kỳ hiện tại</CardTitle>
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-lg sm:text-2xl font-bold text-blue-600">
                      {currentSemester?.name || 'Không có'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentSemester ? `${currentSemester.weeks_count} tuần` : 'Chưa thiết lập'}
                    </p>
                    {currentSemester && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Tiến độ học kỳ</span>
                          <span>75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Chi tiết học kỳ
                  </h4>
                  {currentSemester ? (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>• Tên: <strong>{currentSemester.name}</strong></p>
                      <p>• Số tuần: <strong>{currentSemester.weeks_count} tuần</strong></p>
                      <p>• Trạng thái: <strong className="text-blue-600">Đang diễn ra</strong></p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Chưa có học kỳ nào được thiết lập</p>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>

            <HoverCard>
              <HoverCardTrigger asChild>
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Tổng năm học</CardTitle>
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-lg sm:text-2xl font-bold text-green-600">{academicYearsTotal}</div>
                    <p className="text-xs text-muted-foreground">
                      Trong hệ thống
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
                    Thống kê năm học
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Tổng số: <strong>{academicYearsTotal}</strong></p>
                    <p>• Đang hoạt động: <strong>1</strong></p>
                    <p>• Đã hoàn thành: <strong>{academicYearsTotal - 1}</strong></p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>

            <HoverCard>
              <HoverCardTrigger asChild>
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium">Tổng học kỳ</CardTitle>
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-lg sm:text-2xl font-bold text-purple-600">{semestersTotal}</div>
                    <p className="text-xs text-muted-foreground">
                      Trong hệ thống
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Đã tạo</span>
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
                    <Clock className="w-4 h-4" />
                    Thống kê học kỳ
                  </h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Tổng số: <strong>{semestersTotal}</strong></p>
                    <p>• Đang diễn ra: <strong>1</strong></p>
                    <p>• Đã hoàn thành: <strong>{semestersTotal - 1}</strong></p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
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
        <Tabs defaultValue="years" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <TabsList>
            <TabsTrigger value="years">Năm học ({academicYearsTotal})</TabsTrigger>
            <TabsTrigger value="semesters">Học kỳ ({semestersTotal})</TabsTrigger>
          </TabsList>

          <TabsContent value="years" className="space-y-4">
            {academicYearsLoading ? (
              <div className="flex items-center justify-center h-32 md:h-40 lg:h-48">
                <Loader2 className="h-4 w-4 animate-spin" />
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
              <div className="flex items-center justify-center h-32 md:h-40 lg:h-48">
                <Loader2 className="h-4 w-4 animate-spin" />
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
        </Provider>
      </div>
    </AdminPageTemplate>
  )
}
