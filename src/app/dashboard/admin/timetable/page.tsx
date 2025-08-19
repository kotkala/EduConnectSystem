import { Metadata } from "next";
import { CalendarProvider } from "@/features/timetable/components/event-calendar/calendar-context";
import TimetableBigCalendar from "@/features/timetable/components/timetable-big-calendar";

export const metadata: Metadata = {
  title: "Quáº£n lÃ½ thá»i khÃ³a biá»ƒu",
  description: "Quáº£n lÃ½ lá»‹ch há»c, giÃ¡o viÃªn vÃ  thá»i khÃ³a biá»ƒu theo tuáº§n",
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

