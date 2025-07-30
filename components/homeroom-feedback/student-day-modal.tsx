"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  User,
  Clock,
  BookOpen,
  MessageSquare,
  Star,
  Calendar,
  GraduationCap,
  Send,
  Check
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  getStudentDayScheduleWithFeedbackAction,
  type StudentWeeklySchedule,
  type StudentDaySchedule,
  type HomeroomFeedbackFilters
} from "@/lib/actions/homeroom-feedback-actions"
import {
  sendDailyFeedbackToParentsAction,
  checkDailyFeedbackSentStatusAction
} from "@/lib/actions/feedback-notification-actions"

interface StudentDayModalProps {
  student: StudentWeeklySchedule
  dayOfWeek: number
  dayName: string
  filters: HomeroomFeedbackFilters
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentDayModal({
  student,
  dayOfWeek,
  dayName,
  filters,
  open,
  onOpenChange
}: StudentDayModalProps) {
  const [, setDaySchedule] = useState<StudentDaySchedule | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendingDailyFeedback, setSendingDailyFeedback] = useState(false)
  const [dailySentStatus, setDailySentStatus] = useState<{ sent: boolean; sentAt?: string; feedbackCount?: number; parentCount?: number }>({ sent: false })

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get rating color
  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return "text-green-600"
    if (rating >= 3.5) return "text-yellow-600"
    if (rating >= 2.5) return "text-orange-600"
    return "text-red-600"
  }

  // Get rating stars
  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  // Format time
  const formatTime = (time: string): string => {
    return time.slice(0, 5) // Remove seconds
  }

  // Send daily feedback to parents
  const handleSendDailyFeedbackToParents = async () => {
    setSendingDailyFeedback(true)

    try {
      // Get semester ID from filters
      const result = await sendDailyFeedbackToParentsAction(
        student.student_id,
        dayOfWeek,
        filters.academic_year_id,
        filters.semester_id,
        filters.week_number
      )

      if (result.success) {
        toast.success(result.message || "Daily feedback sent to parents successfully")
        // Update sent status
        setDailySentStatus({ sent: true, sentAt: new Date().toISOString() })
      } else {
        toast.error(result.error || "Failed to send daily feedback to parents")
      }
    } catch (error) {
      console.error("Send daily feedback to parents error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setSendingDailyFeedback(false)
    }
  }

  // Check daily sent status
  const checkDailySentStatus = useCallback(async () => {
    try {
      const result = await checkDailyFeedbackSentStatusAction(
        student.student_id,
        dayOfWeek,
        filters.academic_year_id,
        filters.semester_id,
        filters.week_number
      )

      if (result.success && result.data) {
        setDailySentStatus(result.data)
      }
    } catch (error) {
      console.error("Check daily sent status error:", error)
    }
  }, [student.student_id, dayOfWeek, filters.academic_year_id, filters.semester_id, filters.week_number])

  // Load detailed day schedule when modal opens
  useEffect(() => {
    if (!open) return

    const loadDaySchedule = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getStudentDayScheduleWithFeedbackAction(
          student.student_id,
          dayOfWeek,
          filters
        )

        if (result.success && result.data) {
          setDaySchedule(result.data)

          // Check daily sent status
          checkDailySentStatus()
        } else {
          setError(result.error || "Failed to load day schedule")
        }
      } catch (err) {
        console.error("Load day schedule error:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadDaySchedule()
  }, [open, student.student_id, dayOfWeek, filters, student.daily_schedules, checkDailySentStatus])

  // Get lessons from student's daily schedule (fallback)
  const lessons = student.daily_schedules[dayOfWeek.toString()] || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12 border-2 border-border">
                <AvatarImage src={student.student_avatar_url || undefined} alt={student.student_name} />
                <AvatarFallback className="text-lg font-semibold">{getInitials(student.student_name)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="text-xl font-bold">{student.student_name}</div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{student.student_code}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <GraduationCap className="h-3 w-3" />
                    <span>{student.class_name}</span>
                  </div>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-sm font-medium">
              {dayName} - Tuần {filters.week_number}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">

          {/* Loading State */}
          {loading && (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Đang tải lịch học...</p>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {error && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Lessons Schedule */}
          {!loading && !error && lessons.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Lịch Học {dayName}</span>
                </h3>
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="text-sm">
                    {lessons.length} tiết học
                  </Badge>

                  {/* Send All Daily Feedback Button */}
                  {lessons.some(lesson => lesson.feedback) && (
                    dailySentStatus.sent ? (
                      <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                        <Check className="h-4 w-4" />
                        <span>Đã gửi phụ huynh ({dailySentStatus.feedbackCount} feedback)</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={handleSendDailyFeedbackToParents}
                        disabled={sendingDailyFeedback}
                        className="text-sm"
                      >
                        {sendingDailyFeedback ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Gửi tất cả feedback ngày này
                      </Button>
                    )
                  )}
                </div>
              </div>

              <div className="grid gap-4">
                {lessons.map((lesson, index) => (
                  <Card key={lesson.timetable_event_id || index} className="border-l-4 border-l-primary/20 hover:border-l-primary/40 transition-colors">
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {/* Lesson Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2 bg-muted/50 rounded-md px-2 py-1">
                                <Clock className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold">
                                  {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{lesson.subject_name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {lesson.subject_code}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <GraduationCap className="h-4 w-4" />
                              <span>Giáo viên: {lesson.teacher_name}</span>
                            </div>
                          </div>
                        </div>

                        {/* Feedback Section */}
                        {lesson.feedback ? (
                          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg p-4 border border-green-200/50 dark:border-green-800/50">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="p-1.5 bg-green-100 dark:bg-green-900/50 rounded-full">
                                    <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  </div>
                                  <span className="font-medium text-green-800 dark:text-green-200">Phản Hồi</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-1">
                                    {getRatingStars(lesson.feedback.rating)}
                                  </div>
                                  <Badge variant="secondary" className={`${getRatingColor(lesson.feedback.rating)} font-semibold`}>
                                    {lesson.feedback.rating}/5
                                  </Badge>
                                </div>
                              </div>

                              {lesson.feedback.comment && (
                                <div className="bg-white/60 dark:bg-gray-900/60 rounded-md p-3 border border-green-200/30 dark:border-green-800/30">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                                    &ldquo;{lesson.feedback.comment}&rdquo;
                                  </p>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Phản hồi từ: <span className="font-medium">{lesson.feedback.teacher_name}</span></span>
                                <span>{new Date(lesson.feedback.created_at).toLocaleDateString('vi-VN')}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-dashed border-gray-300 dark:border-gray-700">
                            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                              <MessageSquare className="h-4 w-4" />
                              <span className="text-sm">Chưa có phản hồi cho tiết học này</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No Lessons */}
          {!loading && !error && lessons.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-full w-fit mx-auto">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Không Có Tiết Học</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Học sinh không có tiết học nào trong {dayName}.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
