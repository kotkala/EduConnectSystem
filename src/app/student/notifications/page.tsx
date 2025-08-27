import { SharedNotificationsPage } from '@/features/notifications/components/notifications/shared-notifications-page'
import { NOTIFICATION_CONFIGS } from '@/features/notifications/components/notifications/notification-configs'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'
import Link from 'next/link'

export default function StudentNotificationsStandalone() {
  const config = {
    ...NOTIFICATION_CONFIGS.student,
    useSidebarLayout: false // Force to use ContentLayout
  }

  return (
    <ContentLayout title="Thông báo" role="student">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/student">Tổng quan</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
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


