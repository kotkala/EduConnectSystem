import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarLayout } from '@/shared/components/dashboard/sidebar-layout'
import AnalyticsClient from './analytics-client'
import { CardSkeleton, GridSkeleton } from '@/shared/components/ui/skeleton-utils'

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-80 bg-muted animate-pulse rounded" />
      </div>

      {/* Charts Grid Skeleton */}
      <GridSkeleton itemCount={4} />

      {/* Additional Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

export default async function AnalyticsPage() {
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

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <SidebarLayout role="admin" title="Phân Tích Điểm Số">
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsClient />
      </Suspense>
    </SidebarLayout>
  )
}
