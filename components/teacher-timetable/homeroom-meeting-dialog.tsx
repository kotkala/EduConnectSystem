"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
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
  Calendar,
  Loader2,
  Send
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getTeacherHomeroomClassesAction,
  getHomeroomStudentsWithParentsAction,
  createMeetingScheduleAction,
  type MeetingScheduleData,
  type CreateMeetingScheduleRequest
} from '@/lib/actions/meeting-schedule-actions'

interface HomeroomMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface HomeroomClass {
  id: string
  name: string
  academic_year_name: string
  student_count: number
}

interface StudentWithParents {
  id: string
  full_name: string
  email: string
  student_id: string
  parents: Array<{
    id: string
    full_name: string
    email: string
  }>
}

export function HomeroomMeetingDialog({
  open,
  onOpenChange
}: HomeroomMeetingDialogProps) {
  const [homeroomClasses, setHomeroomClasses] = useState<HomeroomClass[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>('')
  const [students, setStudents] = useState<StudentWithParents[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form data
  const [meetingData, setMeetingData] = useState<MeetingScheduleData>({
    title: '',
    description: '',
    meeting_date: '',
    meeting_location: '',
    duration_minutes: 60,
    meeting_type: 'parent_meeting'
  })

  // Load homeroom classes when dialog opens
  useEffect(() => {
    if (open) {
      loadHomeroomClasses()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Load students when class is selected
  useEffect(() => {
    if (selectedClassId) {
      loadStudents()
    } else {
      setStudents([])
      setSelectedStudents(new Set())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId])

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedClassId('')
      setStudents([])
      setSelectedStudents(new Set())
      setMeetingData({
        title: '',
        description: '',
        meeting_date: '',
        meeting_location: '',
        duration_minutes: 60,
        meeting_type: 'parent_meeting'
      })
    }
  }, [open])

  const loadHomeroomClasses = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getTeacherHomeroomClassesAction()
      if (result.success && result.data) {
        setHomeroomClasses(result.data)
      } else {
        toast.error(result.error || 'Không thể tải danh sách lớp chủ nhiệm')
      }
    } catch {
      toast.error('Lỗi khi tải danh sách lớp chủ nhiệm')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadStudents = useCallback(async () => {
    if (!selectedClassId) return
    
    setIsLoading(true)
    try {
      const result = await getHomeroomStudentsWithParentsAction(selectedClassId)
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
  }, [selectedClassId])

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

  const handleSubmit = async () => {
    if (!selectedClassId || !meetingData.title || !meetingData.meeting_date || selectedStudents.size === 0) {
      toast.error('Vui lòng điền đầy đủ thông tin và chọn ít nhất một học sinh')
      return
    }

    setIsSubmitting(true)
    try {
      const request: CreateMeetingScheduleRequest = {
        meeting_data: meetingData,
        student_ids: Array.from(selectedStudents),
        class_id: selectedClassId
      }

      const result = await createMeetingScheduleAction(request)
      
      if (result.success) {
        toast.success(`Đã gửi lịch họp phụ huynh cho ${result.data?.recipients_count} phụ huynh`)
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Không thể tạo lịch họp phụ huynh')
      }
    } catch {
      toast.error('Lỗi khi tạo lịch họp phụ huynh')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateTime = (dateTimeString: string) => {
    if (!dateTimeString) return ''
    const date = new Date(dateTimeString)
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gửi Lịch Họp Phụ Huynh
          </DialogTitle>
          <DialogDescription>
            Tạo và gửi lịch họp phụ huynh cho học sinh trong lớp chủ nhiệm
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class Selection */}
          <div className="space-y-2">
            <Label>Lớp chủ nhiệm:</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn lớp chủ nhiệm" />
              </SelectTrigger>
              <SelectContent>
                {homeroomClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} - {cls.academic_year_name} ({cls.student_count} học sinh)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tiêu đề cuộc họp:</Label>
              <Input
                placeholder="Nhập tiêu đề cuộc họp"
                value={meetingData.title}
                onChange={(e) => setMeetingData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Thời gian họp:</Label>
              <Input
                type="datetime-local"
                value={meetingData.meeting_date}
                onChange={(e) => setMeetingData(prev => ({ ...prev, meeting_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Địa điểm:</Label>
              <Input
                placeholder="Nhập địa điểm họp"
                value={meetingData.meeting_location}
                onChange={(e) => setMeetingData(prev => ({ ...prev, meeting_location: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Thời lượng (phút):</Label>
              <Input
                type="number"
                min="15"
                max="480"
                value={meetingData.duration_minutes}
                onChange={(e) => setMeetingData(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 60 }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mô tả cuộc họp:</Label>
            <Textarea
              placeholder="Nhập mô tả chi tiết về cuộc họp..."
              value={meetingData.description}
              onChange={(e) => setMeetingData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Student Selection */}
          {selectedClassId && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>
                  Chọn học sinh ({selectedStudents.size}/{students.length}):
                </Label>
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
                  {students.map((student) => (
                    <div key={student.id} className="flex items-start space-x-2 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={student.id}
                        checked={selectedStudents.has(student.id)}
                        onCheckedChange={(checked) => handleStudentSelect(student.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <label htmlFor={student.id} className="text-sm cursor-pointer font-medium">
                          {student.full_name}
                        </label>
                        <div className="text-xs text-muted-foreground">
                          {student.student_id}
                        </div>
                        <div className="text-xs text-blue-600">
                          {student.parents.length} phụ huynh: {student.parents.map(p => p.full_name).join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Summary */}
          {selectedStudents.size > 0 && meetingData.meeting_date && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Tóm tắt:</strong> Sẽ gửi lịch họp &quot;{meetingData.title}&quot;
                vào {formatDateTime(meetingData.meeting_date)} 
                cho {selectedStudents.size} học sinh đã chọn
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !selectedClassId || !meetingData.title || !meetingData.meeting_date || selectedStudents.size === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Gửi Lịch Họp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
