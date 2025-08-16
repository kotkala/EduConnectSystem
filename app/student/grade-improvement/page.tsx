import { Metadata } from 'next'
import { StudentGradeImprovementClient } from './student-grade-improvement-client'

export const metadata: Metadata = {
  title: 'Cải thiện điểm số',
  description: 'Nộp đơn yêu cầu cải thiện điểm số và theo dõi trạng thái',
}

export default function StudentGradeImprovementPage() {
  return <StudentGradeImprovementClient />
}
