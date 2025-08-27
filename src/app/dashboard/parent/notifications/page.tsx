import { SharedNotificationsPage } from '@/features/notifications/components/notifications/shared-notifications-page'
import { NOTIFICATION_CONFIGS } from '@/features/notifications/components/notifications/notification-configs'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'

export default function ParentNotificationsPage() {
  const config = {
    ...NOTIFICATION_CONFIGS.parent,
    useSidebarLayout: false // Force to use ContentLayout
  }

  return (
    <ContentLayout title="Thông báo" role="parent">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Thông báo</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <SharedNotificationsPage config={config} />
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
