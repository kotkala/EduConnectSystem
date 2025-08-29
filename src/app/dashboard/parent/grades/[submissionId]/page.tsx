import { Suspense } from 'react'
import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/shared/components/ui/button'
import { Skeleton } from '@/shared/components/ui/skeleton'

import ParentGradeDetailClient from './parent-grade-detail-client'

interface ParentGradeDetailPageProps {
  params: Promise<{ submissionId: string }>
}

export default async function ParentGradeDetailPage({ params }: ParentGradeDetailPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'parent') {
    redirect('/dashboard')
  }

  const { submissionId } = await params

  return (
    <div className="p-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/parent/grades">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chi tiết bảng điểm</h1>
          <p className="text-muted-foreground">
            Xem chi tiết điểm số và nhận xét từ giáo viên
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Suspense fallback={
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
      }>
        <ParentGradeDetailClient submissionId={submissionId} />
      </Suspense>
    </div>
  )
}