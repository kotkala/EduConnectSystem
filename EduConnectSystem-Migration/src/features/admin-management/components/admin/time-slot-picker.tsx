"use client"

import { useState, useEffect } from 'react'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Clock } from 'lucide-react'
import { calculateEndTime } from '@/lib/validations/timetable-validations'

interface TimeSlotPickerProps {
  readonly value?: string
  readonly onChange: (time: string) => void
  readonly disabled?: boolean
  readonly error?: string
}

export function TimeSlotPicker({ value, onChange, disabled, error }: TimeSlotPickerProps) {
  const [selectedHour, setSelectedHour] = useState<string>('')
  const [selectedMinute, setSelectedMinute] = useState<string>('')

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [hour, minute] = value.split(':')
      setSelectedHour(hour)
      setSelectedMinute(minute)
    } else {
      setSelectedHour('')
      setSelectedMinute('')
    }
  }, [value])

  // Generate time options
  const hours = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 7 // 7 AM to 5 PM
    return {
      value: hour.toString().padStart(2, '0'),
      label: `${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`
    }
  })

  const minutes = [
    { value: '00', label: '00' },
    { value: '15', label: '15' },
    { value: '30', label: '30' },
    { value: '45', label: '45' }
  ]

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour)
    if (hour && selectedMinute) {
      const timeString = `${hour}:${selectedMinute}`
      onChange(timeString)
    }
  }

  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute)
    if (selectedHour && minute) {
      const timeString = `${selectedHour}:${minute}`
      onChange(timeString)
    }
  }

  const formatTime12Hour = (time24: string) => {
    if (!time24) return ''
    const [hour, minute] = time24.split(':')
    const hourNum = parseInt(hour)
    const period = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = (() => {
      if (hourNum === 0) return 12
      return hourNum > 12 ? hourNum - 12 : hourNum
    })()
    return `${hour12}:${minute} ${period}`
  }

  const currentTime = selectedHour && selectedMinute ? `${selectedHour}:${selectedMinute}` : ''
  const endTime = currentTime ? calculateEndTime(currentTime, 45) : ''

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">
        Time Slot *
      </Label>
      
      {/* Time Selection */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Start:</span>
        </div>
        
        <Select value={selectedHour} onValueChange={handleHourChange} disabled={disabled}>
          <SelectTrigger className="w-20">
            <SelectValue placeholder="Hour" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((hour) => (
              <SelectItem key={hour.value} value={hour.value}>
                {hour.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-muted-foreground">:</span>

        <Select value={selectedMinute} onValueChange={handleMinuteChange} disabled={disabled}>
          <SelectTrigger className="w-20">
            <SelectValue placeholder="Min" />
          </SelectTrigger>
          <SelectContent>
            {minutes.map((minute) => (
              <SelectItem key={minute.value} value={minute.value}>
                {minute.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Display */}
      {currentTime && (
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {formatTime12Hour(currentTime)} - {formatTime12Hour(endTime)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            (45 minutes)
          </span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Helper Text */}
      <p className="text-xs text-muted-foreground">
        Select start time for a 45-minute lesson (7:00 AM - 5:00 PM)
      </p>
    </div>
  )
}

// Predefined time slots for quick selection
export function QuickTimeSlots({ onSelect, disabled }: {
  readonly onSelect: (time: string) => void
  readonly disabled?: boolean
}) {
  const commonSlots = [
    { time: '07:00', label: '7:00 AM - 7:45 AM' },
    { time: '08:00', label: '8:00 AM - 8:45 AM' },
    { time: '09:00', label: '9:00 AM - 9:45 AM' },
    { time: '10:00', label: '10:00 AM - 10:45 AM' },
    { time: '11:00', label: '11:00 AM - 11:45 AM' },
    { time: '13:00', label: '1:00 PM - 1:45 PM' },
    { time: '14:00', label: '2:00 PM - 2:45 PM' },
    { time: '15:00', label: '3:00 PM - 3:45 PM' },
    { time: '16:00', label: '4:00 PM - 4:45 PM' }
  ]

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Quick Select</Label>
      <div className="flex flex-wrap gap-2">
        {commonSlots.map((slot) => (
          <button
            key={slot.time}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(slot.time)}
            className="px-3 py-1 text-xs border rounded-md hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {slot.label}
          </button>
        ))}
      </div>
    </div>
  )
}
