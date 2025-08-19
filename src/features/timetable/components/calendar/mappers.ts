import type { CalendarEvent, EventColor } from "../event-calendar";

// Domain-specific mappers used by timetable features can live here to avoid duplication.

export type StudySlotCommon = {
  id?: string
  subject_name?: string
  subject_category?: string
  teacher_name?: string
  classroom_name?: string
  notes?: string
  day_of_week: number
  start_time: string
  end_time: string
}

// Map subject categories to palette colors used by CalendarEvent
const subjectCategoryToColor: Record<string, EventColor> = {
  math: "blue",
  science: "blue",
  language: "emerald",
  literature: "emerald",
  social_studies: "orange",
  history: "orange",
  geography: "orange",
  arts: "violet",
  physical_education: "violet",
  music: "violet",
  elective: "rose",
  technology: "rose",
};

export function getSubjectColor(category?: string): EventColor {
  if (!category) return "blue";
  return subjectCategoryToColor[category.toLowerCase()] ?? "blue";
}

// Convert a StudySlot-like object to CalendarEvent for display in the calendar.
export function studySlotToCalendarEvent(slot: StudySlotCommon): CalendarEvent {
  // Compute the Monday of the current week
  const today = new Date();
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);

  // day_of_week is 1..7 (Mon..Sun). Align to the week start.
  const targetDate = new Date(startOfWeek);
  targetDate.setDate(startOfWeek.getDate() + (slot.day_of_week - 1));

  const [sh, sm] = slot.start_time.split(":").map(Number);
  const [eh, em] = slot.end_time.split(":").map(Number);

  const start = new Date(targetDate);
  start.setHours(sh, sm, 0, 0);

  const end = new Date(targetDate);
  end.setHours(eh, em, 0, 0);

  const color = getSubjectColor(slot.subject_category);

  return {
    id: slot.id || `temp-${Date.now()}`,
    title: slot.subject_name || "Môn học",
    description: (() => {
      const timeInfo = `${slot.start_time} - ${slot.end_time}`;
      const teacherInfo = `Giáo viên: ${slot.teacher_name || "TBD"}`;
      const roomInfo = `Phòng: ${slot.classroom_name || "TBD"}`;
      const notesInfo = slot.notes ? `\nGhi chú: ${slot.notes}` : "";
      return `${timeInfo}\n${teacherInfo}\n${roomInfo}${notesInfo}`;
    })(),
    start,
    end,
    allDay: false,
    color,
    location: slot.classroom_name || "TBD",
  };
}


