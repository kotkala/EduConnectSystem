import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import ViolationsPageClient from './violations-page-client'

export default async function ViolationsPage() {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý vi phạm học sinh</h1>
          <p className="text-muted-foreground">
            Quản lý danh mục vi phạm, ghi nhận vi phạm và theo dõi kỷ luật học sinh
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Đang tải...</div>}>
        <ViolationsPageClient />
      </Suspense>
    </div>
  )
}
