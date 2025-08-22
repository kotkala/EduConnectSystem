import type { CalendarEvent, EventColor } from "../event-calendar";
import { getEventStatus, getStatusIndicator } from "@/features/timetable/utils/status-indicators";

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
  substitute_teacher_id?: string
  exchange_request_id?: string
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
export function studySlotToCalendarEvent(
  slot: StudySlotCommon,
  semesterStartDate?: Date,
  weekNumber?: number,
  feedbackInfo?: {
    feedbackCount: number;
    totalStudents: number;
    hasFeedback: boolean;
  }
): CalendarEvent {
  let targetDate: Date;

  if (semesterStartDate && weekNumber) {
    // Calculate the actual lesson date based on semester start and week number
    const semesterStart = new Date(semesterStartDate);
    const weekOffset = (weekNumber - 1) * 7;
    const weekStart = new Date(semesterStart);
    weekStart.setDate(weekStart.getDate() + weekOffset);

    // day_of_week is 0..6 (Sun..Sat) from database. Convert to Monday-based week.
    // If day_of_week is 0 (Sunday), it should be day 6 in Monday-based week
    const mondayBasedDay = slot.day_of_week === 0 ? 6 : slot.day_of_week - 1;
    targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + mondayBasedDay);
  } else {
    // Fallback to current week (original behavior)
    const today = new Date();
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);

    // day_of_week is 0..6 (Sun..Sat) from database. Convert to Monday-based week.
    // If day_of_week is 0 (Sunday), it should be day 6 in Monday-based week
    const mondayBasedDay = slot.day_of_week === 0 ? 6 : slot.day_of_week - 1;
    targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + mondayBasedDay);
  }

  const [sh, sm] = slot.start_time.split(":").map(Number);
  const [eh, em] = slot.end_time.split(":").map(Number);

  const start = new Date(targetDate);
  start.setHours(sh, sm, 0, 0);

  const end = new Date(targetDate);
  end.setHours(eh, em, 0, 0);

  const color = getSubjectColor(slot.subject_category);

  // Determine event status and add status indicator
  const hasSubstitute = !!slot.substitute_teacher_id;
  const hasExchange = !!slot.exchange_request_id;
  const status = getEventStatus(targetDate, slot.start_time, slot.end_time, hasSubstitute, hasExchange, feedbackInfo);

  const baseTitle = slot.subject_name || "Môn học";
  const statusIndicator = getStatusIndicator(status);

  return {
    id: slot.id || `temp-${Date.now()}`,
    title: baseTitle,
    description: (() => {
      const timeInfo = `${slot.start_time} - ${slot.end_time}`;
      const statusInfo = `Trạng thái: ${statusIndicator.label}`;
      const teacherInfo = `Giáo viên: ${slot.teacher_name || "Chưa xác định"}`;
      const roomInfo = `Phòng: ${slot.classroom_name || "Chưa xác định"}`;
      const notesInfo = slot.notes ? `\nGhi chú: ${slot.notes}` : "";
      return `${timeInfo}\n${statusInfo}\n${teacherInfo}\n${roomInfo}${notesInfo}`;
    })(),
    status: statusIndicator.label,
    statusColor: statusIndicator.color,
    statusBgColor: statusIndicator.bgColor,
    start,
    end,
    allDay: false,
    color,
    location: slot.classroom_name || "TBD",
  };
}


