import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'
import TeacherWeeklyDashboard from './teacher-weekly-dashboard'
import { CardSkeleton } from '@/shared/components/ui/skeleton-utils'

function TeacherDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="h-4 w-80 bg-muted animate-pulse rounded" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }, (_, i) => (
          <CardSkeleton key={`teacher-stats-skeleton-${i}`} />
        ))}
      </div>

      {/* Content Sections Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

export default async function TeacherDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is teacher
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    redirect('/dashboard')
  }

  return (
    <div className="p-6">
      <Suspense fallback={<TeacherDashboardSkeleton />}>
        <TeacherWeeklyDashboard profile={profile} />
      </Suspense>
    </div>
  )
}
