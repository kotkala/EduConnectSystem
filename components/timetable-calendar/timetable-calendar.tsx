"use client";

import { useState, useEffect } from "react";
import { format, addMinutes } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { z } from "zod";

import {
  type CalendarEvent,
  CalendarDndProvider,
  MonthView,
  WeekView,
  DayView,
  type CalendarView,
} from "@/components/event-calendar";
import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import { TimetableFilters, type TimetableFilters as TimetableFiltersType } from "./timetable-filters";
import {
  StudySlotDialog,
  type StudySlot,
  type Subject,
  type Teacher,
  type Classroom,
  type TeacherAssignment
} from "./study-slot-dialog";
import {
  createStudySlotAction,
  updateStudySlotAction,
  deleteStudySlotAction,
  getStudySlotDropdownData,
} from "@/lib/actions/study-slot-actions";
import { getTimetableEventsAction } from "@/lib/actions/timetable-actions";

// Convert StudySlot to CalendarEvent for display
function studySlotToCalendarEvent(slot: StudySlot & {
  subject_code?: string;
  subject_name?: string;
  teacher_name?: string;
  classroom_name?: string;
}): CalendarEvent {
  // Create a date for the slot based on day_of_week and week_number
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
  
  // Calculate the target date based on day_of_week
  const targetDate = new Date(currentWeekStart);
  targetDate.setDate(currentWeekStart.getDate() + slot.day_of_week);
  
  // Parse start and end times
  const [startHours, startMinutes] = slot.start_time.split(':').map(Number);
  const [endHours, endMinutes] = slot.end_time.split(':').map(Number);
  
  const startDate = new Date(targetDate);
  startDate.setHours(startHours, startMinutes, 0, 0);
  
  const endDate = new Date(targetDate);
  endDate.setHours(endHours, endMinutes, 0, 0);

  return {
    id: slot.id || `temp-${Date.now()}`,
    title: `${slot.subject_code || 'Subject'} - ${slot.subject_name || ''}`,
    description: `Teacher: ${slot.teacher_name || 'TBD'}\nRoom: ${slot.classroom_name || 'TBD'}${slot.notes ? `\nNotes: ${slot.notes}` : ''}`,
    start: startDate,
    end: endDate,
    allDay: false,
    color: "blue", // Default color for study slots
    location: slot.classroom_name || 'TBD',
  };
}

// UUID validation function using Zod
const isValidUUID = (value: string): boolean => {
  if (!value || value === "") return false; // Empty string is not valid
  try {
    z.string().uuid().parse(value);
    return true;
  } catch {
    return false;
  }
};

// Check if filter has valid values for creating study slots
const hasValidFilters = (filters: TimetableFiltersType): boolean => {
  return !!(
    filters.classId &&
    filters.semesterId &&
    filters.studyWeek &&
    isValidUUID(filters.classId) &&
    isValidUUID(filters.semesterId)
  );
};

export default function TimetableCalendar() {
  const { currentDate } = useCalendarContext();
  const [view, setView] = useState<CalendarView>("week");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [studySlots, setStudySlots] = useState<StudySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<StudySlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState<TimetableFiltersType>({
    academicYearId: "",
    semesterId: "",
    gradeLevel: "",
    classId: "",
    studyWeek: 1,
  });

  // Dropdown data
  const [dropdownData, setDropdownData] = useState<{
    subjects: Subject[];
    teachers: Teacher[];
    classrooms: Classroom[];
    teacherAssignments: TeacherAssignment[];
  }>({
    subjects: [],
    teachers: [],
    classrooms: [],
    teacherAssignments: [],
  });

  // Load dropdown data on mount
  useEffect(() => {
    const loadDropdownData = async () => {
      const result = await getStudySlotDropdownData();
      if (result.success && result.data) {
        setDropdownData(result.data);
      } else {
        toast.error("Failed to load dropdown data");
      }
    };

    loadDropdownData();
  }, []);

  // Load timetable events when filters change
  useEffect(() => {
    const loadTimetableEvents = async () => {
      // Validate that we have proper UUIDs before making API calls
      if (!filters.classId || !filters.semesterId || !filters.studyWeek ||
          !isValidUUID(filters.classId) || !isValidUUID(filters.semesterId)) {
        setEvents([]);
        setStudySlots([]);
        return;
      }

      setIsLoading(true);
      try {
        const result = await getTimetableEventsAction({
          class_id: filters.classId,
          semester_id: filters.semesterId,
          week_number: filters.studyWeek,
        });

        if (result.success && result.data) {
          const slots = result.data as StudySlot[];
          setStudySlots(slots);
          
          // Convert to calendar events for display
          const calendarEvents = slots.map(slot => studySlotToCalendarEvent(slot));
          setEvents(calendarEvents);
        } else {
          toast.error("Failed to load timetable events");
          setEvents([]);
          setStudySlots([]);
        }
      } catch (error) {
        console.error("Error loading timetable events:", error);
        toast.error("Failed to load timetable events");
        setEvents([]);
        setStudySlots([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimetableEvents();
  }, [filters.classId, filters.semesterId, filters.studyWeek]);

  // Convert CalendarEvent back to StudySlot for editing
  const calendarEventToStudySlot = (event: CalendarEvent): StudySlot | null => {
    const existingSlot = studySlots.find(slot => slot.id === event.id);
    if (existingSlot) {
      return existingSlot;
    }
    return null;
  };

  const handleCellClick = (date: Date) => {
    if (!hasValidFilters(filters)) {
      toast.error("Please select valid class, semester, and week first");
      return;
    }

    // Create a new study slot from the clicked date
    const newSlot: StudySlot = {
      class_id: filters.classId!,
      subject_id: "", // Will be set in dialog
      teacher_id: "", // Will be set in dialog
      classroom_id: "", // Will be set in dialog
      semester_id: filters.semesterId!,
      day_of_week: date.getDay(),
      start_time: format(date, "HH:mm"),
      end_time: format(addMinutes(date, 45), "HH:mm"), // Default 45 minutes
      week_number: filters.studyWeek!,
      notes: "",
    };

    setSelectedSlot(newSlot);
    setIsDialogOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    const slot = calendarEventToStudySlot(event);
    if (slot) {
      setSelectedSlot(slot);
      setIsDialogOpen(true);
    }
  };



  const handleEventUpdate = async (event: CalendarEvent) => {
    // This is handled through drag and drop
    const slot = calendarEventToStudySlot(event);
    if (!slot || !slot.id) return;

    const updatedSlot = {
      id: slot.id,
      day_of_week: event.start.getDay(),
      start_time: format(event.start, "HH:mm"),
      end_time: format(event.end, "HH:mm"),
    };

    try {
      const result = await updateStudySlotAction(updatedSlot);
      if (result.success) {
        toast.success("Study slot updated successfully");
        // Reload events
        const reloadResult = await getTimetableEventsAction({
          class_id: filters.classId,
          semester_id: filters.semesterId,
          week_number: filters.studyWeek,
        });
        
        if (reloadResult.success && reloadResult.data) {
          const slots = reloadResult.data as StudySlot[];
          setStudySlots(slots);
          const calendarEvents = slots.map(slot => studySlotToCalendarEvent(slot));
          setEvents(calendarEvents);
        }
      } else {
        toast.error(result.error || "Failed to update study slot");
      }
    } catch (error) {
      console.error("Error updating study slot:", error);
      toast.error("Failed to update study slot");
    }
  };

  const handleSlotSave = async (slot: StudySlot) => {
    try {
      let result;
      if (slot.id) {
        result = await updateStudySlotAction({ ...slot, id: slot.id });
      } else {
        result = await createStudySlotAction(slot);
      }

      if (result.success) {
        toast.success(slot.id ? "Study slot updated successfully" : "Study slot created successfully");
        setIsDialogOpen(false);
        setSelectedSlot(null);
        
        // Reload events
        const reloadResult = await getTimetableEventsAction({
          class_id: filters.classId,
          semester_id: filters.semesterId,
          week_number: filters.studyWeek,
        });
        
        if (reloadResult.success && reloadResult.data) {
          const slots = reloadResult.data as StudySlot[];
          setStudySlots(slots);
          const calendarEvents = slots.map(slot => studySlotToCalendarEvent(slot));
          setEvents(calendarEvents);
        }
      } else {
        toast.error(result.error || "Failed to save study slot");
      }
    } catch (error) {
      console.error("Error saving study slot:", error);
      toast.error("Failed to save study slot");
    }
  };

  const handleSlotDelete = async (slotId: string) => {
    try {
      const result = await deleteStudySlotAction(slotId);
      if (result.success) {
        toast.success("Study slot deleted successfully");
        setIsDialogOpen(false);
        setSelectedSlot(null);
        
        // Reload events
        const reloadResult = await getTimetableEventsAction({
          class_id: filters.classId,
          semester_id: filters.semesterId,
          week_number: filters.studyWeek,
        });
        
        if (reloadResult.success && reloadResult.data) {
          const slots = reloadResult.data as StudySlot[];
          setStudySlots(slots);
          const calendarEvents = slots.map(slot => studySlotToCalendarEvent(slot));
          setEvents(calendarEvents);
        }
      } else {
        toast.error(result.error || "Failed to delete study slot");
      }
    } catch (error) {
      console.error("Error deleting study slot:", error);
      toast.error("Failed to delete study slot");
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedSlot(null);
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Filters */}
      <TimetableFilters
        filters={filters}
        onFiltersChange={setFilters}
        loading={isLoading}
        onRefresh={() => {
          // Reload events when refresh is clicked
          if (filters.classId && filters.semesterId && filters.studyWeek &&
              isValidUUID(filters.classId) && isValidUUID(filters.semesterId)) {
            const loadEvents = async () => {
              const result = await getTimetableEventsAction({
                class_id: filters.classId!,
                semester_id: filters.semesterId!,
                week_number: filters.studyWeek!,
              });
              if (result.success && result.data) {
                const slots = result.data as StudySlot[];
                setStudySlots(slots);
                const calendarEvents = slots.map(slot => studySlotToCalendarEvent(slot));
                setEvents(calendarEvents);
              }
            };
            loadEvents();
          }
        }}
      />

      {/* Calendar */}
      <div className="flex-1">
        <CalendarDndProvider onEventUpdate={handleEventUpdate}>
          <div className="flex-1 rounded-lg border bg-card">
            <div className="flex flex-col h-full">
              {/* Calendar Header */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border-b">
                <h2 className="text-base sm:text-lg font-semibold">Timetable</h2>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!hasValidFilters(filters)) {
                        toast.error("Please select valid class, semester, and week first");
                        return;
                      }

                      // Create a new study slot with current date
                      const newSlot: StudySlot = {
                        class_id: filters.classId!,
                        subject_id: "", // Will be set in dialog
                        teacher_id: "", // Will be set in dialog
                        classroom_id: "", // Will be set in dialog
                        semester_id: filters.semesterId!,
                        day_of_week: currentDate.getDay(),
                        start_time: "08:00",
                        end_time: "08:45", // Default 45 minutes
                        week_number: filters.studyWeek!,
                        notes: "",
                      };

                      setSelectedSlot(newSlot);
                      setIsDialogOpen(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <span className="hidden sm:inline">New Study Slot</span>
                    <span className="sm:hidden">Add Slot</span>
                  </Button>
                  <select
                    value={view}
                    onChange={(e) => setView(e.target.value as CalendarView)}
                    className="px-3 py-1 border rounded w-full sm:w-auto"
                  >
                    <option value="week">Week</option>
                    <option value="day">Day</option>
                    <option value="month">Month</option>
                  </select>
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

      {/* Study Slot Dialog */}
      <StudySlotDialog
        slot={selectedSlot}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSave={handleSlotSave}
        onDelete={handleSlotDelete}
        classId={filters.classId}
        semesterId={filters.semesterId}
        weekNumber={filters.studyWeek}
        subjects={dropdownData.subjects}
        teachers={dropdownData.teachers}
        classrooms={dropdownData.classrooms}
        teacherAssignments={dropdownData.teacherAssignments}
      />
    </div>
  );
}
