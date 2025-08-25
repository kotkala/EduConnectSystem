"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  ArrowLeft,
  Calendar,
  Clock,
  BookOpen,
  MessageSquare,
  User,
  GraduationCap,
  Sparkles,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import {
  getStudentDayFeedbackAction,
  generateDailyFeedbackSummaryAction,
  type HomeroomFeedbackFilters,
  type StudentDaySchedule
} from "@/features/grade-management/actions/homeroom-feedback-actions"

interface StudentDayFeedbackDetailProps {
  studentId: string
  dayOfWeek: number
  filters: HomeroomFeedbackFilters
  studentName?: string
}

export function StudentDayFeedbackDetail({
  studentId,
  dayOfWeek,
  filters,
  studentName
}: StudentDayFeedbackDetailProps) {
  const router = useRouter()
  const [studentData, setStudentData] = useState<StudentDaySchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [dailySummary, setDailySummary] = useState<string | null>(null)

  // Get day name in Vietnamese
  const getDayName = (dayOfWeek: number): string => {
    const days = ['', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
    return days[dayOfWeek] || 'Không xác định'
  }

  // Load student day data
  useEffect(() => {
    const loadStudentData = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getStudentDayFeedbackAction({
          studentId,
          dayOfWeek,
          ...filters
        })

        if (result.success && result.data) {
          setStudentData(result.data)
        } else {
          setError(result.error || "Failed to load student feedback data")
        }
      } catch (err) {
        console.error("Load student data error:", err)
        setError("An unexpected error occurred")
        toast.error("Failed to load student feedback data")
      } finally {
        setLoading(false)
      }
    }

    loadStudentData()
  }, [studentId, dayOfWeek, filters])

  // Generate daily summary
  const handleGenerateSummary = async () => {
    if (!studentData) return

    setSummaryLoading(true)
    try {
      const result = await generateDailyFeedbackSummaryAction({
        studentId,
        dayOfWeek,
        lessons: studentData.lessons,
        ...filters
      })

      if (result.success && result.summary) {
        setDailySummary(result.summary)
        toast.success("Tóm tắt đã được tạo thành công")
      } else {
        toast.error(result.error || "Failed to generate summary")
      }
    } catch (err) {
      console.error("Generate summary error:", err)
      toast.error("An unexpected error occurred")
    } finally {
      setSummaryLoading(false)
    }
  }

  // Handle back navigation
  const handleBack = () => {
    router.back()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Không Có Dữ Liệu</h3>
            <p className="text-muted-foreground">
              Không tìm thấy dữ liệu cho học sinh này.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const dayName = getDayName(dayOfWeek)
  const totalLessons = studentData.lessons.length
  const lessonsWithFeedback = studentData.lessons.filter(lesson => lesson.feedback).length
  const feedbackRate = totalLessons > 0 ? Math.round((lessonsWithFeedback / totalLessons) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Phản hồi {studentName || studentData.student_name}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {dayName} - Tuần {filters.week_number}
            </p>
          </div>
        </div>
        <Button 
          onClick={handleGenerateSummary} 
          disabled={summaryLoading || totalLessons === 0}
          className="w-full sm:w-auto"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {summaryLoading ? "Đang tạo..." : "Tóm tắt AI"}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng Tiết Học</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLessons}</div>
            <p className="text-xs text-muted-foreground">
              Tiết học trong ngày
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Có Phản Hồi</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lessonsWithFeedback}</div>
            <p className="text-xs text-muted-foreground">
              Tiết có phản hồi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tỷ Lệ Phản Hồi</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackRate}%</div>
            <p className="text-xs text-muted-foreground">
              Phần trăm có phản hồi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Summary */}
      {dailySummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Tóm Tắt Phản Hồi Ngày {dayName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {dailySummary}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lessons Detail */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Chi Tiết Các Tiết Học</h2>
        
        {studentData.lessons.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Không Có Tiết Học</h3>
              <p className="text-muted-foreground">
                Không có tiết học nào trong ngày này.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {studentData.lessons.map((lesson, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Tiết {lesson.period} - {lesson.subject_name}
                    </CardTitle>
                    <Badge variant={lesson.feedback ? "default" : "secondary"}>
                      {lesson.feedback ? "Có phản hồi" : "Chưa có phản hồi"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Giáo viên:</span> {lesson.teacher_name}
                    </div>
                    <div>
                      <span className="font-medium">Phòng học:</span> {lesson.classroom || 'Chưa xác định'}
                    </div>
                  </div>
                  
                  {lesson.feedback && (
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Phản hồi của giáo viên:
                      </h4>
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm leading-relaxed">{lesson.feedback}</p>
                        {lesson.feedback_date && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Cập nhật: {new Date(lesson.feedback_date).toLocaleString('vi-VN')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
