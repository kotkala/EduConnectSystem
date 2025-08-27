"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { TeacherPageTemplate } from "@/shared/components/dashboard/teacher-page-template"
import { Button } from "@/shared/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Badge } from "@/shared/components/ui/badge"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"

import { Skeleton } from "@/shared/components/ui/skeleton";import {
  RefreshCw,
  Users,
  BookOpen,
  Send,
  Bot,
  Eye,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import {
  getGradePeriodsAction,
  type GradePeriod
} from "@/features/grade-management/actions/admin-grade-tracking-actions"
import {
  getHomeroomGradeDataAction,
  generateAIFeedbackAction,
  submitGradesToParentsAction,
  type HomeroomGradeData
} from "@/features/grade-management/actions/homeroom-grade-actions"

export default function HomeroomGradesPage() {
  const [periods, setPeriods] = useState<GradePeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [classId, setClassId] = useState<string>('') // This would be set based on homeroom teacher's class
  const [gradeData, setGradeData] = useState<HomeroomGradeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // AI Feedback state
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [feedbackStyle, setFeedbackStyle] = useState<'friendly' | 'serious' | 'encouraging' | 'understanding'>('friendly')
  const [feedbackLength, setFeedbackLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [generatedFeedbacks, setGeneratedFeedbacks] = useState<Record<string, string>>({})
  const [generatingFeedback, setGeneratingFeedback] = useState(false)
  const [submissionReason, setSubmissionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load grade periods
  const loadPeriods = useCallback(async () => {
    try {
      const result = await getGradePeriodsAction()
      if (result.success && result.data) {
        setPeriods(result.data)
        if (result.data.length > 0) {
          setSelectedPeriod(result.data[0].id)
        }
      } else {
        setError(result.error || 'Không thể tải danh sách kỳ báo cáo')
      }
    } catch (error) {
      console.error('Error loading periods:', error)
      setError('Không thể tải danh sách kỳ báo cáo')
    }
  }, [])

  // Load homeroom grade data
  const loadGradeData = useCallback(async () => {
    if (!selectedPeriod || !classId) return

    setLoading(true)
    setError(null)

    try {
      const result = await getHomeroomGradeDataAction(selectedPeriod, classId)
      if (result.success) {
        setGradeData(result.data || [])
      } else {
        setError(result.error || 'Không thể tải dữ liệu điểm số')
      }
    } catch (error) {
      console.error('Error loading grade data:', error)
      setError('Không thể tải dữ liệu điểm số')
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, classId])

  useEffect(() => {
    loadPeriods()
    // TODO: Get homeroom teacher's class ID from user profile
    setClassId('sample-class-id') // This should be fetched from the user's profile
  }, [loadPeriods])

  useEffect(() => {
    loadGradeData()
  }, [loadGradeData])

  // Generate AI feedback for selected students
  const generateFeedback = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Vui lòng chọn ít nhất một học sinh')
      return
    }

    setGeneratingFeedback(true)
    const newFeedbacks: Record<string, string> = {}

    try {
      for (const studentId of selectedStudents) {
        const studentData = gradeData.find(s => s.student_id === studentId)
        if (studentData) {
          const result = await generateAIFeedbackAction(studentData, {
            style: feedbackStyle,
            length: feedbackLength
          })

          if (result.success && result.feedback) {
            newFeedbacks[studentId] = result.feedback
          } else {
            toast.error(`Lỗi tạo phản hồi cho ${studentData.student_name}`)
          }
        }
      }

      setGeneratedFeedbacks(prev => ({ ...prev, ...newFeedbacks }))
      toast.success(`Đã tạo phản hồi cho ${Object.keys(newFeedbacks).length} học sinh`)
    } catch (error) {
      console.error('Error generating feedback:', error)
      toast.error('Lỗi tạo phản hồi AI')
    } finally {
      setGeneratingFeedback(false)
    }
  }

  // Submit grades to parents
  const handleSubmitToParents = async () => {
    const studentsWithFeedback = Array.from(selectedStudents).filter(id => generatedFeedbacks[id])
    
    if (studentsWithFeedback.length === 0) {
      toast.error('Vui lòng tạo phản hồi AI cho các học sinh đã chọn')
      return
    }

    setSubmitting(true)
    try {
      const submissions = studentsWithFeedback.map(studentId => ({
        studentId,
        aiFeedback: generatedFeedbacks[studentId],
        feedbackStyle,
        feedbackLength
      }))

      const result = await submitGradesToParentsAction(
        selectedPeriod,
        classId,
        submissions,
        submissionReason || undefined
      )

      if (result.success) {
        toast.success(result.message)
        setSelectedStudents(new Set())
        setGeneratedFeedbacks({})
        setSubmissionReason('')
        setFeedbackDialogOpen(false)
        loadGradeData() // Reload to show updated submission status
      } else {
        toast.error(result.error || 'Lỗi gửi bảng điểm')
      }
    } catch (error) {
      console.error('Error submitting to parents:', error)
      toast.error('Lỗi gửi bảng điểm cho phụ huynh')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedStudents(newSelection)
  }

  const selectAllStudents = () => {
    setSelectedStudents(new Set(gradeData.map(s => s.student_id)))
  }

  const clearSelection = () => {
    setSelectedStudents(new Set())
  }

  const getOverallGrade = (student: HomeroomGradeData) => {
    const validGrades = student.subjects
      .map(s => s.average_grade)
      .filter(g => g !== null) as number[]
    
    if (validGrades.length === 0) return null
    return Math.round((validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length) * 10) / 10
  }

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-500'
    if (grade >= 8) return 'text-green-600'
    if (grade >= 6.5) return 'text-blue-600'
    if (grade >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFeedbackStyleLabel = (style: string) => {
    switch (style) {
      case 'friendly': return 'Phong cách gần gũi, thân thiện'
      case 'serious': return 'Phong cách nghiêm túc, kỷ luật'
      case 'encouraging': return 'Phong cách khích lệ, động viên'
      case 'understanding': return 'Phong cách lắng nghe, thấu hiểu'
      default: return style
    }
  }

  const getFeedbackLengthLabel = (length: string) => {
    switch (length) {
      case 'short': return 'Văn bản ngắn gọn (1-2 câu)'
      case 'medium': return 'Văn bản trung bình (3-5 câu)'
      case 'long': return 'Văn bản dài (6 câu trở lên)'
      default: return length
    }
  }

  return (
    <TeacherPageTemplate
      title="Điểm số lớp chủ nhiệm"
      description="Tạo phản hồi AI và gửi bảng điểm cho phụ huynh"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadGradeData} disabled={loading}>
            Làm mới
          </Button>
          <Button
            onClick={() => setFeedbackDialogOpen(true)}
            disabled={selectedStudents.size === 0}
          >
            <Bot className="mr-2 h-4 w-4" />
            Tạo phản hồi AI ({selectedStudents.size})
          </Button>
        </div>
      }
      showCard={false}
    >
      <div className="space-y-6">

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn kỳ báo cáo</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Chọn kỳ báo cáo" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  <div className="flex items-center gap-2">
                    <span>{period.name}</span>
                    {period.is_active && (
                      <Badge variant="outline" className="text-xs">Đang hoạt động</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Skeleton className="h-32 w-full rounded-lg" />
            <p className="text-lg">Đang tải dữ liệu điểm số...</p>
          </div>
        </div>
      )}

      {/* Statistics */}
      {!loading && gradeData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng học sinh</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gradeData.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã chọn</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedStudents.size}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã tạo phản hồi</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(generatedFeedbacks).length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Grade Table */}
      {!loading && gradeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Bảng điểm học sinh</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllStudents}>
                  Chọn tất cả
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Bỏ chọn
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">
                      <Checkbox
                        checked={selectedStudents.size === gradeData.length && gradeData.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectAllStudents()
                          } else {
                            clearSelection()
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-3 font-medium">Học sinh</th>
                    <th className="text-left p-3 font-medium">Số báo danh</th>
                    <th className="text-left p-3 font-medium">Điểm TB chung</th>
                    <th className="text-left p-3 font-medium">Số môn học</th>
                    <th className="text-left p-3 font-medium">Phản hồi AI</th>
                    <th className="text-left p-3 font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeData.map((student) => {
                    const isSelected = selectedStudents.has(student.student_id)
                    const overallGrade = getOverallGrade(student)
                    const hasFeedback = generatedFeedbacks[student.student_id]

                    return (
                      <tr key={student.student_id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleStudentSelection(student.student_id)}
                          />
                        </td>
                        <td className="p-3 font-medium">{student.student_name}</td>
                        <td className="p-3">{student.student_number}</td>
                        <td className="p-3 text-center">
                          <span className={`font-medium ${getGradeColor(overallGrade)}`}>
                            {overallGrade ?? 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 text-center">{student.subjects.length}</td>
                        <td className="p-3">
                          {hasFeedback ? (
                            <Badge variant="default" className="text-xs">
                              Đã tạo
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Chưa tạo
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-4 w-4" />
                            Chi tiết
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!loading && gradeData.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="mx-auto h-12 md:h-14 lg:h-16 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Chưa có dữ liệu điểm</h3>
            <p className="text-muted-foreground mb-4">
              Chưa có dữ liệu điểm số cho kỳ báo cáo đã chọn
            </p>
            <Button variant="outline" onClick={loadGradeData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo phản hồi AI cho học sinh</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phong cách phản hồi</Label>
                <Select value={feedbackStyle} onValueChange={(value: 'friendly' | 'serious' | 'encouraging' | 'understanding') => setFeedbackStyle(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Phong cách gần gũi, thân thiện</SelectItem>
                    <SelectItem value="serious">Phong cách nghiêm túc, kỷ luật</SelectItem>
                    <SelectItem value="encouraging">Phong cách khích lệ, động viên</SelectItem>
                    <SelectItem value="understanding">Phong cách lắng nghe, thấu hiểu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Độ dài văn bản</Label>
                <Select value={feedbackLength} onValueChange={(value: 'short' | 'medium' | 'long') => setFeedbackLength(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">Văn bản ngắn gọn (1-2 câu)</SelectItem>
                    <SelectItem value="medium">Văn bản trung bình (3-5 câu)</SelectItem>
                    <SelectItem value="long">Văn bản dài (6 câu trở lên)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Đã chọn {selectedStudents.size} học sinh
              </p>
              <Button onClick={generateFeedback} disabled={generatingFeedback || selectedStudents.size === 0}>
                <Bot className="mr-2 h-4 w-4" />
                {generatingFeedback ? 'Đang tạo...' : 'Tạo phản hồi AI'}
              </Button>
            </div>

            {/* Generated Feedbacks */}
            {Object.keys(generatedFeedbacks).length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Phản hồi đã tạo:</h4>
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {Object.entries(generatedFeedbacks).map(([studentId, feedback]) => {
                    const student = gradeData.find(s => s.student_id === studentId)
                    return (
                      <div key={studentId} className="border rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium">{student?.student_name}</h5>
                          <div className="text-xs text-muted-foreground">
                            {getFeedbackStyleLabel(feedbackStyle)} â€¢ {getFeedbackLengthLabel(feedbackLength)}
                          </div>
                        </div>
                        <p className="text-sm">{feedback}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Submission reason for re-submissions */}
            {Object.keys(generatedFeedbacks).length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="submission-reason">
                  Lý do gửi (nếu gửi lại)
                </Label>
                <Textarea
                  id="submission-reason"
                  placeholder="Nhập lý do gửi lại bảng điểm (tùy chọn)"
                  value={submissionReason}
                  onChange={(e) => setSubmissionReason(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFeedbackDialogOpen(false)}
              disabled={submitting}
            >
              Đóng
            </Button>
            <Button
              onClick={handleSubmitToParents}
              disabled={submitting || Object.keys(generatedFeedbacks).length === 0}
            >
              <Send className="mr-2 h-4 w-4" />
              {submitting ? 'Đang gửi...' : `Gửi cho phụ huynh (${Object.keys(generatedFeedbacks).length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
