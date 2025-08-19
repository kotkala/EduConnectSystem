"use client"

import React, { useState, useEffect, useCallback, useMemo, memo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Edit,
  Send,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import { 
  getReportPeriodsAction,
  type ReportPeriod 
} from "@/lib/actions/report-period-actions"
import { 
  getStudentsForReportAction,
  type StudentForReport
} from "@/lib/actions/student-report-actions"
// 🚀 MIGRATION: Add coordinated loading system
import { usePageTransition } from '@/hooks/use-coordinated-loading'
// Removed StudentReportModal import - now using dedicated page

// Utility function to format date range for dropdown
const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  const end = new Date(endDate).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  return `${start} - ${end}`
}

// Memoized student item component for performance
const StudentItem = memo(function StudentItem({
  student,
  onStudentClick,
  getStatusBadge
}: {
  student: StudentForReport
  onStudentClick: (student: StudentForReport) => void
  getStatusBadge: (student: StudentForReport) => React.ReactElement
}) {
  const handleClick = useCallback(() => {
    onStudentClick(student)
  }, [student, onStudentClick])

  return (
    <button
      type="button"
      className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
      onClick={handleClick}
    >
      <div className="flex-1">
        <h4 className="font-medium">{student.full_name}</h4>
        <p className="text-sm text-gray-500">
          Mã HS: {student.student_id} • Lớp: {student.class_name}
        </p>
      </div>
      <div className="flex items-center gap-3">
        {getStatusBadge(student)}
        <div className="flex items-center gap-1">
          {student.report?.status === 'sent' ? (
            <Eye className="h-4 w-4 text-blue-500" />
          ) : (
            <Edit className="h-4 w-4 text-gray-500" />
          )}
        </div>
      </div>
    </button>
  )
})

// Memoized students list component for performance
const StudentsList = memo(function StudentsList({
  studentsLoading,
  students,
  handleStudentClick,
  getStatusBadge
}: {
  studentsLoading: boolean
  students: StudentForReport[]
  handleStudentClick: (student: StudentForReport) => void
  getStatusBadge: (student: StudentForReport) => React.ReactElement
}) {
  if (studentsLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không có học sinh
        </h3>
        <p className="text-gray-600">
          Không tìm thấy học sinh nào trong lớp chủ nhiệm của bạn.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {students.map((student) => (
        <StudentItem
          key={student.id}
          student={student}
          onStudentClick={handleStudentClick}
          getStatusBadge={getStatusBadge}
        />
      ))}
    </div>
  )
})

function TeacherReportsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 🚀 MIGRATION: Replace loading state with coordinated system
  const { startPageTransition, stopLoading } = usePageTransition()
  
  const [reportPeriods, setReportPeriods] = useState<ReportPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [students, setStudents] = useState<StudentForReport[]>([])
  
  // 📊 Keep section loading for non-blocking student list updates  
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Remove modal state - we'll navigate to dedicated page instead
  const [currentPage, setCurrentPage] = useState(1)
  const [bulkSending, setBulkSending] = useState(false)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [parentFeedbackFilter, setParentFeedbackFilter] = useState<string>("all")

  const ITEMS_PER_PAGE = 10

  // Memoized statistics and pagination for performance
  const stats = useMemo(() => {
    const total = students.length
    const withReports = students.filter(s => s.report).length
    const sentReports = students.filter(s => s.report?.status === 'sent').length
    const draftReports = students.filter(s => s.report?.status === 'draft').length

    return {
      total,
      withReports,
      sentReports,
      draftReports,
      noReports: total - withReports
    }
  }, [students])

  // Filter students based on search term and filters
  const filteredStudents = useMemo(() => {
    let filtered = students

    // Search by name
    if (searchTerm.trim()) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by report status
    if (statusFilter !== "all") {
      if (statusFilter === "sent") {
        filtered = filtered.filter(student => student.report?.status === 'sent')
      } else if (statusFilter === "draft") {
        filtered = filtered.filter(student => student.report?.status === 'draft')
      } else if (statusFilter === "not_created") {
        filtered = filtered.filter(student => !student.report)
      }
    }

    // Filter by parent feedback (placeholder for future implementation)
    if (parentFeedbackFilter !== "all") {
      // TODO: Add parent feedback filtering logic when parent feedback is implemented
      // For now, this is a placeholder
    }

    return filtered
  }, [students, searchTerm, statusFilter, parentFeedbackFilter])

  // Pagination logic using filtered students
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return filteredStudents.slice(startIndex, endIndex)
  }, [filteredStudents, currentPage, ITEMS_PER_PAGE])

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)



  const loadReportPeriods = useCallback(async () => {
    try {
      // 🎯 UX IMPROVEMENT: Use global loading with meaningful message
      startPageTransition("Đang tải danh sách kỳ báo cáo...")
      setError(null)

      const result = await getReportPeriodsAction()
      
      if (result.success) {
        setReportPeriods(result.data || [])
      } else {
        setError(result.error || 'Failed to load report periods')
      }
    } catch (error) {
      console.error('Error loading report periods:', error)
      setError('Failed to load report periods')
    } finally {
      stopLoading()
    }
  }, [startPageTransition, stopLoading])

  const loadStudents = useCallback(async () => {
    if (!selectedPeriod) return

    try {
      setStudentsLoading(true)
      const result = await getStudentsForReportAction(selectedPeriod)
      
      if (result.success) {
        setStudents(result.data || [])
      } else {
        toast.error(result.error || 'Failed to load students')
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Failed to load students')
    } finally {
      setStudentsLoading(false)
    }
  }, [selectedPeriod])

  // Bulk send functionality
  const handleBulkSend = useCallback(async () => {
    const reportsToSend = students.filter(s => s.report?.status === 'draft')

    if (reportsToSend.length === 0) {
      toast.error('Không có báo cáo nào để gửi')
      return
    }

    setBulkSending(true)
    try {
      // Import the bulk send action
      const { bulkSendReportsAction } = await import('@/lib/actions/student-report-actions')

      const result = await bulkSendReportsAction(selectedPeriod, reportsToSend.map(s => s.report!.id))

      if (result.success) {
        toast.success(`Đã gửi ${reportsToSend.length} báo cáo thành công`)
        loadStudents() // Reload to get updated statuses
      } else {
        toast.error(result.error || 'Không thể gửi báo cáo')
      }
    } catch (error) {
      console.error('Error bulk sending reports:', error)
      toast.error('Không thể gửi báo cáo')
    } finally {
      setBulkSending(false)
    }
  }, [students, selectedPeriod, loadStudents])

  const handleRefresh = useCallback(() => {
    loadReportPeriods()
    if (selectedPeriod) {
      loadStudents()
    }
  }, [loadReportPeriods, selectedPeriod, loadStudents])

  const handleStudentClick = useCallback((student: StudentForReport) => {
    router.push(`/dashboard/teacher/reports/${student.id}/${selectedPeriod}`)
  }, [router, selectedPeriod])



  const getStatusBadge = useCallback((student: StudentForReport) => {
    if (!student.report) {
      return <Badge variant="secondary">Chưa tạo</Badge>
    }

    if (student.report.status === 'sent') {
      return <Badge className="bg-green-100 text-green-800">Đã gửi</Badge>
    }

    return <Badge variant="outline">Bản nháp</Badge>
  }, [])

  useEffect(() => {
    loadReportPeriods()
  }, [loadReportPeriods])

  // Handle URL parameter for selected period
  useEffect(() => {
    const periodParam = searchParams.get('period')
    if (periodParam && reportPeriods.length > 0) {
      // Check if the period exists in the loaded periods
      const periodExists = reportPeriods.some(p => p.id === periodParam)
      if (periodExists) {
        setSelectedPeriod(periodParam)
      }
    }
  }, [searchParams, reportPeriods])

  useEffect(() => {
    if (selectedPeriod) {
      loadStudents()
    }
  }, [selectedPeriod, loadStudents])

  // 🚀 MIGRATION: Loading now handled by CoordinatedLoadingOverlay

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Report Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            Chọn kỳ báo cáo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-full md:flex-1">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder="Chọn kỳ báo cáo" />
                </SelectTrigger>
                <SelectContent className="max-h-80 text-base">
                  {reportPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id} className="py-3 text-base">
                      {period.name} ({formatDateRange(period.start_date, period.end_date)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={handleRefresh} className="h-11 text-base">
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      {selectedPeriod && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tổng học sinh</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Đã gửi</p>
                  <p className="text-2xl font-bold text-green-600">{stats.sentReports}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Bản nháp</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.draftReports}</p>
                </div>
                <Edit className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Chưa tạo</p>
                  <p className="text-2xl font-bold text-red-600">{stats.noReports}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Reports List */}
      {selectedPeriod && (
        <Card>
          <CardHeader>
            <CardTitle>Danh sách học sinh</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Input
                  placeholder="Tìm kiếm theo tên hoặc mã học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lọc theo trạng thái báo cáo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="sent">Đã gửi</SelectItem>
                    <SelectItem value="draft">Bản nháp</SelectItem>
                    <SelectItem value="not_created">Chưa tạo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={parentFeedbackFilter} onValueChange={setParentFeedbackFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Lọc theo ý kiến phụ huynh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả ý kiến</SelectItem>
                    <SelectItem value="agree">Phụ huynh đồng ý</SelectItem>
                    <SelectItem value="disagree">Phụ huynh không đồng ý</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {/* Bulk Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleBulkSend}
                    disabled={bulkSending || stats.draftReports === 0}
                    className="flex items-center gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {bulkSending ? 'Đang nộp...' : `Nộp tất cả cho Admin (${stats.draftReports})`}
                  </Button>
                  <span className="text-sm text-gray-600">
                    Nộp tất cả báo cáo bản nháp cho Admin để duyệt
                  </span>
                </div>

                {/* Pagination Info */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    Trang {currentPage} / {totalPages} ({filteredStudents.length} học sinh)
                  </div>
                )}
              </div>

              <StudentsList
                studentsLoading={studentsLoading}
                students={paginatedStudents}
                handleStudentClick={handleStudentClick}
                getStatusBadge={getStatusBadge}
              />

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal removed - now using dedicated page navigation */}
    </div>
  )
}

// Export memoized component for performance
export default memo(TeacherReportsClient)
