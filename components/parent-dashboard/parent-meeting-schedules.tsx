"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Calendar, 
  Clock, 
  MapPin,
  User,
  Users,
  Loader2,
  Eye,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getParentMeetingSchedulesAction,
  markMeetingScheduleAsReadAction,
  getUnreadMeetingScheduleCountAction,
  type MeetingScheduleInfo
} from '@/lib/actions/meeting-schedule-actions'

interface ParentMeetingSchedulesProps {
  showUnreadCount?: boolean
}

export function ParentMeetingSchedules({ showUnreadCount = false }: ParentMeetingSchedulesProps) {
  const [meetingSchedules, setMeetingSchedules] = useState<MeetingScheduleInfo[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingScheduleInfo | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Load meeting schedules and unread count
  const loadMeetingSchedules = useCallback(async () => {
    setIsLoading(true)
    try {
      const [schedulesResult, countResult] = await Promise.all([
        getParentMeetingSchedulesAction(),
        showUnreadCount ? getUnreadMeetingScheduleCountAction() : Promise.resolve({ success: true, data: { count: 0 } })
      ])

      if (schedulesResult.success && schedulesResult.data) {
        setMeetingSchedules(schedulesResult.data)
      } else {
        toast.error(schedulesResult.error || 'Không thể tải lịch họp')
      }

      if (countResult.success && countResult.data) {
        setUnreadCount(countResult.data.count)
      }
    } catch {
      toast.error('Lỗi khi tải lịch họp')
    } finally {
      setIsLoading(false)
    }
  }, [showUnreadCount])

  useEffect(() => {
    loadMeetingSchedules()
  }, [loadMeetingSchedules])

  const handleViewMeeting = async (meeting: MeetingScheduleInfo) => {
    setSelectedMeeting(meeting)
    setIsDialogOpen(true)

    // Mark as read if not already read
    if (!meeting.is_read) {
      try {
        const result = await markMeetingScheduleAsReadAction(meeting.id)
        if (result.success) {
          // Update local state
          setMeetingSchedules(prev => 
            prev.map(m => 
              m.id === meeting.id 
                ? { ...m, is_read: true, read_at: new Date().toISOString() }
                : m
            )
          )
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      } catch (error) {
        console.error('Error marking meeting as read:', error)
      }
    }
  }

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  if (showUnreadCount) {
    return (
      <Button
        variant="outline"
        onClick={() => window.location.href = '/dashboard/parent/meetings'}
        className="relative"
      >
        <Calendar className="mr-2 h-4 w-4" />
        Meeting Schedules
        {unreadCount > 0 && (
          <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lịch Họp Phụ Huynh</h2>
          <p className="text-muted-foreground">
            Xem lịch họp từ giáo viên chủ nhiệm
          </p>
        </div>
        <Button onClick={loadMeetingSchedules} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Làm mới
        </Button>
      </div>

      {/* Meeting Schedules List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Đang tải lịch họp...</span>
        </div>
      ) : meetingSchedules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch họp</h3>
            <p className="text-gray-600 text-center">
              Bạn chưa nhận được lịch họp nào từ giáo viên chủ nhiệm
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {meetingSchedules.map((meeting) => (
            <Card key={meeting.id} className={`cursor-pointer transition-colors hover:bg-gray-50 ${!meeting.is_read ? 'border-blue-200 bg-blue-50' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{meeting.title}</h3>
                      {!meeting.is_read && (
                        <Badge variant="default" className="text-xs">
                          Mới
                        </Badge>
                      )}
                      {isUpcoming(meeting.meeting_date) && (
                        <Badge variant="secondary" className="text-xs">
                          Sắp diễn ra
                        </Badge>
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
                        <User className="h-4 w-4" />
                        {meeting.teacher_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {meeting.class_name}
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
                        {meeting.description.length > 100 
                          ? `${meeting.description.substring(0, 100)}...` 
                          : meeting.description
                        }
                      </p>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewMeeting(meeting)}
                    className="ml-4"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Xem chi tiết
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Meeting Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Chi Tiết Lịch Họp
            </DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về cuộc họp phụ huynh
            </DialogDescription>
          </DialogHeader>

          {selectedMeeting && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedMeeting.title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{getMeetingTypeLabel(selectedMeeting.meeting_type)}</Badge>
                  {selectedMeeting.is_read && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Đã đọc
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Thời gian</p>
                      <p className="text-sm text-muted-foreground">{formatDateTime(selectedMeeting.meeting_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Thời lượng</p>
                      <p className="text-sm text-muted-foreground">{formatDuration(selectedMeeting.duration_minutes)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">Giáo viên chủ nhiệm</p>
                      <p className="text-sm text-muted-foreground">{selectedMeeting.teacher_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">Lớp</p>
                      <p className="text-sm text-muted-foreground">{selectedMeeting.class_name}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedMeeting.meeting_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Địa điểm</p>
                    <p className="text-sm text-muted-foreground">{selectedMeeting.meeting_location}</p>
                  </div>
                </div>
              )}

              {selectedMeeting.description && (
                <div>
                  <p className="text-sm font-medium mb-2">Mô tả cuộc họp</p>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm">{selectedMeeting.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
