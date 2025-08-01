import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { ExchangeRequestsManagement } from '@/components/admin/exchange-requests-management'

export const metadata = {
  title: 'Schedule Exchange Requests',
  description: 'Manage teacher schedule exchange requests',
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
        <h2 className="text-2xl font-bold tracking-tight">Schedule Exchange Requests</h2>
        <p className="text-muted-foreground">
          Review and manage teacher schedule exchange requests.
        </p>
      </div>

      <ExchangeRequestsManagement />
    </div>
  )
}
