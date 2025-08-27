import { Metadata } from "next";
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'
import Link from 'next/link'
import { ParentMeetingSchedules } from "@/features/parent-dashboard/components/parent-dashboard/parent-meeting-schedules";

export const metadata: Metadata = {
  title: "Lịch họp phụ huynh",
  description: "Xem lịch họp từ giáo viên chủ nhiệm",
};

export default function ParentMeetingSchedulesPage() {
  return (
    <ContentLayout title="Lịch họp" role="parent">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/parent">Phụ huynh</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Lịch họp</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="space-y-6">


            {/* Meeting Content */}
            <ParentMeetingSchedules />
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
