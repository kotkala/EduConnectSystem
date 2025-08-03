import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import IndividualGradesClient from './individual-grades-client'

export default async function GradeReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="p-6">
      <Suspense fallback={<div>Loading...</div>}>
        <IndividualGradesClient />
      </Suspense>
    </div>
  )
}