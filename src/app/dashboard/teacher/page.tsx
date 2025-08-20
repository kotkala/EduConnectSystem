import { redirect } from 'next/navigation'
import { createClient } from '@/shared/utils/supabase/server'
import { Suspense } from 'react'
import TeacherWeeklyDashboard from './teacher-weekly-dashboard'

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
      <Suspense fallback={<div>Đang tải...</div>}>
        <TeacherWeeklyDashboard profile={profile} />
      </Suspense>
    </div>
  )
}
