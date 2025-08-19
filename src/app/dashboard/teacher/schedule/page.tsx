import { Metadata } from "next";
import { CalendarProvider } from "@/features/timetable/components/event-calendar/calendar-context";
import TeacherScheduleBigCalendar from "@/features/timetable/components/teacher-schedule-big-calendar";

export const metadata: Metadata = {
  title: "Lá»‹ch Giáº£ng Dáº¡y Cá»§a TÃ´i",
  description: "Xem lá»‹ch giáº£ng dáº¡y vÃ  phÃ¢n cÃ´ng lá»›p há»c cá»§a báº¡n",
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


