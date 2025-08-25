"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Calendar, Clock, BookOpen, Users, MessageSquare, Plus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { getTeacherScheduleChangeRequestsAction } from "../actions/schedule-change-actions"
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

export default function TeacherScheduleChangeList() {
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const result = await getTeacherScheduleChangeRequestsAction()
      
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Đơn Thay Đổi Lịch Dạy</h1>
          <Button asChild>
            <Link href="/dashboard/teacher/schedule-change/create">
              <Plus className="h-4 w-4 mr-2" />
              Tạo Đơn Mới
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Đang tải...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Đơn Thay Đổi Lịch Dạy</h1>
        <Button asChild>
          <Link href="/dashboard/teacher/schedule-change/create">
            <Plus className="h-4 w-4 mr-2" />
            Tạo Đơn Mới
          </Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Chưa có đơn thay đổi lịch dạy nào</p>
              <Button asChild>
                <Link href="/dashboard/teacher/schedule-change/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo Đơn Đầu Tiên
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    Đơn thay đổi lịch dạy #{request.id.slice(-8)}
                  </CardTitle>
                  <Badge className={getStatusColor(request.status)}>
                    {getStatusLabel(request.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {/* Timestamps */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                  <span>Tạo: {new Date(request.created_at).toLocaleString('vi-VN')}</span>
                  {request.updated_at !== request.created_at && (
                    <span>Cập nhật: {new Date(request.updated_at).toLocaleString('vi-VN')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
