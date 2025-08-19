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
import { getTeacherMeetingSchedulesAction } from '@/lib/actions/meeting-schedule-actions'

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
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº£i lá»‹ch há»p')
      }
    } catch {
      toast.error('Lá»—i khi táº£i lá»‹ch há»p')
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
      case 'parent_meeting': return 'Há»p Phá»¥ Huynh'
      case 'class_meeting': return 'Há»p Lá»›p'
      case 'individual_meeting': return 'Há»p CÃ¡ NhÃ¢n'
      default: return 'Cuá»™c Há»p'
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
          <span className="ml-2">Äang táº£i lá»‹ch há»p...</span>
        </div>
      )
    }

    if (meetingSchedules.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>ChÆ°a cÃ³ lá»‹ch há»p nÃ o Ä‘Æ°á»£c táº¡o</p>
          <p className="text-sm">Nháº¥n &quot;Táº¡o Lá»‹ch Há»p&quot; Ä‘á»ƒ báº¯t Ä‘áº§u</p>
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
                    <Badge variant="default">Sáº¯p diá»…n ra</Badge>
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
                    {meeting.recipients_count} phá»¥ huynh
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
          <h1 className="text-3xl font-bold tracking-tight">Há»p Phá»¥ Huynh</h1>
          <p className="text-muted-foreground">
            Quáº£n lÃ½ lá»‹ch há»p phá»¥ huynh cho lá»›p chá»§ nhiá»‡m cá»§a báº¡n
          </p>
        </div>
        <Button 
          onClick={() => setMeetingDialogOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Táº¡o Lá»‹ch Há»p
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium min-w-0 flex-1 pr-2">Tá»•ng Lá»‹ch Há»p</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetingSchedules.length}</div>
            <p className="text-xs text-muted-foreground">
              Lá»‹ch há»p Ä‘Ã£ táº¡o
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium min-w-0 flex-1 pr-2">Phá»¥ Huynh ÄÃ£ Nháº­n</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetingSchedules.reduce((total, meeting) => total + meeting.recipients_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tá»•ng sá»‘ thÃ´ng bÃ¡o Ä‘Ã£ gá»­i
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium min-w-0 flex-1 pr-2">Sáº¯p Diá»…n Ra</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetingSchedules.filter(meeting => isUpcoming(meeting.meeting_date)).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Cuá»™c há»p sáº¯p tá»›i
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium min-w-0 flex-1 pr-2">ThÃ¡ng NÃ y</CardTitle>
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
              Lá»‹ch há»p thÃ¡ng nÃ y
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            HÆ°á»›ng Dáº«n Sá»­ Dá»¥ng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4 className="font-medium">Táº¡o Lá»‹ch Há»p Phá»¥ Huynh:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>â€¢ Nháº¥n nÃºt &quot;Táº¡o Lá»‹ch Há»p&quot; á»Ÿ gÃ³c trÃªn bÃªn pháº£i</li>
                <li>â€¢ Chá»n lá»›p chá»§ nhiá»‡m cá»§a báº¡n</li>
                <li>â€¢ Äiá»n thÃ´ng tin cuá»™c há»p (tiÃªu Ä‘á», thá»i gian, Ä‘á»‹a Ä‘iá»ƒm)</li>
                <li>â€¢ Chá»n há»c sinh cáº§n gá»­i thÃ´ng bÃ¡o cho phá»¥ huynh</li>
                <li>â€¢ Nháº¥n &quot;Gá»­i Lá»‹ch Há»p&quot; Ä‘á»ƒ hoÃ n táº¥t</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">LÆ°u Ã Quan Trá»ng:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>â€¢ Chá»‰ giÃ¡o viÃªn chá»§ nhiá»‡m má»›i cÃ³ thá»ƒ gá»­i lá»‹ch há»p</li>
                <li>â€¢ ThÃ´ng bÃ¡o sáº½ Ä‘Æ°á»£c gá»­i Ä‘áº¿n táº¥t cáº£ phá»¥ huynh cá»§a há»c sinh Ä‘Ã£ chá»n</li>
                <li>â€¢ Phá»¥ huynh sáº½ nháº­n Ä‘Æ°á»£c thÃ´ng bÃ¡o trong má»¥c &quot;Lá»‹ch Há»p&quot;</li>
                <li>â€¢ CÃ³ thá»ƒ chá»n nhiá»u há»c sinh cÃ¹ng lÃºc Ä‘á»ƒ gá»­i thÃ´ng bÃ¡o hÃ ng loáº¡t</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Schedules List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lá»‹ch Há»p ÄÃ£ Táº¡o</CardTitle>
          <Button variant="outline" onClick={loadMeetingSchedules} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            LÃ m má»›i
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
