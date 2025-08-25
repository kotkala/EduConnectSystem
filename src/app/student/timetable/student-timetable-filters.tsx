'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addWeeks, startOfWeek, endOfWeek } from 'date-fns'

interface Semester {
  id: string
  name: string
  start_date: string
  end_date: string
}

export interface StudentTimetableFilters {
  semesterId?: string
  studyWeek?: number
}

interface StudentTimetableFiltersProps {
  readonly filters: StudentTimetableFilters
  readonly onFiltersChange: (filters: StudentTimetableFilters) => void
  readonly onRefresh: () => void
  readonly loading?: boolean
}

export function StudentTimetableFilters({
  filters,
  onFiltersChange,
  onRefresh,
  loading = false
}: StudentTimetableFiltersProps) {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [semesterWeeks, setSemesterWeeks] = useState<Array<{
    number: number
    startDate: Date
    endDate: Date
    label: string
  }>>([])

  // Load semesters (student-accessible)
  const loadSemesters = useCallback(async () => {
    try {
      setLoadingData(true)
      
      // Simple fetch to get active semesters without admin permissions
      const response = await fetch('/api/semesters')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setSemesters(result.data)
          
          // Auto-select current semester if none selected
          if (!filters.semesterId && result.data.length > 0) {
            const currentSemester = result.data[0] // Assume first is current
            onFiltersChange({
              ...filters,
              semesterId: currentSemester.id,
              studyWeek: 1
            })
          }
        }
      }
    } catch (error) {
      console.error('Error loading semesters:', error)
    } finally {
      setLoadingData(false)
    }
  }, [filters, onFiltersChange])

  // Calculate weeks based on semester
  useEffect(() => {
    if (!filters.semesterId) {
      setSemesterWeeks([])
      return
    }

    const selectedSemester = semesters.find(s => s.id === filters.semesterId)
    if (!selectedSemester) {
      setSemesterWeeks([])
      return
    }

    // Simple 20-week calculation for any semester
    const maxWeeks = 20
    const semesterStart = new Date(selectedSemester.start_date)
    const weeks = []

    for (let i = 1; i <= maxWeeks; i++) {
      const weekStart = addWeeks(startOfWeek(semesterStart, { weekStartsOn: 1 }), i - 1)
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      
      weeks.push({
        number: i,
        startDate: weekStart,
        endDate: weekEnd,
        label: `Tuần ${i} (${format(weekStart, 'dd/MM')} - ${format(weekEnd, 'dd/MM')})`
      })
    }

    setSemesterWeeks(weeks)
  }, [filters.semesterId, semesters])

  // Load data on mount
  useEffect(() => {
    loadSemesters()
  }, [loadSemesters])

  const handleSemesterChange = (semesterId: string) => {
    onFiltersChange({
      ...filters,
      semesterId,
      studyWeek: 1 // Reset to week 1 when semester changes
    })
  }

  const handleWeekChange = (direction: 'prev' | 'next') => {
    const currentWeek = filters.studyWeek || 1
    const newWeek = direction === 'prev' 
      ? Math.max(1, currentWeek - 1)
      : Math.min(semesterWeeks.length, currentWeek + 1)
    
    onFiltersChange({
      ...filters,
      studyWeek: newWeek
    })
  }

  const currentWeekInfo = semesterWeeks.find(w => w.number === filters.studyWeek)

  return (
    <div className="space-y-4">
      {/* Semester Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Học kỳ</label>
          <Select
            value={filters.semesterId || ''}
            onValueChange={handleSemesterChange}
            disabled={loadingData}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id}>
                  {semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Tuần học</label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleWeekChange('prev')}
              disabled={!filters.studyWeek || filters.studyWeek <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Select
              value={filters.studyWeek?.toString() || ''}
              onValueChange={(value) => onFiltersChange({
                ...filters,
                studyWeek: parseInt(value)
              })}
              disabled={semesterWeeks.length === 0}
            >
              <SelectTrigger className="min-w-[120px]">
                <SelectValue placeholder="Chọn tuần" />
              </SelectTrigger>
              <SelectContent>
                {semesterWeeks.map((week) => (
                  <SelectItem key={week.number} value={week.number.toString()}>
                    Tuần {week.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleWeekChange('next')}
              disabled={!filters.studyWeek || filters.studyWeek >= semesterWeeks.length}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Current Week Info */}
      {currentWeekInfo && (
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline">
            {currentWeekInfo.label}
          </Badge>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
          ) : (
            <CalendarDays className="h-4 w-4" />
          )}
          Làm mới
        </Button>
      </div>
    </div>
  )
}
