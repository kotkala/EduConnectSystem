"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/shared/components/ui/button";
import { createClient } from "@/lib/supabase/client";


import { type CalendarEvent } from "@/features/timetable/components/calendar";
const EventCalendar = dynamic(
  () => import("@/features/timetable/components/calendar").then((mod) => ({ default: mod.EventCalendar })),
  {
    ssr: false,
    loading: () => (
      <LoadingFallback size="lg" className="flex items-center justify-center">
        <span className="sr-only">Loading calendar...</span>
      </LoadingFallback>
    ),
  }
);
import { LoadingFallback } from "@/shared/components/ui/loading-fallback"
import { useCalendarContext } from "@/features/timetable/components/calendar";
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
import { getTimetableEventsAction } from "@/features/timetable/actions/timetable-actions";

import { studySlotToCalendarEvent } from "@/features/timetable/components/calendar/mappers";
import { StatusLegend } from "@/features/timetable/components/status-legend";
import { getBatchFeedbackInfo, type FeedbackInfo } from "@/features/timetable/utils/feedback-status";

// UUID validation function using regex
const isValidUUID = (value: string): boolean => {
  if (!value || value === "") return false;
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

export default function TimetableBigCalendar() {
  const { currentDate, setCurrentDate, isColorVisible } = useCalendarContext();
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

  // Memoized semester start date to avoid repeated database calls
  const semesterStartDate = useMemo(async () => {
    if (!filters.semesterId) return undefined;

    const { data: semesterData } = await supabase
      .from('semesters')
      .select('start_date')
      .eq('id', filters.semesterId)
      .single();

    return semesterData ? new Date(semesterData.start_date) : undefined;
  }, [supabase, filters.semesterId]);

  // Helper function to convert slots to calendar events with correct dates and feedback info
  const convertSlotsToEvents = useCallback(async (slots: StudySlot[]): Promise<CalendarEvent[]> => {
    const startDate = await semesterStartDate;

    // Only load feedback info if we have valid slots with IDs
    const eventIds = slots.map(slot => slot.id).filter((id): id is string => Boolean(id));
    const classIds = slots.map(slot => slot.class_id).filter((id): id is string => Boolean(id));

    let feedbackMap = new Map<string, FeedbackInfo>();
    if (eventIds.length > 0) {
      try {
        feedbackMap = await getBatchFeedbackInfo(eventIds, classIds);
      } catch (error) {
        console.error("Error loading feedback info:", error);
      }
    }

    return slots.map(slot => {
      const feedbackInfo = slot.id ? feedbackMap.get(slot.id) : undefined;
      return studySlotToCalendarEvent(slot, startDate, filters.studyWeek, feedbackInfo);
    });
  }, [semesterStartDate, filters.studyWeek]);

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

  // Load timetable events when filters change with guard + debounce + request cancel
  const requestIdRef = useRef(0)
  useEffect(() => {
    // Guard: require valid filters
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

        // Ignore out-of-date responses
        if (currentId !== requestIdRef.current) return

        if (result.success && result.data) {
          const slots = result.data as StudySlot[]
          setStudySlots(slots)
          const calendarEvents = await convertSlotsToEvents(slots);
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
    }, 250) // debounce ~250ms

    return () => {
      clearTimeout(timer)
    }
  }, [filters.classId, filters.semesterId, filters.studyWeek, convertSlotsToEvents])

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
    if (!slot?.id) return;

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
          const calendarEvents = await convertSlotsToEvents(slots);
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
        toast.success("Đã xóa tiết học thành công");
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
          const calendarEvents = await convertSlotsToEvents(slots);
          setEvents(calendarEvents);
        }
      } else {
        toast.error(result.error || "Không thể xóa tiết học");
      }
    } catch (error) {
      console.error("Error deleting study slot:", error);
      toast.error("Không thể xóa tiết học");
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
          const calendarEvents = await convertSlotsToEvents(slots);
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
      {/* Filters and Status Legend */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex-1">
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
                    const calendarEvents = await convertSlotsToEvents(slots);
                    setEvents(calendarEvents);
                  }
                };
                loadEvents();
              }
            }}
          />
        </div>
        <StatusLegend />
      </div>

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
