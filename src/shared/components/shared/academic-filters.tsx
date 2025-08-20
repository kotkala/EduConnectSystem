"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Button } from "@/shared/components/ui/button"
import { CalendarDays, RefreshCw } from "lucide-react"
import { format, endOfWeek } from 'date-fns'
import { getWeekStartDate } from '@/features/timetable/components/timetable-calendar/data-mappers'

// Shared types for academic filters
export interface AcademicYear {
  id: string
  name: string
  start_date?: string
  end_date?: string
}

export interface Semester {
  id: string
  name: string
  start_date: string
  end_date: string
  academic_year_id?: string
}

export interface WeekOption {
  number: number
  startDate: Date
  endDate: Date
  label: string
}

export interface BaseAcademicFilters {
  academic_year_id?: string
  semester_id?: string
  week_number?: number
}

// Props for the shared academic filters component
interface AcademicFiltersProps<T extends BaseAcademicFilters> {
  readonly filters: T
  readonly onFiltersChange: (filters: T) => void
  readonly onRefresh?: () => void
  readonly loading?: boolean
  readonly title?: string
  readonly showRefreshButton?: boolean
  readonly loadAcademicYears: () => Promise<AcademicYear[]>
  readonly loadSemesters: (academicYearId: string) => Promise<Semester[]>
  readonly weekCalculationMode?: 'simple' | 'semester-based'
  readonly maxWeeks?: number
  readonly statusMessage?: {
    ready: string
    instruction: string
  }
}

export function AcademicFilters<T extends BaseAcademicFilters>({
  filters,
  onFiltersChange,
  onRefresh,
  loading = false,
  title = "Bá»™ Lá»c",
  showRefreshButton = false,
  loadAcademicYears,
  loadSemesters,
  weekCalculationMode = 'simple',
  maxWeeks = 52,
  statusMessage = {
    ready: "âœ“ Sáºµn sÃ ng xem dá»¯ liá»‡u",
    instruction: "Vui lÃ²ng chá»n nÄƒm há»c, há»c ká»³ vÃ  tuáº§n Ä‘á»ƒ xem dá»¯ liá»‡u"
  }
}: AcademicFiltersProps<T>) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [weekOptions, setWeekOptions] = useState<WeekOption[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Load academic years
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true)
      try {
        const years = await loadAcademicYears()
        setAcademicYears(years)
      } catch (error) {
        console.error("Error loading academic years:", error)
        setAcademicYears([])
      } finally {
        setIsLoadingData(false)
      }
    }

    loadData()
  }, [loadAcademicYears])

  // Load semesters when academic year changes
  useEffect(() => {
    const loadSemesterData = async () => {
      if (!filters.academic_year_id) {
        setSemesters([])
        return
      }

      try {
        const semesterData = await loadSemesters(filters.academic_year_id)
        setSemesters(semesterData)
      } catch (error) {
        console.error("Error loading semesters:", error)
        setSemesters([])
      }
    }

    loadSemesterData()
  }, [filters.academic_year_id, loadSemesters])

  // Generate week options when semester changes
  useEffect(() => {
    const generateWeekOptions = () => {
      if (weekCalculationMode === 'simple') {
        // Simple mode: just generate numbered weeks
        const weeks: WeekOption[] = Array.from({ length: maxWeeks }, (_, i) => ({
          number: i + 1,
          startDate: new Date(),
          endDate: new Date(),
          label: `Tuáº§n ${i + 1}`
        }))
        setWeekOptions(weeks)
        return
      }

      // Semester-based mode: calculate weeks based on semester dates
      const semester = semesters.find(s => s.id === filters.semester_id)
      if (!semester) {
        setWeekOptions([])
        return
      }

      const semesterStartDate = new Date(semester.start_date)
      const semesterEndDate = new Date(semester.end_date)
      const weeks: WeekOption[] = []
      let weekNumber = 1

      while (weekNumber <= maxWeeks) {
        const weekStartDate = getWeekStartDate(semesterStartDate, weekNumber)
        const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 })

        if (weekStartDate > semesterEndDate) {
          break
        }

        weeks.push({
          number: weekNumber,
          startDate: weekStartDate,
          endDate: weekEndDate,
          label: `Tuáº§n ${weekNumber} (${format(weekStartDate, "dd/MM")} - ${format(weekEndDate, "dd/MM")})`,
        })
        weekNumber++
      }

      setWeekOptions(weeks)
    }

    generateWeekOptions()
  }, [filters.semester_id, semesters, weekCalculationMode, maxWeeks])

  const handleFilterChange = useCallback((key: keyof BaseAcademicFilters, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value } as T

    // Reset dependent filters when parent changes
    if (key === 'academic_year_id') {
      newFilters.semester_id = '' as T['semester_id']
      newFilters.week_number = (weekCalculationMode === 'simple' ? undefined : 1) as T['week_number']
      setSemesters([])
      setWeekOptions([])
    } else if (key === 'semester_id') {
      newFilters.week_number = (weekCalculationMode === 'simple' ? undefined : 1) as T['week_number']
      setWeekOptions([])
    }

    onFiltersChange(newFilters)
  }, [filters, onFiltersChange, weekCalculationMode])

  const isFilterComplete = filters.academic_year_id && filters.semester_id && 
    (weekCalculationMode === 'simple' || filters.week_number)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
          {showRefreshButton && onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading || isLoadingData}>
              <RefreshCw className={`mr-2 h-4 w-4 ${(loading || isLoadingData) ? 'animate-spin' : ''}`} />
              LÃ m má»›i
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Academic Year Selection */}
          <div className="space-y-2">
            <label htmlFor="academic-year-select" className="text-sm font-medium">NÄƒm Há»c</label>
            <Select
              value={filters.academic_year_id || ""}
              onValueChange={(value) => handleFilterChange('academic_year_id', value)}
              disabled={isLoadingData}
              name="academic-year-select"
            >
              <SelectTrigger id="academic-year-select">
                <SelectValue placeholder="Chá»n nÄƒm há»c" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Semester Selection */}
          <div className="space-y-2">
            <label htmlFor="semester-select" className="text-sm font-medium">Há»c Ká»³</label>
            <Select
              value={filters.semester_id || ""}
              onValueChange={(value) => handleFilterChange('semester_id', value)}
              disabled={!filters.academic_year_id || semesters.length === 0}
              name="semester-select"
            >
              <SelectTrigger id="semester-select">
                <SelectValue placeholder="Chá»n há»c ká»³" />
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

          {/* Week Selection */}
          <div className="space-y-2">
            <label htmlFor="week-select" className="text-sm font-medium">Tuáº§n Há»c</label>
            <Select
              value={filters.week_number?.toString() || ""}
              onValueChange={(value) => handleFilterChange('week_number', parseInt(value))}
              disabled={!filters.semester_id || weekOptions.length === 0}
              name="week-select"
            >
              <SelectTrigger id="week-select">
                <SelectValue placeholder="Chá»n tuáº§n" />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map((week) => (
                  <SelectItem key={week.number} value={week.number.toString()}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Status */}
        <div className="text-sm text-muted-foreground">
          {isFilterComplete ? (
            <span className="text-green-600">
              {statusMessage.ready} {filters.week_number ? `cho Tuáº§n ${filters.week_number}` : ''}
            </span>
          ) : (
            <span>
              {statusMessage.instruction}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
