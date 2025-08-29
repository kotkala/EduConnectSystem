'use client'

import { Skeleton } from '@/shared/components/ui/skeleton'

export default function ParentGradeDetailLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="space-y-4 mb-4">
        <Skeleton className="h-12 md:h-14 lg:h-16 w-12 rounded-full mx-auto" aria-label="Loading content" role="status" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px] mx-auto" aria-label="Loading content" role="status" />
          <Skeleton className="h-4 w-[150px] mx-auto" aria-label="Loading content" role="status" />
        </div>
      </div>
      <p className="text-muted-foreground font-medium">Đang tải chi tiết bảng điểm...</p>
    </div>
  )
}
