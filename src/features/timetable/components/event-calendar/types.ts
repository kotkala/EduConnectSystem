export type CalendarView = "month" | "week" | "day" | "agenda";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: EventColor;
  label?: string;
  location?: string;
  // Timetable-specific properties
  subject_code?: string;
  teacher_name?: string;
  classroom_name?: string;
  class_name?: string;
  // Store original event data for dialogs
  originalEvent?: unknown;
}

export type EventColor = "blue" | "orange" | "violet" | "rose" | "emerald";
