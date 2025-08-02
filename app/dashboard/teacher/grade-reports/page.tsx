import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

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
    <div className="p-6">
      <Suspense fallback={<div>Loading...</div>}>
        <TeacherGradeReportsClient />
      </Suspense>
    </div>
  )
}
