import { Suspense } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { StudentGradeDetailClient } from './student-grade-detail-client'

interface StudentGradeDetailPageProps {
  readonly params: Promise<{
    readonly studentId: string
  }>
}

export default async function StudentGradeDetailPage({ params }: StudentGradeDetailPageProps) {
  const { studentId } = await params
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chi tiết điểm số học sinh</h1>
          <p className="text-muted-foreground">
            Xem và chỉnh sửa điểm số của học sinh theo từng môn học
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-2 text-muted-foreground">Đang tải dữ liệu học sinh...</span>
        </div>
      }>
        <StudentGradeDetailClient studentId={studentId} />
      </Suspense>
    </div>
  )
}
