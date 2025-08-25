import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Skeleton } from '@/shared/components/ui/skeleton'

import ParentViolationsPageClient from './parent-violations-page-client'

export default async function ParentViolationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'parent') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center py-16">
            <div className="space-y-4 mb-4">
          <Skeleton className="h-12 md:h-14 lg:h-16 w-12 rounded-full mx-auto"  aria-label="Loading content" role="status" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px] mx-auto"  aria-label="Loading content" role="status" />
            <Skeleton className="h-4 w-[150px] mx-auto"  aria-label="Loading content" role="status" />
          </div>
        </div>
            <p className="text-gray-600 font-medium">Đang tải thông tin vi phạm...</p>
          </div>
        }>
          <ParentViolationsPageClient />
        </Suspense>
      </div>
    </div>
  )
}
