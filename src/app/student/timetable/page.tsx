import { Metadata } from 'next'
import { CalendarProvider } from "@/features/timetable/components/event-calendar/calendar-context";
import { StudentTimetableSimple } from './student-timetable-simple'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Thời khóa biểu',
  description: 'Xem thời khóa biểu lớp học của bạn',
}

export default function StudentTimetablePage() {
  return (
    <ContentLayout title="Thời khóa biểu" role="student">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/student">Tổng quan</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Thời khóa biểu</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <CalendarProvider>
            <div className="flex flex-1 flex-col gap-4">
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Thời khóa biểu</h1>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Xem thời khóa biểu lớp học của bạn
                </p>
              </div>
              <StudentTimetableSimple />
            </div>
          </CalendarProvider>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
