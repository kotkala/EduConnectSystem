import { Metadata } from "next";
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'
import Link from 'next/link'
import ParentFeedbackDashboard from "@/features/parent-dashboard/components/parent-feedback/parent-feedback-dashboard";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Phản Hồi Học Tập",
  description: "Xem phản hồi học tập của con em từ giáo viên",
};

export default function ParentFeedbackPage() {
  return (
    <ContentLayout title="Phản hồi" role="parent">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/parent">Phụ huynh</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Phản hồi</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Phản Hồi Học Tập
                </h1>
                <p className="text-muted-foreground">
                  Xem phản hồi và đánh giá học tập của con em từ giáo viên
                </p>
              </div>
            </div>

            {/* Feedback Content */}
            <ParentFeedbackDashboard />
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  );
}
