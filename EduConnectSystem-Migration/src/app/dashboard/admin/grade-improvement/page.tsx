import { Metadata } from 'next'
import { AdminGradeImprovementClient } from './admin-grade-improvement-client'

export const metadata: Metadata = {
  title: 'Quản lý cải thiện điểm số',
  description: 'Quản lý các đơn yêu cầu cải thiện điểm số của học sinh',
}

export default function AdminGradeImprovementPage() {
  return <AdminGradeImprovementClient />
}
