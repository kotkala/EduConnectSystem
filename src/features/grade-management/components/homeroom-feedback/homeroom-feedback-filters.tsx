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
      title="Bộ Lá»c Phản Hồ“i"
      loadAcademicYears={loadAcademicYears}
      loadSemesters={loadSemesters}
      weekCalculationMode="semester-based"
      maxWeeks={20}
      statusMessage={{
        ready: "âœ“ Sẵn sÃ ng xem pháº£n hồ“i hồc sinh",
        instruction: "Vui lòng chồn năm hồc, hồc kỳ vÃ  tuần Ä‘á»ƒ xem pháº£n hồ“i hồc sinh"
      }}
    />
  )
}
