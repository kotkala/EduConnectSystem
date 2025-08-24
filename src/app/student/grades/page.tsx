import { Metadata } from 'next'
import StudentGradesSimple from './student-grades-simple'

export const metadata: Metadata = {
  title: 'Bảng điểm cá nhân',
  description: 'Xem bảng điểm cá nhân và thống kê học tập',
}

export default function StudentGradesPage() {
  return <StudentGradesSimple />
}


