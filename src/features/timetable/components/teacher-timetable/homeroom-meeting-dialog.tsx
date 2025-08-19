"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'

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
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
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
  const [homeroomClass, setHomeroomClass] = useState<HomeroomClass | null>(null)
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
      setHomeroomClass(null)
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
        if (result.data.length === 1) {
          // Auto-select the single homeroom class
          const singleClass = result.data[0]
          setHomeroomClass(singleClass)
          setSelectedClassId(singleClass.id)
        } else if (result.data.length === 0) {
          toast.error('Báº¡n khÃ´ng Ä‘Æ°á»£c phÃ¢n cÃ´ng lÃ m giÃ¡o viÃªn chá»§ nhiá»‡m cho lá»›p nÃ o')
        } else {
          // Multiple classes - shouldn't happen for homeroom teachers but handle gracefully
          setHomeroomClass(result.data[0])
          setSelectedClassId(result.data[0].id)
        }
      } else {
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº£i thÃ´ng tin lá»›p chá»§ nhiá»‡m')
      }
    } catch {
      toast.error('Lá»—i khi táº£i thÃ´ng tin lá»›p chá»§ nhiá»‡m')
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
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch há»c sinh')
      }
    } catch {
      toast.error('Lá»—i khi táº£i danh sÃ¡ch há»c sinh')
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
      toast.error('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin vÃ  chá»n Ã­t nháº¥t má»™t há»c sinh')
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
        toast.success(`ÄÃ£ gá»­i lá»‹ch há»p phá»¥ huynh cho ${result.data?.recipients_count} phá»¥ huynh`)
        onOpenChange(false)
      } else {
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº¡o lá»‹ch há»p phá»¥ huynh')
      }
    } catch {
      toast.error('Lá»—i khi táº¡o lá»‹ch há»p phá»¥ huynh')
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
            Gá»­i Lá»‹ch Há»p Phá»¥ Huynh
          </DialogTitle>
          <DialogDescription>
            Táº¡o vÃ  gá»­i lá»‹ch há»p phá»¥ huynh cho há»c sinh trong lá»›p chá»§ nhiá»‡m
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class Information */}
          {homeroomClass ? (
            <div className="space-y-2">
              <Label>Lá»›p chá»§ nhiá»‡m:</Label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="font-medium text-blue-900">
                  {homeroomClass.name} - {homeroomClass.academic_year_name}
                </p>
                <p className="text-sm text-blue-700">
                  {homeroomClass.student_count} há»c sinh
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Lá»›p chá»§ nhiá»‡m:</Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-gray-500">Äang táº£i thÃ´ng tin lá»›p chá»§ nhiá»‡m...</p>
              </div>
            </div>
          )}

          {/* Meeting Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>TiÃªu Ä‘á» cuá»™c há»p:</Label>
              <Input
                placeholder="Nháº­p tiÃªu Ä‘á» cuá»™c há»p"
                value={meetingData.title}
                onChange={(e) => setMeetingData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Thá»i gian há»p:</Label>
              <Input
                type="datetime-local"
                value={meetingData.meeting_date}
                onChange={(e) => setMeetingData(prev => ({ ...prev, meeting_date: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Äá»‹a Ä‘iá»ƒm:</Label>
              <Input
                placeholder="Nháº­p Ä‘á»‹a Ä‘iá»ƒm há»p"
                value={meetingData.meeting_location}
                onChange={(e) => setMeetingData(prev => ({ ...prev, meeting_location: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Thá»i lÆ°á»£ng (phÃºt):</Label>
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
            <Label>MÃ´ táº£ cuá»™c há»p:</Label>
            <Textarea
              placeholder="Nháº­p mÃ´ táº£ chi tiáº¿t vá» cuá»™c há»p..."
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
                  Chá»n há»c sinh ({selectedStudents.size}/{students.length}):
                </Label>
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  {selectedStudents.size === students.length ? 'Bá» chá»n táº¥t cáº£' : 'Chá»n táº¥t cáº£'}
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Äang táº£i danh sÃ¡ch há»c sinh...</span>
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
                          {student.parents.length} phá»¥ huynh: {student.parents.map(p => p.full_name).join(', ')}
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
                <strong>TÃ³m táº¯t:</strong> Sáº½ gá»­i lá»‹ch há»p &quot;{meetingData.title}&quot;
                vÃ o {formatDateTime(meetingData.meeting_date)} 
                cho {selectedStudents.size} há»c sinh Ä‘Ã£ chá»n
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Há»§y
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !selectedClassId || !meetingData.title || !meetingData.meeting_date || selectedStudents.size === 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2 h-4 w-4" />
            Gá»­i Lá»‹ch Há»p
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
