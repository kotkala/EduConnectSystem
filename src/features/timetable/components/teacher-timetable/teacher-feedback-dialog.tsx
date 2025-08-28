import { Loader2 } from 'lucide-react'
"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Checkbox } from '@/shared/components/ui/checkbox'


import { Skeleton } from "@/shared/components/ui/skeleton";import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
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
  
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getClassStudentsAction,
  createStudentFeedbackAction,
  type StudentInfo,
  type FeedbackData
} from '@/features/teacher-management/actions/teacher-feedback-actions'

// Helper function to get feedback mode text
function getFeedbackModeText(feedbackMode: FeedbackMode): string {
  if (feedbackMode === 'individual') return 'cá nhân'
  if (feedbackMode === 'group') return 'nhóm'
  return 'cả lớp'
}

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

// Helper function to reset form state
function resetFormState(
  setSelectedStudents: (students: Set<string>) => void,
  setFeedbackText: (text: string) => void,
  setRating: (rating: number | undefined) => void,
  setFeedbackMode: (mode: FeedbackMode) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setEditingFeedback: (feedback: any) => void
) {
  setSelectedStudents(new Set());
  setFeedbackText('');
  setRating(undefined);
  setFeedbackMode('individual');
  setEditingFeedback(null);
}

// Helper function to handle student selection
function handleStudentSelection(
  studentId: string,
  checked: boolean,
  selectedStudents: Set<string>,
  setSelectedStudents: (students: Set<string>) => void
) {
  const newSelected = new Set(selectedStudents);
  if (checked) {
    newSelected.add(studentId);
  } else {
    newSelected.delete(studentId);
  }
  setSelectedStudents(newSelected);
}

// Helper function to handle select all students
function handleSelectAllStudents(
  students: StudentInfo[],
  selectedStudents: Set<string>,
  setSelectedStudents: (students: Set<string>) => void
) {
  if (selectedStudents.size === students.length) {
    setSelectedStudents(new Set());
  } else {
    setSelectedStudents(new Set(students.map(s => s.id)));
  }
}

// Student Selection Component
function StudentSelectionSection({
  students,
  selectedStudents,
  feedbackMode,
  isLoading,
  handleStudentSelect,
  handleSelectAll
}: Readonly<{
  students: StudentInfo[];
  selectedStudents: Set<string>;
  feedbackMode: FeedbackMode;
  isLoading: boolean;
  handleStudentSelect: (studentId: string, checked: boolean) => void;
  handleSelectAll: () => void;
}>) {
  if (feedbackMode === 'class') {
    return (
      <div className="text-sm text-muted-foreground">
        Feedback sẽ được gửi cho tất cả học sinh trong lớp
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang tải danh sách học sinh...
      </div>
    );
  }

  return (
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
  );
}

export function TeacherFeedbackDialog({
  open,
  onOpenChange,
  timetableEvent
}: Readonly<TeacherFeedbackDialogProps>) {
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
  // Load students when dialog opens
  useEffect(() => {
    if (open && timetableEvent) {
      loadStudents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, timetableEvent])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetFormState(setSelectedStudents, setFeedbackText, setRating, setFeedbackMode, setEditingFeedback);
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



  const handleStudentSelect = (studentId: string, checked: boolean) => {
    handleStudentSelection(studentId, checked, selectedStudents, setSelectedStudents);
  }

  const handleSelectAll = () => {
    handleSelectAllStudents(students, selectedStudents, setSelectedStudents);
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
      // Let server generate UUID for security - no client-side crypto.randomUUID()
      const feedbackData: FeedbackData[] = targetStudents.map(studentId => ({
        student_id: studentId,
        feedback_text: feedbackText,
        rating: rating,
        feedback_type: feedbackMode,
        group_id: undefined // Server will generate UUID if needed
      }))

      const result = await createStudentFeedbackAction({
        timetable_event_id: timetableEvent.id,
        class_id: timetableEvent.class_id,
        subject_id: timetableEvent.subject_id,
        feedback_data: feedbackData
      })
      
      if (result.success) {
        const action = editingFeedback ? 'cập nhật' : 'tạo'
        toast.success(`Đã ${action} phản hồi cho ${result.data?.created_count} học sinh`)
        setFeedbackText('')
        setRating(undefined)
        setSelectedStudents(new Set())
        setEditingFeedback(null)
        // Feedback created successfully
      } else {
        toast.error(result.error || 'Không thể tạo phản hồi')
      }
    } catch {
      toast.error('Lỗi khi tạo phản hồi')
    } finally {
      setIsSubmitting(false)
    }
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
            <label htmlFor="feedback-mode" className="text-sm font-medium">Chế độ phản hồi:</label>
            <fieldset id="feedback-mode" className="flex gap-2 border-0 p-0 m-0">
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
            </fieldset>
          </div>

          {/* Student Selection */}
          <StudentSelectionSection
            students={students}
            selectedStudents={selectedStudents}
            feedbackMode={feedbackMode}
            isLoading={isLoading}
            handleStudentSelect={handleStudentSelect}
            handleSelectAll={handleSelectAll}
          />

          {/* Feedback Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="feedback-text" className="text-sm font-medium">Nội dung phản hồi:</label>
              <Textarea
                id="feedback-text"
                placeholder="Nhập phản hồi cho học sinh..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="rating-select" className="text-sm font-medium">Đánh giá (tùy chọn):</label>
              <Select value={rating?.toString()} onValueChange={(value) => setRating(value ? parseInt(value) : undefined)}>
                <SelectTrigger id="rating-select" className="w-48">
                  <SelectValue placeholder="Chọn mức đánh giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">â­ 1 - Cần cải thiện</SelectItem>
                  <SelectItem value="2">â­â­ 2 - Khá</SelectItem>
                  <SelectItem value="3">â­â­â­ 3 - Tốt</SelectItem>
                  <SelectItem value="4">â­â­â­â­ 4 - Rất tốt</SelectItem>
                  <SelectItem value="5">â­â­â­â­â­ 5 - Xuất sắc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Tóm tắt:</strong> Sẽ tạo phản hồi {getFeedbackModeText(feedbackMode)} cho{' '}
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
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingFeedback ? 'Cập Nhật Phản Hồi' : 'Tạo Phản Hồi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
