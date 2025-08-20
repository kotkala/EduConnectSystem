"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Textarea } from "@/shared/components/ui/textarea"
import { 
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
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import { 
  getGradeOverwriteRequestsAction,
  approveGradeOverwriteAction,
  rejectGradeOverwriteAction,
  type GradeOverwriteRequest 
} from "@/lib/actions/admin-grade-overwrite-actions"

export default function AdminGradeOverwriteApprovalsPage() {
  const [requests, setRequests] = useState<GradeOverwriteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<GradeOverwriteRequest | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [adminReason, setAdminReason] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [processing, setProcessing] = useState(false)

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
        toast.error(result.message || 'Không thể tải danh sách yêu cầu ghi đè')
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
      
      let result
      if (actionType === 'approve') {
        result = await approveGradeOverwriteAction(selectedRequest.id, adminReason)
      } else {
        result = await rejectGradeOverwriteAction(selectedRequest.id, adminReason)
      }

      if (result.success) {
        toast.success(
          actionType === 'approve' 
            ? 'Đã phê duyệt yêu cầu ghi đè điểm' 
            : 'Đã từ chối yêu cầu ghi đè điểm'
        )
        setDialogOpen(false)
        loadOverwriteRequests() // Reload the list
      } else {
        toast.error(result.message || 'Có lỗi xảy ra')
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải danh sách yêu cầu...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Phê duyệt ghi đè điểm số</h1>
        <p className="text-muted-foreground">
          Xem xét và phê duyệt các yêu cầu ghi đè điểm giữa kỳ và cuối kỳ từ giáo viên
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Không có yêu cầu nào</h3>
            <p className="text-muted-foreground">
              Hiện tại không có yêu cầu ghi đè điểm nào cần phê duyệt
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    Yêu cầu ghi đè điểm số
                  </CardTitle>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent>
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
                    <p className="font-medium">{formatDate(request.changed_at)}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Lý do ghi đè</p>
                  <p className="text-sm bg-gray-50 p-2 rounded border">
                    {request.change_reason}
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

                {request.status !== 'pending' && request.admin_reason && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-1">
                      Ghi chú của admin ({formatDate(request.processed_at || '')})
                    </p>
                    <p className="text-sm bg-blue-50 p-2 rounded border">
                      {request.admin_reason}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
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
  )
}
