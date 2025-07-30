"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { TimeSlotPicker, QuickTimeSlots } from './time-slot-picker'
import {
  createTimetableEventAction,
  updateTimetableEventAction,
  checkTimetableConflictsAction,
  getTimetableDropdownDataAction,
  type TimetableEventDetailed,
  type TimetableDropdownData
} from '@/lib/actions/timetable-actions'
import {
  timetableEventSchema,
  updateTimetableEventSchema,
  calculateEndTime,
  type TimetableEventFormData,
  type UpdateTimetableEventFormData
} from '@/lib/validations/timetable-validations'

interface TimetableEventFormProps {
  event?: TimetableEventDetailed
  onSuccess: () => void
  onCancel: () => void
  // Pre-filled values for quick creation
  defaultValues?: {
    class_id?: string
    semester_id?: string
    week_number?: number
    day_of_week?: number
  }
}

export function TimetableEventForm({
  event,
  onSuccess,
  onCancel,
  defaultValues
}: TimetableEventFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflictCheck, setConflictCheck] = useState<{
    checking: boolean
    hasConflict: boolean
    conflictType?: string
  }>({ checking: false, hasConflict: false })

  // Dropdown data state
  const [dropdownData, setDropdownData] = useState<TimetableDropdownData>({
    classes: [],
    subjects: [],
    teachers: [],
    classrooms: [],
    semesters: []
  })
  const [loadingData, setLoadingData] = useState(true)

  const isEditing = !!event

  // Context7 pattern: Load dropdown data on component mount
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const result = await getTimetableDropdownDataAction()
        if (result.success && result.data) {
          setDropdownData(result.data)
        } else {
          setError(result.error || 'Failed to load form data')
        }
      } catch {
        setError('Failed to load form data')
      } finally {
        setLoadingData(false)
      }
    }

    loadDropdownData()
  }, [])

  const form = useForm({
    resolver: zodResolver(isEditing ? updateTimetableEventSchema : timetableEventSchema),
    defaultValues: isEditing ? {
      id: event.id,
      class_id: event.class_id,
      subject_id: event.subject_id,
      teacher_id: event.teacher_id,
      classroom_id: event.classroom_id,
      semester_id: event.semester_id,
      day_of_week: event.day_of_week,
      start_time: event.start_time,
      end_time: event.end_time,
      week_number: event.week_number,
      notes: event.notes || ''
    } : {
      class_id: defaultValues?.class_id || '',
      subject_id: '',
      teacher_id: '',
      classroom_id: '',
      semester_id: defaultValues?.semester_id || '',
      day_of_week: defaultValues?.day_of_week ?? 1, // Monday
      start_time: '',
      end_time: '',
      week_number: defaultValues?.week_number || 1,
      notes: ''
    }
  })

  // Watch form values for conflict checking
  const watchedValues = form.watch([
    'classroom_id',
    'teacher_id',
    'day_of_week',
    'start_time',
    'week_number',
    'semester_id'
  ])

  const checkConflicts = useCallback(async (
    classroomId: string,
    teacherId: string,
    dayOfWeek: number,
    startTime: string,
    weekNumber: number,
    semesterId: string
  ) => {
    setConflictCheck({ checking: true, hasConflict: false })

    try {
      const result = await checkTimetableConflictsAction(
        classroomId,
        teacherId,
        dayOfWeek,
        startTime,
        weekNumber,
        semesterId,
        isEditing ? event?.id : undefined
      )

      if (result.success) {
        setConflictCheck({
          checking: false,
          hasConflict: result.hasConflict,
          conflictType: result.conflictType
        })
      }
    } catch {
      setConflictCheck({ checking: false, hasConflict: false })
    }
  }, [isEditing, event?.id])

  // Auto-calculate end time when start time changes
  const startTime = form.watch('start_time')

  // Optimize form dependency for useEffect - Context7 React Best Practice
  const formSetValue = useMemo(() => form.setValue, [form.setValue])

  useEffect(() => {
    if (startTime) {
      const endTime = calculateEndTime(startTime, 45)
      formSetValue('end_time', endTime)
    }
  }, [startTime, formSetValue])

  // Check for conflicts when relevant fields change
  useEffect(() => {
    const [classroomId, teacherId, dayOfWeek, startTimeValue, weekNumber, semesterId] = watchedValues

    if (classroomId && teacherId && dayOfWeek !== undefined && startTimeValue && weekNumber && semesterId) {
      checkConflicts(classroomId, teacherId, dayOfWeek, startTimeValue, weekNumber, semesterId)
    } else {
      setConflictCheck({ checking: false, hasConflict: false })
    }
  }, [watchedValues, checkConflicts])

  const onSubmit = async (data: Record<string, unknown>) => {
    if (conflictCheck.hasConflict) {
      setError('Please resolve conflicts before saving')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = isEditing 
        ? await updateTimetableEventAction(data as UpdateTimetableEventFormData)
        : await createTimetableEventAction(data as TimetableEventFormData)

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Failed to save timetable event')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickTimeSelect = (time: string) => {
    form.setValue('start_time', time)
  }

  // Days of week options
  const daysOfWeek = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' }
  ]

  // Week number options (1-52)
  const weekOptions = Array.from({ length: 52 }, (_, i) => ({
    value: i + 1,
    label: `Week ${i + 1}`
  }))

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Conflict Warning */}
      {conflictCheck.hasConflict && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Conflict Detected:</strong> {conflictCheck.conflictType}
          </AlertDescription>
        </Alert>
      )}

      {/* No Conflict Indicator */}
      {!conflictCheck.checking && !conflictCheck.hasConflict && form.watch('start_time') && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            No conflicts detected for this time slot
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingData ? "Loading classes..." : "Select class"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dropdownData.classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                          {classItem.class_block?.[0]?.display_name && ` (${classItem.class_block[0].display_name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingData ? "Loading subjects..." : "Select subject"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dropdownData.subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.code} - {subject.name_vietnamese}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Teacher and Classroom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="teacher_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingData ? "Loading teachers..." : "Select teacher"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dropdownData.teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.full_name}
                          {teacher.employee_id && ` (${teacher.employee_id})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classroom_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classroom *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingData ? "Loading classrooms..." : "Select classroom"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dropdownData.classrooms.map((classroom) => (
                        <SelectItem key={classroom.id} value={classroom.id}>
                          {classroom.name}
                          {classroom.building && ` (${classroom.building}${classroom.floor ? `, Floor ${classroom.floor}` : ''})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Schedule Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="semester_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semester *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loadingData}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingData ? "Loading semesters..." : "Select semester"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {dropdownData.semesters.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id}>
                          {semester.name}
                          {semester.academic_year?.[0]?.name && ` (${semester.academic_year[0].name})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="day_of_week"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Day of Week *</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {daysOfWeek.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="week_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Week Number *</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select week" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {weekOptions.map((week) => (
                        <SelectItem key={week.value} value={week.value.toString()}>
                          {week.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Time Selection */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <TimeSlotPicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={loading}
                    error={form.formState.errors.start_time?.message}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <QuickTimeSlots 
              onSelect={handleQuickTimeSelect}
              disabled={loading}
            />
          </div>

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Additional notes for this lesson..."
                    className="resize-none"
                    rows={3}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || conflictCheck.hasConflict}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Event' : 'Create Event'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
