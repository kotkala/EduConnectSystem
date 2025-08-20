'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { NotificationForm } from '@/features/notifications/components/notifications/notification-form'
import { toast } from 'sonner'

export default function CreateNotificationPage() {
  const router = useRouter()

  const handleSuccess = () => {
    toast.success('Thông báo đã được tạo thành công!')
    router.push('/dashboard/teacher/notifications')
  }

  const handleCancel = () => {
    router.push('/dashboard/teacher/notifications')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách thông báo
          </Button>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tạo thông báo mới</h1>
          <p className="text-gray-600 mt-2">
            Tạo và gửi thông báo đến các đối tượng mục tiêu trong hệ thống
          </p>
        </div>

        {/* Notification Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <NotificationForm
            isEditMode={false}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  )
}
