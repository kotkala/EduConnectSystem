"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Clock,
  MapPin,
  User,
  BookOpen,
  Users,
  Calendar,
  FileText,
  MessageSquare
} from "lucide-react"
import { TeacherFeedbackDialog } from "./teacher-feedback-dialog"

export interface TeacherTimetableEvent {
  id: string
  class_id: string
  subject_id: string
  teacher_id: string
  classroom_id: string
  semester_id: string
  day_of_week: number
  start_time: string
  end_time: string
  week_number: number
  notes: string | null
  created_at: string
  updated_at: string
  // Joined data from the detailed view
  class_name: string
  subject_code: string
  subject_name: string
  teacher_name: string
  classroom_name: string
  building: string | null
  floor: number | null
  room_type: string
  semester_name: string
  academic_year_name: string
}

interface TeacherTimetableEventDialogProps {
  event: TeacherTimetableEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onClose: () => void
}

export function TeacherTimetableEventDialog({
  event,
  open,
  onOpenChange,
  onClose,
}: TeacherTimetableEventDialogProps) {
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)

  if (!event) return null

  const getDayName = (dayOfWeek: number) => {
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
    return days[dayOfWeek] || 'Không xác định'
  }

  const formatTime = (timeString: string) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getDuration = (startTime: string, endTime: string) => {
    const start = new Date(`1970-01-01T${startTime}`)
    const end = new Date(`1970-01-01T${endTime}`)
    const diffMs = end.getTime() - start.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMins / 60)
    const minutes = diffMins % 60
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }
    return `${minutes}m`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Chi Tiết Lớp Học
          </DialogTitle>
          <DialogDescription>
            Xem chi tiết buổi giảng dạy này
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Môn Học</label>
                <div className="flex items-center gap-2 mt-1">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">{event.subject_name}</span>
                  <Badge variant="outline">{event.subject_code}</Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Lớp</label>
                <div className="flex items-center gap-2 mt-1">
                  <Users className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{event.class_name}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Giáo Viên</label>
                <div className="flex items-center gap-2 mt-1">
                  <User className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">{event.teacher_name}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ngày & Giờ</label>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">
                    {getDayName(event.day_of_week)}, {formatTime(event.start_time)} - {formatTime(event.end_time)}
                  </span>
                  <Badge variant="secondary">{getDuration(event.start_time, event.end_time)}</Badge>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Phòng Học</label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <span className="font-medium">
                    {event.classroom_name}
                    {event.building && ` (${event.building})`}
                    {event.floor && `, Tầng ${event.floor}`}
                  </span>
                  {event.room_type && (
                    <Badge variant="outline">{event.room_type}</Badge>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Thời Gian Học</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium">
                    Tuần {event.week_number}, {event.semester_name}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {event.academic_year_name}
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          {event.notes && (
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Ghi Chú
              </label>
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-sm">{event.notes}</p>
              </div>
            </div>
          )}

          {/* Schedule Information */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Ngày tạo:</span>
                <span className="ml-2 font-medium">
                  {new Date(event.created_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Cập nhật lần cuối:</span>
                <span className="ml-2 font-medium">
                  {new Date(event.updated_at).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>

          {/* Read-only Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="flex items-center gap-2 text-blue-800">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Chế Độ Xem Giáo Viên</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Đây là chế độ xem chỉ đọc lịch giảng dạy của bạn. Liên hệ quản trị viên để thay đổi thời khóa biểu.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setFeedbackDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4" />
            Phản Hồi Học Sinh
          </Button>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>

        {/* Feedback Dialog */}
        <TeacherFeedbackDialog
          open={feedbackDialogOpen}
          onOpenChange={setFeedbackDialogOpen}
          timetableEvent={{
            id: event.id,
            class_id: event.class_id,
            subject_id: event.subject_id,
            class_name: event.class_name,
            subject_name: event.subject_name
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
