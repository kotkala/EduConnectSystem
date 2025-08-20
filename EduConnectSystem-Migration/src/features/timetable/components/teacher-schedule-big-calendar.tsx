"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";

// Lazy load heavy calendar components to improve initial page load
const EventCalendar = dynamic(() => import("@/features/timetable/components/calendar").then(mod => ({ default: mod.EventCalendar })), {
  ssr: false,
  loading: () => (
    <LoadingFallback size="lg" className="flex items-center justify-center">
      <span className="sr-only">Loading calendar...</span>
    </LoadingFallback>
  )
});
import { LoadingFallback } from "@/shared/components/ui/loading-fallback"

const ExchangeRequestForm = dynamic(() => import("@/features/teacher-management/components/schedule-exchange/exchange-request-form").then(mod => ({ default: mod.ExchangeRequestForm })), {
  ssr: false,
  loading: () => <LoadingFallback size="xs" />
});

const ExchangeRequestsList = dynamic(() => import("@/features/teacher-management/components/schedule-exchange/exchange-requests-list").then(mod => ({ default: mod.ExchangeRequestsList })), {
  ssr: false,
  loading: () => <LoadingFallback size="sm" />
});

import {
  type CalendarEvent,
  type EventColor,
} from "@/features/timetable/components/calendar";
import { useCalendarContext } from "@/features/timetable/components/calendar";
import { TeacherTimetableFilters, type TeacherTimetableFilters as TeacherTimetableFiltersType } from "./teacher-timetable/teacher-timetable-filters";
import {
  TeacherTimetableEventDialog,
  type TeacherTimetableEvent,
} from "./teacher-timetable/teacher-timetable-event-dialog";
import { getTeacherScheduleAction } from "@/features/teacher-management/actions/teacher-schedule-actions";
import { useAuth } from "@/features/authentication/hooks/use-auth";

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
function hasValidFilters(filters: TeacherTimetableFiltersType): filters is TeacherTimetableFiltersType & { semesterId: string } {
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
  const [timetableEventsMap, setTimetableEventsMap] = useState<Map<string, TeacherTimetableEvent>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<TeacherTimetableFiltersType>({
    academicYearId: undefined,
    semesterId: undefined,
    studyWeek: undefined,
  });

  // Dialog state
  const [selectedEvent, setSelectedEvent] = useState<TeacherTimetableEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Exchange requests refresh trigger
  const [exchangeRefreshTrigger, setExchangeRefreshTrigger] = useState(0);

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
      description: (() => {
        const roomInfo = `Room: ${event.classroom_name || 'TBD'}`
        const notesInfo = event.notes ? `\nNotes: ${event.notes}` : ''
        return `${roomInfo}${notesInfo}`
      })(),
      start: startTime,
      end: endTime,
      color: color,
      location: event.classroom_name || 'TBD',
      originalEvent: event, // Store original timetable event for dialog
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
        semester_id: filters.semesterId,
        week_number: filters.studyWeek,
      });

      if (result.success && result.data) {
        const timetableEvents = result.data as TeacherTimetableEvent[];

        if (!Array.isArray(timetableEvents)) {
          throw new Error("Invalid timetable events data");
        }

        // Store events in map for easy access
        const eventsMap = new Map<string, TeacherTimetableEvent>();
        timetableEvents.forEach(event => {
          if (event?.id) {
            eventsMap.set(event.id, event);
          }
        });
        setTimetableEventsMap(eventsMap);

        // Convert to calendar events for display with additional safety checks
        const calendarEvents = timetableEvents
          .filter(event => event?.id && event?.subject_name && event?.class_name)
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



  // Handle event selection (open dialog)
  const handleEventSelect = useCallback((event: CalendarEvent) => {
    // Find the corresponding timetable event from the map or events array
    const timetableEventFromMap = timetableEventsMap.get(event.id);
    if (timetableEventFromMap) {
      setSelectedEvent(timetableEventFromMap);
      setIsDialogOpen(true);
      return;
    }

    // Fallback to finding from events array
    const timetableEvent = events.find(e => e.id === event.id);
    if (timetableEvent?.originalEvent) {
      setSelectedEvent(timetableEvent.originalEvent as TeacherTimetableEvent);
      setIsDialogOpen(true);
    }
  }, [events, timetableEventsMap]);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Filters and Exchange Request Button */}
      <div className="flex flex-col gap-4">
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

        {/* Exchange Request Actions */}
        {user && hasValidFilters(filters) && (
          <div className="flex justify-end">
            <ExchangeRequestForm
              teacherId={user.id}
              semesterId={filters.semesterId}
              onSuccess={() => setExchangeRefreshTrigger(prev => prev + 1)}
            />
          </div>
        )}
      </div>

      {/* Calendar */}
      <div className="flex-1">
        <EventCalendar
          events={visibleEvents}
          onSelectEvent={handleEventSelect}
          initialView="week"
        />
      </div>

      {/* Exchange Requests List */}
      {user && (
        <ExchangeRequestsList
          teacherId={user.id}
          refreshTrigger={exchangeRefreshTrigger}
        />
      )}

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
