"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"


import { Skeleton } from "@/shared/components/ui/skeleton";import {
  CalendarDays,
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
    const days = ['', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
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
            Phản Hồi Học Sinh
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Xem phản hồi học tập của học sinh trong lớp chủ nhiệm
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" className="w-full sm:w-auto" disabled={loading || !hasValidFilters(filters)}>
          <Skeleton className="h-32 w-full rounded-lg" />
          Làm mới
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
              <CardTitle className="text-sm font-medium">Tổng Học Sinh</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Học sinh trong lớp chủ nhiệm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiết Học Tuần Này</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLessonsThisWeek}</div>
              <p className="text-xs text-muted-foreground">
                Tổng số tiết học trong tuần
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phản Hồi Nhận Được</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFeedbackReceived}</div>
              <p className="text-xs text-muted-foreground">
                Số phản hồi đã nhận được
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
            <Users className="h-12 md:h-14 lg:h-16 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không Có Dữ Liệu</h3>
            <p className="text-muted-foreground">
              Không có dữ liệu học sinh cho tuần đã chọn.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filter Status */}
      {!hasValidFilters(filters) && (
        <Card>
          <CardContent className="py-12 text-center">
            <CalendarDays className="h-12 md:h-14 lg:h-16 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Chọn Bộ Lọc</h3>
            <p className="text-muted-foreground">
              Vui lòng chọn năm học, học kỳ và tuần để xem phản hồi học sinh.
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
