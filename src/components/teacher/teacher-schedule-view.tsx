'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Users, BookOpen, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'

interface TimeSlot {
  id: string
  name: string
  start_time: string
  end_time: string
  order_index: number
}

interface Schedule {
  id: string
  day_of_week: string
  room_number: string
  notes: string
  class: {
    id: string
    name: string
    code: string
    capacity: number
  }
  subject: {
    id: string
    name: string
    code: string
  }
  time_slot: TimeSlot
}

interface TeacherScheduleViewProps {
  onEvaluateLesson: (schedule: Schedule) => void
}

const DAY_LABELS = {
  monday: 'Thứ 2',
  tuesday: 'Thứ 3',
  wednesday: 'Thứ 4',
  thursday: 'Thứ 5',
  friday: 'Thứ 6',
  saturday: 'Thứ 7',
  sunday: 'Chủ nhật'
}

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function TeacherScheduleView({ onEvaluateLesson }: TeacherScheduleViewProps) {
  const [scheduleData, setScheduleData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(0) // 0 = current week

  useEffect(() => {
    fetchSchedule()
  }, [selectedWeek])

  const fetchSchedule = async () => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/teacher-schedule')
      const result = await response.json()

      if (result.success) {
        setScheduleData(result.data)
        setError(null)
      } else {
        setError(result.error || 'Không thể tải thời khóa biểu')
      }
    } catch (err) {
      setError('Có lỗi mạng xảy ra')
      console.error('Error fetching schedule:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5)
  }

  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date()
    const currentDay = today.getDay()
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
    
    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset + (weekOffset * 7))
    
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    
    return dates
  }

  const isToday = (dayIndex: number, weekOffset: number = 0) => {
    const today = new Date()
    const weekDates = getWeekDates(weekOffset)
    const dayDate = weekDates[dayIndex]
    
    return dayDate.toDateString() === today.toDateString()
  }

  const isPastLesson = (schedule: Schedule, dayIndex: number, weekOffset: number = 0) => {
    const now = new Date()
    const weekDates = getWeekDates(weekOffset)
    const lessonDate = weekDates[dayIndex]
    
    // Set lesson time
    const [hours, minutes] = schedule.time_slot.end_time.split(':')
    lessonDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    
    return lessonDate < now
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Đang tải thời khóa biểu...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button onClick={fetchSchedule} className="mt-2">
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!scheduleData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <p>Không có dữ liệu thời khóa biểu</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const weekDates = getWeekDates(selectedWeek)
  const { schedules, time_slots, academic_term, homeroom_classes } = scheduleData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Thời khóa biểu giảng dạy</h2>
          <p className="text-gray-600">
            {academic_term?.name} - {academic_term?.academic_year?.name}
          </p>
        </div>
        
        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedWeek(selectedWeek - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Tuần trước
          </Button>
          
          <div className="text-center px-4">
            <div className="text-sm font-medium">
              {selectedWeek === 0 ? 'Tuần này' : `Tuần ${selectedWeek > 0 ? '+' : ''}${selectedWeek}`}
            </div>
            <div className="text-xs text-gray-500">
              {weekDates[0].toLocaleDateString('vi-VN')} - {weekDates[6].toLocaleDateString('vi-VN')}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedWeek(selectedWeek + 1)}
          >
            Tuần sau
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Homeroom Classes Info */}
      {homeroom_classes && homeroom_classes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Lớp chủ nhiệm
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {homeroom_classes.map((assignment: any) => (
                <Badge key={assignment.id} variant="outline" className="text-base">
                  {assignment.class.name} ({assignment.class.code})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lịch giảng dạy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-gray-50 min-w-20">Tiết</th>
                  {DAYS_ORDER.map((day, index) => (
                    <th 
                      key={day} 
                      className={`border p-2 bg-gray-50 min-w-48 ${
                        isToday(index, selectedWeek) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="text-center">
                        <div className="font-medium">{DAY_LABELS[day as keyof typeof DAY_LABELS]}</div>
                        <div className="text-xs text-gray-500">
                          {weekDates[index].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {time_slots?.map((timeSlot: TimeSlot) => (
                  <tr key={timeSlot.id}>
                    <td className="border p-2 text-center bg-gray-50">
                      <div className="text-sm font-medium">{timeSlot.name}</div>
                      <div className="text-xs text-gray-500">
                        {formatTime(timeSlot.start_time)} - {formatTime(timeSlot.end_time)}
                      </div>
                    </td>
                    {DAYS_ORDER.map((day, dayIndex) => {
                      const daySchedules = schedules[day] || []
                      const schedule = daySchedules.find((s: Schedule) => s.time_slot.id === timeSlot.id)
                      
                      return (
                        <td 
                          key={`${day}-${timeSlot.id}`} 
                          className={`border p-2 ${
                            isToday(dayIndex, selectedWeek) ? 'bg-blue-50' : ''
                          }`}
                        >
                          {schedule ? (
                            <div className="space-y-2">
                              <div className="text-sm">
                                <div className="font-medium text-blue-900">
                                  {schedule.subject.name}
                                </div>
                                <div className="text-gray-600">
                                  {schedule.class.name}
                                </div>
                                {schedule.room_number && (
                                  <div className="text-xs text-gray-500">
                                    Phòng: {schedule.room_number}
                                  </div>
                                )}
                              </div>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onEvaluateLesson(schedule)}
                                className="w-full text-xs"
                                disabled={!isPastLesson(schedule, dayIndex, selectedWeek)}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Đánh giá tiết học
                              </Button>
                            </div>
                          ) : (
                            <div className="text-center text-gray-400 text-sm">
                              Trống
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border rounded"></div>
              <span>Hôm nay</span>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled className="h-6 text-xs">
                Đánh giá tiết học
              </Button>
              <span>Chỉ có thể đánh giá sau khi kết thúc tiết học</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 