'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { SidebarLayout } from '@/shared/components/dashboard/sidebar-layout'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import {
  getParentStudentsAction,
  type StudentInfo
} from '@/features/parent-dashboard/actions/parent-actions'
import { 
  createLeaveApplicationAction,
  uploadLeaveAttachmentAction,
  type LeaveApplicationFormData 
} from '@/lib/actions/leave-application-actions'
import { ArrowLeft, Upload, X, AlertCircle, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function CreateLeaveApplicationPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  
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
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'parent')) {
      router.push('/dashboard')
    }
  }, [loading, user, profile, router])

  useEffect(() => {
    if (!loading && user && profile?.role === 'parent') {
      loadStudents()
    }
  }, [loading, user, profile])

  const loadStudents = async () => {
    const result = await getParentStudentsAction()
    if (result.success && result.data) {
      setStudents(result.data)
    } else {
      setError(result.error || 'Không thể tải danh sách học sinh')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('Vui lòng chọn hình ảnh (JPEG, PNG, GIF) hoặc tệp PDF')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Kích thước tệp phải nhỏ hơn 5MB')
        return
      }

      setSelectedFile(file)
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
      
      setError(null)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate form
      if (!formData.student_id) {
        throw new Error('Vui lòng chọn học sinh')
      }
      if (!formData.start_date || !formData.end_date) {
        throw new Error('Vui lòng chọn ngày bắt đầu và kết thúc')
      }
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        throw new Error('Ngày kết thúc phải sau ngày bắt đầu')
      }
      if (!formData.reason.trim()) {
        throw new Error('Vui lòng nhập lý do xin nghỉ')
      }

      let attachmentUrl = ''

      // Upload file if selected
      if (selectedFile) {
        const uploadResult = await uploadLeaveAttachmentAction(selectedFile)
        if (uploadResult.success && uploadResult.data) {
          attachmentUrl = uploadResult.data.url
        } else {
          throw new Error(uploadResult.error || 'Tải tệp đính kèm thất bại')
        }
      }

      // Create leave application
      const result = await createLeaveApplicationAction({
        ...formData,
        attachment_url: attachmentUrl || undefined
      })

      if (result.success) {
        setSuccess(true)
        toast.success('Đã tạo đơn xin nghỉ thành công!')
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/parent/leave-application')
        }, 2000)
      } else {
        throw new Error(result.error || 'Không thể tạo đơn xin nghỉ')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Đã xảy ra lỗi')
      toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <SidebarLayout role="parent" title="Tạo đơn xin nghỉ">
        <div className="flex items-center justify-center h-64">
          <div className="space-y-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px] mx-auto"  aria-label="Loading content" role="status" />
            <Skeleton className="h-4 w-[100px] mx-auto"  aria-label="Loading content" role="status" />
          </div>
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
          <AlertCircle className="h-16 w-16 md:w-20 lg:w-24 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Từ chối truy cập</h2>
          <p className="text-gray-600">Bạn không có quyền truy cập trang này.</p>
          <Button onClick={() => router.push('/dashboard/parent')}>
            Quay lại bảng điều khiển
          </Button>
        </div>
      </SidebarLayout>
    )
  }

  if (success) {
    return (
      <SidebarLayout role="parent" title="Đơn xin nghỉ">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-16 md:w-20 lg:w-24 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 md:h-9 lg:h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Đã gửi đơn thành công!</h2>
          <p className="text-gray-600 text-center">
            Đơn xin nghỉ của bạn đã được gửi đến giáo viên chủ nhiệm để xem xét.
          </p>
          <p className="text-sm text-gray-500">Đang chuyển hướng về danh sách đơn xin nghỉ...</p>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout role="parent" title="Tạo đơn xin nghỉ">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/parent/leave-application')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tạo đơn xin nghỉ</h1>
            <p className="text-muted-foreground">
              Gửi đơn xin nghỉ cho giáo viên chủ nhiệm của con em bạn
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Selection */}
            <div className="space-y-2">
              <Label htmlFor="student">Học sinh *</Label>
              <Select
                value={formData.student_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học sinh" />
                </SelectTrigger>
                <SelectContent>
                  {students.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} {student.current_class ? `- ${student.current_class.name}` : '(Chưa có lớp)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Leave Type */}
            <div className="space-y-2">
              <Label htmlFor="leave_type">Loại đơn *</Label>
              <Select
                value={formData.leave_type}
                onValueChange={(value: 'sick' | 'family' | 'emergency' | 'vacation' | 'other') =>
                  setFormData(prev => ({ ...prev, leave_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
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
                <Label htmlFor="start_date">Ngày bắt đầu *</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Ngày kết thúc *</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  min={formData.start_date || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do xin nghỉ *</Label>
              <Textarea
                id="reason"
                placeholder="Vui lòng nêu rõ lý do xin nghỉ..."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                rows={4}
                required
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Tài liệu hỗ trợ (không bắt buộc)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {selectedFile ? (
                  <div className="space-y-4">
                    {previewUrl && (
                      <div className="relative w-32 h-32 md:h-40 lg:h-48 mx-auto">
                        <Image
                          src={previewUrl}
                          alt="Xem trước"
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{selectedFile.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-8 h-8 md:h-9 lg:h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Tải lên giấy khám bệnh, thư xác nhận hoặc tài liệu liên quan khác
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Định dạng hỗ trợ: JPEG, PNG, GIF, PDF (tối đa 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      Chọn tệp
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/parent/leave-application')}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Đang gửi...' : 'Gửi đơn'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </SidebarLayout>
  )
}
