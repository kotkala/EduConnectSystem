import { Metadata } from "next";
import { CalendarProvider } from "@/components/event-calendar/calendar-context";
import TimetableCalendar from "@/components/timetable-calendar/timetable-calendar";

export const metadata: Metadata = {
  title: "Timetable Management",
  description: "Manage class schedules, teachers, and weekly timetables",
};

export default function TimetablePage() {
  return (
    <CalendarProvider>
      <div className="flex flex-1 flex-col gap-4 p-2 pt-0">
        <TimetableCalendar />
      </div>
    </CalendarProvider>
  );
}

