"use client"

import { useState, useEffect, useCallback } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarDays } from "lucide-react"
import {
  getHomeroomAcademicYearsAction,
  getHomeroomSemestersAction,
  type HomeroomFeedbackFilters as FiltersType
} from "@/lib/actions/homeroom-feedback-actions"

// Types for filter data
interface AcademicYear {
  id: string
  name: string
}

interface Semester {
  id: string
  name: string
}

interface HomeroomFeedbackFiltersProps {
  filters: FiltersType
  onFiltersChange: (filters: FiltersType) => void
}

export function HomeroomFeedbackFilters({
  filters,
  onFiltersChange,
}: HomeroomFeedbackFiltersProps) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)

  // Load academic years - Context7 pattern for initial data loading
  useEffect(() => {
    const loadAcademicYears = async () => {
      setIsLoadingData(true)
      try {
        const result = await getHomeroomAcademicYearsAction()
        if (result.success && result.data) {
          setAcademicYears(result.data)
        } else {
          console.error("Failed to load academic years:", result.error)
          setAcademicYears([])
        }
      } catch (error) {
        console.error("Error loading academic years:", error)
        setAcademicYears([])
      } finally {
        setIsLoadingData(false)
      }
    }

    loadAcademicYears()
  }, [])

  // Load semesters when academic year changes - Context7 pattern for dependent dropdowns
  useEffect(() => {
    const loadSemesters = async () => {
      if (!filters.academic_year_id) {
        setSemesters([])
        return
      }

      try {
        const result = await getHomeroomSemestersAction(filters.academic_year_id)
        if (result.success && result.data) {
          setSemesters(result.data)
        } else {
          console.error("Failed to load semesters:", result.error)
          setSemesters([])
        }
      } catch (error) {
        console.error("Error loading semesters:", error)
        setSemesters([])
      }
    }

    loadSemesters()
  }, [filters.academic_year_id])

  const handleFilterChange = useCallback((key: keyof FiltersType, value: string | number) => {
    const newFilters = { ...filters, [key]: value }

    // Reset dependent filters when parent changes - Context7 pattern for cascading dropdowns
    if (key === 'academic_year_id') {
      newFilters.semester_id = ''
      newFilters.week_number = 1
      // Clear semesters immediately when academic year changes
      setSemesters([])
    } else if (key === 'semester_id') {
      newFilters.week_number = 1
    }

    onFiltersChange(newFilters)
  }, [filters, onFiltersChange])

  const getWeekOptions = () => {
    return Array.from({ length: 52 }, (_, i) => i + 1)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <span>Bộ Lọc Phản Hồi</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Academic Year, Semester, and Week Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Academic Year Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Năm Học</label>
            <Select
              value={filters.academic_year_id || ""}
              onValueChange={(value) => handleFilterChange('academic_year_id', value)}
              disabled={isLoadingData}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn năm học" />
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
            <label className="text-sm font-medium">Học Kỳ</label>
            <Select
              value={filters.semester_id || ""}
              onValueChange={(value) => handleFilterChange('semester_id', value)}
              disabled={!filters.academic_year_id || semesters.length === 0}
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

          {/* Study Week Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tuần Học</label>
            <Select
              value={filters.week_number?.toString() || ""}
              onValueChange={(value) => handleFilterChange('week_number', parseInt(value))}
              disabled={!filters.semester_id}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn tuần" />
              </SelectTrigger>
              <SelectContent>
                {getWeekOptions().map((week) => (
                  <SelectItem key={week} value={week.toString()}>
                    Tuần {week}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Status */}
        <div className="text-sm text-muted-foreground">
          {filters.academic_year_id && filters.semester_id && filters.week_number ? (
            <span className="text-green-600">
              ✓ Sẵn sàng xem phản hồi học sinh cho Tuần {filters.week_number}
            </span>
          ) : (
            <span>
              Vui lòng chọn năm học, học kỳ và tuần để xem phản hồi học sinh
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
