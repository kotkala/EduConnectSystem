"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { AdminPageTemplate } from "@/shared/components/dashboard/admin-page-template"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Textarea } from "@/shared/components/ui/textarea"

import { Skeleton } from "@/shared/components/ui/skeleton";import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/shared/components/ui/dialog"
import {
  CheckCircle,
  XCircle,
  Clock,
  User,
  BookOpen,
  Calendar,
  AlertTriangle,
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { toast } from "sonner"
import {
  getGradeOverwriteRequestsAction,
  reviewGradeOverwriteRequestAction,
  type GradeOverwriteRequest
} from "@/lib/actions/grade-overwrite-approval-actions"

export default function AdminGradeOverwriteApprovalsPage() {
  const [requests, setRequests] = useState<GradeOverwriteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<GradeOverwriteRequest | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [adminReason, setAdminReason] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('pending')
  const [subjectFilter, setSubjectFilter] = useState<string>('all')
  const [componentTypeFilter, setComponentTypeFilter] = useState<string>('all')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  // Filter requests based on search and filters
  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchTerm === '' ||
      (request.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (request.subject_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (request.class_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (request.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)

    const matchesStatus = statusFilter === 'all' || request.status === statusFilter
    const matchesSubject = subjectFilter === 'all' || request.subject_name === subjectFilter
    const matchesComponentType = componentTypeFilter === 'all' || request.component_type === componentTypeFilter

    return matchesSearch && matchesStatus && matchesSubject && matchesComponentType
  })

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

  useEffect(() => {
    loadOverwriteRequests()
  }, [])

  const loadOverwriteRequests = async () => {
    try {
      setLoading(true)
      const result = await getGradeOverwriteRequestsAction()
      if (result.success && result.data) {
        setRequests(result.data)
      } else {
        toast.error(result.error || 'Không thể tải danh sách yêu cầu ghi đè')
      }
    } catch (error) {
      console.error('Error loading overwrite requests:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách yêu cầu')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (request: GradeOverwriteRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setActionType(action)
    setAdminReason('')
    setDialogOpen(true)
  }

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return

    try {
      setProcessing(true)
      
      const result = await reviewGradeOverwriteRequestAction({
        request_id: selectedRequest.id,
        status: actionType === 'approve' ? 'approved' : 'rejected',
        admin_notes: adminReason.trim() || undefined
      })

      if (result.success) {
        toast.success(
          actionType === 'approve' 
            ? 'Đã phê duyệt yêu cầu ghi đè điểm' 
            : 'Đã từ chối yêu cầu ghi đè điểm'
        )
        setDialogOpen(false)
        loadOverwriteRequests() // Reload the list
      } else {
        toast.error(result.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error processing action:', error)
      toast.error('Có lỗi xảy ra khi xử lý yêu cầu')
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600"><Clock className="w-3 h-3 mr-1" />Chờ duyệt</Badge>
      case 'approved':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Đã duyệt</Badge>
      case 'rejected':
        return <Badge variant="outline" className="text-red-600"><XCircle className="w-3 h-3 mr-1" />Đã từ chối</Badge>
      default:
        return <Badge variant="outline">Không xác định</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Skeleton className="h-32 w-full rounded-lg" />
            <p className="text-muted-foreground">Đang tải danh sách yêu cầu...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminPageTemplate
      title="Duyệt ghi đè điểm"
      description="Duyệt các yêu cầu ghi đè điểm số"
      showCard={false}
    >
      <div className="space-y-6">

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Tìm kiếm và lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Tên học sinh, môn học, lý do..."
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
              <Label htmlFor="subject-filter">Môn học</Label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn môn học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {Array.from(new Set(requests.map(r => r.subject_name).filter(Boolean))).map(subject => (
                    <SelectItem key={subject} value={subject!}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="component-filter">Loại điểm</Label>
              <Select value={componentTypeFilter} onValueChange={setComponentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại điểm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="midterm">Giữa kỳ</SelectItem>
                  <SelectItem value="final">Cuối kỳ</SelectItem>
                  <SelectItem value="semester_1">Học kỳ 1</SelectItem>
                  <SelectItem value="semester_2">Học kỳ 2</SelectItem>
                  <SelectItem value="yearly">Cả năm</SelectItem>
                  <SelectItem value="summary">Tổng kết</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-muted-foreground">
            Hiển thị {filteredRequests.length} trong tổng số {requests.length} yêu cầu
          </div>
        </CardContent>
      </Card>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="mx-auto h-12 md:h-14 lg:h-16 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {requests.length === 0 ? 'Không có yêu cầu nào' : 'Không tìm thấy yêu cầu'}
            </h3>
            <p className="text-muted-foreground">
              {requests.length === 0
                ? 'Hiện tại không có yêu cầu ghi đè điểm nào cần phê duyệt'
                : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request) => {
            const isExpanded = expandedCards.has(request.id)
            return (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <div className="flex items-center gap-4">
                      <span className="font-medium">{request.student_name}</span>
                      <span className="text-sm text-muted-foreground">{request.subject_name}</span>
                      <span className="text-sm font-medium">
                        <span className="text-red-600">{request.old_value}</span>
                        {' → '}
                        <span className="text-green-600">{request.new_value}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(request.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCardExpansion(request.id)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Thu gọn
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Chi tiết
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Học sinh</p>
                      <p className="font-medium">{request.student_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Môn học</p>
                      <p className="font-medium">{request.subject_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Lớp</p>
                      <p className="font-medium">{request.class_name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Giáo viên</p>
                    <p className="font-medium">{request.teacher_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Loại điểm</p>
                    <p className="font-medium">
                      {request.component_type === 'midterm' ? 'Giữa kỳ' : 'Cuối kỳ'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Điểm cũ → Điểm mới</p>
                    <p className="font-medium">
                      <span className="text-red-600">{request.old_value}</span>
                      {' → '}
                      <span className="text-green-600">{request.new_value}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Thời gian yêu cầu</p>
                    <p className="font-medium">{formatDate(request.requested_at)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Lý do ghi đè</p>
                  <p className="text-sm bg-gray-50 p-2 rounded border">
                    {request.reason}
                  </p>
                </div>

                {request.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleAction(request, 'approve')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Phê duyệt
                    </Button>
                    <Button 
                      onClick={() => handleAction(request, 'reject')}
                      variant="destructive"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Từ chối
                    </Button>
                  </div>
                )}

                {request.status !== 'pending' && request.admin_notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">
                      Ghi chú của admin ({formatDate(request.reviewed_at || '')})
                    </p>
                    <p className="text-sm bg-blue-50 p-2 rounded border">
                      {request.admin_notes}
                    </p>
                  </div>
                )}
                </CardContent>
              )}
            </Card>
          )})}
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Phê duyệt' : 'Từ chối'} yêu cầu ghi đè điểm
            </DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded">
                <p><strong>Học sinh:</strong> {selectedRequest.student_name}</p>
                <p><strong>Môn học:</strong> {selectedRequest.subject_name}</p>
                <p><strong>Loại điểm:</strong> {selectedRequest.component_type === 'midterm' ? 'Giữa kỳ' : 'Cuối kỳ'}</p>
                <p><strong>Thay đổi:</strong> {selectedRequest.old_value} → {selectedRequest.new_value}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Ghi chú của admin {actionType === 'approve' ? '(tùy chọn)' : '(bắt buộc)'}
                </label>
                <Textarea
                  value={adminReason}
                  onChange={(e) => setAdminReason(e.target.value)}
                  placeholder={
                    actionType === 'approve' 
                      ? 'Nhập ghi chú về việc phê duyệt (không bắt buộc)...'
                      : 'Nhập lý do từ chối yêu cầu ghi đè điểm...'
                  }
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              onClick={confirmAction}
              disabled={processing || (actionType === 'reject' && !adminReason.trim())}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {processing ? 'Đang xử lý...' : (actionType === 'approve' ? 'Phê duyệt' : 'Từ chối')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </AdminPageTemplate>
  )
}