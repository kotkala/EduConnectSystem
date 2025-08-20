import { Suspense } from 'react'
import { createClient } from '@/shared/utils/supabase/server'
import { redirect } from 'next/navigation'
import ParentReportsClient from './parent-reports-client'
import { BookCheck } from 'lucide-react'

export default async function ParentReportsPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Modern Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <BookCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Báo cáo học tập
                </h1>
                <p className="text-gray-600 mt-1">
                  Xem báo cáo học tập và rèn luyện của con em từ giáo viên chủ nhiệm
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <Suspense fallback={
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 p-6 sm:p-8">
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          }>
            <ParentReportsClient />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
