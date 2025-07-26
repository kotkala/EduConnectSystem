import { Metadata } from "next";
import { CalendarProvider } from "@/components/event-calendar/calendar-context";
import { SidebarLayout } from "@/components/dashboard/sidebar-layout";
import TeacherTimetableCalendar from "@/components/teacher-timetable/teacher-timetable-calendar";

export const metadata: Metadata = {
  title: "Lịch Giảng Dạy Của Tôi",
  description: "Xem lịch giảng dạy và phân công lớp học của bạn",
};

export default function TeacherSchedulePage() {
  return (
    <SidebarLayout role="teacher" title="Lịch Giảng Dạy Của Tôi">
      <CalendarProvider>
        <div className="flex flex-1 flex-col gap-4">
          <TeacherTimetableCalendar />
        </div>
      </CalendarProvider>
    </SidebarLayout>
  );
}


