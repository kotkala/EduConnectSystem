"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import {
  Calendar,
  Plus,
  Users,
  Clock,
  FileText,
  MapPin,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { HomeroomMeetingDialog } from '@/features/timetable/components/teacher-timetable/homeroom-meeting-dialog'
import { getTeacherMeetingSchedulesAction } from '@/features/meetings'

interface TeacherMeetingSchedule {
  id: string
  title: string
  description?: string
  meeting_date: string
  meeting_location?: string
  duration_minutes: number
  meeting_type: string
  class_name: string
  recipients_count: number
  created_at: string
}

export default function TeacherMeetingsPage() {
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
  const [meetingSchedules, setMeetingSchedules] = useState<TeacherMeetingSchedule[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load meeting schedules
  const loadMeetingSchedules = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getTeacherMeetingSchedulesAction()
      if (result.success && result.data) {
        setMeetingSchedules(result.data)
      } else {
        toast.error(result.error || 'Không thể tải lịch họp')
      }
    } catch {
      toast.error('Lỗi khi tải lịch họp')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load data on component mount
  useEffect(() => {
    loadMeetingSchedules()
  }, [loadMeetingSchedules])

  // Reload data when dialog closes (meeting created)
  const handleDialogClose = (open: boolean) => {
    setMeetingDialogOpen(open)
    if (!open) {
      // Reload meeting schedules when dialog closes
      loadMeetingSchedules()
    }
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString('vi-VN', {
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }

  const getMeetingTypeLabel = (type: string) => {
    switch (type) {
      case 'parent_meeting': return 'Họp Phụ Huynh'
      case 'class_meeting': return 'Họp Lớp'
      case 'individual_meeting': return 'Họp Cá Nhân'
      default: return 'Cuộc Họp'
    }
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  const renderMeetingSchedulesList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Đang tải lịch họp...</span>
        </div>
      )
    }

    if (meetingSchedules.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có lịch họp nào được tạo</p>
          <p className="text-sm">Nhấn &quot;Tạo Lịch Họp&quot; để bắt đầu</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {meetingSchedules.map((meeting) => (
          <div key={meeting.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{meeting.title}</h3>
                  <Badge variant="outline">{getMeetingTypeLabel(meeting.meeting_type)}</Badge>
                  {isUpcoming(meeting.meeting_date) && (
                    <Badge variant="default">Sắp diễn ra</Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDateTime(meeting.meeting_date)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatDuration(meeting.duration_minutes)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {meeting.class_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {meeting.recipients_count} phụ huynh
                  </div>
                  {meeting.meeting_location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {meeting.meeting_location}
                    </div>
                  )}
                </div>

                {meeting.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {meeting.description.length > 150
                      ? `${meeting.description.substring(0, 150)}...`
                      : meeting.description
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Họp Phụ Huynh</h1>
          <p className="text-muted-foreground">
            Quản lý lịch họp phụ huynh cho lớp chủ nhiệm của bạn
          </p>
        </div>
        <Button 
          onClick={() => setMeetingDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Tạo Lịch Họp
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium min-w-0 flex-1 pr-2">Tổng Lịch Họp</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetingSchedules.length}</div>
            <p className="text-xs text-muted-foreground">
              Lịch họp đã tạo
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium min-w-0 flex-1 pr-2">Phụ Huynh Đã Nhận</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetingSchedules.reduce((total, meeting) => total + meeting.recipients_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tổng số thông báo đã gửi
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium min-w-0 flex-1 pr-2">Sắp Diễn Ra</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetingSchedules.filter(meeting => isUpcoming(meeting.meeting_date)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Cuộc họp sắp tới
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium min-w-0 flex-1 pr-2">Tháng Này</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetingSchedules.filter(meeting => {
                const meetingDate = new Date(meeting.meeting_date)
                const now = new Date()
                return meetingDate.getMonth() === now.getMonth() && meetingDate.getFullYear() === now.getFullYear()
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Lịch họp tháng này
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Hướng Dẫn Sử Dụng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Tạo Lịch Họp Phụ Huynh:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>â€¢ Nhấn nút &quot;Tạo Lịch Họp&quot; ở góc trên bên phải</li>
                <li>â€¢ Chọn lớp chủ nhiệm của bạn</li>
                <li>â€¢ Điền thông tin cuộc họp (tiêu đề, thời gian, địa điểm)</li>
                <li>â€¢ Chọn học sinh cần gửi thông báo cho phụ huynh</li>
                <li>â€¢ Nhấn &quot;Gửi Lịch Họp&quot; để hoàn tất</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Lưu Ý Quan Trọng:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>â€¢ Chỉ giáo viên chủ nhiệm mới có thể gửi lịch họp</li>
                <li>â€¢ Thông báo sẽ được gửi đến tất cả phụ huynh của học sinh đã chọn</li>
                <li>â€¢ Phụ huynh sẽ nhận được thông báo trong mục &quot;Lịch Họp&quot;</li>
                <li>â€¢ Có thể chọn nhiều học sinh cùng lúc để gửi thông báo hàng loạt</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Schedules List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lịch Họp Đã Tạo</CardTitle>
          <Button variant="outline" onClick={loadMeetingSchedules} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Làm mới
          </Button>
        </CardHeader>
        <CardContent>
          {renderMeetingSchedulesList()}
        </CardContent>
      </Card>

      {/* Meeting Dialog */}
      <HomeroomMeetingDialog
        open={meetingDialogOpen}
        onOpenChange={handleDialogClose}
      />
    </div>
  )
}
