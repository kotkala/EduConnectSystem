"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  BookOpen,
  Calendar,
  MessageSquare,
  Star,
  GraduationCap,
  Eye,
  User
} from "lucide-react"
import {
  getParentAcademicYearsAction,
  getStudentFeedbackForParentAction,
  markFeedbackAsReadAction,
  type ParentFeedbackFilters,
  type StudentFeedbackForParent
} from "@/lib/actions/parent-feedback-actions"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function ParentFeedbackDashboard() {
  const [filters, setFilters] = useState<ParentFeedbackFilters>({
    academic_year_id: "",
    week_number: 1
  })
  const [academicYears, setAcademicYears] = useState<Array<{id: string, name: string}>>([])
  const [studentFeedback, setStudentFeedback] = useState<StudentFeedbackForParent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Day names
  const dayNames: Record<number, string> = {
    1: "Thứ Hai",
    2: "Thứ Ba", 
    3: "Thứ Tư",
    4: "Thứ Năm",
    5: "Thứ Sáu"
  }

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

  // Load academic years
  useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        const result = await getParentAcademicYearsAction()
        if (result.success && result.data) {
          setAcademicYears(result.data)
          if (result.data.length > 0) {
            setFilters(prev => ({ ...prev, academic_year_id: result.data![0].id }))
          }
        } else {
          setError(result.error || "Failed to load academic years")
        }
      } catch (err) {
        console.error("Load academic years error:", err)
        setError("An unexpected error occurred")
      }
    }

    loadAcademicYears()
  }, [])

  // Load student feedback when filters change
  useEffect(() => {
    if (!filters.academic_year_id) return

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
  }, [filters])

  // Handle filters change
  const handleFiltersChange = (key: keyof ParentFeedbackFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Mark feedback as read
  const handleMarkAsRead = async (feedbackId: string) => {
    try {
      const result = await markFeedbackAsReadAction(feedbackId)
      if (result.success) {
        // Update local state
        setStudentFeedback(prev => 
          prev.map(student => ({
            ...student,
            daily_feedback: Object.fromEntries(
              Object.entries(student.daily_feedback).map(([day, feedback]) => [
                day,
                feedback.map(f => 
                  f.feedback_id === feedbackId ? { ...f, is_read: true } : f
                )
              ])
            )
          }))
        )
        toast.success("Marked as read")
      } else {
        toast.error(result.error || "Failed to mark as read")
      }
    } catch (error) {
      console.error("Mark as read error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Phản Hồi Học Tập</h2>
        <p className="text-muted-foreground">
          Xem phản hồi học tập của con em từ giáo viên theo tuần học
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bộ Lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Academic Year */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Năm Học</label>
              <Select
                value={filters.academic_year_id}
                onValueChange={(value) => handleFiltersChange('academic_year_id', value)}
              >
                <SelectTrigger>
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
              <label className="text-sm font-medium">Tuần Học</label>
              <Select
                value={filters.week_number.toString()}
                onValueChange={(value) => handleFiltersChange('week_number', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn tuần" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                    <SelectItem key={week} value={week.toString()}>
                      Tuần {week}
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

              {/* Weekly Feedback Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5].map((dayOfWeek) => {
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
                                      onClick={() => handleMarkAsRead(feedback.feedback_id)}
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
