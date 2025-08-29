'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import Link from 'next/link'

import { useAuth } from '@/features/authentication/hooks/use-auth'


import {
  getTeacherLeaveApplicationsAction,
  updateLeaveApplicationStatusAction,
  type LeaveApplication
} from '@/lib/actions/leave-application-actions'
import {
  Check,
  X,
  Clock,
  Calendar,
  User,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import Image from "next/image"
import { ImageViewer } from '@/shared/components/ui/image-viewer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function TeacherLeaveRequestsPage() {
  const router = useRouter()
  const { user, profile } = useAuth()
  
  // ðŸš€ MIGRATION: Replace isLoading with coordinated system  

  
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState<{ [key: string]: string }>({})

  // Dialog states
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>('all')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [paginatedApplications, setPaginatedApplications] = useState<LeaveApplication[]>([])
  const pageSize = 10



  // ✅ FIXED: Memoize filtered applications to prevent infinite loop
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = searchTerm === '' ||
        app.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.student?.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.reason.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || app.status === statusFilter
      const matchesLeaveType = leaveTypeFilter === 'all' || app.leave_type === leaveTypeFilter

      return matchesSearch && matchesStatus && matchesLeaveType
    })
  }, [applications, searchTerm, statusFilter, leaveTypeFilter])

  const fetchLeaveApplications = useCallback(async () => {
    try {
      // ðŸŽ¯ UX IMPROVEMENT: Use global loading with meaningful message
      // Loading state removed
      setError(null)

      const result = await getTeacherLeaveApplicationsAction()

      if (result.success && result.data) {
        const allApplications = result.data
        setApplications(allApplications)
      } else {
        setError(result.error || 'Không thể tải danh sách đơn xin nghỉ')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi')
    } finally {
      // Loading state removed
    }
  }, []) // âœ… Add all dependencies

  // ✅ FIXED: Handle filter changes and page reset (without currentPage dependency)
  useEffect(() => {
    setTotalCount(filteredApplications.length)
    const newTotalPages = Math.ceil(filteredApplications.length / pageSize)
    setTotalPages(newTotalPages)

    // Reset to page 1 when filters change and current page is invalid
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(1)
      return // Exit early, let the page change effect handle pagination
    }

    // Update pagination for current page
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setPaginatedApplications(filteredApplications.slice(startIndex, endIndex))
  }, [filteredApplications, pageSize]) // eslint-disable-line react-hooks/exhaustive-deps

  // ✅ FIXED: Handle page changes separately
  useEffect(() => {
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setPaginatedApplications(filteredApplications.slice(startIndex, endIndex))
  }, [currentPage, filteredApplications, pageSize])

  useEffect(() => {
    if (user && profile?.role === 'teacher') {
      fetchLeaveApplications()
    }
  }, [user, profile, fetchLeaveApplications]) // âœ… Add all dependencies

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

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'sick':
        return 'Nghỉ ốm'
      case 'personal':
        return 'Nghỉ cá nhân'
      case 'family':
        return 'Nghỉ gia đình'
      case 'emergency':
        return 'Nghỉ khẩn cấp'
      default:
        return type
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

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  // ðŸš€ MIGRATION: Loading now handled by CoordinatedLoadingOverlay
  // Show initial state during loading when no data loaded yet
  // const isInitialLoading = coordinatedLoading.isLoading && applications.length === 0

  // Show loading while checking permissions
  if (!user || !profile) {
    return (
      <ContentLayout title="Đơn xin nghỉ" role="teacher">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
        </div>
      </ContentLayout>
    )
  }

  // Show access denied if no permission
  if (profile?.role !== 'teacher') {
    return (
      <ContentLayout title="Đơn xin nghỉ" role="teacher">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Từ chối truy cập</h2>
          <p className="text-gray-600">Bạn không có quyền truy cập trang này.</p>
          <Button onClick={() => router.push('/dashboard/teacher')}>
            Quay lại bảng điều khiển
          </Button>
        </div>
      </ContentLayout>
    )
  }

  return (
    <ContentLayout title="Đơn xin nghỉ" role="teacher">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/teacher">Bảng điều khiển</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Đơn xin nghỉ</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="min-h-[calc(100vh-56px-64px-20px-24px-56px-48px)]">
            <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 sm:space-y-3 animate-in fade-in duration-700">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Đơn xin nghỉ
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Xem xét và quản lý đơn xin nghỉ của học sinh lớp chủ nhiệm
              </p>
            </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
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

        {/* Search and Filters */}
        <Card className="hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
              <Filter className="h-5 w-5 text-blue-600" />
              Tìm kiếm và lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="search">Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Tên học sinh, mã số, lý do..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status-filter">Trạng thái</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Đang chờ</SelectItem>
                    <SelectItem value="approved">Đã duyệt</SelectItem>
                    <SelectItem value="rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="leave-type-filter">Loại nghỉ</Label>
                <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại nghỉ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="Nghỉ ốm">Nghỉ ốm</SelectItem>
                    <SelectItem value="Nghỉ phép">Nghỉ phép</SelectItem>
                    <SelectItem value="Nghỉ việc gia đình">Nghỉ việc gia đình</SelectItem>
                    <SelectItem value="Khác">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-muted-foreground">
              Hiển thị {filteredApplications.length} trong tổng số {applications.length} đơn xin nghỉ
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        <div className="space-y-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {applications.length === 0 ? 'Chưa có đơn xin nghỉ' : 'Không tìm thấy đơn xin nghỉ'}
                </h3>
                <p className="text-gray-600 text-center">
                  {applications.length === 0
                    ? 'Hiện chưa có đơn xin nghỉ nào từ học sinh lớp chủ nhiệm.'
                    : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            paginatedApplications.map((application, index) => {
              const isExpanded = expandedCards.has(application.id)
              return (
              <Card
                key={application.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500 hover:border-l-emerald-500 animate-in fade-in slide-in-from-bottom-4 duration-700"
                style={{ animationDelay: `${450 + index * 100}ms` }}
              >
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
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCardExpansion(application.id)}
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-2" />
                              Thu gọn
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-2" />
                              Mở rộng
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application)
                            setShowDetailDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </Button>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <div>Gửi: {formatDate(application.created_at)}</div>
                        {application.responded_at && (
                          <div>Phản hồi: {formatDate(application.responded_at)}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                {isExpanded && (
                  <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Lý do</Label>
                    <p className="text-sm text-muted-foreground mt-1">{application.reason}</p>
                  </div>

                  {application.attachment_url && (
                    <div>
                      <Label className="text-sm font-medium">Đơn xin nghỉ học</Label>
                      <div className="mt-1 border rounded-lg p-2 bg-gray-50">
                        <ImageViewer
                          src={application.attachment_url}
                          alt="Đơn xin nghỉ học"
                          className="rounded-lg overflow-hidden"
                        >
                          <Image
                            src={application.attachment_url}
                            alt="Đơn xin nghỉ học"
                            width={800}
                            height={400}
                            className="max-w-full h-auto rounded-md shadow-sm cursor-pointer hover:scale-105 transition-transform duration-200"
                            style={{ maxHeight: '400px' }}
                            draggable={false}
                            unselectable="on"
                            onContextMenu={(e) => e.preventDefault()}
                          />
                        </ImageViewer>
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
                )}
              </Card>
            )})
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
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Chi tiết đơn xin nghỉ
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đơn xin nghỉ của {selectedApplication?.student?.full_name}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Học sinh</Label>
                  <p className="text-base font-medium">{selectedApplication.student?.full_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Lớp</Label>
                  <p className="text-base">{selectedApplication.class?.name || 'Chưa có thông tin'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Loại nghỉ</Label>
                  <p className="text-base">{getLeaveTypeLabel(selectedApplication.leave_type)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Trạng thái</Label>
                  <div className="mt-1">{getStatusBadge(selectedApplication.status)}</div>
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Ngày bắt đầu</Label>
                  <p className="text-base">{format(new Date(selectedApplication.start_date), 'dd/MM/yyyy', { locale: vi })}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Ngày kết thúc</Label>
                  <p className="text-base">{format(new Date(selectedApplication.end_date), 'dd/MM/yyyy', { locale: vi })}</p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Lý do</Label>
                <p className="text-base mt-1 p-3 bg-gray-50 rounded-lg">{selectedApplication.reason}</p>
              </div>

              {/* Attachment */}
              {selectedApplication.attachment_url && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Tệp đính kèm</Label>
                  <div className="mt-2 space-y-2">
                    {/* Debug info
                    <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded space-y-2">
                      <div>URL: {selectedApplication.attachment_url}</div>
                      <div>
                        <strong>Test với img tag:</strong>
                        <img
                          src={selectedApplication.attachment_url}
                          alt="Test"
                          className="w-20 h-20 object-contain border mt-1"
                          onError={() => console.log('IMG tag failed to load')}
                          onLoad={() => console.log('IMG tag loaded successfully')}
                        />
                      </div>
                    </div> */}

                    {/* Direct Image Display - Test without ImageViewer first */}
                    <div className="rounded-lg border overflow-hidden bg-white p-2">
                      <Image
                        src={selectedApplication.attachment_url}
                        alt="Đính kèm đơn xin nghỉ"
                        width={400}
                        height={300}
                        className="w-full h-auto max-h-64 object-contain rounded"
                        onError={(e) => {
                          console.error('Image load error:', selectedApplication.attachment_url)
                          e.currentTarget.style.display = 'none'
                          // Show error message
                          const errorDiv = document.createElement('div')
                          errorDiv.className = 'text-red-500 text-center p-4'
                          errorDiv.textContent = 'Không thể tải hình ảnh'
                          e.currentTarget.parentNode?.appendChild(errorDiv)
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', selectedApplication.attachment_url)
                        }}
                      />
                    </div>

                    {/* ImageViewer for zoom functionality */}
                    <div className="mt-2">
                      <ImageViewer
                        src={selectedApplication.attachment_url}
                        alt="Đính kèm đơn xin nghỉ"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          Click để phóng to
                        </Button>
                      </ImageViewer>
                    </div>

                    {/* Fallback buttons */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => selectedApplication.attachment_url && window.open(selectedApplication.attachment_url, '_blank')}
                        className="text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Xem trong tab mới
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedApplication.attachment_url) {
                            const link = document.createElement('a')
                            link.href = selectedApplication.attachment_url
                            link.download = `don-xin-nghi-${selectedApplication.student?.full_name}.jpg`
                            link.click()
                          }
                        }}
                        className="text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Tải xuống
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Teacher Response */}
              {selectedApplication.teacher_response && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Phản hồi từ giáo viên</Label>
                  <p className="text-base mt-1 p-3 bg-blue-50 rounded-lg">{selectedApplication.teacher_response}</p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <Label className="text-xs font-medium text-gray-500">Ngày tạo</Label>
                  <p>{format(new Date(selectedApplication.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                </div>
                {selectedApplication.responded_at && (
                  <div>
                    <Label className="text-xs font-medium text-gray-500">Ngày phản hồi</Label>
                    <p>{format(new Date(selectedApplication.responded_at), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ContentLayout>
  )
}
