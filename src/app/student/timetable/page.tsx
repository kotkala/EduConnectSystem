import { Metadata } from 'next'
import { CalendarProvider } from "@/features/timetable/components/event-calendar/calendar-context";
import { StudentTimetableSimple } from './student-timetable-simple'

export const metadata: Metadata = {
  title: 'Thời khóa biểu',
  description: 'Xem thời khóa biểu lớp học của bạn',
}

export default function StudentTimetablePage() {
  return (
    <div className="p-6">
      <CalendarProvider>
        <div className="flex flex-1 flex-col gap-4">
          <StudentTimetableSimple />
        </div>
      </CalendarProvider>
    </div>
  )
}
