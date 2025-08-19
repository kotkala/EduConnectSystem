'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import { useAuth } from '@/hooks/use-auth'
import { 
  getParentLeaveApplicationsAction,
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
  Plus
} from 'lucide-react'

export default function ParentLeaveStatusPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  
  const [applications, setApplications] = useState<LeaveApplication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && profile?.role === 'parent') {
      fetchLeaveApplications()
    }
  }, [user, profile])

  const fetchLeaveApplications = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await getParentLeaveApplicationsAction()
      
      if (result.success && result.data) {
        setApplications(result.data)
      } else {
        setError(result.error || 'Không thể tải danh sách đơn xin nghỉ')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Đang chờ duyệt</Badge>
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

  // Show loading state
  if (loading || isLoading) {
    return (
      <SidebarLayout role="parent" title="Trạng thái đơn xin nghỉ">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Đang tải danh sách đơn xin nghỉ...</p>
          </div>
        </div>
      </SidebarLayout>
    )
  }

  // Show access denied if no permission
  if (!user || profile?.role !== 'parent') {
    return (
      <SidebarLayout role="parent" title="Từ chối truy cập">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Từ chối truy cập</h2>
          <p className="text-gray-600">Bạn không có quyền truy cập trang này.</p>
          <Button onClick={() => router.push('/dashboard/parent')}>
            Quay lại bảng điều khiển
          </Button>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout role="parent" title="Trạng thái đơn xin nghỉ">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/parent')}
              className="w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại bảng điều khiển
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Trạng thái đơn xin nghỉ</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Theo dõi trạng thái đơn xin nghỉ của con em
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/dashboard/parent/leave-application')}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo đơn mới
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng số đơn</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{applications.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang chờ</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {applications.filter(app => app.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
              <Check className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {applications.filter(app => app.status === 'approved').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Từ chối</CardTitle>
              <X className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {applications.filter(app => app.status === 'rejected').length}
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
                <p className="text-gray-600 text-center mb-4">
                  Bạn chưa gửi đơn xin nghỉ nào.
                </p>
                <Button onClick={() => router.push('/dashboard/parent/leave-application')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo đơn đầu tiên
                </Button>
              </CardContent>
            </Card>
          ) : (
            applications.map((application) => (
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
                      {application.class?.name && (
                        <div className="text-sm text-muted-foreground">
                          Lớp: {application.class.name}
                        </div>
                      )}
                      {application.homeroom_teacher?.full_name && (
                        <div className="text-sm text-muted-foreground">
                          GVCN: {application.homeroom_teacher.full_name}
                        </div>
                      )}
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
                    <div className="text-sm font-medium mb-1">Reason</div>
                    <p className="text-sm text-muted-foreground">{application.reason}</p>
                  </div>

                  {application.attachment_url && (
                    <div>
                      <div className="text-sm font-medium mb-1">Attachment</div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={application.attachment_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3 w-3 mr-1" />
                          View Attachment
                        </a>
                      </Button>
                    </div>
                  )}

                  {application.teacher_response && (
                    <div>
                      <div className="text-sm font-medium mb-1">Teacher Response</div>
                      <p className="text-sm text-muted-foreground">{application.teacher_response}</p>
                    </div>
                  )}

                  {application.status === 'pending' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">Awaiting Teacher Review</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">
                        Your application has been sent to the homeroom teacher and is pending review.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </SidebarLayout>
  )
}
