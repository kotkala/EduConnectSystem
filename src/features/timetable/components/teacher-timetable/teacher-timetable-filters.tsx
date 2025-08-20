"use client";

import { useCallback } from "react";
import { getTeacherAcademicYearsAction, getTeacherSemestersAction } from "@/features/teacher-management/actions/teacher-schedule-actions";
import { useAuth } from "@/features/authentication/hooks/use-auth";
import {
  AcademicFilters,
  type AcademicYear,
  type Semester,
  type BaseAcademicFilters
} from "@/shared/components/shared/academic-filters";

export interface TeacherTimetableFilters extends BaseAcademicFilters {
  academicYearId?: string;
  semesterId?: string;
  studyWeek?: number;
}

interface TeacherTimetableFiltersProps {
  readonly filters: TeacherTimetableFilters;
  readonly onFiltersChange: (filters: TeacherTimetableFilters) => void;
  readonly onRefresh: () => void;
  readonly loading?: boolean;
}

export function TeacherTimetableFilters({
  filters,
  onFiltersChange,
  onRefresh,
  loading = false,
}: TeacherTimetableFiltersProps) {
  const { user } = useAuth();

  // Load academic years function
  const loadAcademicYears = useCallback(async (): Promise<AcademicYear[]> => {
    if (!user) return [];

    const result = await getTeacherAcademicYearsAction();
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error("Failed to load academic years:", result.error);
      return [];
    }
  }, [user]);

  // Load semesters function
  const loadSemesters = useCallback(async (academicYearId: string): Promise<Semester[]> => {
    const result = await getTeacherSemestersAction(academicYearId);
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error("Failed to load semesters:", result.error);
      return [];
    }
  }, []);

  // Convert filters to match the shared component interface
  const sharedFilters = {
    academic_year_id: filters.academicYearId,
    semester_id: filters.semesterId,
    week_number: filters.studyWeek
  };

  const handleSharedFiltersChange = useCallback((newFilters: typeof sharedFilters) => {
    onFiltersChange({
      academicYearId: newFilters.academic_year_id,
      semesterId: newFilters.semester_id,
      studyWeek: newFilters.week_number
    });
  }, [onFiltersChange]);

  return (
    <AcademicFilters
      filters={sharedFilters}
      onFiltersChange={handleSharedFiltersChange}
      onRefresh={onRefresh}
      loading={loading}
      title="Bá»™ Lá»c Lá»‹ch Há»c"
      showRefreshButton={true}
      loadAcademicYears={loadAcademicYears}
      loadSemesters={loadSemesters}
      weekCalculationMode="simple"
      maxWeeks={52}
      statusMessage={{
        ready: "âœ“ Sáºµn sÃ ng xem lá»‹ch há»c",
        instruction: "Vui lÃ²ng chá»n nÄƒm há»c, há»c ká»³ vÃ  tuáº§n Ä‘á»ƒ xem lá»‹ch giáº£ng dáº¡y cá»§a báº¡n"
      }}
    />
  );
}
