import { Metadata } from 'next'
import { StudentGradesClient } from './student-grades-client'

export const metadata: Metadata = {
  title: 'Bảng điểm cá nhân',
  description: 'Xem bảng điểm cá nhân và thống kê học tập',
}

export default function StudentGradesPage() {
  return <StudentGradesClient />
}


