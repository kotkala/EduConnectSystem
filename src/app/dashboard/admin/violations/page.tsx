import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ViolationsPageClient from './violations-page-client'
import ViolationsPageWrapper from './violations-page-wrapper'
import { AdminPageWithSuspense } from '@/shared/components/dashboard/admin-page-template'

export default async function ViolationsPage() {
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

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <ViolationsPageWrapper>
      <AdminPageWithSuspense
        title="Quản lý vi phạm"
        description="Theo dõi và xử lý vi phạm học sinh"
        showCard={true}
        fallback={<div>Đang tải...</div>}
      >
        <ViolationsPageClient />
      </AdminPageWithSuspense>
    </ViolationsPageWrapper>
  )
}
