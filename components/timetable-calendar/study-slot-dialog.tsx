"use client";

import { useEffect, useMemo, useState } from "react";
import { RiCalendarLine, RiDeleteBinLine } from "@remixicon/react";
import { format, addMinutes } from "date-fns";
import { checkStudySlotConflictsAction } from "@/lib/actions/study-slot-actions";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  StartHour,
  EndHour,
  DefaultStartHour,
} from "@/components/event-calendar/constants";

// Types for study slot
export interface StudySlot {
  id?: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  classroom_id: string;
  semester_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  week_number: number;
  notes?: string;
}

export interface Subject {
  id: string;
  code: string;
  name_vietnamese: string;
  category: string;
}

export interface Teacher {
  id: string;
  full_name: string;
  employee_id?: string;
}

export interface Classroom {
  id: string;
  name: string;
  building?: string;
  floor?: number;
  room_type: string;
}

export interface TeacherAssignment {
  teacher_id: string;
  teacher_name: string;
  subject_id: string;
}

interface StudySlotDialogProps {
  slot: StudySlot | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: StudySlot) => void;
  onDelete: (slotId: string) => void;
  // Filter context
  classId?: string;
  semesterId?: string;
  weekNumber?: number;
  // Data for dropdowns
  subjects: Subject[];
  teachers: Teacher[];
  classrooms: Classroom[];
  teacherAssignments: TeacherAssignment[];
}

export function StudySlotDialog({
  slot,
  isOpen,
  onClose,
  onSave,
  onDelete,
  classId,
  semesterId,
  weekNumber,
  subjects,
  teachers,
  classrooms,
  teacherAssignments,
}: StudySlotDialogProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState(`${DefaultStartHour}:00`);
  const [endTime, setEndTime] = useState(`${DefaultStartHour + 1}:00`);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);

  // Auto-populate teacher when subject changes
  useEffect(() => {
    if (selectedSubjectId && classId) {
      const assignment = teacherAssignments.find(
        (ta) => ta.subject_id === selectedSubjectId
      );
      if (assignment) {
        setSelectedTeacherId(assignment.teacher_id);
      } else {
        setSelectedTeacherId("");
      }
    }
  }, [selectedSubjectId, classId, teacherAssignments]);

  // Check for conflicts when key parameters change
  useEffect(() => {
    const checkConflicts = async () => {
      if (!selectedClassroomId || !selectedTeacherId || !startTime || !classId || !semesterId || !weekNumber) {
        setWarning(null);
        return;
      }

      setIsCheckingConflicts(true);
      try {
        const dayOfWeek = selectedDate.getDay();
        const result = await checkStudySlotConflictsAction(
          selectedClassroomId,
          selectedTeacherId,
          dayOfWeek,
          startTime,
          weekNumber,
          semesterId,
          slot?.id // Exclude current slot if editing
        );

        if (result.success && result.hasConflict) {
          setWarning(result.conflictType || "Schedule conflict detected");
        } else {
          setWarning(null);
        }
      } catch (error) {
        console.error("Error checking conflicts:", error);
      } finally {
        setIsCheckingConflicts(false);
      }
    };

    // Debounce the conflict check
    const timeoutId = setTimeout(checkConflicts, 500);
    return () => clearTimeout(timeoutId);
  }, [selectedClassroomId, selectedTeacherId, startTime, selectedDate, classId, semesterId, weekNumber, slot?.id]);

  // Auto-calculate end time when start time changes (add 45 minutes)
  useEffect(() => {
    if (startTime) {
      const [hours, minutes] = startTime.split(":").map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      
      // Add 45 minutes using date-fns
      const endDate = addMinutes(startDate, 45);
      const formattedEndTime = format(endDate, "HH:mm");
      setEndTime(formattedEndTime);
    }
  }, [startTime]);

  // Initialize form when slot changes
  useEffect(() => {
    if (slot) {
      setSelectedSubjectId(slot.subject_id);
      setSelectedTeacherId(slot.teacher_id);
      setSelectedClassroomId(slot.classroom_id);
      setStartTime(slot.start_time);
      setEndTime(slot.end_time);
      setNotes(slot.notes || "");
      setError(null);
    } else {
      resetForm();
    }
  }, [slot]);

  const resetForm = () => {
    setSelectedSubjectId("");
    setSelectedTeacherId("");
    setSelectedClassroomId("");
    setSelectedDate(new Date());
    setStartTime(`${DefaultStartHour}:00`);
    setEndTime(`${DefaultStartHour + 1}:00`);
    setNotes("");
    setError(null);
    setWarning(null);
  };

  // Generate time options (15-minute intervals)
  const timeOptions = useMemo(() => {
    const options = [];
    for (let hour = StartHour; hour <= EndHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, "0");
        const formattedMinute = minute.toString().padStart(2, "0");
        const value = `${formattedHour}:${formattedMinute}`;
        const date = new Date(2000, 0, 1, hour, minute);
        const label = format(date, "h:mm a");
        options.push({ value, label });
      }
    }
    return options;
  }, []);

  const handleSave = () => {
    // Validation
    if (!selectedSubjectId) {
      setError("Please select a subject");
      return;
    }
    if (!selectedTeacherId) {
      setError("Please select a teacher");
      return;
    }
    if (!selectedClassroomId) {
      setError("Please select a classroom");
      return;
    }
    if (!classId || !semesterId || !weekNumber) {
      setError("Missing class, semester, or week information");
      return;
    }

    // Calculate day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = selectedDate.getDay();

    const studySlot: StudySlot = {
      id: slot?.id,
      class_id: classId,
      subject_id: selectedSubjectId,
      teacher_id: selectedTeacherId,
      classroom_id: selectedClassroomId,
      semester_id: semesterId,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      week_number: weekNumber,
      notes: notes.trim() || undefined,
    };

    onSave(studySlot);
  };

  const handleDelete = () => {
    if (slot?.id) {
      onDelete(slot.id);
    }
  };

  // Filter available teachers based on subject assignment
  const availableTeachers = useMemo(() => {
    if (!selectedSubjectId || !classId) return teachers;
    
    const assignedTeacherIds = teacherAssignments
      .filter((ta) => ta.subject_id === selectedSubjectId)
      .map((ta) => ta.teacher_id);
    
    return teachers.filter((teacher) => assignedTeacherIds.includes(teacher.id));
  }, [selectedSubjectId, classId, teachers, teacherAssignments]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {slot?.id ? "Edit Study Slot" : "New Study Slot"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {slot?.id
              ? "Edit the details of this study slot"
              : "Add a new study slot to the timetable"}
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-destructive/15 text-destructive rounded-md px-3 py-2 text-sm">
            {error}
          </div>
        )}

        {warning && (
          <div className="bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md px-3 py-2 text-sm flex items-center gap-2">
            <span className="text-yellow-600">⚠️</span>
            <span>{warning}</span>
            {isCheckingConflicts && (
              <span className="text-xs text-yellow-600">(checking...)</span>
            )}
          </div>
        )}

        <div className="grid gap-3 sm:gap-4 py-3 sm:py-4">
          {/* Subject Selection */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger id="subject">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name_vietnamese}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Teacher Selection (auto-populated) */}
          <div className="space-y-2">
            <Label htmlFor="teacher">Teacher *</Label>
            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
              <SelectTrigger id="teacher">
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {availableTeachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                    {teacher.employee_id && ` (${teacher.employee_id})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    "w-full justify-between px-3 font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <span>
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </span>
                  <RiCalendarLine size={16} className="shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setDatePickerOpen(false);
                    }
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time *</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger id="start-time">
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger id="end-time">
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Classroom Selection */}
          <div className="space-y-2">
            <Label htmlFor="classroom">Classroom *</Label>
            <Select value={selectedClassroomId} onValueChange={setSelectedClassroomId}>
              <SelectTrigger id="classroom">
                <SelectValue placeholder="Select a classroom" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map((classroom) => (
                  <SelectItem key={classroom.id} value={classroom.id}>
                    {classroom.name}
                    {classroom.building && ` - ${classroom.building}`}
                    {classroom.floor && ` (Floor ${classroom.floor})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes for this study slot..."
            />
          </div>
        </div>

        <DialogFooter className="flex-row sm:justify-between">
          {slot?.id && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              size="icon"
              onClick={handleDelete}
              aria-label="Delete study slot"
            >
              <RiDeleteBinLine size={16} />
            </Button>
          )}
          <div className="flex flex-1 justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Study Slot</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
