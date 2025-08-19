"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form"

import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Textarea } from "@/shared/components/ui/textarea"
import { Calendar } from "@/shared/components/ui/calendar"
import { cn } from "@/lib/utils"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  type EligibleTeacher
} from "@/lib/actions/schedule-exchange-actions"

// Form validation schema
const formSchema = z.object({
  timetable_event_id: z.string().min(1, "Please select a teaching slot"),
  target_teacher_id: z.string().min(1, "Please select a teacher"),
  exchange_date: z.date({
    message: "Please select an exchange date",
  }),
  reason: z.string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be less than 500 characters")
})

type FormData = z.infer<typeof formSchema>

interface TimetableEvent {
  id: string
  class_name: string
  subject_code: string
  subject_name: string
  day_of_week: number
  start_time: string
  end_time: string
  week_number: number
  classroom_name: string
}

interface ExchangeRequestFormProps {
  readonly teacherId: string
  readonly semesterId: string
  readonly onSuccess?: () => void
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function ExchangeRequestForm({ teacherId, semesterId, onSuccess }: ExchangeRequestFormProps) {
  const [open, setOpen] = useState(false)
  const [timetableEvents, setTimetableEvents] = useState<TimetableEvent[]>([])
  const [eligibleTeachers, setEligibleTeachers] = useState<EligibleTeacher[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTeachers, setLoadingTeachers] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      timetable_event_id: "",
      target_teacher_id: "",
      reason: ""
    }
  })

  const selectedEventId = form.watch("timetable_event_id")

  // Load teacher's timetable events
  const loadTimetableEvents = useCallback(async () => {
    try {
      const response = await fetch(`/api/teacher-timetable-events?teacher_id=${teacherId}&semester_id=${semesterId}`)
      const result = await response.json()

      if (result.success && result.data) {
        setTimetableEvents(result.data as TimetableEvent[])
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Failed to load timetable events")
    }
  }, [teacherId, semesterId])

  useEffect(() => {
    if (open && teacherId && semesterId) {
      loadTimetableEvents()
    }
  }, [open, teacherId, semesterId, loadTimetableEvents])

  // Load eligible teachers when event is selected
  const loadEligibleTeachers = useCallback(async (eventId: string) => {
    setLoadingTeachers(true)
    try {
      const response = await fetch(`/api/eligible-teachers?event_id=${eventId}&requesting_teacher_id=${teacherId}`)
      const result = await response.json()

      if (result.success && result.data) {
        setEligibleTeachers(result.data as EligibleTeacher[])
      } else {
        toast.error(result.error)
        setEligibleTeachers([])
      }
    } catch {
      toast.error("Failed to load eligible teachers")
      setEligibleTeachers([])
    } finally {
      setLoadingTeachers(false)
    }
  }, [teacherId])

  useEffect(() => {
    if (selectedEventId) {
      loadEligibleTeachers(selectedEventId)
    } else {
      setEligibleTeachers([])
      form.setValue("target_teacher_id", "")
    }
  }, [selectedEventId, form, loadEligibleTeachers])



  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const formData = {
        timetable_event_id: data.timetable_event_id,
        target_teacher_id: data.target_teacher_id,
        exchange_date: format(data.exchange_date, 'yyyy-MM-dd'),
        reason: data.reason
      }

      const response = await fetch('/api/exchange-requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Exchange request submitted successfully")
        form.reset()
        setOpen(false)
        onSuccess?.()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Failed to submit exchange request")
    } finally {
      setLoading(false)
    }
  }

  const selectedEvent = timetableEvents.find(event => event.id === selectedEventId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          Request Schedule Exchange
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Schedule Exchange</DialogTitle>
          <DialogDescription>
            Request another teacher to substitute for one of your teaching slots.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Teaching Slot Selection */}
            <FormField
              control={form.control}
              name="timetable_event_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teaching Slot</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teaching slot" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {timetableEvents.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.subject_code} - {event.class_name} | {dayNames[event.day_of_week]} {event.start_time}-{event.end_time} | Week {event.week_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the teaching slot you want to exchange
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Selected Event Details */}
            {selectedEvent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Selected Teaching Slot Details</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                  <div><strong>Subject:</strong> {selectedEvent.subject_code} - {selectedEvent.subject_name}</div>
                  <div><strong>Class:</strong> {selectedEvent.class_name}</div>
                  <div><strong>Time:</strong> {dayNames[selectedEvent.day_of_week]} {selectedEvent.start_time}-{selectedEvent.end_time}</div>
                  <div><strong>Classroom:</strong> {selectedEvent.classroom_name}</div>
                  <div><strong>Week:</strong> {selectedEvent.week_number}</div>
                </CardContent>
              </Card>
            )}

            {/* Target Teacher Selection */}
            <FormField
              control={form.control}
              name="target_teacher_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Substitute Teacher</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedEventId || loadingTeachers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={(() => {
                          if (!selectedEventId) return "Select a teaching slot first"
                          if (loadingTeachers) return "Loading teachers..."
                          return "Select a teacher"
                        })()} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eligibleTeachers.map((teacher) => (
                        <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                          {teacher.teacher_name} ({teacher.teacher_email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only teachers who teach the same subject are shown
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Exchange Date */}
            <FormField
              control={form.control}
              name="exchange_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Exchange Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select the specific date for the exchange
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Exchange</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please explain why you need this schedule exchange..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a clear reason for the exchange request (10-500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
