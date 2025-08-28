"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'

import { Skeleton } from "@/shared/components/ui/skeleton";import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { 
  Calendar, 
  Clock, 
  MapPin,
  User,
  Users,
  Eye,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getParentMeetingSchedulesAction,
  markMeetingScheduleAsReadAction,
  getUnreadMeetingScheduleCountAction,
  type MeetingScheduleInfo
} from '@/features/meetings'

interface ParentMeetingSchedulesProps {
  readonly showUnreadCount?: boolean
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

  // Memoized helper functions for better performance
  const formatDateTime = useCallback((dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return date.toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  const formatDuration = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
    return `${mins}m`
  }, [])

  const getMeetingTypeLabel = useCallback((type: string) => {
    switch (type) {
      case 'parent_meeting': return 'Họp Phụ Huynh'
      case 'class_meeting': return 'Họp Lớp'
      case 'individual_meeting': return 'Họp Cá Nhân'
      default: return 'Cuộc Họp'
    }
  }, [])

  const isUpcoming = useCallback((dateString: string) => {
    return new Date(dateString) > new Date()
  }, [])

  // Memoized meeting data processing
  const processedMeetings = useMemo(() => {
    return meetingSchedules.map(meeting => ({
      ...meeting,
      formattedDate: formatDateTime(meeting.meeting_date),
      formattedDuration: formatDuration(meeting.duration_minutes),
      typeLabel: getMeetingTypeLabel(meeting.meeting_type),
      isUpcoming: isUpcoming(meeting.meeting_date)
    }))
  }, [meetingSchedules, formatDateTime, formatDuration, getMeetingTypeLabel, isUpcoming])

  const renderMeetingSchedulesList = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Skeleton className="h-32 w-full rounded-lg" />
          <span className="ml-2">Đang tải lịch họp...</span>
        </div>
      )
    }

    if (meetingSchedules.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 md:h-14 lg:h-16 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch họp</h3>
            <p className="text-gray-600 text-center">
              Bạn chưa nhận được lịch họp nào từ giáo viên chủ nhiệm
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-3">
        {processedMeetings.map((meeting) => (
          <Card key={meeting.id} className={`cursor-pointer transition-colors hover:bg-gray-50 ${!meeting.is_read ? 'border-blue-200 bg-blue-50' : ''}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-3">
                {/* Left section - Meeting info */}
                <div className="flex-1 min-w-0">
                  {/* Title and badges */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">{meeting.title}</h3>
                    {!meeting.is_read && (
                      <Badge variant="default" className="text-xs shrink-0 px-1 py-0">
                        Mới
                      </Badge>
                    )}
                    {meeting.isUpcoming && (
                      <Badge variant="secondary" className="text-xs shrink-0 px-1 py-0">
                        Sắp tới
                      </Badge>
                    )}
                  </div>

                  {/* Meeting details in single row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(meeting.meeting_date).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {meeting.teacher_name}
                    </span>
                  </div>
                </div>

                {/* Right section - Action button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewMeeting(meeting)}
                  className="shrink-0 h-8 w-8 p-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (showUnreadCount) {
    return (
      <Button
        variant="outline"
        onClick={() => window.location.href = '/parent/meetings'}
        className="relative"
      >
        <Calendar className="mr-2 h-4 w-4" />
        Lịch họp phụ huynh
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
          {isLoading && <Skeleton className="h-32 w-full rounded-lg" />}
          Làm mới
        </Button>
      </div>

      {/* Meeting Schedules List */}
      {renderMeetingSchedulesList()}

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
