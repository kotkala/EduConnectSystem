import { Suspense } from 'react'
import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { TeacherPageWithSuspense } from '@/shared/components/dashboard/teacher-page-template'

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
    <TeacherPageWithSuspense
      title="Báo cáo điểm số"
      description="Xem và quản lý báo cáo điểm số học sinh"
      showCard={false}
      fallback={<div>Đang tải...</div>}
    >
      <TeacherGradeReportsClient />
    </TeacherPageWithSuspense>
  )
}