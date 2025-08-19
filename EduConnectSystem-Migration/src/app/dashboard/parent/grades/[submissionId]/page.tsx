import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/shared/components/ui/button'

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
      <Suspense fallback={<div>Đang tải...</div>}>
        <ParentGradeDetailClient submissionId={submissionId} />
      </Suspense>
    </div>
  )
}