import { SharedNotificationsPage } from '@/shared/components/notifications/shared-notifications-page'
import { NOTIFICATION_CONFIGS } from '@/shared/components/notifications/notification-configs'

export default function ParentNotificationsPage() {
  return <SharedNotificationsPage config={NOTIFICATION_CONFIGS.parent} />
}
