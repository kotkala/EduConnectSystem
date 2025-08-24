'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Eye, Award } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { getStudentGradeSubmissionsAction } from '@/lib/actions/student-grade-actions'

interface GradeSubmission {
  id: string
  submission_name: string
  student_id: string
  created_at: string
  student: {
    id: string
    full_name: string
    student_id: string
  }
  class: {
    name: string
    homeroom_teacher: {
      full_name: string
    }
  }
  semester: {
    name: string
  }
  academic_year: {
    name: string
  }
  grades: Array<{
    subject: {
      id: string
      code: string
      name_vietnamese: string
      category: string
    }
    grades: Array<{
      value: number
      component_type: string
      weight: number
    }>
    average: number
  }>
  ai_feedback?: string
  teacher_notes?: string
  sent_to_parents_at: string
}

export default function StudentGradesSimple() {
  const [loading, setLoading] = useState(true)
  const [gradeSubmissions, setGradeSubmissions] = useState<GradeSubmission[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [availablePeriods, setAvailablePeriods] = useState<Array<{id: string, name: string}>>([])

  // Load grade submissions
  const loadGradeSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getStudentGradeSubmissionsAction()

      if (result.success && result.data) {
        const submissions = result.data as GradeSubmission[]
        setGradeSubmissions(submissions)

        // Extract unique periods
        const periods = submissions.reduce((acc, submission) => {
          const periodExists = acc.some(p => p.name === submission.semester.name)
          if (!periodExists) {
            acc.push({
              id: submission.semester.name, // Using name as ID since we don't have semester ID
              name: submission.semester.name
            })
          }
          return acc
        }, [] as Array<{id: string, name: string}>)
        setAvailablePeriods(periods)
      } else {
        toast.error(result.error || 'Không thể tải dữ liệu điểm')
        setGradeSubmissions([])
      }
    } catch (error) {
      console.error('Error loading grade submissions:', error)
      toast.error('Có lỗi xảy ra khi tải dữ liệu điểm')
      setGradeSubmissions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGradeSubmissions()
  }, [loadGradeSubmissions])

  // Filter submissions by selected period
  const filteredSubmissions = selectedPeriod === 'all'
    ? gradeSubmissions
    : gradeSubmissions.filter(submission => submission.semester.name === selectedPeriod)

  // Handle view submission details
  const handleViewSubmission = useCallback((submission: GradeSubmission) => {
    // Navigate to detailed grade view
    const url = `/student/grades/${submission.id}`
    window.open(url, '_blank')
    toast.success(`Đang mở chi tiết bảng điểm`)
  }, [])



  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-muted-foreground">Đang tải bảng điểm...</span>
      </div>
    )
  }

  if (gradeSubmissions.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="Không có bảng điểm"
        description="Chưa có bảng điểm nào được giáo viên gửi"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bảng điểm của tôi</h1>
          <p className="text-gray-600">Xem bảng điểm đã được giáo viên gửi</p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="period-select" className="text-sm font-medium">
            Kỳ báo cáo:
          </label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Chọn kỳ báo cáo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kỳ</SelectItem>
              {availablePeriods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bảng điểm</p>
                <p className="text-2xl font-bold">{filteredSubmissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Môn học</p>
                <p className="text-2xl font-bold">
                  {filteredSubmissions.reduce((total, submission) => total + submission.grades.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.map((submission) => (
          <Card key={submission.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{submission.student.full_name}</CardTitle>
                  <CardDescription>
                    Mã HS: {submission.student.student_id} • {submission.class.name} • {submission.grades.length} bảng điểm
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Subject codes */}
                <div className="flex flex-wrap gap-2">
                  {submission.grades.slice(0, 5).map((grade) => (
                    <span key={grade.subject.id} className="px-2 py-1 bg-gray-100 rounded text-sm">
                      {grade.subject.code}
                    </span>
                  ))}
                  {submission.grades.length > 5 && (
                    <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                      +{submission.grades.length - 5} môn khác
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleViewSubmission(submission)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    {submission.semester.name}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
