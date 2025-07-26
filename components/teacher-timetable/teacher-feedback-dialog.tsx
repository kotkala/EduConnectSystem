"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  MessageSquare,
  Users,
  User,
  Loader2,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getClassStudentsAction,
  createStudentFeedbackAction,
  getEventFeedbackAction,
  type StudentInfo,
  type FeedbackData,
  type CreateFeedbackRequest
} from '@/lib/actions/teacher-feedback-actions'

interface TeacherFeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  timetableEvent: {
    id: string
    class_id: string
    subject_id: string
    class_name: string
    subject_name: string
  } | null
}

type FeedbackMode = 'individual' | 'group' | 'class'

export function TeacherFeedbackDialog({
  open,
  onOpenChange,
  timetableEvent
}: TeacherFeedbackDialogProps) {
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('individual')
  const [feedbackText, setFeedbackText] = useState('')
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [editingFeedback, setEditingFeedback] = useState<{
    id: string
    student_id: string
    feedback_text: string
    rating?: number
    feedback_type: string
    created_at: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingFeedback, setExistingFeedback] = useState<Array<{
    id: string
    student_id: string
    student_name: string
    feedback_text: string
    rating?: number
    feedback_type: string
    group_id?: string
    created_at: string
  }>>([])

  // Load students when dialog opens
  useEffect(() => {
    if (open && timetableEvent) {
      loadStudents()
      loadExistingFeedback()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, timetableEvent])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedStudents(new Set())
      setFeedbackText('')
      setRating(undefined)
      setFeedbackMode('individual')
      setEditingFeedback(null)
    }
  }, [open])

  const loadStudents = useCallback(async () => {
    if (!timetableEvent) return

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
  }, [timetableEvent])

  const loadExistingFeedback = useCallback(async () => {
    if (!timetableEvent) return

    try {
      const result = await getEventFeedbackAction(timetableEvent.id)
      if (result.success && result.data) {
        setExistingFeedback(result.data)
      }
    } catch {
      console.error('Error loading existing feedback')
    }
  }, [timetableEvent])

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
    if (!timetableEvent || !feedbackText.trim()) {
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
      const groupId = feedbackMode === 'group' ? crypto.randomUUID() : undefined
      
      const feedbackData: FeedbackData[] = targetStudents.map(studentId => ({
        student_id: studentId,
        feedback_text: feedbackText,
        rating: rating,
        feedback_type: feedbackMode,
        group_id: groupId
      }))

      const request: CreateFeedbackRequest = {
        timetable_event_id: timetableEvent.id,
        class_id: timetableEvent.class_id,
        subject_id: timetableEvent.subject_id,
        feedback_data: feedbackData
      }

      const result = await createStudentFeedbackAction(request)
      
      if (result.success) {
        const action = editingFeedback ? 'cập nhật' : 'tạo'
        toast.success(`Đã ${action} phản hồi cho ${result.data?.created_count} học sinh`)
        setFeedbackText('')
        setRating(undefined)
        setSelectedStudents(new Set())
        setEditingFeedback(null)
        loadExistingFeedback() // Reload to show new feedback
      } else {
        toast.error(result.error || 'Không thể tạo phản hồi')
      }
    } catch {
      toast.error('Lỗi khi tạo phản hồi')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStudentFeedback = (studentId: string) => {
    return existingFeedback.find(f => f.student_id === studentId)
  }

  const canEditFeedback = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
    return hoursDiff <= 24
  }

  const handleEditFeedback = (feedback: {
    id: string
    student_id: string
    student_name: string
    feedback_text: string
    rating?: number
    feedback_type: string
    group_id?: string
    created_at: string
  }) => {
    setEditingFeedback(feedback)
    setFeedbackText(feedback.feedback_text)
    setRating(feedback.rating)
    setFeedbackMode('individual')
    setSelectedStudents(new Set([feedback.student_id]))
  }

  if (!timetableEvent) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Phản Hồi Học Sinh - {timetableEvent.subject_name}
          </DialogTitle>
          <DialogDescription>
            Lớp: {timetableEvent.class_name} | Tổng số học sinh: {students.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feedback Mode Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Chế độ phản hồi:</label>
            <div className="flex gap-2">
              <Button
                variant={feedbackMode === 'individual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackMode('individual')}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Cá nhân
              </Button>
              <Button
                variant={feedbackMode === 'group' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackMode('group')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Nhóm
              </Button>
              <Button
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

          {/* Student List */}
          {feedbackMode !== 'class' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  Chọn học sinh ({selectedStudents.size}/{students.length}):
                </label>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedStudents.size === students.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Đang tải danh sách học sinh...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-md p-3">
                  {students.map((student) => {
                    const feedback = getStudentFeedback(student.id)
                    return (
                      <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                        <Checkbox
                          id={student.id}
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                        />
                        <label htmlFor={student.id} className="flex-1 text-sm cursor-pointer">
                          {student.full_name}
                          <span className="text-muted-foreground ml-1">({student.student_id})</span>
                          {feedback && (
                            <div className="text-xs text-gray-600 mt-1">
                              Phản hồi: {feedback.feedback_text.substring(0, 50)}
                              {feedback.feedback_text.length > 50 ? '...' : ''}
                            </div>
                          )}
                        </label>
                        <div className="flex items-center gap-1">
                          {feedback && (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              {canEditFeedback(feedback.created_at) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditFeedback(feedback)}
                                  className="h-6 w-6 p-0"
                                >
                                  ✏️
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Feedback Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nội dung phản hồi:</label>
              <Textarea
                placeholder="Nhập phản hồi cho học sinh..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Đánh giá (tùy chọn):</label>
              <Select value={rating?.toString()} onValueChange={(value) => setRating(value ? parseInt(value) : undefined)}>
                <SelectTrigger className="w-48">
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
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Tóm tắt:</strong> Sẽ tạo phản hồi {feedbackMode === 'individual' ? 'cá nhân' : feedbackMode === 'group' ? 'nhóm' : 'cả lớp'} cho{' '}
              {feedbackMode === 'class' ? `tất cả ${students.length} học sinh` : `${selectedStudents.size} học sinh đã chọn`}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmitFeedback}
            disabled={isSubmitting || !feedbackText.trim()}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingFeedback ? 'Cập Nhật Phản Hồi' : 'Tạo Phản Hồi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
