"use client";

import { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { z } from "zod";

import {
  type CalendarEvent,
  EventCalendar,
  type EventColor,
} from "@/components/event-calendar";
import { useCalendarContext } from "@/components/event-calendar/calendar-context";
import { TimetableFilters, type TimetableFilters as TimetableFiltersType } from "./timetable-calendar/timetable-filters";
import {
  StudySlotDialog,
  type StudySlot,
  type Subject,
  type Teacher,
  type Classroom,
  type TeacherAssignment
} from "./timetable-calendar/study-slot-dialog";
import {
  createStudySlotAction,
  updateStudySlotAction,
  deleteStudySlotAction,
  getStudySlotDropdownData,
} from "@/lib/actions/study-slot-actions";
import { getTimetableEventsAction } from "@/lib/actions/timetable-actions";

// Map subject categories to colors
const getSubjectColor = (subjectCategory: string): EventColor => {
  const categoryMap: Record<string, EventColor> = {
    'math': 'blue',
    'science': 'blue',
    'language': 'emerald',
    'literature': 'emerald',
    'social_studies': 'orange',
    'history': 'orange',
    'geography': 'orange',
    'arts': 'violet',
    'physical_education': 'violet',
    'music': 'violet',
    'elective': 'rose',
    'technology': 'rose',
  };
  
  return categoryMap[subjectCategory.toLowerCase()] || 'blue';
};

// Convert StudySlot to CalendarEvent for display
function studySlotToCalendarEvent(slot: StudySlot & {
  subject_code?: string;
  subject_name?: string;
  subject_category?: string;
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

  // Determine color based on subject category
  const color = getSubjectColor(slot.subject_category || 'elective');

  return {
    id: slot.id || `temp-${Date.now()}`,
    title: `${slot.subject_code || 'Subject'} - ${slot.subject_name || ''}`,
    description: `Teacher: ${slot.teacher_name || 'TBD'}\nRoom: ${slot.classroom_name || 'TBD'}${slot.notes ? `\nNotes: ${slot.notes}` : ''}`,
    start: startDate,
    end: endDate,
    allDay: false,
    color: color,
    location: slot.classroom_name || 'TBD',
  };
}

// UUID validation function using Zod
const isValidUUID = (value: string): boolean => {
  if (!value || value === "") return false;
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

export default function TimetableBigCalendar() {
  const { currentDate, isColorVisible } = useCalendarContext();
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

  // Filter events based on visible colors
  const visibleEvents = useMemo(() => {
    return events.filter((event) => isColorVisible(event.color));
  }, [events, isColorVisible]);

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

  const handleEventAdd = async (event: CalendarEvent) => {
    if (!hasValidFilters(filters)) {
      toast.error("Please select valid class, semester, and week first");
      return;
    }

    const newSlot: StudySlot = {
      class_id: filters.classId!,
      subject_id: "", // Will be set in dialog
      teacher_id: "", // Will be set in dialog
      classroom_id: "", // Will be set in dialog
      semester_id: filters.semesterId!,
      day_of_week: event.start.getDay(),
      start_time: format(event.start, "HH:mm"),
      end_time: format(event.end, "HH:mm"),
      week_number: filters.studyWeek!,
      notes: "",
    };

    setSelectedSlot(newSlot);
    setIsDialogOpen(true);
  };

  const handleEventUpdate = async (event: CalendarEvent) => {
    const slot = studySlots.find(s => s.id === event.id);
    if (!slot || !slot.id) return;

    const updatedSlot = {
      id: slot.id,
      day_of_week: event.start.getDay(),
      start_time: format(event.start, "HH:mm"),
      end_time: format(event.end, "HH:mm"),
      // Include all required fields to avoid constraint violations
      classroom_id: slot.classroom_id,
      teacher_id: slot.teacher_id,
      semester_id: slot.semester_id,
      week_number: slot.week_number,
      class_id: slot.class_id,
      subject_id: slot.subject_id,
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

  const handleEventDelete = async (eventId: string) => {
    try {
      const result = await deleteStudySlotAction(eventId);
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

  // Event selection is handled through the EventDialog component

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

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Filters */}
      <TimetableFilters
        filters={filters}
        onFiltersChange={setFilters}
        loading={isLoading}
        onRefresh={() => {
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

      {/* Calendar with New Study Slot Button */}
      <div className="flex-1">
        <div className="flex-1 rounded-lg border bg-card">
          <div className="flex flex-col h-full">
            {/* Calendar Header with New Study Slot Button */}
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
              </div>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 p-2 sm:p-4">
              <EventCalendar
                events={visibleEvents}
                onEventAdd={handleEventAdd}
                onEventUpdate={handleEventUpdate}
                onEventDelete={handleEventDelete}
                initialView="week"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Study Slot Dialog */}
      <StudySlotDialog
        slot={selectedSlot}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedSlot(null);
        }}
        onSave={handleSlotSave}
        onDelete={handleEventDelete}
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
