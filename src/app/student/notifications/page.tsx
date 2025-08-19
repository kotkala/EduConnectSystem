import { SharedNotificationsPage } from '@/features/notifications/components/notifications/shared-notifications-page'
import { NOTIFICATION_CONFIGS } from '@/features/notifications/components/notifications/notification-configs'

export default function StudentNotificationsStandalone() {
  return <SharedNotificationsPage config={NOTIFICATION_CONFIGS.student} />
}


