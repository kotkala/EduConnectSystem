import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import ParentGradesClient from './parent-grades-client'

export default async function ParentGradesPage() {
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

  return (
    <SidebarLayout role="parent" title="Bảng Điểm Con Em">
      <Suspense fallback={<div>Loading...</div>}>
        <ParentGradesClient />
      </Suspense>
    </SidebarLayout>
  )
}
