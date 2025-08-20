"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import {
  User,
  BookOpen,
  MessageSquare,
  Star,
  Calendar
} from "lucide-react"
import { type StudentWeeklySchedule } from "@/features/grade-management/actions/homeroom-feedback-actions"

interface StudentWeeklyGridProps {
  readonly students: StudentWeeklySchedule[]
  readonly onStudentDayClick: (student: StudentWeeklySchedule, dayOfWeek: number) => void
  readonly loading?: boolean
}

export function StudentWeeklyGrid({
  students,
  onStudentDayClick,
  loading = false
}: StudentWeeklyGridProps) {
  // Get day names in Vietnamese
  const dayNames = ['', 'Thồ© Hai', 'Thồ© Ba', 'Thồ© TÆ°', 'Thồ© Năm', 'Thồ© SÃ¡u', 'Thồ© Báº£y']

  // Get initials for avatar
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get feedback statistics for a day
  const getDayStats = (lessons: Array<{ feedback?: { rating: number } }>) => {
    const totalLessons = lessons.length
    const lessonsWithFeedback = lessons.filter(lesson => lesson.feedback).length
    const averageRating = lessons
      .filter(lesson => lesson.feedback)
      .reduce((sum, lesson) => sum + (lesson.feedback?.rating || 0), 0) / lessonsWithFeedback || 0

    return {
      totalLessons,
      lessonsWithFeedback,
      averageRating: Math.round(averageRating * 10) / 10,
      feedbackPercentage: totalLessons > 0 ? Math.round((lessonsWithFeedback / totalLessons) * 100) : 0
    }
  }

  // Get color for feedback percentage
  const getFeedbackColor = (percentage: number): string => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    if (percentage >= 40) return "text-orange-600"
    return "text-red-600"
  }

  // Get color for rating
  const getRatingColor = (rating: number): string => {
    if (rating >= 4.5) return "text-green-600"
    if (rating >= 3.5) return "text-yellow-600"
    if (rating >= 2.5) return "text-orange-600"
    return "text-red-600"
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Äang tải dữ liệu...</p>
        </CardContent>
      </Card>
    )
  }

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Không Có Hồc Sinh</h3>
          <p className="text-muted-foreground">
            Không có hồc sinh nÃ o trong lớp chủ nhiệm cho tuần Ä‘Ã£ chồn.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {students.map((student) => (
        <Card key={student.student_id} className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={student.student_avatar_url || undefined} alt={student.student_name} />
                <AvatarFallback>{getInitials(student.student_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">{student.student_name}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>MSSV: {student.student_code}</span>
                  <span>Lớp: {student.class_name}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                const lessons = student.daily_schedules[dayOfWeek.toString()] || []
                const stats = getDayStats(lessons)
                
                return (
                  <div key={dayOfWeek} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{dayNames[dayOfWeek]}</h4>
                      <Badge variant="outline" className="text-xs">
                        {stats.totalLessons} tiết
                      </Badge>
                    </div>
                    
                    <Button
                      variant="outline"
                      className="w-full h-auto p-3 flex flex-col items-start space-y-2"
                      onClick={() => onStudentDayClick(student, dayOfWeek)}
                      disabled={stats.totalLessons === 0}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center space-x-1">
                          <BookOpen className="h-3 w-3" />
                          <span className="text-xs">{stats.totalLessons} tiết</span>
                        </div>
                        {stats.lessonsWithFeedback > 0 && (
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-3 w-3" />
                            <span className="text-xs">{stats.lessonsWithFeedback}</span>
                          </div>
                        )}
                      </div>
                      
                      {stats.lessonsWithFeedback > 0 && (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span className={`text-xs font-medium ${getRatingColor(stats.averageRating)}`}>
                              {stats.averageRating.toFixed(1)}
                            </span>
                          </div>
                          <span className={`text-xs font-medium ${getFeedbackColor(stats.feedbackPercentage)}`}>
                            {stats.feedbackPercentage}%
                          </span>
                        </div>
                      )}
                      
                      {stats.totalLessons > 0 && stats.lessonsWithFeedback === 0 && (
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">Chưa có pháº£n hồ“i</span>
                        </div>
                      )}
                      
                      {stats.totalLessons === 0 && (
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className="text-xs">Không có tiết hồc</span>
                        </div>
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
