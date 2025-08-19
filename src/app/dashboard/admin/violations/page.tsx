import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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
          <h1 className="text-3xl font-bold tracking-tight">Quáº£n lÃ½ vi pháº¡m há»c sinh</h1>
          <p className="text-muted-foreground">
            Quáº£n lÃ½ danh má»¥c vi pháº¡m, ghi nháº­n vi pháº¡m vÃ  theo dÃµi ká»· luáº­t há»c sinh
          </p>
        </div>
      </div>

      <Suspense fallback={<div>Äang táº£i...</div>}>
        <ViolationsPageClient />
      </Suspense>
    </div>
  )
}
