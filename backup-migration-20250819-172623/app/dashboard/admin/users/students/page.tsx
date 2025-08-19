import { Suspense } from 'react'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import StudentsPageClient from './students-page-client'

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quản lý Học sinh & Phụ huynh</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Quản lý tài khoản học sinh kèm mối quan hệ phụ huynh bắt buộc
          </p>
        </div>
        <a href="/dashboard/admin/users" className="text-sm text-blue-600 hover:underline">← Quay về Quản lý người dùng</a>
      </div>

      <Suspense fallback={<div>Đang tải...</div>}>
        <StudentsPageClient />
      </Suspense>
    </div>
  )
}

