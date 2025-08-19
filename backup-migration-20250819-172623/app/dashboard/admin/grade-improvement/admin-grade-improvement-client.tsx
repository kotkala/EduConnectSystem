'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePageTransition } from '@/components/ui/global-loading-provider'
import { useCoordinatedLoading } from '@/hooks/use-coordinated-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  TrendingUp,
  Plus,
  Search,

  Calendar,
  User,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  createGradeImprovementPeriodAction,
  getGradeImprovementPeriodsAction,
  getGradeImprovementRequestsAction,
  respondToGradeImprovementRequestAction
} from '@/lib/actions/grade-improvement-actions'
import {
  type GradeImprovementPeriod,
  type GradeImprovementRequest,
  type GradeImprovementRequestFilters
} from '@/lib/validations/grade-improvement-validations'
import { getGradeReportingPeriodsAction } from '@/lib/actions/grade-management-actions'

interface GradeReportingPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
}

export function AdminGradeImprovementClient() {
  // 🚀 COORDINATED LOADING: Replace scattered loading with coordinated system
  const { startPageTransition, stopLoading } = usePageTransition()
  const coordinatedLoading = useCoordinatedLoading()

  // State management
  const [periods, setPeriods] = useState<GradeImprovementPeriod[]>([])
  const [requests, setRequests] = useState<GradeImprovementRequest[]>([])
  const [gradeReportingPeriods, setGradeReportingPeriods] = useState<GradeReportingPeriod[]>([])
  
  // Dialog states
  const [showCreatePeriodDialog, setShowCreatePeriodDialog] = useState(false)
  const [showRequestDetailDialog, setShowRequestDetailDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<GradeImprovementRequest | null>(null)
  
  // Form states
  const [periodForm, setPeriodForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    grade_reporting_period_id: ''
  })
  
  const [responseForm, setResponseForm] = useState({
    status: '',
    admin_comment: ''
  })
  
  // Filter and pagination states
  const [filters, setFilters] = useState<GradeImprovementRequestFilters>({
    status: undefined,
    improvement_period_id: undefined,
    subject_id: undefined,
    student_search: undefined,
    page: 1,
    limit: 20
  })
  
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0
  })
  
  // 📊 Section loading for non-blocking operations
  const [sectionLoading, setSectionLoading] = useState({
    creatingPeriod: false,
    respondingToRequest: false
  })

  // Load data functions
  const loadPeriods = useCallback(async () => {
    try {
      const result = await getGradeImprovementPeriodsAction()
      if (result.success && result.data) {
        setPeriods(result.data)
      } else {
        toast.error(result.error || 'Không thể tải danh sách kỳ cải thiện điểm')
      }
    } catch (error) {
      console.error('Error loading periods:', error)
      toast.error('Lỗi khi tải danh sách kỳ cải thiện điểm')
    }
  }, [])

  const loadGradeReportingPeriods = useCallback(async () => {
    try {
      const result = await getGradeReportingPeriodsAction({ limit: 100 })
      if (result.success && result.data) {
        setGradeReportingPeriods(result.data as unknown as GradeReportingPeriod[])
      }
    } catch (error) {
      console.error('Error loading grade reporting periods:', error)
    }
  }, [])

  const loadRequests = useCallback(async () => {
    try {
      // 🎯 UX IMPROVEMENT: Use global loading for initial load, no loading for filter changes
      const isInitialLoad = requests.length === 0 && filters.page === 1
      
      if (isInitialLoad) {
        startPageTransition("Đang tải danh sách đơn cải thiện điểm...")
      }

      const result = await getGradeImprovementRequestsAction(filters)
      if (result.success && result.data) {
        setRequests(result.data.requests)
        setPagination({
          total: result.data.total,
          totalPages: result.data.totalPages
        })
      } else {
        toast.error(result.error || 'Không thể tải danh sách đơn cải thiện điểm')
      }
    } catch (error) {
      console.error('Error loading requests:', error)
      toast.error('Lỗi khi tải danh sách đơn cải thiện điểm')
    } finally {
      stopLoading()
    }
  }, [filters, requests.length, startPageTransition, stopLoading])

  // Initial data loading
  useEffect(() => {
    loadPeriods()
    loadGradeReportingPeriods()
  }, [loadPeriods, loadGradeReportingPeriods])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  // Memoized status badge component to prevent re-renders
  const StatusBadge = useMemo(() => {
    const StatusBadgeComponent = ({ status }: { status: string }) => {
      const statusConfig = {
        pending: { label: 'Chờ duyệt', variant: 'secondary' as const, icon: Clock },
        approved: { label: 'Đã duyệt', variant: 'default' as const, icon: CheckCircle },
        rejected: { label: 'Từ chối', variant: 'destructive' as const, icon: XCircle }
      }
      
      const config = statusConfig[status as keyof typeof statusConfig]
      if (!config) return null
      
      const Icon = config.icon
      
      return (
        <Badge variant={config.variant} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      )
    }
    StatusBadgeComponent.displayName = 'StatusBadge'
    return StatusBadgeComponent
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Quản lý cải thiện điểm số
          </h1>
          <p className="text-muted-foreground">
            Quản lý các kỳ cải thiện điểm và xử lý đơn yêu cầu của học sinh
          </p>
        </div>
        
        <Dialog open={showCreatePeriodDialog} onOpenChange={setShowCreatePeriodDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tạo kỳ cải thiện điểm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tạo kỳ cải thiện điểm mới</DialogTitle>
              <DialogDescription>
                Tạo kỳ thời gian cho phép học sinh nộp đơn cải thiện điểm
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="period-name">Tên kỳ cải thiện điểm</Label>
                <Input
                  id="period-name"
                  value={periodForm.name}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Kỳ cải thiện điểm HK1 2024-2025"
                />
              </div>
              
              <div>
                <Label htmlFor="period-description">Mô tả (tùy chọn)</Label>
                <Textarea
                  id="period-description"
                  value={periodForm.description}
                  onChange={(e) => setPeriodForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Mô tả về kỳ cải thiện điểm..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="grade-reporting-period">Kỳ báo cáo điểm</Label>
                <Select
                  value={periodForm.grade_reporting_period_id}
                  onValueChange={(value) => setPeriodForm(prev => ({ ...prev, grade_reporting_period_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn kỳ báo cáo điểm" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeReportingPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Ngày bắt đầu</Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={periodForm.start_date}
                    onChange={(e) => setPeriodForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="end-date">Ngày kết thúc</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={periodForm.end_date}
                    onChange={(e) => setPeriodForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreatePeriodDialog(false)}
                  disabled={sectionLoading.creatingPeriod}
                >
                  Hủy
                </Button>
                <Button
                  onClick={async () => {
                    setSectionLoading(prev => ({ ...prev, creatingPeriod: true }))
                    try {
                      const result = await createGradeImprovementPeriodAction({
                        ...periodForm,
                        is_active: true
                      })
                      if (result.success) {
                        toast.success(result.message)
                        setShowCreatePeriodDialog(false)
                        setPeriodForm({
                          name: '',
                          description: '',
                          start_date: '',
                          end_date: '',
                          grade_reporting_period_id: ''
                        })
                        loadPeriods()
                      } else {
                        toast.error(result.error)
                      }
                    } catch (error) {
                      console.error('Error creating period:', error)
                      toast.error('Lỗi khi tạo kỳ cải thiện điểm')
                    } finally {
                      setSectionLoading(prev => ({ ...prev, creatingPeriod: false }))
                    }
                  }}
                  disabled={sectionLoading.creatingPeriod || !periodForm.name || !periodForm.start_date || !periodForm.end_date || !periodForm.grade_reporting_period_id}
                >
                  {sectionLoading.creatingPeriod ? 'Đang tạo...' : 'Tạo kỳ'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Periods Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Các kỳ cải thiện điểm
          </CardTitle>
          <CardDescription>
            Danh sách các kỳ thời gian cho phép học sinh nộp đơn cải thiện điểm
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coordinatedLoading.isLoading && periods.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            </div>
          ) : periods.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Chưa có kỳ cải thiện điểm nào</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {periods.map((period) => (
                <Card key={period.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{period.name}</h3>
                      {period.description && (
                        <p className="text-sm text-muted-foreground">{period.description}</p>
                      )}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          Từ: {format(new Date(period.start_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </div>
                        <div>
                          Đến: {format(new Date(period.end_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={period.is_active ? 'default' : 'secondary'}>
                          {period.is_active ? 'Đang hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requests Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Đơn yêu cầu cải thiện điểm
          </CardTitle>
          <CardDescription>
            Xem và xử lý các đơn yêu cầu cải thiện điểm từ học sinh
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="search-student">Tìm kiếm học sinh</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-student"
                  placeholder="Tên hoặc mã học sinh..."
                  value={filters.student_search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, student_search: e.target.value || undefined, page: 1 }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="filter-status">Trạng thái</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as 'pending' | 'approved' | 'rejected', page: 1 }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="filter-period">Kỳ cải thiện</Label>
              <Select
                value={filters.improvement_period_id || 'all'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, improvement_period_id: value === 'all' ? undefined : value, page: 1 }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kỳ</SelectItem>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Requests Table */}
          {coordinatedLoading.isLoading && requests.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Đang tải danh sách đơn...</p>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Không có đơn yêu cầu nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Môn học</TableHead>
                    <TableHead>Kỳ cải thiện</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead>Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{request.student?.full_name}</div>
                            <div className="text-sm text-muted-foreground">{request.student?.student_id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{request.subject?.name_vietnamese}</div>
                            <div className="text-sm text-muted-foreground">{request.subject?.code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {request.improvement_period?.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setResponseForm({
                              status: request.status,
                              admin_comment: request.admin_comment || ''
                            })
                            setShowRequestDetailDialog(true)
                          }}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Xem
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Trang {filters.page} / {pagination.totalPages} (Tổng: {pagination.total} đơn)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={filters.page <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={filters.page >= pagination.totalPages}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Request Detail Dialog */}
      <Dialog open={showRequestDetailDialog} onOpenChange={setShowRequestDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn cải thiện điểm</DialogTitle>
            <DialogDescription>
              Xem thông tin chi tiết và phản hồi đơn yêu cầu
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Học sinh</Label>
                  <div className="mt-1">
                    <div className="font-medium">{selectedRequest.student?.full_name}</div>
                    <div className="text-sm text-muted-foreground">{selectedRequest.student?.student_id}</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Môn học</Label>
                  <div className="mt-1">
                    <div className="font-medium">{selectedRequest.subject?.name_vietnamese}</div>
                    <div className="text-sm text-muted-foreground">{selectedRequest.subject?.code}</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Kỳ cải thiện điểm</Label>
                  <div className="mt-1 font-medium">{selectedRequest.improvement_period?.name}</div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Trạng thái hiện tại</Label>
                  <div className="mt-1">
                    <StatusBadge status={selectedRequest.status} />
                  </div>
                </div>
                
                {selectedRequest.current_grade !== null && (
                  <div>
                    <Label className="text-sm font-medium">Điểm hiện tại</Label>
                    <div className="mt-1 font-medium">{selectedRequest.current_grade}</div>
                  </div>
                )}
                
                {selectedRequest.target_grade !== null && (
                  <div>
                    <Label className="text-sm font-medium">Điểm mục tiêu</Label>
                    <div className="mt-1 font-medium">{selectedRequest.target_grade}</div>
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium">Lý do yêu cầu cải thiện điểm</Label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  {selectedRequest.reason}
                </div>
              </div>
              
              {selectedRequest.status !== 'pending' && (
                <div>
                  <Label className="text-sm font-medium">Phản hồi của admin</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    {selectedRequest.admin_comment || 'Không có nhận xét'}
                  </div>
                  {selectedRequest.reviewed_by_profile && selectedRequest.reviewed_at && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Phản hồi bởi {selectedRequest.reviewed_by_profile.full_name} vào {format(new Date(selectedRequest.reviewed_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </div>
                  )}
                </div>
              )}
              
              {/* Response Form */}
              {selectedRequest.status === 'pending' && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="font-medium">Phản hồi đơn yêu cầu</h4>
                  
                  <div>
                    <Label htmlFor="response-status">Quyết định</Label>
                    <Select
                      value={responseForm.status}
                      onValueChange={(value) => setResponseForm(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn quyết định" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Phê duyệt</SelectItem>
                        <SelectItem value="rejected">Từ chối</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="admin-comment">Nhận xét của admin</Label>
                    <Textarea
                      id="admin-comment"
                      value={responseForm.admin_comment}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, admin_comment: e.target.value }))}
                      placeholder="Nhập nhận xét về đơn yêu cầu..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowRequestDetailDialog(false)}
                      disabled={sectionLoading.respondingToRequest}
                    >
                      Hủy
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!responseForm.status || !responseForm.admin_comment.trim()) {
                          toast.error('Vui lòng chọn quyết định và nhập nhận xét')
                          return
                        }
                        
                        setSectionLoading(prev => ({ ...prev, respondingToRequest: true }))
                        try {
                          const result = await respondToGradeImprovementRequestAction({
                            request_id: selectedRequest.id,
                            status: responseForm.status as 'approved' | 'rejected',
                            admin_comment: responseForm.admin_comment
                          })
                          
                          if (result.success) {
                            toast.success(result.message)
                            setShowRequestDetailDialog(false)
                            loadRequests()
                          } else {
                            toast.error(result.error)
                          }
                        } catch (error) {
                          console.error('Error responding to request:', error)
                          toast.error('Lỗi khi phản hồi đơn yêu cầu')
                        } finally {
                          setSectionLoading(prev => ({ ...prev, respondingToRequest: false }))
                        }
                      }}
                      disabled={sectionLoading.respondingToRequest || !responseForm.status || !responseForm.admin_comment.trim()}
                    >
                      {sectionLoading.respondingToRequest ? 'Đang xử lý...' : 'Gửi phản hồi'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
