"use client"

import { useCallback } from "react"
import {
  getHomeroomAcademicYearsAction,
  getHomeroomSemestersAction,
  type HomeroomFeedbackFilters as FiltersType
} from "@/features/grade-management/actions/homeroom-feedback-actions"
import {
  AcademicFilters,
  type AcademicYear,
  type Semester
} from "@/shared/components/shared/academic-filters"

interface HomeroomFeedbackFiltersProps {
  readonly filters: FiltersType
  readonly onFiltersChange: (filters: FiltersType) => void
}

export function HomeroomFeedbackFilters({
  filters,
  onFiltersChange,
}: HomeroomFeedbackFiltersProps) {

  // Load academic years function
  const loadAcademicYears = useCallback(async (): Promise<AcademicYear[]> => {
    const result = await getHomeroomAcademicYearsAction()
    if (result.success && result.data) {
      return result.data
    } else {
      console.error("Failed to load academic years:", result.error)
      return []
    }
  }, [])

  // Load semesters function
  const loadSemesters = useCallback(async (academicYearId: string): Promise<Semester[]> => {
    const result = await getHomeroomSemestersAction(academicYearId)
    if (result.success && result.data) {
      return result.data
    } else {
      console.error("Failed to load semesters:", result.error)
      return []
    }
  }, [])

  return (
    <AcademicFilters
      filters={filters}
      onFiltersChange={onFiltersChange}
      title="Bộ Lọc Phản Hồi"
      loadAcademicYears={loadAcademicYears}
      loadSemesters={loadSemesters}
      weekCalculationMode="semester-based"
      maxWeeks={20}
      statusMessage={{
        ready: "âœ“ Sẵn sàng xem phản hồi học sinh",
        instruction: "Vui lòng chọn năm học, học kỳ và tuần để xem phản hồi học sinh"
      }}
    />
  )
}
