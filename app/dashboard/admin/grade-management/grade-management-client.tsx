'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, FileSpreadsheet, Edit, Trash2, Eye, Search, Calendar, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import {
  getGradeReportingPeriodsAction,
  deleteGradeReportingPeriodAction,
  getClassesForGradeInputAction,
  getSubjectsForGradeInputAction
} from '@/lib/actions/grade-management-actions'
import { getDetailedGradesAction } from '@/lib/actions/detailed-grade-actions'
import { GradeReportingPeriodForm } from '@/components/admin/grade-management/grade-reporting-period-form'


import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { GradeReportingPeriod } from '@/lib/validations/grade-management-validations'

interface StudentRecord {
  id: string
  full_name: string
  student_id: string
  class: {
    id: string
    name: string
  }
  grade_count: number
  subjects: Array<{
    id: string
    name_vietnamese: string
    code: string
  }>
}

export function GradeManagementClient() {
  const [periods, setPeriods] = useState<GradeReportingPeriod[]>([])
  const [classes, setClasses] = useState<Array<{id: string, name: string}>>([])
  const [subjects, setSubjects] = useState<Array<{id: string, name_vietnamese: string, code: string}>>([])
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<GradeReportingPeriod | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('periods')
  const [totalGrades, setTotalGrades] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')


  // Load grade reporting periods - Memoized to prevent unnecessary re-renders
  const loadPeriods = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getGradeReportingPeriodsAction()

      if (result.success) {
        setPeriods((result.data || []) as unknown as GradeReportingPeriod[])
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Không thể tải danh sách kỳ báo cáo")
    } finally {
      setLoading(false)
    }
  }, [])

  // Load statistics data
  const loadStatistics = useCallback(async () => {
    try {
      const [classesResult, subjectsResult] = await Promise.all([
        getClassesForGradeInputAction(),
        getSubjectsForGradeInputAction()
      ])

      if (classesResult.success && classesResult.data) {
        setClasses(classesResult.data as unknown as Array<{id: string, name: string}>)
      }

      if (subjectsResult.success && subjectsResult.data) {
        setSubjects(subjectsResult.data as unknown as Array<{id: string, name_vietnamese: string, code: string}>)
      }

      // Load students with grade counts if there's an active period
      const activePeriod = periods.find(p => p.is_active)
      if (activePeriod) {
        const gradesResult = await getDetailedGradesAction(activePeriod.id, { limit: 1000 })
        if (gradesResult.success && gradesResult.data) {
          setTotalGrades(gradesResult.count || 0)

          // Group grades by student to create student records
          const gradeData = gradesResult.data as Array<{
            student_id: string
            class_id: string
            subject_id: string
            student?: { full_name: string; student_id: string }
            class?: { name: string }
            subject?: { name_vietnamese: string; code: string }
          }>
          const studentMap = new Map<string, StudentRecord>()

          gradeData.forEach((grade) => {
            const studentId = grade.student_id
            if (!studentMap.has(studentId)) {
              studentMap.set(studentId, {
                id: studentId,
                full_name: grade.student?.full_name || 'N/A',
                student_id: grade.student?.student_id || 'N/A',
                class: {
                  id: grade.class_id,
                  name: grade.class?.name || 'N/A'
                },
                grade_count: 0,
                subjects: []
              })
            }

            const student = studentMap.get(studentId)!
            student.grade_count++

            // Add subject if not already added
            const subjectExists = student.subjects.some(s => s.id === grade.subject_id)
            if (!subjectExists && grade.subject) {
              student.subjects.push({
                id: grade.subject_id,
                name_vietnamese: grade.subject.name_vietnamese,
                code: grade.subject.code
              })
            }
          })

          setStudents(Array.from(studentMap.values()))
        }
      }
    } catch (error) {
      console.error('Error loading statistics:', error)
    }
  }, [periods])

  // Handle delete period - Memoized to prevent unnecessary re-renders
  const handleDeletePeriod = useCallback(async () => {
    if (!selectedPeriod) return

    try {
      const result = await deleteGradeReportingPeriodAction(selectedPeriod.id)

      if (result.success) {
        toast.success(result.message)
        await loadPeriods()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Không thể xóa kỳ báo cáo")
    } finally {
      setShowDeleteDialog(false)
      setSelectedPeriod(null)
    }
  }, [selectedPeriod, loadPeriods])

  // Check if period allows operations
  const canImportGrades = useCallback((period: GradeReportingPeriod) => {
    const now = new Date()
    const startDate = new Date(period.start_date)
    const importDeadline = new Date(period.import_deadline)
    return now >= startDate && now <= importDeadline && period.is_active
  }, [])

  const canEditGrades = useCallback((period: GradeReportingPeriod) => {
    const now = new Date()
    const editDeadline = new Date(period.edit_deadline)
    return now <= editDeadline && period.is_active
  }, [])

  // Get period status
  const getPeriodStatus = useCallback((period: GradeReportingPeriod) => {
    const now = new Date()
    const startDate = new Date(period.start_date)
    const importDeadline = new Date(period.import_deadline)
    const editDeadline = new Date(period.edit_deadline)

    if (!period.is_active) {
      return { label: 'Đã vô hiệu hóa', variant: 'secondary' as const }
    }

    if (now < startDate) {
      return { label: 'Chưa bắt đầu', variant: 'outline' as const }
    }

    if (now > editDeadline) {
      return { label: 'Đã khóa', variant: 'destructive' as const }
    }

    if (now > importDeadline) {
      return { label: 'Hết hạn nhập', variant: 'secondary' as const }
    }

    if (now <= importDeadline) {
      return { label: 'Đang mở', variant: 'default' as const }
    }

    return { label: 'Đang hoạt động', variant: 'default' as const }
  }, [])

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // Memoize periods with status calculations to prevent re-computation
  const periodsWithStatus = useMemo(() => {
    return periods.map(period => ({
      ...period,
      status: getPeriodStatus(period),
      canImport: canImportGrades(period),
      canEdit: canEditGrades(period)
    }))
  }, [periods, getPeriodStatus, canImportGrades, canEditGrades])

  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  useEffect(() => {
    if (periods.length > 0) {
      loadStatistics()
    }
  }, [periods, loadStatistics])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-muted-foreground">Đang tải dữ liệu...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kỳ báo cáo</p>
                <p className="text-2xl font-bold">{periods.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lớp học</p>
                <p className="text-2xl font-bold">{classes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Môn học</p>
                <p className="text-2xl font-bold">{subjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Điểm số</p>
                <p className="text-2xl font-bold">{totalGrades}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* VNedu Disclaimer */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center">
            ⚠️ Miễn trừ trách nhiệm về quản lý
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-amber-800 space-y-2">
            <p>
              <strong>Lưu ý quan trọng:</strong> Hệ thống này chỉ đang lấy file upload Excel làm tham khảo từ phần mềm VNedu của bên thứ 3.
            </p>
            <p>
              Chúng tôi không chịu trách nhiệm về tính chính xác hoặc đầy đủ của dữ liệu được nhập từ các template Excel này.
              Vui lòng kiểm tra kỹ thông tin trước khi sử dụng trong môi trường sản xuất.
            </p>
            <p className="text-sm">
              Template Excel được thiết kế tương thích với định dạng VNedu để thuận tiện cho việc nhập liệu,
              nhưng không thay thế cho việc xác minh dữ liệu chính thức.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">🚀 Hướng dẫn sử dụng nhanh</CardTitle>
          <CardDescription className="text-blue-700">
            Quy trình quản lý điểm số theo thứ tự:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
              <div>
                <div className="font-medium text-gray-900">Tạo kỳ báo cáo</div>
                <div className="text-sm text-gray-600">Thiết lập thời gian và hạn chót</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">2</div>
              <div>
                <div className="font-medium text-gray-900">Tải template Excel</div>
                <div className="text-sm text-gray-600">Lấy file mẫu cho từng lớp</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">3</div>
              <div>
                <div className="font-medium text-gray-900">Nhập điểm từ Excel</div>
                <div className="text-sm text-gray-600">Upload file đã điền điểm</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">4</div>
              <div>
                <div className="font-medium text-gray-900">Kiểm tra & sửa điểm</div>
                <div className="text-sm text-gray-600">Xem lại và chỉnh sửa nếu cần</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => setShowCreateForm(true)}
          size="lg"
          className="flex items-center space-x-3 px-8 py-4 text-lg"
        >
          <Plus className="h-6 w-6" />
          <span>Tạo kỳ báo cáo mới</span>
        </Button>
        <Link href="/dashboard/admin/grade-management/view-grades">
          <Button
            variant="outline"
            size="lg"
            className="flex items-center space-x-3 px-8 py-4 text-lg"
          >
            <Search className="h-6 w-6" />
            <span>Xem điểm số</span>
          </Button>
        </Link>
      </div>

      {/* Simplified Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="periods" className="flex items-center space-x-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Quản lý kỳ báo cáo</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Quản lý học sinh</span>
          </TabsTrigger>
        </TabsList>

        {/* Grade Reporting Periods Tab */}
        <TabsContent value="periods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách kỳ báo cáo điểm số</CardTitle>
              <CardDescription>
                Quản lý các kỳ báo cáo điểm số trong năm học. Mỗi kỳ có thời gian nhập và chỉnh sửa điểm riêng biệt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {periodsWithStatus.length === 0 ? (
                <EmptyState
                  icon={FileSpreadsheet}
                  title="Chưa có kỳ báo cáo nào"
                  description="Tạo kỳ báo cáo đầu tiên để bắt đầu quản lý điểm số"
                  action={
                    <Button onClick={() => setShowCreateForm(true)} size="lg">
                      <Plus className="h-5 w-5 mr-2" />
                      Tạo kỳ báo cáo đầu tiên
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {periodsWithStatus.map((period) => (
                    <Card key={period.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          {/* Period Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-4">
                              <h3 className="text-xl font-semibold text-gray-900">{period.name}</h3>
                              <Badge variant={period.status.variant} className="text-sm px-3 py-1">
                                {period.status.label}
                              </Badge>
                            </div>

                            <div className="text-sm text-gray-600">
                              <span className="font-medium">{period.academic_year?.name}</span> - <span className="font-medium">{period.semester?.name}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="space-y-1">
                                <div className="text-gray-500">Thời gian kỳ báo cáo</div>
                                <div className="font-medium">{formatDate(period.start_date)} → {formatDate(period.end_date)}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-gray-500">Hạn chót nhập điểm</div>
                                <div className={`font-medium ${period.canImport ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatDate(period.import_deadline)}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-gray-500">Hạn chót sửa điểm</div>
                                <div className={`font-medium ${period.canEdit ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatDate(period.edit_deadline)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col space-y-2 ml-6">

                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedPeriod(period)
                                setShowEditForm(true)
                              }}
                              className="w-full justify-start"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Cài đặt kỳ báo cáo
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedPeriod(period)
                                setShowDeleteDialog(true)
                              }}
                              className="w-full justify-start text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa kỳ báo cáo
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Danh sách học sinh</CardTitle>
                  <CardDescription>
                    Xem và quản lý điểm số của từng học sinh. Click vào học sinh để xem chi tiết điểm số.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm học sinh..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Chưa có dữ liệu học sinh"
                  description="Vui lòng tạo kỳ báo cáo và nhập điểm để xem danh sách học sinh."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students
                    .filter(student =>
                      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((student) => (
                      <Link
                        key={student.id}
                        href={`/dashboard/admin/grade-management/student/${student.id}`}
                        className="block"
                      >
                        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg text-gray-900">
                                  {student.full_name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-2">
                                  Mã HS: {student.student_id}
                                </p>
                                <p className="text-sm text-gray-600 mb-3">
                                  Lớp: {student.class.name}
                                </p>

                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {student.grade_count} điểm
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {student.subjects.length} môn
                                    </Badge>
                                  </div>
                                  <Eye className="h-4 w-4 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>






      </Tabs>

      {/* Dialogs */}
      {showCreateForm && (
        <GradeReportingPeriodForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSuccess={() => {
            setShowCreateForm(false)
            loadPeriods()
          }}
        />
      )}

      {showEditForm && selectedPeriod && (
        <GradeReportingPeriodForm
          open={showEditForm}
          onOpenChange={setShowEditForm}
          period={selectedPeriod}
          onSuccess={() => {
            setShowEditForm(false)
            setSelectedPeriod(null)
            loadPeriods()
          }}
        />
      )}



      {showDeleteDialog && selectedPeriod && (
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Xóa kỳ báo cáo"
          description={`Bạn có chắc chắn muốn xóa kỳ báo cáo &ldquo;${selectedPeriod.name}&rdquo;? Hành động này không thể hoàn tác.`}
          onConfirm={handleDeletePeriod}
          confirmText="Xóa"
          variant="destructive"
        />
      )}
    </div>
  )
}
