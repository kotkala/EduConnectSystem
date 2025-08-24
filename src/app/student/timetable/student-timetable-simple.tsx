'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from "next/dynamic"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Calendar, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingFallback } from "@/shared/components/ui/loading-fallback"
import { TimetableFilters, type TimetableFilters as TimetableFiltersType } from "@/features/timetable/components/timetable-calendar/timetable-filters"
import { getTimetableEventsAction } from "@/features/timetable/actions/timetable-actions"
import { type CalendarEvent } from "@/features/timetable/components/calendar"
import { studySlotToCalendarEvent } from "@/features/timetable/components/calendar/mappers"

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
)

interface StudentClassInfo {
  class_id: string
  class_info: {
    id: string
    name: string
    grade_level: string
    academic_year: string
  }
}

export function StudentTimetableSimple() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [studentClassInfo, setStudentClassInfo] = useState<StudentClassInfo | null>(null)
  
  // Filter state - will be auto-populated with student's class
  const [filters, setFilters] = useState<TimetableFiltersType>({
    academicYearId: "",
    semesterId: "",
    gradeLevel: "",
    classId: "",
    studyWeek: 1,
  })

  // Load student's class information
  const loadStudentClass = useCallback(async () => {
    try {
      const response = await fetch('/api/student-timetable')
      const result = await response.json()

      if (result.success && result.data) {
        setStudentClassInfo(result.data)
        // Auto-set the class filter
        setFilters(prev => ({
          ...prev,
          classId: result.data.class_id
        }))
      } else {
        toast.error(result.error || 'Không thể tải thông tin lớp học')
      }
    } catch (error) {
      console.error('Error loading student class:', error)
      toast.error('Có lỗi xảy ra khi tải thông tin lớp học')
    }
  }, [])

  // Load timetable events using the same logic as admin
  const loadTimetableEvents = useCallback(async () => {
    if (!filters.classId || !filters.semesterId || !filters.studyWeek) {
      return
    }

    setIsLoading(true)
    try {
      const result = await getTimetableEventsAction({
        class_id: filters.classId,
        semester_id: filters.semesterId,
        week_number: filters.studyWeek,
      })

      if (result.success && result.data) {
        const calendarEvents = result.data.map(slot =>
          studySlotToCalendarEvent({
            ...slot,
            notes: slot.notes || undefined // Convert null to undefined
          })
        )
        setEvents(calendarEvents)
      } else {
        toast.error('Không thể tải thời khóa biểu')
        setEvents([])
      }
    } catch (error) {
      console.error('Error loading timetable events:', error)
      toast.error('Có lỗi xảy ra khi tải thời khóa biểu')
      setEvents([])
    } finally {
      setIsLoading(false)
    }
  }, [filters.classId, filters.semesterId, filters.studyWeek])

  // Load student class on mount
  useEffect(() => {
    loadStudentClass()
  }, [loadStudentClass])

  // Load events when filters change
  useEffect(() => {
    loadTimetableEvents()
  }, [loadTimetableEvents])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Thời khóa biểu
          </h1>
          <p className="text-muted-foreground">
            {studentClassInfo?.class_info ? 
              `Lớp ${studentClassInfo.class_info.name} - ${studentClassInfo.class_info.academic_year}` : 
              'Xem thời khóa biểu lớp học của bạn'
            }
          </p>
        </div>
        
        <Button 
          onClick={() => {
            loadStudentClass()
            loadTimetableEvents()
          }}
          variant="outline"
          size="sm"
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </Button>
      </div>

      {/* Filters - simplified for students */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc thời khóa biểu</CardTitle>
          <CardDescription>
            Chọn học kỳ và tuần để xem thời khóa biểu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimetableFilters
            filters={filters}
            onFiltersChange={setFilters}
            onRefresh={loadTimetableEvents}
            loading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Thời khóa biểu tuần {filters.studyWeek}
          </CardTitle>
          <CardDescription>
            {events.length > 0 ? 
              `Có ${events.length} tiết học trong tuần này` : 
              'Không có tiết học nào trong tuần này'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!studentClassInfo ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Không thể tải thông tin lớp học</p>
              <Button 
                onClick={loadStudentClass}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Thử lại
              </Button>
            </div>
          ) : (
            <EventCalendar
              events={events}
              className="w-full"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
