'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Save, Sparkles, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

import { getSubmittedStudentGradeDetailsAction, getPeriodsWithSubmissionsAction } from '@/lib/actions/detailed-grade-actions'
import { createAIFeedbackAction, getAIFeedbackForStudentAction, updateGradeSubmissionFeedbackAction } from '@/lib/actions/enhanced-grade-actions'
import { getGradeReportingPeriodsForTeachersAction } from '@/lib/actions/grade-management-actions'

interface SubjectGrade {
  subject_id: string
  subject_name: string
  subject_code: string
  grades: {
    regular: number[]
    midterm: number | null
    final: number | null
    summary: number | null
  }
}

interface SubmittedStudentData {
  submission: {
    id: string
    submission_count: number
    status: string
    submitted_at: string
  }
  student: {
    id: string
    full_name: string
    student_id: string
  }
  class: {
    id: string
    name: string
  }
  period: {
    id: string
    name: string
  }
  subjects: SubjectGrade[]
}

interface GradeReportingPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  academic_year: { name: string }
  semester: { name: string }
}

interface TeacherStudentGradeDetailClientProps {
  studentId: string
}

export function TeacherStudentGradeDetailClient({ studentId }: Readonly<TeacherStudentGradeDetailClientProps>) {
  const [loading, setLoading] = useState(true)
  const [studentData, setStudentData] = useState<SubmittedStudentData | null>(null)
  const [periods, setPeriods] = useState<GradeReportingPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  
  // AI Feedback states
  const [aiFeedback, setAiFeedback] = useState('')
  const [feedbackStyle, setFeedbackStyle] = useState<'friendly' | 'serious' | 'encouraging' | 'understanding'>('friendly')
  const [feedbackLength, setFeedbackLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)
  const [isSavingFeedback, setIsSavingFeedback] = useState(false)
  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(false)
  const [existingFeedbackId, setExistingFeedbackId] = useState<string | null>(null)
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false)

  // Load periods
  const loadPeriods = useCallback(async () => {
    try {
      // Load all periods
      const periodsResult = await getGradeReportingPeriodsForTeachersAction({ limit: 100 })

      // Load periods with submissions
      const submissionsResult = await getPeriodsWithSubmissionsAction()

      if (periodsResult.success && periodsResult.data) {
        const periodsData = periodsResult.data as unknown as GradeReportingPeriod[]
        setPeriods(periodsData)

        // Smart period selection: prioritize periods with submissions
        if (submissionsResult.success && submissionsResult.data) {
          const submissionPeriodIds = submissionsResult.data.map(p => p.id)

          // Auto-select the first period with submissions, or active period as fallback
          if (submissionPeriodIds.length > 0) {
            setSelectedPeriod(submissionPeriodIds[0])
          } else {
            const activePeriod = periodsData.find((period) => period.is_active === true)
            if (activePeriod) {
              setSelectedPeriod(activePeriod.id)
            }
          }
        } else {
          // Fallback to active period if submissions loading fails
          const activePeriod = periodsData.find((period) => period.is_active === true)
          if (activePeriod) {
            setSelectedPeriod(activePeriod.id)
          }
        }
      }
    } catch (error) {
      console.error('Error loading periods:', error)
      toast.error('Không thể tải danh sách kỳ báo cáo')
    }
  }, [])

  // Load student grades
  const loadStudentGrades = useCallback(async () => {
    if (!selectedPeriod) {
      setStudentData(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const result = await getSubmittedStudentGradeDetailsAction(selectedPeriod, studentId)

      if (result.success && result.data) {
        setStudentData(result.data)
      } else {
        console.error('Error loading student grades:', result.error)
        toast.error(result.error || 'Không thể tải điểm số học sinh')
        setStudentData(null)
      }
    } catch (error) {
      console.error('Error loading student grades:', error)
      toast.error('Không thể tải điểm số học sinh')
      setStudentData(null)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, studentId])

  // Load periods on mount
  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  // Load existing AI feedback
  const loadExistingFeedback = useCallback(async () => {
    if (!selectedPeriod || !studentId) return

    setIsLoadingFeedback(true)
    try {
      const result = await getAIFeedbackForStudentAction(studentId, selectedPeriod)
      if (result.success && result.data) {
        setAiFeedback(result.data.feedback_content)
        setFeedbackStyle(result.data.feedback_style)
        setFeedbackLength(result.data.feedback_length)
        setExistingFeedbackId(result.data.id)
      } else {
        // No existing feedback, reset form
        setAiFeedback('')
        setFeedbackStyle('friendly')
        setFeedbackLength('medium')
        setExistingFeedbackId(null)
      }
    } catch (error) {
      console.error('Error loading existing feedback:', error)
      // Don't show error toast for missing feedback, it's normal
    } finally {
      setIsLoadingFeedback(false)
    }
  }, [selectedPeriod, studentId])

  // Load grades when period changes
  useEffect(() => {
    loadStudentGrades()
    loadExistingFeedback()
  }, [loadStudentGrades, loadExistingFeedback])

  // Generate AI feedback
  const generateAIFeedback = useCallback(async () => {
    if (!studentData || studentData.subjects.length === 0) {
      toast.error('Không có dữ liệu điểm số để tạo đánh giá')
      return
    }

    setIsGeneratingFeedback(true)
    try {
      // Transform grades to the format expected by AI API
      const subjectGrades = studentData.subjects.map((subject) => {
        const allGrades = [...subject.grades.regular]
        if (subject.grades.midterm !== null) allGrades.push(subject.grades.midterm)
        if (subject.grades.final !== null) allGrades.push(subject.grades.final)

        const averageGrade = allGrades.length > 0
          ? allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length
          : undefined

        return {
          subjectName: subject.subject_name,
          midtermGrade: subject.grades.midterm,
          finalGrade: subject.grades.final,
          averageGrade
        }
      })

      const gradeData = {
        studentName: studentData.student.full_name,
        studentId: studentData.student.student_id,
        studentCode: studentData.student.student_id,
        subjects: subjectGrades
      }

      const response = await fetch('/api/ai/generate-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gradeData,
          style: feedbackStyle,
          length: feedbackLength
        }),
      })

      const result = await response.json()

      if (result.success) {
        setAiFeedback(result.feedback)
        toast.success('Đã tạo đánh giá AI thành công!')
      } else {
        toast.error(result.error || 'Không thể tạo đánh giá AI')
      }
    } catch (error) {
      console.error('Error generating AI feedback:', error)
      toast.error('Lỗi khi tạo đánh giá AI')
    } finally {
      setIsGeneratingFeedback(false)
    }
  }, [studentData, feedbackStyle, feedbackLength])

  // Save feedback
  const saveFeedback = useCallback(async () => {
    if (!studentData || !aiFeedback.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá')
      return
    }

    if (!selectedPeriod) {
      toast.error('Vui lòng chọn kỳ báo cáo')
      return
    }

    setIsSavingFeedback(true)
    try {
      // Save feedback directly to grade_submissions table so parents can see it
      const result = await updateGradeSubmissionFeedbackAction(
        studentData.class.id,
        selectedPeriod,
        aiFeedback.trim(),
        'Đánh giá được tạo bằng AI và chỉnh sửa bởi giáo viên chủ nhiệm'
      )

      if (result.success) {
        toast.success('Đã lưu đánh giá thành công!')
        setShowDisclaimerDialog(false)

        // Also save to ai_grade_feedback table for teacher reference
        await createAIFeedbackAction({
          student_id: studentData.student.id,
          class_id: studentData.class.id,
          period_id: selectedPeriod,
          feedback_content: aiFeedback.trim(),
          feedback_style: feedbackStyle,
          feedback_length: feedbackLength,
          reason_for_revision: existingFeedbackId ? 'Cập nhật đánh giá' : undefined
        })
      } else {
        toast.error(result.error || 'Không thể lưu đánh giá')
      }
    } catch (error) {
      console.error('Error saving feedback:', error)
      toast.error('Lỗi khi lưu đánh giá')
    } finally {
      setIsSavingFeedback(false)
    }
  }, [studentData, aiFeedback, selectedPeriod, feedbackStyle, feedbackLength, existingFeedbackId])



  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-muted-foreground">Đang tải thông tin học sinh...</span>
      </div>
    )
  }

  if (!studentData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Không tìm thấy dữ liệu</h3>
          <p className="text-gray-600">Không tìm thấy thông tin học sinh hoặc điểm số trong kỳ báo cáo này.</p>
          <Link href="/dashboard/teacher/grade-reports">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/teacher/grade-reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Chi tiết điểm học sinh</h1>
            <p className="text-gray-600">
              {studentData.student.full_name} • Mã HS: {studentData.student.student_id} • Lớp: {studentData.class.name}
            </p>
          </div>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn kỳ báo cáo</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn kỳ báo cáo" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name} - {period.academic_year.name} - {period.semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Grades Table */}
      {studentData.subjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bảng điểm chi tiết</CardTitle>
            <CardDescription>
              Điểm số của học sinh trong kỳ báo cáo đã chọn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Môn học</TableHead>
                    <TableHead>Điểm miệng</TableHead>
                    <TableHead>Điểm giữa kì</TableHead>
                    <TableHead>Điểm cuối kì</TableHead>
                    <TableHead>TBM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentData.subjects.map((subject) => {
                    // Calculate TBM
                    const regularGrades = subject.grades.regular
                    const midtermGrade = subject.grades.midterm
                    const finalGrade = subject.grades.final

                    const allGrades = [...regularGrades]
                    if (midtermGrade !== null) allGrades.push(midtermGrade)
                    if (finalGrade !== null) allGrades.push(finalGrade)

                    const tbm = allGrades.length > 0
                      ? Math.round((allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length) * 10) / 10
                      : null

                    return (
                      <TableRow key={subject.subject_id}>
                        <TableCell className="font-medium">
                          {subject.subject_name}
                        </TableCell>
                        <TableCell>
                          {regularGrades.length > 0
                            ? regularGrades.map(g => g.toFixed(1)).join(', ')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {midtermGrade !== null ? midtermGrade.toFixed(1) : '-'}
                        </TableCell>
                        <TableCell>
                          {finalGrade !== null ? finalGrade.toFixed(1) : '-'}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {tbm !== null ? tbm.toFixed(1) : '-'}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Feedback Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Đánh giá tình hình học tập trong học kì
          </CardTitle>
          <CardDescription>
            Tạo đánh giá bằng AI dựa trên điểm số của học sinh
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI Disclaimer */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Lưu ý:</strong> Thông tin từ AI chỉ mang tính chất tham khảo. Giáo viên nên xem xét và chỉnh sửa phù hợp với tình hình thực tế của học sinh.
            </AlertDescription>
          </Alert>

          {/* Style and Length Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phong cách đánh giá</label>
              <Select value={feedbackStyle} onValueChange={(value: 'friendly' | 'serious' | 'encouraging' | 'understanding') => setFeedbackStyle(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn phong cách" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Phong cách gần gũi, thân thiện</SelectItem>
                  <SelectItem value="serious">Phong cách nghiêm túc, kỷ luật</SelectItem>
                  <SelectItem value="encouraging">Phong cách khích lệ, động viên</SelectItem>
                  <SelectItem value="understanding">Phong cách lắng nghe, thấu hiểu</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Độ dài văn bản</label>
              <Select value={feedbackLength} onValueChange={(value: 'short' | 'medium' | 'long') => setFeedbackLength(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn độ dài" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Văn bản ngắn gọn (1-2 câu)</SelectItem>
                  <SelectItem value="medium">Văn bản trung bình (3-5 câu)</SelectItem>
                  <SelectItem value="long">Văn bản dài (6 câu trở lên)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate AI Button */}
          <div className="flex justify-start">
            <Button
              onClick={generateAIFeedback}
              disabled={isGeneratingFeedback || studentData.subjects.length === 0}
              className="flex items-center gap-2"
            >
              {isGeneratingFeedback ? (
                <>
                  <LoadingSpinner size="sm" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Tạo bằng AI
                </>
              )}
            </Button>
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Nội dung đánh giá</label>
              {isLoadingFeedback && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <LoadingSpinner size="sm" />
                  Đang tải...
                </div>
              )}
              {existingFeedbackId && (
                <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                  Đã lưu
                </span>
              )}
            </div>
            <Textarea
              value={aiFeedback}
              onChange={(e) => setAiFeedback(e.target.value)}
              placeholder="Nội dung đánh giá sẽ xuất hiện ở đây. Bạn có thể chỉnh sửa nếu cần..."
              className="min-h-[200px]"
              disabled={isLoadingFeedback}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={() => setShowDisclaimerDialog(true)}
              disabled={!aiFeedback.trim() || isSavingFeedback}
              className="flex items-center gap-2"
            >
              {isSavingFeedback ? (
                <>
                  <LoadingSpinner size="sm" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Lưu đánh giá
                </>
              )}
            </Button>


          </div>
        </CardContent>
      </Card>

      {/* Disclaimer Dialog */}
      <Dialog open={showDisclaimerDialog} onOpenChange={setShowDisclaimerDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận lưu đánh giá</DialogTitle>
            <DialogDescription>
              Thông tin từ AI chỉ mang tính chất tham khảo. Bạn có chắc chắn muốn lưu đánh giá này không?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDisclaimerDialog(false)}>
              Hủy
            </Button>
            <Button onClick={saveFeedback}>
              Xác nhận lưu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
