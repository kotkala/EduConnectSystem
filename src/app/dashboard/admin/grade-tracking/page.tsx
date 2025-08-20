"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Badge } from "@/shared/components/ui/badge"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Progress } from "@/shared/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"
import { Input } from "@/shared/components/ui/input"
import {
  RefreshCw,
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Download,
  Eye,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import {
  getGradePeriodsAction,
  getStudentGradeTrackingDataAction,
  submitStudentGradesToHomeroomAction,
  type GradePeriod as AdminGradePeriod,
  type StudentGradeData,
  type AdminGradeStats
} from "@/lib/actions/admin-grade-tracking-actions"

export default function AdminGradeTrackingPage() {
  const [periods, setPeriods] = useState<AdminGradePeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [gradeData, setGradeData] = useState<StudentGradeData[]>([])
  const [stats, setStats] = useState<AdminGradeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false)
  const [submissionReason, setSubmissionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Load grade periods
  const loadPeriods = useCallback(async () => {
    try {
      const result = await getGradePeriodsAction()
      if (result.success && result.data) {
        setPeriods(result.data)
        if (result.data.length > 0) {
          setSelectedPeriod(result.data[0].id)
        }
      } else {
        setError(result.error || 'Không thể tải danh sách kỳ báo cáo')
      }
    } catch (error) {
      console.error('Error loading periods:', error)
      setError('Không thể tải danh sách kỳ báo cáo')
    }
  }, [])

  // Load grade data for selected period
  const loadGradeData = useCallback(async () => {
    if (!selectedPeriod) return

    setLoading(true)
    setError(null)

    try {
      const result = await getStudentGradeTrackingDataAction(selectedPeriod)
      if (result.success) {
        setGradeData(result.data || [])
        setStats(result.stats || null)
      } else {
        setError(result.error || 'Không thể tải dữ liệu điểm số')
      }
    } catch (error) {
      console.error('Error loading grade data:', error)
      setError('Không thể tải dữ liệu điểm số')
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  useEffect(() => {
    loadGradeData()
  }, [loadGradeData])

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-500'
    if (grade >= 8) return 'text-green-600'
    if (grade >= 6.5) return 'text-blue-600'
    if (grade >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const exportData = () => {
    // TODO: Implement export functionality
    toast.info('Chức năng xuất dữ liệu đang được phát triển')
  }

  const handleSubmitGrades = async () => {
    if (selectedItems.size === 0) {
      toast.error('Vui lòng chọn ít nhất một học sinh để gửi')
      return
    }

    setSubmitting(true)
    try {
      const studentIds = Array.from(selectedItems)

      const result = await submitStudentGradesToHomeroomAction(
        selectedPeriod,
        studentIds,
        submissionReason || undefined
      )

      if (result.success) {
        toast.success(result.message)
        setSelectedItems(new Set())
        setSubmissionReason('')
        setSubmissionDialogOpen(false)
        loadGradeData() // Reload data to show updated submission status
      } else {
        toast.error(result.error || 'Lỗi gửi bảng điểm')
      }
    } catch (error) {
      console.error('Error submitting grades:', error)
      toast.error('Lỗi gửi bảng điểm')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleItemSelection = (studentId: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedItems(newSelection)
  }

  const selectAllItems = () => {
    const allKeys = filteredData.map(item => item.student_id)
    setSelectedItems(new Set(allKeys))
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
  }

  // Filter and search logic
  const filteredData = useMemo(() => {
    return gradeData.filter(item => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        item.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.student_id.toLowerCase().includes(searchTerm.toLowerCase())

      // Class filter
      const matchesClass = classFilter === 'all' || item.class_name === classFilter

      // Status filter
      const matchesStatus = statusFilter === 'all' || item.submission_status === statusFilter

      return matchesSearch && matchesClass && matchesStatus
    })
  }, [gradeData, searchTerm, classFilter, statusFilter])

  // Get unique class names for filter dropdown
  const uniqueClasses = useMemo(() => {
    const classes = [...new Set(gradeData.map(item => item.class_name))]
    return classes.sort()
  }, [gradeData])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Theo dõi điểm số toàn trường</h1>
          <p className="text-muted-foreground">
            Quản lý và theo dõi tiến độ nhập điểm của tất cả các lớp và môn học
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadGradeData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
          <Button
            onClick={() => setSubmissionDialogOpen(true)}
            disabled={selectedItems.size === 0}
          >
            Gửi bảng điểm ({selectedItems.size})
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn kỳ báo cáo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Chọn kỳ báo cáo" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{period.name} - {period.academic_years?.[0]?.name} - {period.semesters?.[0]?.name}</span>
                      {period.is_active && (
                        <Badge variant="outline" className="ml-2 text-xs">Đang hoạt động</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPeriod && (
              <div className="text-sm text-muted-foreground">
                Kỳ: {periods.find(p => p.id === selectedPeriod)?.name}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Filter and Search */}
      {selectedPeriod && !loading && (
        <Card>
          <CardHeader>
            <CardTitle>Bộ lọc và tìm kiếm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Tìm kiếm học sinh</Label>
                <Input
                  id="search"
                  placeholder="Tên hoặc mã học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class-filter">Lọc theo lớp</Label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger id="class-filter">
                    <SelectValue placeholder="Tất cả lớp" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả lớp</SelectItem>
                    {uniqueClasses.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status-filter">Trạng thái gửi</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Tất cả trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="submitted">Đã gửi</SelectItem>
                    <SelectItem value="resubmitted">Gửi lại</SelectItem>
                    <SelectItem value="not_submitted">Chưa gửi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Thao tác</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('')
                      setClassFilter('all')
                      setStatusFilter('all')
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </div>

            {(searchTerm || classFilter !== 'all' || statusFilter !== 'all') && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Hiển thị {filteredData.length} / {gradeData.length} học sinh
                  {searchTerm && ` • Tìm kiếm: "${searchTerm}"`}
                  {classFilter !== 'all' && ` • Lớp: ${classFilter}`}
                  {statusFilter !== 'all' && ` • Trạng thái: ${statusFilter === 'submitted' ? 'Đã gửi' : statusFilter === 'resubmitted' ? 'Gửi lại' : 'Chưa gửi'}`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg">Đang tải dữ liệu điểm số...</p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số lớp</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_classes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng học sinh</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_students}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng môn học</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_subjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getCompletionColor(stats.overall_completion_rate)}`}>
                {stats.overall_completion_rate}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm TB chung</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getGradeColor(stats.overall_average_grade)}`}>
                {stats.overall_average_grade ?? 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Grade Data Table */}
      {!loading && gradeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chi tiết điểm số theo học sinh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedItems.size === gradeData.length && gradeData.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllItems()
                            } else {
                              clearSelection()
                            }
                          }}
                        />
                        <span>Chọn</span>
                      </div>
                    </th>
                    <th className="text-left p-3 font-medium">Học sinh</th>
                    <th className="text-left p-3 font-medium">Số báo danh</th>
                    <th className="text-left p-3 font-medium">Lớp</th>
                    <th className="text-left p-3 font-medium">Tổng môn</th>
                    <th className="text-left p-3 font-medium">Đã có điểm</th>
                    <th className="text-left p-3 font-medium">Tỷ lệ (%)</th>
                    <th className="text-left p-3 font-medium">Điểm TB chung</th>
                    <th className="text-left p-3 font-medium">Phân bố điểm</th>
                    <th className="text-left p-3 font-medium">Trạng thái gửi</th>
                    <th className="text-left p-3 font-medium">Cập nhật cuối</th>
                    <th className="text-left p-3 font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row) => {
                    const isSelected = selectedItems.has(row.student_id)

                    return (
                      <tr key={row.student_id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItemSelection(row.student_id)}
                          />
                        </td>
                        <td className="p-3 font-medium">{row.student_name}</td>
                        <td className="p-3">{row.student_number}</td>
                        <td className="p-3">{row.class_name}</td>
                        <td className="p-3 text-center">{row.total_subjects}</td>
                        <td className="p-3 text-center">{row.subjects_with_grades}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center gap-2">
                            <Progress value={row.completion_rate} className="w-16 h-2" />
                            <span className={`text-sm font-medium ${getCompletionColor(row.completion_rate)}`}>
                              {row.completion_rate}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-medium ${getGradeColor(row.overall_average)}`}>
                            {row.overall_average ?? 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              ≥8: {row.grade_distribution.excellent}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              6.5-7.9: {row.grade_distribution.good}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                              5-6.4: {row.grade_distribution.average}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                              &lt;5: {row.grade_distribution.poor}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={row.submission_status === 'submitted' ? 'default' :
                                      row.submission_status === 'resubmitted' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {row.submission_status === 'submitted' ? 'Đã gửi' :
                               row.submission_status === 'resubmitted' ? 'Gửi lại' : 'Chưa gửi'}
                            </Badge>
                            {row.submission_count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Lần {row.submission_count}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(row.last_updated).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/dashboard/admin/grade-tracking/student/${row.student_id}?period=${selectedPeriod}`, '_blank')}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Chi tiết
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!loading && gradeData.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Chưa có dữ liệu điểm</h3>
            <p className="text-muted-foreground mb-4">
              Chưa có dữ liệu điểm số cho kỳ báo cáo đã chọn
            </p>
            <Button variant="outline" onClick={loadGradeData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Submission Dialog */}
      <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gửi bảng điểm cho giáo viên chủ nhiệm</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Bạn đang gửi bảng điểm cho {selectedItems.size} học sinh
              </p>
              <div className="max-h-32 overflow-y-auto border rounded p-2 text-sm">
                {Array.from(selectedItems).map(studentId => {
                  const student = gradeData.find(d => d.student_id === studentId)
                  return (
                    <div key={studentId} className="flex justify-between py-1">
                      <span>{student?.student_name}</span>
                      <span>{student?.class_name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Check if any selected students have been submitted before */}
            {Array.from(selectedItems).some(studentId => {
              const student = gradeData.find(d => d.student_id === studentId)
              return student && student.submission_count > 0
            }) && (
              <div className="space-y-2">
                <Label htmlFor="submission-reason">
                  Lý do gửi lại <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="submission-reason"
                  placeholder="Nhập lý do gửi lại bảng điểm (ví dụ: Cập nhật điểm, Sửa lỗi, Bổ sung thông tin...)"
                  value={submissionReason}
                  onChange={(e) => setSubmissionReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmissionDialogOpen(false)}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmitGrades}
              disabled={submitting || (
                Array.from(selectedItems).some(studentId => {
                  const student = gradeData.find(d => d.student_id === studentId)
                  return student && student.submission_count > 0
                }) && !submissionReason.trim()
              )}
            >
              {submitting ? 'Đang gửi...' : 'Gửi bảng điểm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}