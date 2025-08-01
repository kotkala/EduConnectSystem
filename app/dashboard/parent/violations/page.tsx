import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import ParentViolationsPageClient from './parent-violations-page-client'

export default async function ParentViolationsPage() {
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
    <SidebarLayout role="parent" title="Student Violations">
      <Suspense fallback={<div>Loading...</div>}>
        <ParentViolationsPageClient />
      </Suspense>
    </SidebarLayout>
  )
}
