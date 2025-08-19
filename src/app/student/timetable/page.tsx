import { Metadata } from 'next'
import { StudentTimetableClient } from './student-timetable-client'

export const metadata: Metadata = {
  title: 'Thời khóa biểu',
  description: 'Xem thời khóa biểu lớp học của bạn',
}

export default function StudentTimetablePage() {
  return <StudentTimetableClient />
}
