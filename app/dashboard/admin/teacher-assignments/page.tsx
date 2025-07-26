import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import TeacherAssignmentClient from './teacher-assignment-client'

export default async function TeacherAssignmentsPage() {
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

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <SidebarLayout role="admin" title="Teacher Assignments">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Teacher Assignments</h1>
            <p className="text-muted-foreground">
              Assign teachers to teach specific subjects in classes
            </p>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <TeacherAssignmentClient currentUserId={user.id} />
        </Suspense>
      </div>
    </SidebarLayout>
  )
}
