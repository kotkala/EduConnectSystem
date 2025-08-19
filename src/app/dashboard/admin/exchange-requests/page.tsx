import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExchangeRequestsManagement } from '@/features/admin-management/components/admin/exchange-requests-management'

export const metadata = {
  title: 'YÃªu cáº§u Ä‘á»•i lá»‹ch',
  description: 'Quáº£n lÃ½ yÃªu cáº§u Ä‘á»•i lá»‹ch giáº£ng dáº¡y cá»§a giÃ¡o viÃªn',
}

export default async function AdminExchangeRequestsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">YÃªu cáº§u Ä‘á»•i lá»‹ch</h2>
        <p className="text-muted-foreground">
          Xem xÃ©t vÃ  quáº£n lÃ½ cÃ¡c yÃªu cáº§u Ä‘á»•i lá»‹ch giáº£ng dáº¡y cá»§a giÃ¡o viÃªn.
        </p>
      </div>

      <ExchangeRequestsManagement />
    </div>
  )
}
