import { CalendarEvent, EventColor } from "@/components/event-calendar/types";
import { TimetableEventDetailed } from "@/lib/actions/timetable-actions";
import { format, addWeeks, startOfWeek } from "date-fns";

/**
 * Maps a TimetableEvent to CalendarEvent format for the calendar component
 */
export function mapTimetableToCalendarEvent(
  timetableEvent: TimetableEventDetailed,
  weekStartDate: Date
): CalendarEvent {
  // Calculate the actual date for this event based on day_of_week and week start
  const eventDate = new Date(weekStartDate);
  
  // Adjust for day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOffset = timetableEvent.day_of_week === 0 ? 6 : timetableEvent.day_of_week - 1;
  eventDate.setDate(eventDate.getDate() + dayOffset);
  
  // Parse start and end times
  const [startHour, startMinute] = timetableEvent.start_time.split(':').map(Number);
  const [endHour, endMinute] = timetableEvent.end_time.split(':').map(Number);
  
  // Create start and end Date objects
  const startDateTime = new Date(eventDate);
  startDateTime.setHours(startHour, startMinute, 0, 0);
  
  const endDateTime = new Date(eventDate);
  endDateTime.setHours(endHour, endMinute, 0, 0);
  
  return {
    id: timetableEvent.id,
    title: `${timetableEvent.class_name} - ${timetableEvent.subject_code}`,
    description: (() => {
      const teacherInfo = `Teacher: ${timetableEvent.teacher_name}`
      const classroomInfo = `Classroom: ${timetableEvent.classroom_name}`
      const notesInfo = timetableEvent.notes ? `\nNotes: ${timetableEvent.notes}` : ''
      return `${teacherInfo}\n${classroomInfo}${notesInfo}`
    })(),
    start: startDateTime,
    end: endDateTime,
    color: getSubjectColor(timetableEvent.subject_code),
    location: timetableEvent.classroom_name,
    // Timetable-specific properties
    subject_code: timetableEvent.subject_code,
    teacher_name: timetableEvent.teacher_name,
    classroom_name: timetableEvent.classroom_name,
    class_name: timetableEvent.class_name,
  };
}

/**
 * Maps multiple TimetableEvents to CalendarEvents for a specific week
 */
export function mapTimetableEventsToCalendar(
  timetableEvents: TimetableEventDetailed[],
  weekNumber: number,
  semesterStartDate: Date
): CalendarEvent[] {
  // Calculate the start date of the specified week
  const semesterWeekStart = startOfWeek(semesterStartDate, { weekStartsOn: 1 }); // Monday
  const weekStartDate = addWeeks(semesterWeekStart, weekNumber - 1);
  
  return timetableEvents.map(event => 
    mapTimetableToCalendarEvent(event, weekStartDate)
  );
}

/**
 * Maps a CalendarEvent back to TimetableEvent format for saving
 */
export function mapCalendarToTimetableEvent(
  calendarEvent: CalendarEvent,
  classId: string,
  subjectId: string,
  teacherId: string,
  classroomId: string,
  semesterId: string,
  weekNumber: number
): Partial<TimetableEventDetailed> {
  // Calculate day of week (convert from Sunday=0 to Monday=1 format)
  const dayOfWeek = calendarEvent.start.getDay();
  const adjustedDayOfWeek = dayOfWeek === 0 ? 0 : dayOfWeek; // Keep Sunday as 0, Monday as 1, etc.
  
  return {
    id: calendarEvent.id === `event-${Date.now()}` ? undefined : calendarEvent.id,
    class_id: classId,
    subject_id: subjectId,
    teacher_id: teacherId,
    classroom_id: classroomId,
    semester_id: semesterId,
    day_of_week: adjustedDayOfWeek,
    start_time: format(calendarEvent.start, 'HH:mm'),
    end_time: format(calendarEvent.end, 'HH:mm'),
    week_number: weekNumber,
    notes: calendarEvent.description?.split('\n').find(line => line.startsWith('Notes:'))?.replace('Notes: ', '') || '',
  };
}

/**
 * Get color for a subject based on subject code
 */
export function getSubjectColor(subjectCode: string): EventColor {
  // Hash the subject code to get a consistent color
  const colors: EventColor[] = ['blue', 'orange', 'violet', 'rose', 'emerald'];
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < subjectCode.length; i++) {
    const char = subjectCode.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get the week start date for a given semester and week number
 */
export function getWeekStartDate(semesterStartDate: Date, weekNumber: number): Date {
  const semesterWeekStart = startOfWeek(semesterStartDate, { weekStartsOn: 1 });
  return addWeeks(semesterWeekStart, weekNumber - 1);
}

/**
 * Calculate which week number a date falls in within a semester
 */
export function getWeekNumberFromDate(date: Date, semesterStartDate: Date): number {
  const semesterWeekStart = startOfWeek(semesterStartDate, { weekStartsOn: 1 });
  const targetWeekStart = startOfWeek(date, { weekStartsOn: 1 });
  
  const diffInWeeks = Math.floor((targetWeekStart.getTime() - semesterWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return Math.max(1, diffInWeeks + 1);
}

/**
 * Format time for display in 12-hour format
 */
export function formatTimeDisplay(time: string): string {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = (() => {
    if (hour === 0) return 12
    return hour > 12 ? hour - 12 : hour
  })()
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
}

/**
 * Calculate end time by adding minutes to start time
 */
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hour, minute] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hour, minute, 0, 0);
  
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return format(endDate, 'HH:mm');
}
