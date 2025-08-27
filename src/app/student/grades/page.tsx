import { Metadata } from 'next'
import StudentGradesSimple from './student-grades-simple'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Bảng điểm cá nhân',
  description: 'Xem bảng điểm cá nhân và thống kê học tập',
}

export default function StudentGradesPage() {
  return (
    <ContentLayout title="Bảng điểm" role="student">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/student">Tổng quan</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Bảng điểm</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <StudentGradesSimple />
        </CardContent>
      </Card>
    </ContentLayout>
  )
}


