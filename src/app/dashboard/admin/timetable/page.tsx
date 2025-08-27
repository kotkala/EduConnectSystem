import { Metadata } from "next";
import { CalendarProvider } from "@/features/timetable/components/event-calendar/calendar-context";
import TimetableBigCalendar from "@/features/timetable/components/timetable-big-calendar";
import { AdminPageTemplate } from "@/shared/components/dashboard/admin-page-template";

export const metadata: Metadata = {
  title: "Quản lý thời khóa biểu",
  description: "Quản lý lịch học, giáo viên và thời khóa biểu theo tuần",
};

export default function TimetablePage() {
  return (
    <AdminPageTemplate
      title="Quản lý thời khóa biểu"
      description="Quản lý lịch học và thời khóa biểu"
      showCard={true}
    >
      <CalendarProvider>
        <div className="flex flex-1 flex-col gap-4">
          <TimetableBigCalendar />
        </div>
      </CalendarProvider>
    </AdminPageTemplate>
  );
}

