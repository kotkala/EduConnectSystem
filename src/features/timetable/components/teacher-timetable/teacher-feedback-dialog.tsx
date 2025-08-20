"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'
import { Checkbox } from '@/shared/components/ui/checkbox'

import {
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
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getClassStudentsAction,
  createStudentFeedbackAction,
  type StudentInfo,
  type FeedbackData,
  type CreateFeedbackRequest
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
        Feedback sẽ Ä‘Æ°á»£c gá»­i cho táº¥t cả hồc sinh trong lớp
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Äang tải danh sách hồc sinh...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Chồn hồc sinh:</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
        >
          {selectedStudents.size === students.length ? 'Bá» chồn táº¥t cả' : 'Chồn táº¥t cả'}
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
          ÄÃ£ chồn {selectedStudents.size} hồc sinh
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
        toast.error(result.error || 'Không thể tải danh sách hồc sinh')
      }
    } catch {
      toast.error('Lỗi khi tải danh sách hồc sinh')
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
      toast.error('Vui lòng nháº­p ná»™i dung pháº£n hồ“i')
      return
    }

    let targetStudents: string[] = []
    
    if (feedbackMode === 'individual' && selectedStudents.size !== 1) {
      toast.error('Vui lòng chồn một hồc sinh cho pháº£n hồ“i cá nhân')
      return
    } else if (feedbackMode === 'group' && selectedStudents.size < 2) {
      toast.error('Vui lòng chồn Ã­t nháº¥t 2 hồc sinh cho pháº£n hồ“i nhóm')
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

      const request: CreateFeedbackRequest = {
        timetable_event_id: timetableEvent.id,
        class_id: timetableEvent.class_id,
        subject_id: timetableEvent.subject_id,
        feedback_data: feedbackData
      }

      const result = await createStudentFeedbackAction(request)
      
      if (result.success) {
        const action = editingFeedback ? 'cập nhật' : 'tạo'
        toast.success(`ÄÃ£ ${action} pháº£n hồ“i cho ${result.data?.created_count} hồc sinh`)
        setFeedbackText('')
        setRating(undefined)
        setSelectedStudents(new Set())
        setEditingFeedback(null)
        // Feedback created successfully
      } else {
        toast.error(result.error || 'Không thể tạo pháº£n hồ“i')
      }
    } catch {
      toast.error('Lỗi khi tạo pháº£n hồ“i')
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
            Phản Hồ“i Hồc Sinh - {timetableEvent.subject_name}
          </DialogTitle>
          <DialogDescription>
            Lớp: {timetableEvent.class_name} | Tổng sá»‘ hồc sinh: {students.length}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feedback Mode Selection */}
          <div className="space-y-3">
            <label htmlFor="feedback-mode" className="text-sm font-medium">Cháº¿ Ä‘á»™ pháº£n hồ“i:</label>
            <fieldset id="feedback-mode" className="flex gap-2 border-0 p-0 m-0">
              <Button
                variant={feedbackMode === 'individual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackMode('individual')}
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                CÃ¡ nhân
              </Button>
              <Button
                variant={feedbackMode === 'group' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackMode('group')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                NhÃ³m
              </Button>
              <Button
                variant={feedbackMode === 'class' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFeedbackMode('class')}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Cáº£ lớp
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
              <label htmlFor="feedback-text" className="text-sm font-medium">Ná»™i dung pháº£n hồ“i:</label>
              <Textarea
                id="feedback-text"
                placeholder="Nhập pháº£n hồ“i cho hồc sinh..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="rating-select" className="text-sm font-medium">ÄÃ¡nh giá (tÃ¹y chồn):</label>
              <Select value={rating?.toString()} onValueChange={(value) => setRating(value ? parseInt(value) : undefined)}>
                <SelectTrigger id="rating-select" className="w-48">
                  <SelectValue placeholder="Chồn mức Ä‘Ã¡nh giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">â­ 1 - Cáº§n cải thiện</SelectItem>
                  <SelectItem value="2">â­â­ 2 - KhÃ¡</SelectItem>
                  <SelectItem value="3">â­â­â­ 3 - Tá»‘t</SelectItem>
                  <SelectItem value="4">â­â­â­â­ 4 - Ráº¥t tá»‘t</SelectItem>
                  <SelectItem value="5">â­â­â­â­â­ 5 - Xuáº¥t sáº¯c</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>TÃ³m táº¯t:</strong> Sáº½ tạo pháº£n hồ“i {getFeedbackModeText(feedbackMode)} cho{' '}
              {feedbackMode === 'class' ? `táº¥t cả ${students.length} hồc sinh` : `${selectedStudents.size} hồc sinh Ä‘Ã£ chồn`}
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
            {editingFeedback ? 'Cập Nháº­t Phản Hồ“i' : 'Tạo Phản Hồ“i'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
