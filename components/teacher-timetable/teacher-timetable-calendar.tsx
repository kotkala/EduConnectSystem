"use client"

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

import {
  type CalendarEvent,
  CalendarDndProvider,
  MonthView,
  WeekView,
  DayView,
  type CalendarView,
} from "@/components/event-calendar";
import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import { TeacherTimetableFilters, type TeacherTimetableFilters as TeacherTimetableFiltersType } from "./teacher-timetable-filters";
import {
  TeacherTimetableEventDialog,
  type TeacherTimetableEvent,
} from "./teacher-timetable-event-dialog";
import { getTeacherScheduleAction } from "@/lib/actions/teacher-schedule-actions";
import { useAuth } from "@/hooks/use-auth";

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

export default function TeacherTimetableCalendar() {
  const { user } = useAuth();
  const { currentDate, setCurrentDate } = useCalendarContext();
  const [view, setView] = useState<CalendarView>("week");
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

  // Convert timetable event to calendar event
  const timetableEventToCalendarEvent = useCallback((event: TeacherTimetableEvent): CalendarEvent => {
    // Get the start of the current week (Monday = 1, Sunday = 0)
    const weekStart = new Date(currentDate);
    const dayOfWeek = weekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday (0), go back 6 days to Monday
    weekStart.setDate(weekStart.getDate() + daysToMonday);

    // Calculate the event date based on day_of_week (1 = Monday, 7 = Sunday)
    const eventDate = new Date(weekStart);
    eventDate.setDate(weekStart.getDate() + (event.day_of_week - 1));

    const [startHour, startMinute] = event.start_time.split(':').map(Number);
    const [endHour, endMinute] = event.end_time.split(':').map(Number);

    const startTime = new Date(eventDate);
    startTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(eventDate);
    endTime.setHours(endHour, endMinute, 0, 0);

    // Temporarily simplify to isolate the error
    const title = `${event.subject_name || 'Unknown'} - ${event.class_name || 'Unknown'}`;

    return {
      id: event.id,
      title: title,
      start: startTime,
      end: endTime,
      color: "blue" as const, // Blue color for teacher events
    };
  }, [currentDate]);

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

        // Validate events data
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

        // Feedback completion feature temporarily disabled

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, user]);

  // Load events when filters change
  useEffect(() => {
    loadTimetableEvents();
  }, [loadTimetableEvents]);

  // Handle event click (view only for teachers)
  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (event?.id && timetableEventsMap) {
      const timetableEvent = timetableEventsMap.get(event.id);
      if (timetableEvent) {
        setSelectedEvent(timetableEvent);
        setIsDialogOpen(true);
      }
    }
  }, [timetableEventsMap]);

  // Handle cell click (disabled for teachers - they can't create events)
  const handleCellClick = useCallback(() => {
    // Teachers cannot create new events
    toast.info("Chỉ quản trị viên mới có thể tạo lịch giảng dạy mới");
  }, []);

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Filters */}
      <TeacherTimetableFilters
        filters={filters}
        onFiltersChange={setFilters}
        loading={isLoading}
        onRefresh={() => {
          // Reload events when refresh is clicked
          if (hasValidFilters(filters)) {
            loadTimetableEvents();
          }
        }}
      />

      {/* Calendar */}
      <div className="flex-1">
        <CalendarDndProvider onEventUpdate={() => {
          // Teachers cannot update events
          toast.info("Chỉ quản trị viên mới có thể chỉnh sửa lịch giảng dạy");
        }}>
          <div className="flex-1 rounded-lg border bg-card">
            <div className="flex flex-col h-full">
              {/* Calendar Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-b">
                <h2 className="text-base sm:text-lg font-semibold">Lịch Giảng Dạy Của Tôi</h2>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                  {/* View Toggle */}
                  <div className="flex rounded-md border w-full sm:w-auto">
                    <Button
                      variant={view === "day" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setView("day")}
                      className="rounded-r-none flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      Ngày
                    </Button>
                    <Button
                      variant={view === "week" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setView("week")}
                      className="rounded-none flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      Tuần
                    </Button>
                    <Button
                      variant={view === "month" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setView("month")}
                      className="rounded-l-none flex-1 sm:flex-none text-xs sm:text-sm"
                    >
                      Tháng
                    </Button>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        if (view === "day") {
                          newDate.setDate(newDate.getDate() - 1);
                        } else if (view === "week") {
                          newDate.setDate(newDate.getDate() - 7);
                        } else {
                          newDate.setMonth(newDate.getMonth() - 1);
                        }
                        setCurrentDate(newDate);
                      }}
                    >
                      ←
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentDate(new Date())}
                    >
                      Hôm nay
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newDate = new Date(currentDate);
                        if (view === "day") {
                          newDate.setDate(newDate.getDate() + 1);
                        } else if (view === "week") {
                          newDate.setDate(newDate.getDate() + 7);
                        } else {
                          newDate.setMonth(newDate.getMonth() + 1);
                        }
                        setCurrentDate(newDate);
                      }}
                    >
                      →
                    </Button>
                  </div>
                </div>
              </div>

              {/* Calendar Content */}
              <div className="flex-1 p-2 sm:p-4">
                {view === "week" && (
                  <WeekView
                    events={events}
                    currentDate={currentDate}
                    onEventSelect={handleEventClick}
                    onEventCreate={handleCellClick}
                  />
                )}
                {view === "day" && (
                  <DayView
                    events={events}
                    currentDate={currentDate}
                    onEventSelect={handleEventClick}
                    onEventCreate={handleCellClick}
                  />
                )}
                {view === "month" && (
                  <MonthView
                    events={events}
                    currentDate={currentDate}
                    onEventSelect={handleEventClick}
                    onEventCreate={handleCellClick}
                  />
                )}
              </div>
            </div>
          </div>
        </CalendarDndProvider>
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
