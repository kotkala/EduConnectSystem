"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Trash2, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"

import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Separator } from "@/shared/components/ui/separator"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"

import {
  type ScheduleExchangeRequestDetailed
} from "@/lib/actions/schedule-exchange-actions"

interface ExchangeRequestsListProps {
  readonly teacherId: string
  readonly refreshTrigger?: number
}

const statusConfig = {
  pending: {
    label: "Đang chờ",
    variant: "secondary" as const,
    icon: Clock,
    description: "Đang chờ phê duyệt từ admin"
  },
  approved: {
    label: "Đã chấp thuận",
    variant: "default" as const,
    icon: CheckCircle,
    description: "Yêu cầu đã được chấp thuận"
  },
  rejected: {
    label: "Đã từ chối",
    variant: "destructive" as const,
    icon: XCircle,
    description: "Yêu cầu đã bị từ chối"
  }
}

const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

export function ExchangeRequestsList({ teacherId, refreshTrigger }: ExchangeRequestsListProps) {
  const [requests, setRequests] = useState<ScheduleExchangeRequestDetailed[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/exchange-requests?teacher_id=${teacherId}`)
      const result = await response.json()

      if (result.success) {
        setRequests(result.data as ScheduleExchangeRequestDetailed[])
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Không thể tải danh sách yêu cầu đổi lịch")
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    loadRequests()
  }, [loadRequests, refreshTrigger])

  // Memoize formatted requests to prevent unnecessary re-renders
  const formattedRequests = useMemo(() => {
    return requests.map((request) => ({
      ...request,
      formattedCreatedAt: format(new Date(request.created_at), 'PPp'),
      formattedExchangeDate: format(new Date(request.exchange_date), 'PPP'),
      formattedApprovedAt: request.approved_at ? format(new Date(request.approved_at), 'PPp') : null
    }))
  }, [requests])

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return

    setDeleting(true)
    try {
      const response = await fetch('/api/exchange-requests/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: requestToDelete })
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Đã xóa yêu cầu thành công")
        setRequests(prev => prev.filter(req => req.id !== requestToDelete))
        setDeleteDialogOpen(false)
        setRequestToDelete(null)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Không thể xóa yêu cầu")
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (requestId: string) => {
    setRequestToDelete(requestId)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Đang tải yêu cầu đổi lịch...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu đổi lịch</CardTitle>
          <CardDescription>Các yêu cầu đổi lịch của bạn sẽ hiển thị tại đây</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Bạn chưa gửi yêu cầu đổi lịch nào.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Yêu cầu đổi lịch</CardTitle>
              <CardDescription>
                Các yêu cầu đổi lịch của bạn và trạng thái xử lý
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRequests}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formattedRequests.map((request) => {
            const config = statusConfig[request.status]
            const StatusIcon = config.icon
            const isRequester = request.requester_teacher_id === teacherId
            const otherTeacher = isRequester 
              ? { name: request.target_name, email: request.target_email }
              : { name: request.requester_name, email: request.requester_email }

            return (
              <Card key={request.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={config.variant} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {isRequester ? "Gửi tới" : "Nhận từ"} {otherTeacher.name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                    {request.status === 'pending' && isRequester && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(request.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Teaching Slot Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Môn:</strong> {request.subject_code} - {request.subject_name}
                    </div>
                    <div>
                      <strong>Lớp:</strong> {request.class_name}
                    </div>
                    <div>
                      <strong>Thời gian:</strong> {dayNames[request.day_of_week]} {request.start_time}-{request.end_time}
                    </div>
                    <div>
                      <strong>Phòng học:</strong> {request.classroom_name}
                    </div>
                    <div>
                      <strong>Tuần:</strong> {request.week_number}
                    </div>
                    <div>
                      <strong>Ngày đổi lịch:</strong> {request.formattedExchangeDate}
                    </div>
                  </div>

                  <Separator />

                  {/* Reason */}
                  <div>
                    <strong className="text-sm">Reason:</strong>
                    <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
                  </div>

                  {/* Admin Response */}
                  {request.admin_response && (
                    <>
                      <Separator />
                      <div>
                        <strong className="text-sm">Phản hồi từ admin:</strong>
                        <p className="text-sm text-muted-foreground mt-1">{request.admin_response}</p>
                      </div>
                    </>
                  )}

                  {/* Timestamps */}
                  <div className="flex justify-between text-xs text-muted-foreground pt-2">
                    <span>
                      Đã gửi: {request.formattedCreatedAt}
                    </span>
                    {request.formattedApprovedAt && (
                      <span>
                        {request.status === 'approved' ? 'Đã chấp thuận' : 'Đã từ chối'}: {request.formattedApprovedAt}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá yêu cầu đổi lịch</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa yêu cầu đổi lịch này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRequest}
              disabled={deleting}
            >
              {deleting ? "Đang xóa..." : "Xoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
