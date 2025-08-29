'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import {
  getParentLeaveApplicationsAction,
  createLeaveApplicationAction,
  uploadLeaveAttachmentAction,
  type LeaveApplication,
  type LeaveApplicationFormData
} from '@/lib/actions/leave-application-actions'
import {
  getParentStudentsAction,
  type StudentInfo
} from '@/features/parent-dashboard/actions/parent-actions'
import { Plus, FileText, Calendar, Clock, AlertCircle, Eye, CheckCircle, XCircle, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { ImageViewer } from '@/shared/components/ui/image-viewer'

export default function LeaveApplicationPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()

  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [formData, setFormData] = useState<LeaveApplicationFormData>({
    student_id: '',
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Detail dialog states
  const [selectedApplication, setSelectedApplication] = useState<LeaveApplication | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

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

  // Load students when dialog opens
  const loadStudents = async () => {
    if (!user?.id) return

    try {
      const result = await getParentStudentsAction()
      if (result.success && result.data) {
        setStudents(result.data)
      } else {
        toast.error('Không thể tải danh sách học sinh')
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách học sinh')
    }
  }

  const handleCreateNew = () => {
    setIsCreateDialogOpen(true)
    loadStudents()
  }

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File không được vượt quá 5MB')
        return
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF) hoặc PDF')
        return
      }

      setSelectedFile(file)

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setPreviewUrl(e.target?.result as string)
        reader.readAsDataURL(file)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.student_id || !formData.start_date || !formData.end_date || !formData.reason.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      toast.error('Ngày bắt đầu không thể sau ngày kết thúc')
      return
    }

    setIsSubmitting(true)

    try {
      // Create leave application
      const result = await createLeaveApplicationAction(formData)

      if (!result.success || !result.data) {
        toast.error(result.error || 'Có lỗi xảy ra khi tạo đơn xin nghỉ')
        return
      }

      // Upload attachment if exists
      if (selectedFile) {
        const uploadResult = await uploadLeaveAttachmentAction(selectedFile)
        if (uploadResult.success && uploadResult.data) {
          // Update the leave application with attachment URL
          // Note: Attachment URL would be handled by the upload action
          // Note: You might need to create an update action if needed
        } else {
          toast.warning('Đơn xin nghỉ đã được tạo nhưng không thể tải lên file đính kèm')
        }
      }

      toast.success('Tạo đơn xin nghỉ thành công!')

      // Reset form and close dialog
      setFormData({
        student_id: '',
        leave_type: 'sick',
        start_date: '',
        end_date: '',
        reason: ''
      })
      setSelectedFile(null)
      setPreviewUrl(null)
      setIsCreateDialogOpen(false)

      // Reload applications
      loadLeaveApplications()

    } catch (error) {
      console.error('Error creating leave application:', error)
      toast.error('Có lỗi xảy ra khi tạo đơn xin nghỉ')
    } finally {
      setIsSubmitting(false)
    }
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateNew} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tạo đơn mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Tạo đơn xin nghỉ mới
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Selection */}
                <div className="space-y-2">
                  <Label htmlFor="student">Học sinh <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.student_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn học sinh" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} ({student.student_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Leave Type */}
                <div className="space-y-2">
                  <Label htmlFor="leave_type">Loại đơn <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.leave_type}
                    onValueChange={(value: "sick" | "family" | "emergency" | "vacation" | "other") => setFormData(prev => ({ ...prev, leave_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn loại đơn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sick">Nghỉ ốm</SelectItem>
                      <SelectItem value="family">Việc gia đình</SelectItem>
                      <SelectItem value="emergency">Khẩn cấp</SelectItem>
                      <SelectItem value="vacation">Nghỉ phép</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Ngày bắt đầu <span className="text-red-500">*</span></Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Ngày kết thúc <span className="text-red-500">*</span></Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Lý do xin nghỉ <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="reason"
                    placeholder="Nhập lý do xin nghỉ..."
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={4}
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="attachment">Tệp đính kèm (tùy chọn)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    {selectedFile ? (
                      <div className="space-y-4">
                        {previewUrl && (
                          <div className="relative">
                            <Image
                              src={previewUrl}
                              alt="Preview"
                              width={200}
                              height={200}
                              className="mx-auto rounded-lg object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-500" />
                            <span className="text-sm font-medium">{selectedFile.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeFile}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">
                          Kéo thả file hoặc click để chọn
                        </p>
                        <p className="text-xs text-gray-500">
                          Hỗ trợ: JPG, PNG, GIF, PDF (tối đa 5MB)
                        </p>
                        <Input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleFileSelect}
                          className="hidden"
                          id="file-upload"
                        />
                        <Label
                          htmlFor="file-upload"
                          className="inline-block mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600"
                        >
                          Chọn file
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isSubmitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2"
                  >
                    {isSubmitting && <Clock className="h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Đang tạo...' : 'Tạo đơn'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Statistics Cards - Modern Admin Style */}
        <div className="grid gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Tổng đơn</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {leaveApplications.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Đơn xin nghỉ
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Đã duyệt</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {leaveApplications.filter(app => app.status === 'approved').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Được chấp thuận
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-yellow-600 opacity-5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Chờ duyệt</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {leaveApplications.filter(app => app.status === 'pending').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Đang xử lý
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600 opacity-5" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Từ chối</CardTitle>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {leaveApplications.filter(app => app.status === 'rejected').length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bị từ chối
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Applications List - Gmail Style */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Danh sách đơn xin nghỉ</h2>
          </div>

          <div className="border rounded-lg">
            {isLoading ? (
              <div className="divide-y">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                ))}
              </div>
            ) : leaveApplications.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 md:h-14 lg:h-16 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đơn xin nghỉ nào</h3>
                <p className="text-gray-500">Bạn chưa tạo đơn xin nghỉ nào cho con em mình. Sử dụng nút &quot;Tạo đơn mới&quot; ở trên để bắt đầu.</p>
              </div>
            ) : (
              <div className="divide-y">
                {leaveApplications.map((application) => (
                  <div
                    key={application.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        application.status === 'approved' ? 'bg-green-100' :
                        application.status === 'rejected' ? 'bg-red-100' :
                        'bg-yellow-100'
                      }`}>
                        {application.status === 'approved' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : application.status === 'rejected' ? (
                          <XCircle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Clock className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {application.student_name}
                          </h3>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-600">
                            {getLeaveTypeLabel(application.leave_type)}
                          </span>
                          {application.attachment_url && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              Có đính kèm
                            </Badge>
                          )}
                          {getStatusBadge(application.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(application.start_date), 'dd/MM/yyyy', { locale: vi })} - {format(new Date(application.end_date), 'dd/MM/yyyy', { locale: vi })}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(new Date(application.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                          </div>
                        </div>
                      </div>

                      {/* Action */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(application)
                          setShowDetailDialog(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn xin nghỉ</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đơn xin nghỉ của {selectedApplication?.student_name}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">


              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Học sinh</Label>
                  <p className="text-base font-medium">{selectedApplication.student_name}</p>
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

              {/* Attachment - Always show section for debugging */}
              <div>
                <Label className="text-sm font-medium text-gray-600">Tệp đính kèm</Label>
                {selectedApplication.attachment_url ? (
                  <div className="mt-2 space-y-2">
                    <ImageViewer
                      src={selectedApplication.attachment_url}
                      alt="Đính kèm đơn xin nghỉ"
                      className="rounded-lg border overflow-hidden bg-gray-50"
                    >
                      <div className="relative group">
                        <Image
                          src={selectedApplication.attachment_url}
                          alt="Đính kèm đơn xin nghỉ"
                          width={400}
                          height={300}
                          className="w-full h-auto max-h-64 object-contain cursor-pointer hover:scale-105 transition-transform duration-200"
                          draggable={false}
                          unselectable="on"
                          onContextMenu={(e) => e.preventDefault()}
                          onError={(e) => {
                            console.error('Image load error:', selectedApplication.attachment_url)
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                            <Eye className="h-5 w-5 text-gray-700" />
                          </div>
                        </div>
                      </div>
                    </ImageViewer>

                    {/* Fallback download button */}
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
                            link.download = `don-xin-nghi-${selectedApplication.student_name}.jpg`
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
                ) : (
                  <p className="text-sm text-gray-500 mt-2">Không có tệp đính kèm</p>
                )}
              </div>

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
