import { SharedNotificationsPage, type NotificationPageConfig } from '@/components/notifications/shared-notifications-page'

const adminConfig: NotificationPageConfig = {
  role: 'admin',
  title: 'Thông báo',
  description: 'Gửi và quản lý thông báo tới giáo viên, học sinh và phụ huynh',
  emptyStateMessage: 'Gửi thông báo đầu tiên để bắt đầu',
  dashboardPath: '/dashboard/admin',
  canSendNotifications: true,
  useSidebarLayout: false
}

export default function AdminNotificationsPage() {
  return <SharedNotificationsPage config={adminConfig} />
}
