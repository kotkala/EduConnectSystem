import { Suspense } from 'react'
import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'

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
    <div className="p-6">
      <Suspense fallback={<div>Đang tải...</div>}>
        <ParentGradesClient />
      </Suspense>
    </div>
  )
}