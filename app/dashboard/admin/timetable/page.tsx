import { Metadata } from "next";
import { CalendarProvider } from "@/components/event-calendar/calendar-context";
import { SidebarLayout } from "@/components/dashboard/sidebar-layout";
import TimetableCalendar from "@/components/timetable-calendar/timetable-calendar";

export const metadata: Metadata = {
  title: "Timetable Management",
  description: "Manage class schedules, teachers, and weekly timetables",
};

export default function TimetablePage() {
  return (
    <SidebarLayout role="admin" title="Timetable Management">
      <CalendarProvider>
        <div className="flex flex-1 flex-col gap-4">
          <TimetableCalendar />
        </div>
      </CalendarProvider>
    </SidebarLayout>
  );
}

