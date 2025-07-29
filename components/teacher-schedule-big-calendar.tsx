"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";

import {
  type CalendarEvent,
  EventCalendar,
  type EventColor,
} from "@/components/event-calendar";
import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import { TeacherTimetableFilters, type TeacherTimetableFilters as TeacherTimetableFiltersType } from "./teacher-timetable/teacher-timetable-filters";
import {
  TeacherTimetableEventDialog,
  type TeacherTimetableEvent,
} from "./teacher-timetable/teacher-timetable-event-dialog";
import { getTeacherScheduleAction } from "@/lib/actions/teacher-schedule-actions";
import { useAuth } from "@/hooks/use-auth";

// Map teacher event types to colors
const getTeacherEventColor = (): EventColor => {
  // For now, use blue for all teacher events
  // This can be enhanced later to categorize by subject, feedback status, etc.
  return 'blue';
};

// Helper function to check if a string is a valid UUID
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Helper function to check if filters are valid for loading events
function hasValidFilters(filters: TeacherTimetableFiltersType): boolean {
  return !!(
    filters.semesterId &&
    filters.studyWeek &&
    isValidUUID(filters.semesterId)
  );
}

export default function TeacherScheduleBigCalendar() {
  const { user } = useAuth();
  const { currentDate, isColorVisible } = useCalendarContext();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [, setTimetableEventsMap] = useState<Map<string, TeacherTimetableEvent>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<TeacherTimetableFiltersType>({
    academicYearId: undefined,
    semesterId: undefined,
    studyWeek: undefined,
  });

  // Dialog state
  const [selectedEvent, setSelectedEvent] = useState<TeacherTimetableEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Convert timetable event to calendar event
  const timetableEventToCalendarEvent = useCallback((event: TeacherTimetableEvent): CalendarEvent => {
    const eventDate = new Date(currentDate);
    eventDate.setDate(eventDate.getDate() - eventDate.getDay() + event.day_of_week);

    const [startHour, startMinute] = event.start_time.split(':').map(Number);
    const [endHour, endMinute] = event.end_time.split(':').map(Number);

    const startTime = new Date(eventDate);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(eventDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    const title = `${event.subject_name || 'Unknown'} - ${event.class_name || 'Unknown'}`;
    const color = getTeacherEventColor();

    return {
      id: event.id,
      title: title,
      description: `Room: ${event.classroom_name || 'TBD'}${event.notes ? `\nNotes: ${event.notes}` : ''}`,
      start: startTime,
      end: endTime,
      color: color,
      location: event.classroom_name || 'TBD',
    };
  }, [currentDate]);

  // Filter events based on visible colors
  const visibleEvents = useMemo(() => {
    return events.filter((event) => isColorVisible(event.color));
  }, [events, isColorVisible]);

  // Load timetable events
  const loadTimetableEvents = useCallback(async () => {
    if (!hasValidFilters(filters) || !user) {
      setEvents([]);
      setTimetableEventsMap(new Map());
      return;
    }

    setIsLoading(true);
    try {
      const result = await getTeacherScheduleAction({
        semester_id: filters.semesterId!,
        week_number: filters.studyWeek!,
      });

      if (result.success && result.data) {
        const timetableEvents = result.data as TeacherTimetableEvent[];

        if (!Array.isArray(timetableEvents)) {
          throw new Error("Invalid timetable events data");
        }

        // Store events in map for easy access
        const eventsMap = new Map<string, TeacherTimetableEvent>();
        timetableEvents.forEach(event => {
          if (event && event.id) {
            eventsMap.set(event.id, event);
          }
        });
        setTimetableEventsMap(eventsMap);

        // Convert to calendar events for display with additional safety checks
        const calendarEvents = timetableEvents
          .filter(event => event && event.id && event.subject_name && event.class_name)
          .map(event => {
            try {
              return timetableEventToCalendarEvent(event);
            } catch (error) {
              console.error("Error converting event to calendar event:", error, event);
              return null;
            }
          })
          .filter(event => event !== null);

        setEvents(calendarEvents);
      } else {
        toast.error("Không thể tải lịch giảng dạy");
        setEvents([]);
        setTimetableEventsMap(new Map());
      }
    } catch (error) {
      console.error("Error loading timetable events:", error);
      toast.error("Không thể tải lịch giảng dạy");
      setEvents([]);
      setTimetableEventsMap(new Map());
    } finally {
      setIsLoading(false);
    }
  }, [filters, user, timetableEventToCalendarEvent]);

  // Load events when filters change
  useEffect(() => {
    loadTimetableEvents();
  }, [loadTimetableEvents]);

  // Event selection is handled through the EventDialog component

  // Handle event creation (disabled for teachers)
  const handleEventAdd = useCallback(() => {
    toast.info("Chỉ quản trị viên mới có thể tạo lịch giảng dạy mới");
  }, []);

  // Handle event update (disabled for teachers)
  const handleEventUpdate = useCallback(() => {
    toast.info("Chỉ quản trị viên mới có thể chỉnh sửa lịch giảng dạy");
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Filters */}
      <TeacherTimetableFilters
        filters={filters}
        onFiltersChange={setFilters}
        loading={isLoading}
        onRefresh={() => {
          if (hasValidFilters(filters)) {
            loadTimetableEvents();
          }
        }}
      />

      {/* Calendar */}
      <div className="flex-1">
        <EventCalendar
          events={visibleEvents}
          onEventAdd={handleEventAdd}
          onEventUpdate={handleEventUpdate}
          initialView="week"
        />
      </div>

      {/* Event Dialog (View Only) */}
      <TeacherTimetableEventDialog
        event={selectedEvent}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
}
