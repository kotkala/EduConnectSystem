import { SharedNotificationsPage, type NotificationPageConfig } from '@/features/notifications/components/notifications/shared-notifications-page'

const adminConfig: NotificationPageConfig = {
  role: 'admin',
  title: 'ThÃ´ng bÃ¡o',
  description: 'Gá»­i vÃ  quáº£n lÃ½ thÃ´ng bÃ¡o tá»›i giÃ¡o viÃªn, há»c sinh vÃ  phá»¥ huynh',
  emptyStateMessage: 'Gá»­i thÃ´ng bÃ¡o Ä‘áº§u tiÃªn Ä‘á»ƒ báº¯t Ä‘áº§u',
  dashboardPath: '/dashboard/admin',
  canSendNotifications: true,
  useSidebarLayout: false
}

export default function AdminNotificationsPage() {
  return <SharedNotificationsPage config={adminConfig} />
}
