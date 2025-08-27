import { Metadata } from 'next'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'
import { BookOpen, Clock, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Khóa học',
  description: 'Xem danh sách khóa học và môn học',
}

export default function StudentCoursesPage() {
  return (
    <ContentLayout title="Khóa học" role="student">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/student">Tổng quan</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Khóa học</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Khóa học</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Xem danh sách khóa học và môn học bạn đang theo học
              </p>
            </div>

            {/* Coming Soon Message */}
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Tính năng đang phát triển</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Chức năng quản lý khóa học đang được phát triển và sẽ sớm có mặt trong phiên bản tiếp theo.
              </p>
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Dự kiến hoàn thành trong thời gian tới</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}


