'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import Link from 'next/link'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import {
  getParentLeaveApplicationsAction,
  type LeaveApplication
} from '@/lib/actions/leave-application-actions'
import { Plus, FileText, Calendar, Clock, AlertCircle, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export default function LeaveApplicationPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'parent')) {
      router.push('/dashboard')
    }
  }, [loading, user, profile, router])

  useEffect(() => {
    if (!loading && user && profile?.role === 'parent') {
      loadLeaveApplications()
    }
  }, [loading, user, profile])

  const loadLeaveApplications = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getParentLeaveApplicationsAction()
      if (result.success && result.data) {
        setLeaveApplications(result.data)
      } else {
        setError(result.error || 'Không thể tải danh sách đơn xin nghỉ')
        toast.error(result.error || 'Không thể tải danh sách đơn xin nghỉ')
      }
    } catch (err) {
      console.error('Error loading leave applications:', err)
      const errorMessage = 'Có lỗi xảy ra khi tải danh sách đơn xin nghỉ'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Chờ duyệt</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Đã duyệt</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Từ chối</Badge>
      default:
        return <Badge variant="outline">Không xác định</Badge>
    }
  }

  const getLeaveTypeLabel = (type: string) => {
    switch (type) {
      case 'sick':
        return 'Nghỉ ốm'
      case 'family':
        return 'Việc gia đình'
      case 'emergency':
        return 'Khẩn cấp'
      case 'vacation':
        return 'Nghỉ phép'
      case 'other':
        return 'Khác'
      default:
        return type
    }
  }

  const handleCreateNew = () => {
    router.push('/dashboard/parent/leave-application/create')
  }

  // Show loading state
  if (loading) {
    return (
      <ContentLayout title="Đơn xin nghỉ" role="parent">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/parent">Phụ huynh</Link>
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
        <div className="flex items-center justify-center h-64">
          <div className="space-y-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px] mx-auto"  aria-label="Loading content" role="status" />
              <Skeleton className="h-4 w-[100px] mx-auto"  aria-label="Loading content" role="status" />
            </div>
          </div>
        </div>
          </CardContent>
        </Card>
      </ContentLayout>
    )
  }

  // Show access denied if no permission
  if (!user || profile?.role !== 'parent') {
    return (
      <ContentLayout title="Từ chối truy cập" role="parent">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard/parent">Phụ huynh</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Từ chối truy cập</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Card className="rounded-lg border-none mt-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <AlertCircle className="h-16 w-16 md:w-20 lg:w-24 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-900">Từ chối truy cập</h2>
              <p className="text-gray-600">Bạn không có quyền truy cập trang này.</p>
              <Button onClick={() => router.push('/dashboard/parent')}>
                Quay lại bảng điều khiển
              </Button>
            </div>
          </CardContent>
        </Card>
      </ContentLayout>
    )
  }

  return (
    <ContentLayout title="Đơn xin nghỉ" role="parent">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/parent">Phụ huynh</Link>
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Đơn xin nghỉ</h1>
            <p className="text-muted-foreground">
              Quản lý đơn xin nghỉ học của con em bạn
            </p>
          </div>
          <Button onClick={handleCreateNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Tạo đơn mới
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Leave Applications Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Danh sách đơn xin nghỉ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px] mx-auto"  aria-label="Loading content" role="status" />
                    <Skeleton className="h-4 w-[100px] mx-auto"  aria-label="Loading content" role="status" />
                  </div>
                </div>
              </div>
            ) : leaveApplications.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 md:h-14 lg:h-16 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn xin nghỉ nào</h3>
                <p className="text-gray-500 mb-4">Bạn chưa tạo đơn xin nghỉ nào cho con em mình.</p>
                <Button onClick={handleCreateNew} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Tạo đơn đầu tiên
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Loại đơn</TableHead>
                    <TableHead>Thời gian nghỉ</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        {application.student_name}
                      </TableCell>
                      <TableCell>
                        {getLeaveTypeLabel(application.leave_type)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {format(new Date(application.start_date), 'dd/MM/yyyy', { locale: vi })} - {format(new Date(application.end_date), 'dd/MM/yyyy', { locale: vi })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(application.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {format(new Date(application.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/leave-application/${application.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
