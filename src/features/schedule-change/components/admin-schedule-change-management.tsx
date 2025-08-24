"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import { Calendar, Clock, BookOpen, Users, MessageSquare, Check, X, User } from "lucide-react"
import { toast } from "sonner"
import {
  getAdminScheduleChangeRequestsAction,
  adminRespondToScheduleChangeRequestAction
} from "../actions/schedule-change-actions"
import { type ScheduleChangeRequest } from "../types/schedule-change-types"

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Chờ duyệt'
    case 'approved':
      return 'Đã duyệt'
    case 'rejected':
      return 'Từ chối'
    default:
      return status
  }
}

export default function AdminScheduleChangeManagement() {
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<ScheduleChangeRequest | null>(null)
  const [responseText, setResponseText] = useState('')
  const [responding, setResponding] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const result = await getAdminScheduleChangeRequestsAction()
      
      if (result.success && result.data) {
        setRequests(result.data)
      } else {
        toast.error(result.error || 'Không thể tải danh sách đơn thay đổi')
      }
    } catch (error) {
      console.error('Error loading requests:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách')
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async (status: 'approved' | 'rejected') => {
    if (!selectedRequest || !responseText.trim()) {
      toast.error('Vui lòng nhập phản hồi')
      return
    }

    setResponding(true)
    
    try {
      const result = await adminRespondToScheduleChangeRequestAction({
        request_id: selectedRequest.id,
        status,
        admin_response: responseText
      })
      
      if (result.success) {
        toast.success(`Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} đơn thay đổi lịch dạy`)
        setDialogOpen(false)
        setSelectedRequest(null)
        setResponseText('')
        loadRequests() // Reload the list
      } else {
        toast.error(result.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error responding to request:', error)
      toast.error('Có lỗi xảy ra khi phản hồi')
    } finally {
      setResponding(false)
    }
  }

  const openResponseDialog = (request: ScheduleChangeRequest) => {
    setSelectedRequest(request)
    setResponseText('')
    setDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Quản Lý Đơn Thay Đổi Lịch Dạy</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Đang tải...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingRequests = requests.filter(r => r.status === 'pending')
  const processedRequests = requests.filter(r => r.status !== 'pending')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản Lý Đơn Thay Đổi Lịch Dạy</h1>

      {/* Pending Requests */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-yellow-600">
          Đơn Chờ Duyệt ({pendingRequests.length})
        </h2>
        
        {pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">Không có đơn nào chờ duyệt</p>
            </CardContent>
          </Card>
        ) : (
          pendingRequests.map((request) => (
            <Card key={request.id} className="border-yellow-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    Đơn #{request.id.slice(-8)} - {request.teacher.full_name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(request.status)}>
                      {getStatusLabel(request.status)}
                    </Badge>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          size="sm" 
                          onClick={() => openResponseDialog(request)}
                        >
                          Phản hồi
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Phản hồi đơn thay đổi lịch dạy</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="response">Phản hồi của bạn</Label>
                            <Textarea
                              id="response"
                              placeholder="Nhập phản hồi..."
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleResponse('approved')}
                              disabled={responding || !responseText.trim()}
                              className="flex-1"
                            >
                              <Check className="h-4 w-4 mr-2" />
                              Duyệt
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleResponse('rejected')}
                              disabled={responding || !responseText.trim()}
                              className="flex-1"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Từ chối
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Teacher Info */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Giáo viên</p>
                    <p className="text-sm text-muted-foreground">
                      {request.teacher.full_name} ({request.teacher.email})
                    </p>
                  </div>
                </div>

                {/* Request Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Ngày thay đổi</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(request.change_date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Tuần & Tiết</p>
                      <p className="text-sm text-muted-foreground">
                        Tuần {request.week_number}, Tiết {request.original_period}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Môn học</p>
                      <p className="text-sm text-muted-foreground">
                        {request.subject.name_vietnamese} ({request.subject.code})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Lớp học</p>
                      <p className="text-sm text-muted-foreground">
                        {request.class.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Academic Info */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{request.academic_year.name}</span>
                  <span>•</span>
                  <span>{request.semester.name}</span>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Lý do thay đổi:</p>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md">
                    {request.reason}
                  </p>
                </div>

                {/* Timestamp */}
                <div className="text-xs text-muted-foreground pt-2 border-t">
                  Tạo: {new Date(request.created_at).toLocaleString('vi-VN')}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-600">
            Đơn Đã Xử Lý ({processedRequests.length})
          </h2>
          
          {processedRequests.map((request) => (
            <Card key={request.id} className="opacity-75">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    Đơn #{request.id.slice(-8)} - {request.teacher.full_name}
                  </CardTitle>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusLabel(request.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Ngày:</span> {new Date(request.change_date).toLocaleDateString('vi-VN')}
                  </div>
                  <div>
                    <span className="font-medium">Môn:</span> {request.subject.name_vietnamese}
                  </div>
                  <div>
                    <span className="font-medium">Lớp:</span> {request.class.name}
                  </div>
                </div>

                {/* Admin Response */}
                {request.admin_response && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Phản hồi từ Admin:</p>
                    </div>
                    <p className={`text-sm p-3 rounded-md ${
                      request.status === 'approved' 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {request.admin_response}
                    </p>
                    {request.admin && request.responded_at && (
                      <p className="text-xs text-muted-foreground">
                        Phản hồi bởi {request.admin.full_name} vào {new Date(request.responded_at).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
