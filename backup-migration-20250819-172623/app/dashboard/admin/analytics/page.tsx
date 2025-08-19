import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import AnalyticsClient from './analytics-client'

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
      <Suspense fallback={<div>Loading...</div>}>
        <AnalyticsClient />
      </Suspense>
    </SidebarLayout>
  )
}
