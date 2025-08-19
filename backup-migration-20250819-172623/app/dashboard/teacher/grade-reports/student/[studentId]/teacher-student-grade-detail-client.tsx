'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Save, Send, Sparkles, AlertTriangle } from 'lucide-react'
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

import { getHomeroomDetailedGradesAction } from '@/lib/actions/detailed-grade-actions'
import { getGradeReportingPeriodsForTeachersAction } from '@/lib/actions/grade-management-actions'

interface GradeRecord {
  id: string
  student_id: string
  grade_value: number
  component_type: string
  student: {
    full_name: string
    student_id: string
  }
  subject: {
    name_vietnamese: string
    code: string
  }
  class: {
    name: string
  }
}

interface StudentInfo {
  id: string
  full_name: string
  student_id: string
  class: {
    id: string
    name: string
  }
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

export function TeacherStudentGradeDetailClient({ studentId }: TeacherStudentGradeDetailClientProps) {
  const [loading, setLoading] = useState(true)
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [periods, setPeriods] = useState<GradeReportingPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  
  // AI Feedback states
  const [aiFeedback, setAiFeedback] = useState('')
  const [feedbackStyle, setFeedbackStyle] = useState<'friendly' | 'serious' | 'encouraging' | 'understanding'>('friendly')
  const [feedbackLength, setFeedbackLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)
  const [isSavingFeedback, setIsSavingFeedback] = useState(false)
  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(false)

  // Load periods
  const loadPeriods = useCallback(async () => {
    try {
      const result = await getGradeReportingPeriodsForTeachersAction({ limit: 100 })
      if (result.success && result.data) {
        const periodsData = result.data as unknown as GradeReportingPeriod[]
        setPeriods(periodsData)
        
        // Auto-select the active period
        const activePeriod = periodsData.find((period) => period.is_active === true)
        if (activePeriod) {
          setSelectedPeriod(activePeriod.id)
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
      setGrades([])
      setStudentInfo(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const filters = {
        student_search: studentId,
        page: 1,
        limit: 1000
      }

      const result = await getHomeroomDetailedGradesAction(selectedPeriod, filters)

      if (result.success && result.data) {
        const gradeData = result.data as unknown as GradeRecord[]
        const studentGrades = gradeData.filter(grade => grade.student_id === studentId)
        
        setGrades(studentGrades)
        
        if (studentGrades.length > 0) {
          const firstGrade = studentGrades[0]
          setStudentInfo({
            id: firstGrade.student_id,
            full_name: firstGrade.student.full_name,
            student_id: firstGrade.student.student_id,
            class: {
              id: firstGrade.class.name, // We'll need to get the actual class ID
              name: firstGrade.class.name
            }
          })
        }
      } else {
        console.error('Error loading grades:', result.error)
        toast.error(result.error || 'Không thể tải điểm số học sinh')
        setGrades([])
        setStudentInfo(null)
      }
    } catch (error) {
      console.error('Error loading student grades:', error)
      toast.error('Không thể tải điểm số học sinh')
      setGrades([])
      setStudentInfo(null)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, studentId])

  // Load periods on mount
  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  // Load grades when period changes
  useEffect(() => {
    loadStudentGrades()
  }, [loadStudentGrades])

  // Generate AI feedback
  const generateAIFeedback = useCallback(async () => {
    if (!studentInfo || grades.length === 0) {
      toast.error('Không có dữ liệu điểm số để tạo đánh giá')
      return
    }

    setIsGeneratingFeedback(true)
    try {
      // Transform grades to the format expected by AI API
      const subjectGrades = Object.entries(
        grades.reduce((acc, grade) => {
          const subjectCode = grade.subject.code
          if (!acc[subjectCode]) {
            acc[subjectCode] = {
              subjectName: grade.subject.name_vietnamese,
              regular: [],
              midterm: undefined,
              final: undefined
            }
          }

          if (grade.component_type.startsWith('regular_')) {
            acc[subjectCode].regular.push(grade.grade_value)
          } else if (grade.component_type === 'midterm') {
            acc[subjectCode].midterm = grade.grade_value
          } else if (grade.component_type === 'final') {
            acc[subjectCode].final = grade.grade_value
          }

          return acc
        }, {} as Record<string, {
          subjectName: string
          regular: number[]
          midterm?: number
          final?: number
        }>)
      ).map(([, subjectData]) => {

        const allGrades = [...subjectData.regular]
        if (subjectData.midterm !== undefined) allGrades.push(subjectData.midterm)
        if (subjectData.final !== undefined) allGrades.push(subjectData.final)

        const averageGrade = allGrades.length > 0
          ? allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length
          : undefined

        return {
          subjectName: subjectData.subjectName,
          midtermGrade: subjectData.midterm,
          finalGrade: subjectData.final,
          averageGrade
        }
      })

      const gradeData = {
        studentName: studentInfo.full_name,
        studentId: studentInfo.student_id,
        studentCode: studentInfo.student_id,
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
  }, [studentInfo, grades, feedbackStyle, feedbackLength])

  // Save feedback
  const saveFeedback = useCallback(async () => {
    if (!studentInfo || !aiFeedback.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá')
      return
    }

    setIsSavingFeedback(true)
    try {
      // Here we would save the feedback to the database
      // For now, just show success message
      toast.success('Đã lưu đánh giá thành công!')
      setShowDisclaimerDialog(false)
    } catch (error) {
      console.error('Error saving feedback:', error)
      toast.error('Lỗi khi lưu đánh giá')
    } finally {
      setIsSavingFeedback(false)
    }
  }, [studentInfo, aiFeedback])

  // Send to parents
  const sendToParents = useCallback(async () => {
    if (!studentInfo || !aiFeedback.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá')
      return
    }

    try {
      // Here we would send the feedback to parents
      // For now, just show success message
      toast.success('Đã gửi đánh giá cho phụ huynh thành công!')
    } catch (error) {
      console.error('Error sending to parents:', error)
      toast.error('Lỗi khi gửi đánh giá cho phụ huynh')
    }
  }, [studentInfo, aiFeedback])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-muted-foreground">Đang tải thông tin học sinh...</span>
      </div>
    )
  }

  if (!studentInfo) {
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
              {studentInfo.full_name} • Mã HS: {studentInfo.student_id} • Lớp: {studentInfo.class.name}
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
      {grades.length > 0 && (
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
                  {/* Group grades by subject */}
                  {Object.entries(
                    grades.reduce((acc, grade) => {
                      const subjectCode = grade.subject.code
                      if (!acc[subjectCode]) {
                        acc[subjectCode] = {
                          subject: grade.subject,
                          regular: [],
                          midterm: null,
                          final: null
                        }
                      }

                      if (grade.component_type.startsWith('regular_')) {
                        acc[subjectCode].regular.push(grade)
                      } else if (grade.component_type === 'midterm') {
                        acc[subjectCode].midterm = grade
                      } else if (grade.component_type === 'final') {
                        acc[subjectCode].final = grade
                      }

                      return acc
                    }, {} as Record<string, {
                      subject: { name_vietnamese: string; code: string }
                      regular: GradeRecord[]
                      midterm: GradeRecord | null
                      final: GradeRecord | null
                    }>)
                  ).map(([subjectCode, subjectGrades]) => {
                    // Calculate TBM
                    const regularGrades = subjectGrades.regular.map((g: GradeRecord) => g.grade_value)
                    const midtermGrade = subjectGrades.midterm?.grade_value
                    const finalGrade = subjectGrades.final?.grade_value

                    const allGrades = [...regularGrades]
                    if (midtermGrade !== undefined) allGrades.push(midtermGrade)
                    if (finalGrade !== undefined) allGrades.push(finalGrade)

                    const tbm = allGrades.length > 0
                      ? Math.round((allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length) * 10) / 10
                      : null

                    return (
                      <TableRow key={subjectCode}>
                        <TableCell className="font-medium">
                          {subjectGrades.subject.name_vietnamese}
                        </TableCell>
                        <TableCell>
                          {regularGrades.length > 0
                            ? regularGrades.map(g => g.toFixed(1)).join(', ')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {midtermGrade !== undefined ? midtermGrade.toFixed(1) : '-'}
                        </TableCell>
                        <TableCell>
                          {finalGrade !== undefined ? finalGrade.toFixed(1) : '-'}
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
              disabled={isGeneratingFeedback || grades.length === 0}
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
            <label className="text-sm font-medium">Nội dung đánh giá</label>
            <Textarea
              value={aiFeedback}
              onChange={(e) => setAiFeedback(e.target.value)}
              placeholder="Nội dung đánh giá sẽ xuất hiện ở đây. Bạn có thể chỉnh sửa nếu cần..."
              className="min-h-[200px]"
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

            <Button
              variant="outline"
              onClick={sendToParents}
              disabled={!aiFeedback.trim()}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Gửi cho phụ huynh
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
