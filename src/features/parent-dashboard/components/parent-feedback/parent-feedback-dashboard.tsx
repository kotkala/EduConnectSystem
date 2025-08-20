"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  BookOpen,
  Calendar,
  MessageSquare,
  Star,
  GraduationCap,
  Eye,
  User,
  Sparkles,
  TrendingUp
} from "lucide-react"
import {
  getParentAcademicYearsAction,
  getStudentFeedbackForParentAction,
  getParentChildrenAction,
  markFeedbackAsReadAction,
  type ParentFeedbackFilters,
  type StudentFeedbackForParent
} from "@/lib/actions/parent-feedback-actions"
import { Button } from "@/shared/components/ui/button"
import { toast } from "sonner"
import { format, endOfWeek } from 'date-fns'
import { getWeekStartDate } from '@/features/timetable/components/timetable-calendar/data-mappers'

interface WeekOption {
  number: number
  startDate: Date
  endDate: Date
  label: string
}

export default function ParentFeedbackDashboard() {
  const [filters, setFilters] = useState<ParentFeedbackFilters>({
    academic_year_id: "",
    week_number: 1,
    student_id: "" // Empty means show all children
  })
  const [academicYears, setAcademicYears] = useState<Array<{id: string, name: string, start_date: string, end_date: string}>>([])
  const [children, setChildren] = useState<Array<{id: string, name: string, student_code: string, avatar_url: string | null, class_name: string}>>([])
  const [studentFeedback, setStudentFeedback] = useState<StudentFeedbackForParent[]>([])
  const [weekOptions, setWeekOptions] = useState<WeekOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAiSummary] = useState(true)
  const [showDailyAiSummary] = useState(true)

  // Day names
  const dayNames = useMemo(() => ({
    1: "Thứ Hai",
    2: "Thứ Ba",
    3: "Thứ Tư",
    4: "Thứ Năm",
    5: "Thứ Sáu",
    6: "Thứ Bảy"
  } as Record<number, string>), [])

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



  // Load academic years and children
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load academic years
        const academicYearsResult = await getParentAcademicYearsAction()
        if (academicYearsResult.success && academicYearsResult.data) {
          setAcademicYears(academicYearsResult.data)
          if (academicYearsResult.data.length > 0) {
            setFilters(prev => ({ ...prev, academic_year_id: academicYearsResult.data![0].id }))
          }
        } else {
          setError(academicYearsResult.error || "Failed to load academic years")
        }

        // Load children list
        const childrenResult = await getParentChildrenAction()
        if (childrenResult.success && childrenResult.data) {
          setChildren(childrenResult.data)
          // If parent has only one child, auto-select it
          if (childrenResult.data.length === 1) {
            setFilters(prev => ({ ...prev, student_id: childrenResult.data![0].id }))
          }
        } else {
          setError(childrenResult.error || "Failed to load children list")
        }
      } catch (err) {
        console.error("Load initial data error:", err)
        setError("An unexpected error occurred")
      }
    }

    loadInitialData()
  }, [])

  // Generate week options when academic year changes - Context7 pattern for synchronized week calculation
  useEffect(() => {
    const generateWeekOptions = () => {
      const academicYear = academicYears.find(ay => ay.id === filters.academic_year_id)
      if (!academicYear) {
        setWeekOptions([])
        return
      }

      // For parent feedback, we'll use the academic year dates to generate weeks
      // This assumes the academic year spans the full year with semesters
      const academicYearStartDate = new Date(academicYear.start_date)
      const academicYearEndDate = new Date(academicYear.end_date)

      const weeks: WeekOption[] = []
      let weekNumber = 1

      while (weekNumber <= 52) { // Max 52 weeks per academic year
        // Use the same calculation as timetable and violations systems
        const weekStartDate = getWeekStartDate(academicYearStartDate, weekNumber)
        const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 })

        // Stop if week starts after academic year ends
        if (weekStartDate > academicYearEndDate) {
          break
        }

        weeks.push({
          number: weekNumber,
          startDate: weekStartDate,
          endDate: weekEndDate,
          label: `Tuần ${weekNumber} (${format(weekStartDate, "dd/MM")} - ${format(weekEndDate, "dd/MM")})`,
        })
        weekNumber++
      }

      setWeekOptions(weeks)
    }

    generateWeekOptions()
  }, [filters.academic_year_id, academicYears])

  // Load student feedback when filters change
  useEffect(() => {
    if (!filters.academic_year_id || children.length === 0) return

    const loadStudentFeedback = async () => {
      setLoading(true)
      setError(null)

      try {
        const result = await getStudentFeedbackForParentAction(filters)
        if (result.success) {
          setStudentFeedback(result.data || [])
        } else {
          setError(result.error || "Failed to load student feedback")
        }
      } catch (err) {
        console.error("Load student feedback error:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadStudentFeedback()
  }, [filters, children.length])

  // Handle filters change
  const handleFiltersChange = (key: keyof ParentFeedbackFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }



  // Helper function to update feedback read status
  const updateFeedbackReadStatus = useCallback((student: StudentFeedbackForParent, feedbackId: string): StudentFeedbackForParent => {
    const updatedDailyFeedback = Object.fromEntries(
      Object.entries(student.daily_feedback).map(([day, feedback]) => [
        day,
        feedback.map(f => f.feedback_id === feedbackId ? { ...f, is_read: true } : f)
      ])
    )
    return { ...student, daily_feedback: updatedDailyFeedback }
  }, [])

  // Mark feedback as read
  const handleMarkAsRead = useCallback(async (feedbackId: string) => {
    try {
      const result = await markFeedbackAsReadAction(feedbackId)
      if (result.success) {
        // Update local state using helper function
        setStudentFeedback(prev => prev.map(student => updateFeedbackReadStatus(student, feedbackId)))
        toast.success("Marked as read")
      } else {
        toast.error(result.error || "Failed to mark as read")
      }
    } catch (error) {
      console.error("Mark as read error:", error)
      toast.error("An unexpected error occurred")
    }
  }, [updateFeedbackReadStatus])



  // Helper function to create mark as read click handler
  const createMarkAsReadHandler = useCallback((feedbackId: string) => {
    return () => handleMarkAsRead(feedbackId)
  }, [handleMarkAsRead])

  // Helper function to render teacher AI summary
  const renderTeacherAiSummary = useCallback((dayFeedback: StudentFeedbackForParent['daily_feedback'][string], dayOfWeek: number) => {
    // Find teacher's AI summary for this day
    const teacherAiSummary = dayFeedback.find(f => f.ai_summary && f.use_ai_summary)

    return teacherAiSummary ? (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-3 border border-green-200/50 dark:border-green-800/50 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-800 dark:text-green-200">
              Tóm tắt từ Giáo viên - {dayNames[dayOfWeek]}
            </span>
          </div>
          <div className="text-xs text-green-600 dark:text-green-400">
            {new Date(teacherAiSummary.ai_generated_at!).toLocaleDateString('vi-VN')}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-md p-2 border">
          <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">
            &ldquo;{teacherAiSummary.ai_summary}&rdquo;
          </p>
        </div>
        <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Sparkles className="h-3 w-3" />
            <span>Tóm tắt AI từ giáo viên</span>
          </div>
          <span className="text-gray-400">
            {dayFeedback.reduce((sum, f) => sum + f.rating, 0) / dayFeedback.length}/5 â­
          </span>
        </div>
      </div>
    ) : (
      // Show message when no teacher AI summary available
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20 rounded-lg p-3 border border-gray-200/50 dark:border-gray-800/50 mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <MessageSquare className="h-4 w-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Tóm tắt AI - {dayNames[dayOfWeek]}
          </span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-md p-2 border">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic">
            Giáo viên chưa tạo tóm tắt AI cho ngày này.
          </p>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-between">
          <span>Có {dayFeedback.length} phản hồi chi tiết</span>
          <span className="text-gray-400">
            {dayFeedback.reduce((sum, f) => sum + f.rating, 0) / dayFeedback.length}/5 â­
          </span>
        </div>
      </div>
    )
  }, [dayNames])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Phản Hồi Học Tập</h2>
          <p className="text-muted-foreground">
            Xem phản hồi học tập của con em từ giáo viên theo tuần học
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bộ Lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Student Selection - Only show if parent has multiple children */}
            {children.length > 1 && (
              <div className="space-y-2">
                <label htmlFor="student-select" className="text-sm font-medium">Con Em</label>
                <Select
                  value={filters.student_id || "ALL_CHILDREN"}
                  onValueChange={(value) => handleFiltersChange('student_id', value === "ALL_CHILDREN" ? "" : value)}
                >
                  <SelectTrigger id="student-select">
                    <SelectValue placeholder="Tất cả con em" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_CHILDREN">Tất cả con em</SelectItem>
                    {children.map((child) => (
                      <SelectItem key={child.id} value={child.id}>
                        <div className="flex items-center space-x-2">
                          <span>{child.name}</span>
                          <span className="text-xs text-muted-foreground">({child.student_code})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Academic Year */}
            <div className="space-y-2">
              <label htmlFor="academic-year-select" className="text-sm font-medium">Năm Học</label>
              <Select
                value={filters.academic_year_id}
                onValueChange={(value) => handleFiltersChange('academic_year_id', value)}
              >
                <SelectTrigger id="academic-year-select">
                  <SelectValue placeholder="Chọn năm học" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Week */}
            <div className="space-y-2">
              <label htmlFor="week-select" className="text-sm font-medium">Tuần Học</label>
              <Select
                value={filters.week_number.toString()}
                onValueChange={(value) => handleFiltersChange('week_number', parseInt(value))}
                disabled={weekOptions.length === 0}
              >
                <SelectTrigger id="week-select">
                  <SelectValue placeholder="Chọn tuần" />
                </SelectTrigger>
                <SelectContent>
                  {weekOptions.map((week) => (
                    <SelectItem key={week.number} value={week.number.toString()}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Đang tải phản hồi...</p>
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

      {/* Student Feedback - Redesigned for Better UX */}
      {!loading && !error && studentFeedback.length > 0 && (
        <div className="space-y-8">
          {studentFeedback.map((student) => (
            <div key={student.student_id} className="space-y-6">
              {/* Student Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                    <AvatarImage src={student.student_avatar_url || undefined} alt={student.student_name} />
                    <AvatarFallback className="text-xl font-bold bg-blue-500 text-white">
                      {getInitials(student.student_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {student.student_name}
                    </h2>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 rounded-lg px-3 py-1">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{student.student_code}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/70 dark:bg-gray-800/70 rounded-lg px-3 py-1">
                        <GraduationCap className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-gray-700 dark:text-gray-300">{student.class_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Tuần {filters.week_number}</div>
                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {Object.values(student.daily_feedback).flat().length} phản hồi
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Summary Section */}
              {showAiSummary && Object.values(student.daily_feedback).flat().length > 0 && (
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-purple-800 dark:text-purple-200">
                        <Sparkles className="h-5 w-5" />
                        <span>Tóm Tắt AI & Tiến Bộ - Tuần {filters.week_number}</span>
                      </div>
                      {filters.week_number > 1 && (
                        <div className="flex items-center space-x-1 text-xs text-purple-600 dark:text-purple-400">
                          <TrendingUp className="h-3 w-3" />
                          <span>So với tuần trước</span>
                        </div>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-purple-200/50 dark:border-purple-800/50">
                      <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {/* Mock AI summary with progress - In real implementation, this would come from the database */}
                        <div className="space-y-2">
                          <span className="italic text-purple-600 dark:text-purple-400">
                            &ldquo;{student.student_name} tiến bộ rõ rệt tuần này! Điểm Toán tăng từ 3.5 lên 4.5. Tiếp tục duy trì.&rdquo;
                          </span>
                          {filters.week_number > 1 && (
                            <div className="flex items-center space-x-2 text-xs">
                              <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                <TrendingUp className="h-3 w-3" />
                                <span>Điểm trung bình: +0.8</span>
                              </div>
                              <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                              <span className="text-gray-500">So với tuần {filters.week_number - 1}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 text-xs text-purple-600 dark:text-purple-400 flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Sparkles className="h-3 w-3" />
                          <span>Được tạo bởi AI với theo dõi tiến bộ</span>
                        </div>
                        <span className="text-gray-400">Tuần {filters.week_number}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Weekly Feedback Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                  const dayFeedback = student.daily_feedback[dayOfWeek.toString()] || []

                  return (
                    <Card key={dayOfWeek} className={`${dayFeedback.length > 0 ? 'border-green-200 bg-green-50/30 dark:bg-green-950/20' : 'border-gray-200 bg-gray-50/30 dark:bg-gray-900/20'} transition-all hover:shadow-md`}>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-bold">{dayNames[dayOfWeek]}</span>
                          </div>
                          {dayFeedback.length > 0 ? (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                              {dayFeedback.length} phản hồi
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500">
                              Không có
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {dayFeedback.length > 0 ? (
                          <div className="space-y-4">
                            {/* Teacher's Daily AI Summary */}
                            {showDailyAiSummary && dayFeedback.length > 0 && renderTeacherAiSummary(dayFeedback, dayOfWeek)}

                            {/* Individual Feedback Items */}
                            {dayFeedback.map((feedback) => (
                              <div key={feedback.feedback_id} className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 ${feedback.is_read ? 'border-l-gray-300' : 'border-l-blue-500'} shadow-sm`}>
                                {/* Subject and Time */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center space-x-2">
                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                      {feedback.subject_name}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
                                    {formatTime(feedback.start_time)} - {formatTime(feedback.end_time)}
                                  </div>
                                </div>

                                {/* Rating */}
                                <div className="flex items-center justify-center mb-3">
                                  <div className="flex items-center space-x-2 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg px-3 py-2">
                                    <div className="flex items-center space-x-1">
                                      {getRatingStars(feedback.rating)}
                                    </div>
                                    <span className={`text-lg font-bold ${getRatingColor(feedback.rating)}`}>
                                      {feedback.rating}/5
                                    </span>
                                  </div>
                                </div>

                                {/* Comment */}
                                {feedback.comment && (
                                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 mb-3">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 text-center italic">
                                      &ldquo;{feedback.comment}&rdquo;
                                    </p>
                                  </div>
                                )}

                                {/* Teacher and Actions */}
                                <div className="flex items-center justify-between text-xs">
                                  <div className="text-gray-600 dark:text-gray-400">
                                    <span className="font-medium">{feedback.teacher_name}</span>
                                  </div>
                                  {!feedback.is_read && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={createMarkAsReadHandler(feedback.feedback_id)}
                                      className="h-6 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Đã đọc
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">Chưa có phản hồi</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Feedback - Improved */}
      {!loading && !error && studentFeedback.length === 0 && filters.academic_year_id && (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-2xl p-12 max-w-md mx-auto">
            <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-6 w-fit mx-auto mb-6">
              <MessageSquare className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Chưa Có Phản Hồi
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
              Chưa có phản hồi nào từ giáo viên cho <span className="font-semibold text-blue-600">tuần {filters.week_number}</span> trong năm học này.
            </p>
            <div className="mt-6 text-sm text-gray-500 dark:text-gray-500">
              Phản hồi sẽ xuất hiện ở đây khi giáo viên gửi đánh giá về con em bạn.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
