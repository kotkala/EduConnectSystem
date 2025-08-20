import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ExchangeRequestsManagement } from '@/features/admin-management/components/admin/exchange-requests-management'

export const metadata = {
  title: 'Yêu cầu đổi lịch',
  description: 'Quản lý yêu cầu đổi lịch giảng dạy của giáo viên',
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
        <h2 className="text-2xl font-bold tracking-tight">Yêu cầu đổi lịch</h2>
        <p className="text-muted-foreground">
          Xem xét và quản lý các yêu cầu đổi lịch giảng dạy của giáo viên.
        </p>
      </div>

      <ExchangeRequestsManagement />
    </div>
  )
}
