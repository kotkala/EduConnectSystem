import { SharedNotificationsPage, type NotificationPageConfig } from '@/features/notifications/components/notifications/shared-notifications-page'

const teacherConfig: NotificationPageConfig = {
  role: 'teacher',
  title: 'ThÃ´ng bÃ¡o',
  description: 'Gá»­i thÃ´ng bÃ¡o cho há»c sinh vÃ  xem tin Ä‘Ã£ nháº­n',
  emptyStateMessage: 'Gá»­i thÃ´ng bÃ¡o Ä‘áº§u tiÃªn Ä‘á»ƒ báº¯t Ä‘áº§u',
  dashboardPath: '/dashboard/teacher',
  canSendNotifications: true,
  useSidebarLayout: false
}

export default function TeacherNotificationsPage() {
  return <SharedNotificationsPage config={teacherConfig} />
}
