'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Skeleton } from '@/shared/components/ui/skeleton'

import { Label } from '@/shared/components/ui/label'
import { ArrowLeft, Bell, Clock, User, Edit, FileText, Image as ImageIcon, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import Image from 'next/image'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { useNotificationCount } from '@/features/notifications/hooks/use-notification-count'
import {
  getNotificationForViewAction,
  markNotificationAsReadAction,
  type Notification
} from '@/features/notifications/actions/notification-actions'
import { NotificationForm } from '@/features/notifications/components/notifications/notification-form'

export default function TeacherNotificationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, profile } = useAuth()
  const { refreshCounts } = useNotificationCount('teacher', user?.id)
  const notificationId = params.id as string

  const [notification, setNotification] = useState<Notification | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  useEffect(() => {
    if (notificationId) {
      loadNotification()
    }
  }, [notificationId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadNotification = async () => {
    setLoading(true)
    try {
      const result = await getNotificationForViewAction(notificationId)
      if (result.success && result.data) {
        setNotification(result.data)

        // Mark as read if not already read
        if (!result.data.is_read) {
          await markNotificationAsReadAction(notificationId)
        }
      } else {
        setError(result.error || 'Không thể tải thông báo')
      }
    } catch {
      setError('Đã xảy ra lỗi khi tải thông báo')
    } finally {
      setLoading(false)
    }
  }

  const canEditNotification = () => {
    if (!user || !profile || !notification) return false
    return profile.role === 'admin' || notification.sender_id === user.id
  }

  const handleEditSuccess = () => {
    setIsEditMode(false)
    loadNotification()
    toast.success('Cập nhật thông báo thành công!')
  }

  const handleMarkAsRead = async () => {
    if (!notification || notification.is_read) return

    const result = await markNotificationAsReadAction(notification.id)
    if (result.success) {
      setNotification(prev => prev ? { ...prev, is_read: true } : null)
      // Refresh notification count in sidebar
      refreshCounts()
      toast.success('Đã đánh dấu là đã đọc')
    } else {
      toast.error(result.error || 'Không thể đánh dấu là đã đọc')
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'admin': 'Quản trị viên',
      'teacher': 'Giáo viên',
      'parent': 'Phụ huynh',
      'student': 'Học sinh'
    }
    return roleMap[role] || role
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="space-y-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[150px] mx-auto"  aria-label="Loading content" role="status" />
            <Skeleton className="h-4 w-[100px] mx-auto"  aria-label="Loading content" role="status" />
          </div>
        </div>
            <span className="ml-2">Đang tải thông báo...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !notification) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Không tìm thấy thông báo'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>

          <div className="flex items-center gap-3">
            {!notification.is_read && (
              <Button
                variant="outline"
                onClick={handleMarkAsRead}
                className="flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Đánh dấu đã đọc
              </Button>
            )}

            {canEditNotification() && (
              <Button
                variant="outline"
                onClick={() => setIsEditMode(!isEditMode)}
                className="flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditMode ? 'Hủy chỉnh sửa' : 'Chỉnh sửa'}
              </Button>
            )}
          </div>
        </div>

        {/* Notification Content */}
        {isEditMode ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6">
            <NotificationForm
              editNotificationId={notification.id}
              isEditMode={true}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditMode(false)}
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="h-12 md:h-14 lg:h-16 w-12 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Bell className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  {notification.title}
                </h1>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="h-3 w-3 text-gray-600" />
                    </div>
                    <span className="font-medium">
                      {notification.sender?.full_name || 'Hệ thống'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <div className="flex flex-col">
                      <span>
                        Tạo: {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true, 
                          locale: vi 
                        })}
                      </span>
                      {notification.edited_at && (
                        <span className="text-xs text-blue-600">
                          Sửa: {formatDistanceToNow(new Date(notification.edited_at), { 
                            addSuffix: true, 
                            locale: vi 
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Target Roles */}
            {notification.target_roles && notification.target_roles.length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Gửi tới:</span>
                <div className="flex gap-2">
                  {notification.target_roles.map(role => (
                    <Badge
                      key={role}
                      variant="outline"
                      className="text-xs px-3 py-1 rounded-xl border-gray-200"
                    >
                      {getRoleDisplayName(role)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="prose prose-lg max-w-none">
              <div className="bg-gray-50 rounded-2xl p-6">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed m-0">
                  {notification.content}
                </p>
              </div>
            </div>

            {/* Image Attachment */}
            {notification.image_url && (
              <div className="rounded-2xl overflow-hidden border border-gray-200">
                <Image
                  src={notification.image_url}
                  alt="Hình ảnh đính kèm"
                  width={800}
                  height={500}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* File Attachments */}
            {notification.attachments && notification.attachments.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Tệp đính kèm</Label>
                <div className="grid gap-3">
                  {notification.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        {attachment.mime_type.startsWith('image/') ? (
                          <ImageIcon className="w-5 h-5 text-blue-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-gray-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{attachment.file_name}</p>
                          <p className="text-xs text-gray-500">
                            {Math.round(attachment.file_size / 1024)} KB • {attachment.file_type}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(attachment.public_url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Xem
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
