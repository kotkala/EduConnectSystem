import { SharedNotificationsPage, type NotificationPageConfig } from '@/components/notifications/shared-notifications-page'

const teacherConfig: NotificationPageConfig = {
  role: 'teacher',
  title: 'Notifications',
  description: 'Send notifications to your students and view received messages',
  emptyStateMessage: 'Send your first notification to get started',
  dashboardPath: '/dashboard/teacher',
  canSendNotifications: true,
  useSidebarLayout: false
}

export default function TeacherNotificationsPage() {
  return <SharedNotificationsPage config={teacherConfig} />
}
