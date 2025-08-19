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
  Check,
  Sparkles,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import {
  getStudentDayScheduleWithFeedbackAction,
  type StudentWeeklySchedule,
  type HomeroomFeedbackFilters
} from "@/lib/actions/homeroom-feedback-actions"
import {
  sendDailyFeedbackToParentsAction,
  checkDailyFeedbackSentStatusAction
} from "@/lib/actions/feedback-notification-actions"

interface StudentDayModalProps {
  readonly student: StudentWeeklySchedule
  readonly dayOfWeek: number
  readonly dayName: string
  readonly filters: HomeroomFeedbackFilters
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function StudentDayModal({
  student,
  dayOfWeek,
  dayName,
  filters,
  open,
  onOpenChange
}: StudentDayModalProps) {

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendingDailyFeedback, setSendingDailyFeedback] = useState(false)
  const [dailySentStatus, setDailySentStatus] = useState<{ sent: boolean; sentAt?: string; feedbackCount?: number; parentCount?: number }>({ sent: false })

  // AI Summary states
  const [aiSummary, setAiSummary] = useState<string>("")
  const [generatingAiSummary, setGeneratingAiSummary] = useState(false)
  const [showAiSummary, setShowAiSummary] = useState(false)
  const [useAiSummary, setUseAiSummary] = useState(false)

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
      // If using AI summary, save it to database first
      if (useAiSummary && aiSummary) {
        const feedbacks = lessons
          .filter(lesson => lesson.feedback)
          .map(lesson => ({
            id: lesson.feedback!.id,
            subject_name: lesson.subject_name,
            teacher_name: lesson.teacher_name,
            rating: lesson.feedback!.rating,
            comment: lesson.feedback!.comment || "",
            created_at: lesson.feedback!.created_at
          }))

        // Save AI summary to database
        const formattedDate = new Date().toLocaleDateString('vi-VN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

        await fetch('/api/ai/summarize-feedback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            feedbacks,
            studentName: student.student_name,
            date: formattedDate,
            saveToDatabase: true, // Save to database
            studentId: student.student_id,
            dayOfWeek,
            academicYearId: filters.academic_year_id,
            semesterId: filters.semester_id,
            weekNumber: filters.week_number,
            includeProgressTracking: true // Enable progress tracking
          })
        })
      }

      // Send feedback to parents
      const result = await sendDailyFeedbackToParentsAction(
        student.student_id,
        dayOfWeek,
        filters.academic_year_id,
        filters.semester_id,
        filters.week_number
      )

      if (result.success) {
        const message = useAiSummary && aiSummary
          ? "AI summary sent to parents successfully"
          : "Daily feedback sent to parents successfully"
        toast.success(result.message || message)
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

  // Generate AI summary of feedback
  const generateAiSummary = async () => {
    setGeneratingAiSummary(true)
    setError(null)

    try {
      // Prepare feedback data for AI
      const feedbacks = lessons
        .filter(lesson => lesson.feedback)
        .map(lesson => ({
          id: lesson.feedback!.id,
          subject_name: lesson.subject_name,
          teacher_name: lesson.teacher_name,
          rating: lesson.feedback!.rating,
          comment: lesson.feedback!.comment || "",
          created_at: lesson.feedback!.created_at
        }))

      if (feedbacks.length === 0) {
        toast.error("Không có feedback nào để tóm tắt")
        return
      }

      // Format date for display
      const currentDate = new Date()
      const formattedDate = currentDate.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      const response = await fetch('/api/ai/summarize-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedbacks,
          studentName: student.student_name,
          date: formattedDate,
          saveToDatabase: true, // Save to database immediately
          studentId: student.student_id,
          dayOfWeek,
          academicYearId: filters.academic_year_id,
          semesterId: filters.semester_id,
          weekNumber: filters.week_number,
          includeProgressTracking: true // Enable progress tracking
        })
      })

      const result = await response.json()

      if (result.success) {
        setAiSummary(result.summary)
        setShowAiSummary(true)
        toast.success("AI đã tóm tắt feedback thành công!")
      } else {
        throw new Error(result.error || 'Failed to generate AI summary')
      }
    } catch (error) {
      console.error('AI Summary Error:', error)
      toast.error('Không thể tạo tóm tắt AI. Vui lòng thử lại.')
      setError(error instanceof Error ? error.message : 'AI summarization failed')
    } finally {
      setGeneratingAiSummary(false)
    }
  }

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

                  {/* Daily Sent Status Indicator */}
                  {lessons.some(lesson => lesson.feedback) && dailySentStatus.sent && (
                    <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
                      <Check className="h-4 w-4" />
                      <span>Đã gửi phụ huynh ({dailySentStatus.feedbackCount} feedback)</span>
                    </div>
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

          {/* AI Summary & Send Section */}
          {!loading && !error && lessons.length > 0 && (
            <div className="space-y-4 border-t pt-6">
              {/* AI Summary Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Tóm Tắt AI & Theo Dõi Tiến Bộ
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateAiSummary}
                      disabled={generatingAiSummary || lessons.filter(l => l.feedback).length === 0}
                    >
                      {generatingAiSummary ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Tạo Tóm Tắt & Theo Dõi Tiến Bộ
                        </>
                      )}
                    </Button>
                    {aiSummary && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAiSummary(!showAiSummary)}
                      >
                        {showAiSummary ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" />
                            Ẩn
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* AI Summary Display */}
                {showAiSummary && aiSummary && (
                  <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <AlertDescription className="text-sm">
                      <div className="space-y-2">
                        <p className="font-medium text-purple-800 dark:text-purple-200">
                          Tóm tắt AI cho phụ huynh:
                        </p>
                        <div className="bg-white dark:bg-gray-900 rounded-md p-3 border">
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                            {aiSummary}
                          </p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Option to use AI summary */}
                {aiSummary && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="useAiSummary"
                      checked={useAiSummary}
                      onChange={(e) => setUseAiSummary(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="useAiSummary" className="text-sm">
                      Gửi tóm tắt AI thay vì feedback chi tiết
                    </Label>
                  </div>
                )}
              </div>

              {/* Send to Parents Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {dailySentStatus.sent ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <Check className="h-4 w-4" />
                      <span>Đã gửi feedback cho phụ huynh</span>
                      {dailySentStatus.sentAt && (
                        <span className="text-xs">
                          ({new Date(dailySentStatus.sentAt).toLocaleString('vi-VN')})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span>Gửi tất cả feedback ngày này cho phụ huynh</span>
                  )}
                </div>
                <Button
                  onClick={handleSendDailyFeedbackToParents}
                  disabled={sendingDailyFeedback || dailySentStatus.sent || lessons.filter(l => l.feedback).length === 0}
                  className="min-w-[140px]"
                >
                  {sendingDailyFeedback ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      {useAiSummary && aiSummary ? 'Gửi Tóm Tắt AI' : 'Gửi Feedback'}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
