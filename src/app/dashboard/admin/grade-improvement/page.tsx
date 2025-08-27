import { Metadata } from 'next'
import { AdminGradeImprovementClient } from './admin-grade-improvement-client'
import { AdminPageTemplate } from '@/shared/components/dashboard/admin-page-template'

export const metadata: Metadata = {
  title: 'Quản lý cải thiện điểm số',
  description: 'Quản lý các đơn yêu cầu cải thiện điểm số của học sinh',
}

export default function AdminGradeImprovementPage() {
  return (
    <AdminPageTemplate
      title="Cải thiện điểm số"
      description="Quản lý yêu cầu cải thiện điểm số"
      showCard={true}
    >
      <AdminGradeImprovementClient />
    </AdminPageTemplate>
  )
}
