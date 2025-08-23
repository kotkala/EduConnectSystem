'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { SidebarLayout } from '@/shared/components/dashboard/sidebar-layout'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { 
  getLeaveApplicationDetailAction,
  respondToLeaveApplicationAction,
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
  School,
  MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'

export default function LeaveApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, profile } = useAuth()
  
  const [application, setApplication] = useState<LeaveApplication | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [teacherResponse, setTeacherResponse] = useState('')

  const applicationId = params.id as string

  const fetchApplicationDetail = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await getLeaveApplicationDetailAction(applicationId)

      if (result.success && result.data) {
        setApplication(result.data)
        setTeacherResponse(result.data.teacher_response || '')
      } else {
        setError(result.error || 'Không thể tải thông tin đơn xin nghỉ')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi')
    } finally {
      setIsLoading(false)
    }
  }, [applicationId])

  useEffect(() => {
    if (applicationId) {
      fetchApplicationDetail()
    }
  }, [applicationId, fetchApplicationDetail])

  const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
    if (!application) return

    try {
      setIsProcessing(true)
      setError(null)

      const result = await respondToLeaveApplicationAction(
        application.id,
        status,
        teacherResponse
      )

      if (result.success) {
        toast.success(`Đã ${status === 'approved' ? 'phê duyệt' : 'từ chối'} đơn xin nghỉ`)
        await fetchApplicationDetail() // Refresh data
      } else {
        setError(result.error || 'Không thể cập nhật trạng thái đơn xin nghỉ')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi')
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Đang chờ
        </Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Check className="w-3 h-3 mr-1" />
          Đã duyệt
        </Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <X className="w-3 h-3 mr-1" />
          Từ chối
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'sick': return 'Ốm đau'
      case 'family': return 'Gia đình'
      case 'emergency': return 'Khẩn cấp'
      case 'vacation': return 'Nghỉ phép'
      case 'other': return 'Khác'
      default: return type
    }
  }

  const getBackUrl = () => {
    if (profile?.role === 'teacher') {
      return '/dashboard/teacher/leave-requests'
    } else if (profile?.role === 'parent') {
      return '/dashboard/parent/leave-application'
    }
    return '/dashboard'
  }

  if (isLoading) {
    return (
      <SidebarLayout role={profile?.role || 'parent'} title="Chi tiết đơn xin nghỉ">
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải thông tin đơn xin nghỉ...</p>
            </div>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  if (error || !application) {
    return (
      <SidebarLayout role={profile?.role || 'parent'} title="Chi tiết đơn xin nghỉ">
        <div className="p-6">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <AlertCircle className="h-16 w-16 text-red-500" />
            <h2 className="text-2xl font-bold text-gray-900">Lỗi</h2>
            <p className="text-gray-600 text-center">{error || 'Không tìm thấy đơn xin nghỉ'}</p>
            <Button onClick={() => router.push(getBackUrl())}>
              Quay lại
            </Button>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  const isTeacher = profile?.role === 'teacher' && application.homeroom_teacher_id === user?.id
  const canRespond = isTeacher && application.status === 'pending'

  return (
    <SidebarLayout role={profile?.role || 'parent'} title="Chi tiết đơn xin nghỉ">
      <div className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(getBackUrl())}
              className="w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Chi tiết đơn xin nghỉ</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Thông tin chi tiết về đơn xin nghỉ phép
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Application Details */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Thông tin đơn xin nghỉ
                </CardTitle>
                {getStatusBadge(application.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Student Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Học sinh
                  </Label>
                  <p className="text-sm text-gray-900">
                    {(application.student as { full_name?: string })?.full_name || 'N/A'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <School className="h-4 w-4" />
                    Lớp
                  </Label>
                  <p className="text-sm text-gray-900">
                    {(application.class as { name?: string })?.name || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Loại nghỉ phép</Label>
                  <p className="text-sm text-gray-900">{getLeaveTypeLabel(application.leave_type)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Từ ngày
                  </Label>
                  <p className="text-sm text-gray-900">
                    {new Date(application.start_date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Đến ngày
                  </Label>
                  <p className="text-sm text-gray-900">
                    {new Date(application.end_date).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Lý do nghỉ phép</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-900">{application.reason}</p>
                </div>
              </div>

              {/* Attachment */}
              {application.attachment_url && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Tệp đính kèm</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(application.attachment_url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Tải xuống
                  </Button>
                </div>
              )}

              {/* Teacher Response */}
              {application.teacher_response && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Phản hồi của giáo viên
                  </Label>
                  <div className="p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-gray-900">{application.teacher_response}</p>
                  </div>
                </div>
              )}

              {/* Response Date */}
              {application.responded_at && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Ngày phản hồi</Label>
                  <p className="text-sm text-gray-900">
                    {new Date(application.responded_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Teacher Response Section */}
          {canRespond && (
            <Card>
              <CardHeader>
                <CardTitle>Phản hồi đơn xin nghỉ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teacher-response">Ghi chú (tùy chọn)</Label>
                  <Textarea
                    id="teacher-response"
                    placeholder="Nhập ghi chú về quyết định của bạn..."
                    value={teacherResponse}
                    onChange={(e) => setTeacherResponse(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Phê duyệt
                  </Button>
                  <Button
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={isProcessing}
                    variant="destructive"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Từ chối
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SidebarLayout>
  )
}
