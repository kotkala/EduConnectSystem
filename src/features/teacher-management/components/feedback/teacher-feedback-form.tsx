"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  MessageSquare,
  Users,
  User,
  Loader2,
  ArrowLeft,
  Edit,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getClassStudentsAction,
  createStudentFeedbackAction,
  type StudentInfo,
  type FeedbackData,
  type CreateFeedbackRequest
} from '@/features/teacher-management/actions/teacher-feedback-actions'

interface TimetableEvent {
  id: string
  class_id: string
  subject_id: string
  class_name: string
  subject_name: string
  subject_code: string
  day_of_week: number
  start_time: string
  end_time: string
  week_number: number
  semester_name: string
  academic_year_name: string
}

interface ExistingFeedback {
  id: string
  student_id: string
  student_name: string
  feedback_text: string
  rating?: number
  feedback_type: string
  group_id?: string
  created_at: string
}

interface TeacherFeedbackFormProps {
  readonly timetableEvent: TimetableEvent
  readonly existingFeedback: ExistingFeedback[]
  readonly canEdit: boolean
  readonly hasExistingFeedback: boolean
}

type FeedbackMode = 'individual' | 'group' | 'class'

export function TeacherFeedbackForm({
  timetableEvent,
  existingFeedback,
  canEdit,
  hasExistingFeedback
}: TeacherFeedbackFormProps) {
  const router = useRouter()
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('individual')
  const [feedbackText, setFeedbackText] = useState('')
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(!hasExistingFeedback)

  const loadStudents = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getClassStudentsAction(timetableEvent.class_id)
      if (result.success && result.data) {
        setStudents(result.data)
      } else {
        toast.error(result.error || 'Không thể tải danh sách học sinh')
      }
    } catch {
      toast.error('Lỗi khi tải danh sách học sinh')
    } finally {
      setIsLoading(false)
    }
  }, [timetableEvent.class_id])

  // Load students when component mounts
  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  // Load existing feedback data when editing
  useEffect(() => {
    if (hasExistingFeedback && existingFeedback.length > 0) {
      const firstFeedback = existingFeedback[0]
      setFeedbackText(firstFeedback.feedback_text)
      setRating(firstFeedback.rating)
      setFeedbackMode(firstFeedback.feedback_type as FeedbackMode)

      // Set selected students based on existing feedback
      const feedbackStudentIds = new Set(existingFeedback.map(f => f.student_id))
      setSelectedStudents(feedbackStudentIds)
    }
  }, [hasExistingFeedback, existingFeedback])

  const handleStudentSelect = (studentId: string, checked: boolean) => {
    const newSelected = new Set(selectedStudents)
    if (checked) {
      newSelected.add(studentId)
    } else {
      newSelected.delete(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)))
    }
  }

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      toast.error('Vui lòng nhập nội dung phản hồi')
      return
    }

    let targetStudents: string[] = []
    
    if (feedbackMode === 'individual' && selectedStudents.size !== 1) {
      toast.error('Vui lòng chọn một học sinh cho phản hồi cá nhân')
      return
    } else if (feedbackMode === 'group' && selectedStudents.size < 2) {
      toast.error('Vui lòng chọn ít nhất 2 học sinh cho phản hồi nhóm')
      return
    } else if (feedbackMode === 'class') {
      targetStudents = students.map(s => s.id)
    } else {
      targetStudents = Array.from(selectedStudents)
    }

    setIsSubmitting(true)
    try {
      const feedbackData: FeedbackData[] = targetStudents.map(studentId => ({
        student_id: studentId,
        feedback_text: feedbackText,
        rating: rating,
        feedback_type: feedbackMode,
        group_id: undefined
      }))

      const request: CreateFeedbackRequest = {
        timetable_event_id: timetableEvent.id,
        class_id: timetableEvent.class_id,
        subject_id: timetableEvent.subject_id,
        feedback_data: feedbackData
      }

      const result = await createStudentFeedbackAction(request)
      
      if (result.success) {
        const action = hasExistingFeedback ? 'cập nhật' : 'tạo'
        toast.success(`Đã ${action} phản hồi cho ${result.data?.created_count} học sinh`)
        
        // Redirect back to schedule
        router.push('/dashboard/teacher/schedule')
      } else {
        toast.error(result.error || 'Không thể lưu phản hồi')
      }
    } catch {
      toast.error('Lỗi khi lưu phản hồi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/teacher/schedule')
  }

  const getFeedbackModeText = (mode: FeedbackMode): string => {
    if (mode === 'individual') return 'cá nhân'
    if (mode === 'group') return 'nhóm'
    return 'cả lớp'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        Đang tải...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={handleCancel}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại lịch giảng dạy
      </Button>

      {/* Existing Feedback Display */}
      {hasExistingFeedback && !isEditing && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Phản hồi đã tạo
            </CardTitle>
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Chỉnh sửa
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Badge variant="secondary">
                Phản hồi {getFeedbackModeText(existingFeedback[0]?.feedback_type as FeedbackMode)}
              </Badge>
            </div>
            <div>
              <strong>Nội dung:</strong>
              <p className="mt-1 text-sm bg-muted p-3 rounded-md">
                {existingFeedback[0]?.feedback_text}
              </p>
            </div>
            {existingFeedback[0]?.rating && (
              <div>
                <strong>Đánh giá:</strong> {existingFeedback[0].rating}/5 ⭐
              </div>
            )}
            <div>
              <strong>Học sinh:</strong>
              <div className="mt-1 flex flex-wrap gap-1">
                {existingFeedback.map(feedback => (
                  <Badge key={feedback.id} variant="outline">
                    {feedback.student_name}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Tạo lúc: {new Date(existingFeedback[0]?.created_at).toLocaleString('vi-VN')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Form */}
      {isEditing && canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {hasExistingFeedback ? 'Chỉnh sửa phản hồi' : 'Tạo phản hồi mới'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Feedback Mode Selection */}
            <div className="space-y-3">
              <div className="text-sm font-medium">Chế độ phản hồi:</div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={feedbackMode === 'individual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedbackMode('individual')}
                  className="flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Cá nhân
                </Button>
                <Button
                  type="button"
                  variant={feedbackMode === 'group' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedbackMode('group')}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Nhóm
                </Button>
                <Button
                  type="button"
                  variant={feedbackMode === 'class' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFeedbackMode('class')}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Cả lớp
                </Button>
              </div>
            </div>

            {/* Student Selection */}
            {feedbackMode !== 'class' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Chọn học sinh:</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedStudents.size === students.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </Button>
                </div>

                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={(checked) => handleStudentSelect(student.id, !!checked)}
                      />
                      <span className="text-sm">{student.full_name}</span>
                      <span className="text-xs text-muted-foreground">({student.student_id})</span>
                    </div>
                  ))}
                </div>

                {selectedStudents.size > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Đã chọn {selectedStudents.size} học sinh
                  </div>
                )}
              </div>
            )}

            {feedbackMode === 'class' && (
              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                Phản hồi sẽ được gửi cho tất cả {students.length} học sinh trong lớp
              </div>
            )}

            {/* Feedback Content */}
            <div className="space-y-2">
              <label htmlFor="feedback-text" className="text-sm font-medium">Nội dung phản hồi:</label>
              <Textarea
                id="feedback-text"
                placeholder="Nhập phản hồi cho học sinh..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <label htmlFor="rating-select" className="text-sm font-medium">Đánh giá (tùy chọn):</label>
              <Select value={rating?.toString()} onValueChange={(value) => setRating(value ? parseInt(value) : undefined)}>
                <SelectTrigger id="rating-select" className="w-48">
                  <SelectValue placeholder="Chọn mức đánh giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">⭐ 1 - Cần cải thiện</SelectItem>
                  <SelectItem value="2">⭐⭐ 2 - Khá</SelectItem>
                  <SelectItem value="3">⭐⭐⭐ 3 - Tốt</SelectItem>
                  <SelectItem value="4">⭐⭐⭐⭐ 4 - Rất tốt</SelectItem>
                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Xuất sắc</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Tóm tắt:</strong> Sẽ {hasExistingFeedback ? 'cập nhật' : 'tạo'} phản hồi {getFeedbackModeText(feedbackMode)} cho{' '}
                {feedbackMode === 'class' ? `tất cả ${students.length} học sinh` : `${selectedStudents.size} học sinh đã chọn`}
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (hasExistingFeedback) {
                    setIsEditing(false)
                  } else {
                    handleCancel()
                  }
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>
              <Button
                onClick={handleSubmitFeedback}
                disabled={isSubmitting || !feedbackText.trim()}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                {hasExistingFeedback ? 'Cập nhật phản hồi' : 'Tạo phản hồi'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Edit Permission */}
      {!canEdit && (
        <Alert>
          <AlertDescription>
            Bạn không thể tạo hoặc chỉnh sửa phản hồi vì đã quá 24 giờ kể từ khi kết thúc tiết học.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
