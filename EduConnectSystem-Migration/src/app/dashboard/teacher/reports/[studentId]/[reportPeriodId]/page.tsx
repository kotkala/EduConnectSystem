import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentReportEditor from './student-report-editor'

interface PageProps {
  params: Promise<{
    studentId: string
    reportPeriodId: string
  }>
}

export default async function StudentReportPage({ params }: PageProps) {
  const { studentId, reportPeriodId } = await params
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
      <Suspense fallback={
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      }>
        <StudentReportEditor 
          studentId={studentId}
          reportPeriodId={reportPeriodId}
        />
      </Suspense>
    </div>
  )
}
