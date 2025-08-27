import { Metadata } from "next";
import { CalendarProvider } from "@/features/timetable/components/event-calendar/calendar-context";
import TeacherScheduleBigCalendar from "@/features/timetable/components/teacher-schedule-big-calendar";
import { TeacherPageTemplate } from "@/shared/components/dashboard/teacher-page-template";

export const metadata: Metadata = {
  title: "Lịch Giảng Dạy Của Tôi",
  description: "Xem lịch giảng dạy và phân công lớp học của bạn",
};

export default function TeacherSchedulePage() {
  return (
    <TeacherPageTemplate
      title="Lịch giảng dạy"
      description="Xem lịch giảng dạy và phân công lớp học của bạn"
      showCard={false}
    >
      <CalendarProvider>
        <div className="flex flex-1 flex-col gap-4">
          <TeacherScheduleBigCalendar />
        </div>
      </CalendarProvider>
    </TeacherPageTemplate>
  );
}


