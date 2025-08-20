"use client";

import { useState, useEffect, useRef } from "react";
import { format, addMinutes } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";


import {
  type CalendarEvent,
  CalendarDndProvider,
  MonthView,
  WeekView,
  DayView,
  type CalendarView,
} from "@/shared/components/calendar";
import { useCalendarContext } from "@/shared/components/calendar";
import { CalendarNavigationButtons } from "@/shared/components/shared/calendar-navigation";
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
import { studySlotToCalendarEvent } from "@/shared/components/calendar/mappers";

// UUID validation function using Zod
const isValidUUID = (value: string): boolean => {
  if (!value || value === "") return false; // Empty string is not valid
  // UUID v4 regex pattern
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
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
  // Load timetable events when filters change with guard + debounce + request cancel
  const requestIdRef = useRef(0)
  useEffect(() => {
    if (!filters.classId || !filters.semesterId || !filters.studyWeek ||
        !isValidUUID(filters.classId) || !isValidUUID(filters.semesterId)) {
      setEvents([])
      setStudySlots([])
      return
    }

    const currentId = ++requestIdRef.current
    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const result = await getTimetableEventsAction({
          class_id: filters.classId!,
          semester_id: filters.semesterId!,
          week_number: filters.studyWeek!,
        })

        if (currentId !== requestIdRef.current) return

        if (result.success && result.data) {
          const slots = result.data as StudySlot[]
          setStudySlots(slots)
          const calendarEvents = slots.map(slot => studySlotToCalendarEvent(slot))
          setEvents(calendarEvents)
        } else {
          toast.error("Failed to load timetable events")
          setEvents([])
          setStudySlots([])
        }
      } catch (error) {
        if (currentId === requestIdRef.current) {
          console.error("Error loading timetable events:", error)
          toast.error("Failed to load timetable events")
          setEvents([])
          setStudySlots([])
        }
      } finally {
        if (currentId === requestIdRef.current) setIsLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [filters.classId, filters.semesterId, filters.studyWeek])

  // Navigation functions to sync with study week filter
  const navigatePrevious = () => {
    if (!filters.studyWeek) return;

    const newWeek = Math.max(1, filters.studyWeek - 1);
    if (newWeek !== filters.studyWeek) {
      setFilters(prev => ({ ...prev, studyWeek: newWeek }));
    }
  };

  const navigateNext = () => {
    if (!filters.studyWeek) return;

    // Calculate max weeks based on semester (default to 18 for semester 1, 17 for semester 2)
    const maxWeeks = 18; // Default fallback
    const newWeek = Math.min(maxWeeks, filters.studyWeek + 1);
    if (newWeek !== filters.studyWeek) {
      setFilters(prev => ({ ...prev, studyWeek: newWeek }));
    }
  };

  const navigateToday = () => {
    // For timetable, "today" means go to current week (week 1)
    if (filters.studyWeek !== 1) {
      setFilters(prev => ({ ...prev, studyWeek: 1 }));
    }
  };

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
    if (!slot?.id) return;

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
                  {/* Navigation Buttons */}
                  <CalendarNavigationButtons
                    onPrevious={navigatePrevious}
                    onNext={navigateNext}
                    onToday={navigateToday}
                  />
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
