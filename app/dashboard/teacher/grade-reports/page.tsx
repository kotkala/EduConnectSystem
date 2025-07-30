import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import TeacherGradeReportsClient from './teacher-grade-reports-client'

export default async function TeacherGradeReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, homeroom_enabled')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    redirect('/dashboard')
  }

  return (
    <SidebarLayout role="teacher" title="Quản Lý Bảng Điểm">
      <Suspense fallback={<div>Loading...</div>}>
        <TeacherGradeReportsClient />
      </Suspense>
    </SidebarLayout>
  )
}
