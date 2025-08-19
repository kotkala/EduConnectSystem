import { SharedNotificationsPage, type NotificationPageConfig } from '@/components/notifications/shared-notifications-page'

const teacherConfig: NotificationPageConfig = {
  role: 'teacher',
  title: 'Thông báo',
  description: 'Gửi thông báo cho học sinh và xem tin đã nhận',
  emptyStateMessage: 'Gửi thông báo đầu tiên để bắt đầu',
  dashboardPath: '/dashboard/teacher',
  canSendNotifications: true,
  useSidebarLayout: false
}

export default function TeacherNotificationsPage() {
  return <SharedNotificationsPage config={teacherConfig} />
}
