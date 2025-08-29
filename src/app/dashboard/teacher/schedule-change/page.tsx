import { Metadata } from "next"
import { Suspense } from "react"
import { ContentLayout } from "@/shared/components/dashboard/content-layout"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/shared/components/ui/breadcrumb"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Skeleton } from "@/shared/components/ui/skeleton"
import Link from "next/link"
import TeacherScheduleChangeList from "@/features/schedule-change/components/teacher-schedule-change-list"

export const metadata: Metadata = {
  title: "Đơn Thay Đổi Lịch Dạy | EduConnect",
  description: "Quản lý đơn thay đổi lịch dạy của giáo viên",
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-[300px]" />
        <Skeleton className="h-4 w-[500px]" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  )
}

export default function TeacherScheduleChangePage() {
  return (
    <ContentLayout title="Đơn Thay Đổi Lịch Dạy" role="teacher">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/teacher">Bảng điều khiển</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Đơn Thay Đổi Lịch Dạy</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="min-h-[calc(100vh-56px-64px-20px-24px-56px-48px)]">
            <Suspense fallback={<LoadingSkeleton />}>
              <TeacherScheduleChangeList />
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
