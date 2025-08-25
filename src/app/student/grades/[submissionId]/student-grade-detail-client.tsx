'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { BookOpen, Calendar, User, Award, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

import { getStudentGradeSubmissionDetailAction } from '@/lib/actions/student-grade-actions'

interface Grade {
  value: number
  component_type: string
  weight: number
}

interface SubjectGrade {
  subject: {
    id: string
    code: string
    name_vietnamese: string
    category: string
  }
  grades: Grade[]
  average: number
}

interface StudentGradeDetail {
  id: string
  student: {
    id: string
    full_name: string
    student_id: string
  }
  period?: {
    id: string
    name: string
    start_date: string
    end_date: string
  }
  class_id: string
  grades: SubjectGrade[]
  ai_feedback?: string
  teacher_notes?: string
  submitted_at: string
}

interface StudentGradeDetailClientProps {
  readonly submissionId: string
}

export default function StudentGradeDetailClient({ submissionId }: StudentGradeDetailClientProps) {
  const [gradeDetail, setGradeDetail] = useState<StudentGradeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadGradeDetail = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getStudentGradeSubmissionDetailAction(submissionId)

      if (result.success && result.data) {
        setGradeDetail(result.data)
      } else {
        setError(result.error || 'Không thể tải chi tiết bảng điểm')
        toast.error(result.error || 'Không thể tải chi tiết bảng điểm')
      }
    } catch (error) {
      console.error('Error loading grade detail:', error)
      setError('Có lỗi xảy ra khi tải dữ liệu')
      toast.error('Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [submissionId])

  useEffect(() => {
    loadGradeDetail()
  }, [loadGradeDetail])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 8) return 'text-green-600'
    if (grade >= 6.5) return 'text-blue-600'
    if (grade >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeBadgeVariant = (grade: number) => {
    if (grade >= 8) return 'default'
    if (grade >= 6.5) return 'secondary'
    if (grade >= 5) return 'outline'
    return 'destructive'
  }

  const calculateOverallAverage = () => {
    if (!gradeDetail?.grades || gradeDetail.grades.length === 0) return 0
    const total = gradeDetail.grades.reduce((sum, subject) => sum + subject.average, 0)
    return total / gradeDetail.grades.length
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !gradeDetail) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không thể tải bảng điểm
          </h3>
          <p className="text-gray-600">
            {error || 'Bảng điểm không tồn tại hoặc bạn không có quyền truy cập'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Thông tin học sinh
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Họ và tên</p>
              <p className="font-medium">{gradeDetail.student.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Mã số học sinh</p>
              <p className="font-medium">{gradeDetail.student.student_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lớp</p>
              <p className="font-medium">{gradeDetail.class_id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kỳ báo cáo</p>
              <p className="font-medium">{gradeDetail.period?.name || 'Chưa xác định'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overall Average */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Điểm trung bình tổng kết
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className={`text-4xl font-bold ${getGradeColor(calculateOverallAverage())}`}>
              {calculateOverallAverage().toFixed(2)}
            </div>
            <p className="text-muted-foreground mt-2">
              Điểm trung bình tất cả các môn học
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subject Grades */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Chi tiết điểm theo môn học
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {gradeDetail.grades.map((subjectGrade) => (
              <div key={subjectGrade.subject.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold">{subjectGrade.subject.name_vietnamese}</h3>
                    <p className="text-sm text-muted-foreground">Mã môn: {subjectGrade.subject.code}</p>
                  </div>
                  <Badge variant={getGradeBadgeVariant(subjectGrade.average)} className="text-lg px-3 py-1">
                    {subjectGrade.average.toFixed(1)}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Chi tiết điểm số</p>
                    <div className="flex flex-wrap gap-2">
                      {subjectGrade.grades.length > 0 ? (
                        subjectGrade.grades.map((grade, index) => (
                          <div key={`${subjectGrade.subject.id}-${index}`} className="flex flex-col items-center">
                            <Badge variant="outline" className={getGradeColor(grade.value)}>
                              {grade.value.toFixed(1)}
                            </Badge>
                            <span className="text-xs text-muted-foreground mt-1">
                              {grade.component_type}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Chưa có điểm</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Teacher Feedback */}
      {(gradeDetail.teacher_notes || gradeDetail.ai_feedback) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Nhận xét và phản hồi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gradeDetail.teacher_notes && (
              <div>
                <p className="text-sm font-medium mb-2">Nhận xét của giáo viên</p>
                <p className="text-muted-foreground">{gradeDetail.teacher_notes}</p>
              </div>
            )}
            {gradeDetail.ai_feedback && (
              <div>
                <p className="text-sm font-medium mb-2">Phân tích AI</p>
                <p className="text-muted-foreground">{gradeDetail.ai_feedback}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submission Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Thông tin bảng điểm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Ngày nộp bảng điểm</p>
              <p className="font-medium">{formatDate(gradeDetail.submitted_at)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Thời gian kỳ báo cáo</p>
              <p className="font-medium">
                {gradeDetail.period ?
                  `${formatDate(gradeDetail.period.start_date)} - ${formatDate(gradeDetail.period.end_date)}` :
                  'Chưa xác định'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
