import { Metadata } from "next";
import { CalendarProvider } from "@/components/event-calendar/calendar-context";
import TeacherScheduleBigCalendar from "@/components/teacher-schedule-big-calendar";

export const metadata: Metadata = {
  title: "Lịch Giảng Dạy Của Tôi",
  description: "Xem lịch giảng dạy và phân công lớp học của bạn",
};

export default function TeacherSchedulePage() {
  return (
    <div className="p-6">
      <CalendarProvider>
        <div className="flex flex-1 flex-col gap-4">
          <TeacherScheduleBigCalendar />
        </div>
      </CalendarProvider>
    </div>
  );
}


