import { Metadata } from 'next'
import { StudentGradeImprovementClient } from './student-grade-improvement-client'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cải thiện điểm số',
  description: 'Nộp đơn yêu cầu cải thiện điểm số và theo dõi trạng thái',
}

export default function StudentGradeImprovementPage() {
  return (
    <ContentLayout title="Cải thiện điểm" role="student">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/student">Tổng quan</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cải thiện điểm</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <StudentGradeImprovementClient />
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
