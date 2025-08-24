"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";

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

// Exchange request components removed

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
import { getEventStatus, getStatusIndicator } from "@/features/timetable/utils/status-indicators";
import { StatusLegend } from "@/features/timetable/components/status-legend";
import { getBatchFeedbackInfo, type FeedbackInfo } from "@/features/timetable/utils/feedback-status";

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
  const { currentDate, setCurrentDate, isColorVisible } = useCalendarContext();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timetableEventsMap, setTimetableEventsMap] = useState<Map<string, TeacherTimetableEvent>>(new Map());
  const [feedbackInfoMap, setFeedbackInfoMap] = useState<Map<string, FeedbackInfo>>(new Map());
  const [isLoading, setIsLoading] = useState(false);

  // Initialize filters from URL - Context7 pattern
  const [filters, setFilters] = useState<TeacherTimetableFiltersType>(() => ({
    academicYearId: searchParams.get('academicYearId') || undefined,
    semesterId: searchParams.get('semesterId') || undefined,
    studyWeek: searchParams.get('studyWeek') ? parseInt(searchParams.get('studyWeek')!) : undefined,
  }));

  // Helper function to update URL with new filters - Context7 pattern
  const updateURLWithFilters = useCallback(
    (newFilters: TeacherTimetableFiltersType) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update or remove parameters based on filter values
      if (newFilters.academicYearId) {
        params.set('academicYearId', newFilters.academicYearId);
      } else {
        params.delete('academicYearId');
      }

      if (newFilters.semesterId) {
        params.set('semesterId', newFilters.semesterId);
      } else {
        params.delete('semesterId');
      }

      if (newFilters.studyWeek) {
        params.set('studyWeek', newFilters.studyWeek.toString());
      } else {
        params.delete('studyWeek');
      }

      // Use replaceState to avoid adding to history stack - Context7 pattern
      const newURL = `${pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newURL);
    },
    [searchParams, pathname]
  );

  // Dialog state
  const [selectedEvent, setSelectedEvent] = useState<TeacherTimetableEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

// Exchange request state removed

  const supabase = createClient();

  // Update currentDate when week filter changes
  useEffect(() => {
    const updateCurrentDateForWeek = async () => {
      if (filters.studyWeek && filters.semesterId) {
        try {
          // Get semester start date
          const { data: semesterData, error } = await supabase
            .from('semesters')
            .select('start_date')
            .eq('id', filters.semesterId)
            .single();

          if (semesterData && !error) {
            const semesterStart = new Date(semesterData.start_date);
            // Calculate the start of the selected week
            const weekOffset = (filters.studyWeek - 1) * 7;
            const selectedWeekStart = new Date(semesterStart);
            selectedWeekStart.setDate(selectedWeekStart.getDate() + weekOffset);

            // Set currentDate to the middle of the selected week (Wednesday)
            const selectedWeekMiddle = new Date(selectedWeekStart);
            selectedWeekMiddle.setDate(selectedWeekMiddle.getDate() + 2); // Wednesday

            setCurrentDate(selectedWeekMiddle);
          }
        } catch (error) {
          console.error('Error updating current date for week:', error);
        }
      }
    };

    updateCurrentDateForWeek();
  }, [filters.studyWeek, filters.semesterId, setCurrentDate, supabase]);

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

    // Determine event status and add status indicator with feedback info
    const feedbackInfo = feedbackInfoMap.get(event.id);
    const status = getEventStatus(eventDate, event.start_time, event.end_time, feedbackInfo);

    const baseTitle = `${event.subject_name || 'Không xác định'} - ${event.class_name || 'Không xác định'}`;
    const statusIndicator = getStatusIndicator(status);
    const color = getTeacherEventColor();

    return {
      id: event.id,
      title: baseTitle,
      description: (() => {
        const statusInfo = `Trạng thái: ${statusIndicator.label}`
        const roomInfo = `Phòng học: ${event.classroom_name || 'Chưa xác định'}`
        const notesInfo = event.notes ? `\nGhi chú: ${event.notes}` : ''
        return `${statusInfo}\n${roomInfo}${notesInfo}`
      })(),
      status: statusIndicator.label,
      statusColor: statusIndicator.color,
      statusBgColor: statusIndicator.bgColor,
      start: startTime,
      end: endTime,
      color: color,
      location: event.classroom_name || 'Chưa xác định',
      originalEvent: event, // Store original timetable event for dialog
    };
  }, [currentDate, feedbackInfoMap]);

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

        // Load feedback information for all events
        const eventIds = timetableEvents.map(event => event.id);
        const classIds = timetableEvents.map(event => event.class_id);

        try {
          const feedbackMap = await getBatchFeedbackInfo(eventIds, classIds);
          setFeedbackInfoMap(feedbackMap);
        } catch (error) {
          console.error("Error loading feedback info:", error);
          setFeedbackInfoMap(new Map());
        }

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
        setFeedbackInfoMap(new Map());
      }
    } catch (error) {
      console.error("Error loading timetable events:", error);
      toast.error("Không thể tải lịch giảng dạy");
      setEvents([]);
      setTimetableEventsMap(new Map());
      setFeedbackInfoMap(new Map());
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
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex-1">
            <TeacherTimetableFilters
              filters={filters}
              onFiltersChange={(newFilters) => {
                setFilters(newFilters);
                updateURLWithFilters(newFilters);
              }}
              loading={isLoading}
              onRefresh={() => {
                if (hasValidFilters(filters)) {
                  loadTimetableEvents();
                }
              }}
            />
          </div>
          <StatusLegend />
        </div>

        {/* Exchange request actions removed */}
      </div>

      {/* Calendar */}
      <div className="flex-1">
        <EventCalendar
          events={visibleEvents}
          onSelectEvent={handleEventSelect}
          initialView="week"
        />
      </div>

      {/* Exchange requests list removed */}

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
