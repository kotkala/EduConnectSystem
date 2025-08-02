import { SharedNotificationsPage, type NotificationPageConfig } from '@/components/notifications/shared-notifications-page'

const adminConfig: NotificationPageConfig = {
  role: 'admin',
  title: 'Notifications',
  description: 'Send and manage notifications to teachers, students, and parents',
  emptyStateMessage: 'Send your first notification to get started',
  dashboardPath: '/dashboard/admin',
  canSendNotifications: true,
  useSidebarLayout: true
}

export default function AdminNotificationsPage() {
  return <SharedNotificationsPage config={adminConfig} />
}
