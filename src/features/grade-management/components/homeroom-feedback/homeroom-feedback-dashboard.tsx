"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"

import {
  CalendarDays,
  RefreshCw,
  Users,
  BookOpen,
  MessageSquare
} from "lucide-react"
import { toast } from "sonner"
import { HomeroomFeedbackFilters } from "./homeroom-feedback-filters"
import { StudentWeeklyGrid } from "./student-weekly-grid"
import { StudentDayModal } from "./student-day-modal"
import {
  getHomeroomStudentsWeeklyFeedbackAction,
  type HomeroomFeedbackFilters as FiltersType,
  type StudentWeeklySchedule
} from "@/features/grade-management/actions/homeroom-feedback-actions"

export function HomeroomFeedbackDashboard() {
  const [students, setStudents] = useState<StudentWeeklySchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FiltersType>({
    academic_year_id: '',
    semester_id: '',
    week_number: 1
  })

  // Modal state for viewing student day details
  const [selectedStudentDay, setSelectedStudentDay] = useState<{
    student: StudentWeeklySchedule
    dayOfWeek: number
  } | null>(null)

  // Helper function to check if filters are valid for loading data
  function hasValidFilters(filters: FiltersType): boolean {
    return !!(
      filters.academic_year_id &&
      filters.semester_id &&
      filters.week_number
    )
  }



  // Load students weekly feedback data
  const loadStudentsData = useCallback(async () => {
    if (!hasValidFilters(filters)) {
      setStudents([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await getHomeroomStudentsWeeklyFeedbackAction(filters)

      if (result.success && result.data) {
        setStudents(result.data)
      } else {
        setError(result.error || "Failed to load students feedback data")
        setStudents([])
      }
    } catch (err) {
      console.error("Load students data error:", err)
      setError("An unexpected error occurred")
      toast.error("Failed to load students feedback data")
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Load data when filters change
  useEffect(() => {
    loadStudentsData()
  }, [loadStudentsData])

  // Handle filter changes
  const handleFiltersChange = (newFilters: FiltersType) => {
    setFilters(newFilters)
  }

  // Handle refresh
  const handleRefresh = () => {
    if (hasValidFilters(filters)) {
      loadStudentsData()
      toast.success("Data refreshed")
    }
  }

  // Handle student day click
  const handleStudentDayClick = (student: StudentWeeklySchedule, dayOfWeek: number) => {
    setSelectedStudentDay({ student, dayOfWeek })
  }

  // Get day name in Vietnamese
  const getDayName = (dayOfWeek: number): string => {
    const days = ['', 'Thá»© Hai', 'Thá»© Ba', 'Thá»© TÆ°', 'Thá»© NÄƒm', 'Thá»© SÃ¡u', 'Thá»© Báº£y', 'Chá»§ Nháº­t']
    return days[dayOfWeek] || ''
  }

  // Calculate statistics
  const totalStudents = students.length
  const totalLessonsThisWeek = students.reduce((total, student) => {
    return total + Object.values(student.daily_schedules).reduce((dayTotal, lessons) => {
      return dayTotal + lessons.length
    }, 0)
  }, 0)

  const totalFeedbackReceived = students.reduce((total, student) => {
    return total + Object.values(student.daily_schedules).reduce((dayTotal, lessons) => {
      return dayTotal + lessons.filter(lesson => lesson.feedback).length
    }, 0)
  }, 0)

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Pháº£n Há»“i Há»c Sinh
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Xem pháº£n há»“i há»c táº­p cá»§a há»c sinh trong lá»›p chá»§ nhiá»‡m
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="w-full sm:w-auto" disabled={loading || !hasValidFilters(filters)}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          LÃ m má»›i
        </Button>
      </div>

      {/* Filters */}
      <HomeroomFeedbackFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Statistics Cards */}
      {hasValidFilters(filters) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tá»•ng Há»c Sinh</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Há»c sinh trong lá»›p chá»§ nhiá»‡m
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiáº¿t Há»c Tuáº§n NÃ y</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLessonsThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                Tá»•ng sá»‘ tiáº¿t há»c trong tuáº§n
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pháº£n Há»“i Nháº­n ÄÆ°á»£c</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFeedbackReceived}</div>
              <p className="text-xs text-muted-foreground">
                Sá»‘ pháº£n há»“i Ä‘Ã£ nháº­n Ä‘Æ°á»£c
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Students Weekly Grid */}
      {hasValidFilters(filters) && !loading && !error && (
        <StudentWeeklyGrid
          students={students}
          onStudentDayClick={handleStudentDayClick}
          loading={loading}
        />
      )}

      {/* No Data Message */}
      {hasValidFilters(filters) && !loading && !error && students.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">KhÃ´ng CÃ³ Dá»¯ Liá»‡u</h3>
            <p className="text-muted-foreground">
              KhÃ´ng cÃ³ dá»¯ liá»‡u há»c sinh cho tuáº§n Ä‘Ã£ chá»n.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filter Status */}
      {!hasValidFilters(filters) && (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chá»n Bá»™ Lá»c</h3>
            <p className="text-muted-foreground">
              Vui lÃ²ng chá»n nÄƒm há»c, há»c ká»³ vÃ  tuáº§n Ä‘á»ƒ xem pháº£n há»“i há»c sinh.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Student Day Detail Modal */}
      {selectedStudentDay && (
        <StudentDayModal
          student={selectedStudentDay.student}
          dayOfWeek={selectedStudentDay.dayOfWeek}
          dayName={getDayName(selectedStudentDay.dayOfWeek)}
          filters={filters}
          open={!!selectedStudentDay}
          onOpenChange={(open) => !open && setSelectedStudentDay(null)}
        />
      )}
    </div>
  )
}
