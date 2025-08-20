import { Metadata } from "next";
import { CalendarProvider } from "@/features/timetable/components/event-calendar/calendar-context";
import TimetableBigCalendar from "@/features/timetable/components/timetable-big-calendar";

export const metadata: Metadata = {
  title: "Quản lý thời khóa biểu",
  description: "Quản lý lịch học, giáo viên và thời khóa biểu theo tuần",
};

export default function TimetablePage() {
  return (
    <div className="p-6">
      <CalendarProvider>
        <div className="flex flex-1 flex-col gap-4">
          <TimetableBigCalendar />
        </div>
      </CalendarProvider>
    </div>
  );
}

