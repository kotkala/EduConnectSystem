import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeacherReportsClient from './teacher-reports-client'

export default async function TeacherReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    redirect('/dashboard')
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">BÃ¡o cÃ¡o káº¿t quáº£ há»c táº­p</h1>
          <p className="text-muted-foreground">
            Quáº£n lÃ½ bÃ¡o cÃ¡o há»c táº­p vÃ  rÃ¨n luyá»‡n cá»§a há»c sinh
          </p>
        </div>

        {/* Main Content */}
        <Suspense fallback={
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        }>
          <TeacherReportsClient />
        </Suspense>
      </div>
    </div>
  )
}
