'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'

import { useAuth } from '@/features/authentication/hooks/use-auth'
// ðŸš€ MIGRATION: Add coordinated loading system
import { usePageTransition /* , useCoordinatedLoading */ } from '@/shared/hooks/use-coordinated-loading'
import { 
  getTeacherLeaveApplicationsAction,
  updateLeaveApplicationStatusAction,
  type LeaveApplication 
} from '@/lib/actions/leave-application-actions'
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

export default function TeacherLeaveRequestsPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  
  // ðŸš€ MIGRATION: Replace isLoading with coordinated system  
  const { startPageTransition, stopLoading } = usePageTransition()
  // const coordinatedLoading = useCoordinatedLoading() // Unused variable
  
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({})

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [paginatedApplications, setPaginatedApplications] = useState<LeaveApplication[]>([])
  const pageSize = 10

  const fetchLeaveApplications = useCallback(async () => {
    try {
      // ðŸŽ¯ UX IMPROVEMENT: Use global loading with meaningful message
      startPageTransition("Đang tải danh sách đơn xin nghỉ...")
      setError(null)

      const result = await getTeacherLeaveApplicationsAction()

      if (result.success && result.data) {
        const allApplications = result.data
        setApplications(allApplications)

        // Update pagination
        setTotalCount(allApplications.length)
        setTotalPages(Math.ceil(allApplications.length / pageSize))

        // Get current page applications
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        setPaginatedApplications(allApplications.slice(startIndex, endIndex))
      } else {
        setError(result.error || 'Không thể tải danh sách đơn xin nghỉ')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi')
    } finally {
      stopLoading()
    }
  }, [currentPage, pageSize, startPageTransition, stopLoading]) // âœ… Add all dependencies

  useEffect(() => {
    if (user && profile?.role === 'teacher') {
      fetchLeaveApplications()
    }
  }, [user, profile, currentPage, fetchLeaveApplications]) // âœ… Add all dependencies

  const handleStatusUpdate = async (applicationId: string, status: 'approved' | 'rejected') => {
    try {
      setProcessingId(applicationId)
      setError(null)

      const result = await updateLeaveApplicationStatusAction({
        applicationId,
        status,
        teacherResponse: responseText[applicationId] || ''
      })

      if (result.success) {
        // Refresh the list
        await fetchLeaveApplications()
        // Clear the response text for this application
        setResponseText(prev => {
          const newState = { ...prev }
          delete newState[applicationId]
          return newState
        })
      } else {
        setError(result.error || 'Failed to update leave application')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Đang chờ</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><Check className="w-3 h-3 mr-1" />Đã duyệt</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><X className="w-3 h-3 mr-1" />Từ chối</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const getDaysDifference = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  // ðŸš€ MIGRATION: Loading now handled by CoordinatedLoadingOverlay
  // Show initial state during loading when no data loaded yet
  // const isInitialLoading = coordinatedLoading.isLoading && applications.length === 0

  // Show access denied if no permission
  if (!user || profile?.role !== 'teacher') {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Từ chối truy cập</h2>
          <p className="text-gray-600">Bạn không có quyền truy cập trang này.</p>
          <Button onClick={() => router.push('/dashboard/teacher')}>
            Quay lại bảng điều khiển
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/teacher')}
            className="w-fit"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại bảng điều khiển
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Đơn xin nghỉ</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Xem xét và quản lý đơn xin nghỉ của học sinh lớp chủ nhiệm
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Tổng số đơn</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Đang chờ</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                {applications.filter(app => app.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã xử lý</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {applications.filter(app => app.status !== 'pending').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {applications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn xin nghỉ</h3>
                <p className="text-gray-600 text-center">
                  Hiện chưa có đơn xin nghỉ nào từ học sinh lớp chủ nhiệm.
                </p>
              </CardContent>
            </Card>
          ) : (
            paginatedApplications.map((application) => (
              <Card key={application.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {application.student?.full_name} ({application.student?.student_id})
                        </span>
                        {getStatusBadge(application.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(application.start_date)} - {formatDate(application.end_date)}
                        </div>
                        <span>({getDaysDifference(application.start_date, application.end_date)} ngày)</span>
                        <Badge variant="secondary">{application.leave_type}</Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <div>Gửi: {formatDate(application.created_at)}</div>
                      {application.responded_at && (
                        <div>Phản hồi: {formatDate(application.responded_at)}</div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Lý do</Label>
                    <p className="text-sm text-muted-foreground mt-1">{application.reason}</p>
                  </div>

                  {application.attachment_url && (
                    <div>
                      <Label className="text-sm font-medium">Tệp đính kèm</Label>
                      <div className="mt-1">
                        <Button variant="outline" size="sm" asChild>
                          <a href={application.attachment_url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-3 w-3 mr-1" />
                            Xem tệp đính kèm
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {application.teacher_response && (
                    <div>
                      <Label className="text-sm font-medium">Phản hồi của giáo viên</Label>
                      <p className="text-sm text-muted-foreground mt-1">{application.teacher_response}</p>
                    </div>
                  )}

                  {application.status === 'pending' && (
                    <div className="space-y-3 pt-4 border-t">
                      <div>
                        <Label htmlFor={`response-${application.id}`} className="text-sm font-medium">
                          Phản hồi (không bắt buộc)
                        </Label>
                        <Textarea
                          id={`response-${application.id}`}
                          placeholder="Thêm nội dung phản hồi..."
                          value={responseText[application.id] || ''}
                          onChange={(e) => setResponseText(prev => ({
                            ...prev,
                            [application.id]: e.target.value
                          }))}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleStatusUpdate(application.id, 'approved')}
                          disabled={processingId === application.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Duyệt
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleStatusUpdate(application.id, 'rejected')}
                          disabled={processingId === application.id}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Từ chối
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages} - Tổng {totalCount} đơn xin nghỉ
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                      if (pageNum > totalPages) return null

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
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
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
