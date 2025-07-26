"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays, RefreshCw } from "lucide-react";
import { getTeacherAcademicYearsAction, getTeacherSemestersAction } from "@/lib/actions/teacher-schedule-actions";
import { useAuth } from "@/hooks/use-auth";

// Types for filter data
interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface Semester {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  academic_year_id: string;
}

export interface TeacherTimetableFilters {
  academicYearId?: string;
  semesterId?: string;
  studyWeek?: number;
}

interface TeacherTimetableFiltersProps {
  filters: TeacherTimetableFilters;
  onFiltersChange: (filters: TeacherTimetableFilters) => void;
  onRefresh: () => void;
  loading?: boolean;
}

export function TeacherTimetableFilters({
  filters,
  onFiltersChange,
  onRefresh,
  loading = false,
}: TeacherTimetableFiltersProps) {
  const { user } = useAuth();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Load academic years
  useEffect(() => {
    const loadAcademicYears = async () => {
      if (!user) return;
      
      setIsLoadingData(true);
      try {
        const result = await getTeacherAcademicYearsAction();
        if (result.success && result.data) {
          setAcademicYears(result.data);
        }
      } catch (error) {
        console.error("Error loading academic years:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAcademicYears();
  }, [user]);

  // Load semesters when academic year changes
  useEffect(() => {
    const loadSemesters = async () => {
      if (!filters.academicYearId) {
        setSemesters([]);
        return;
      }

      try {
        // Get semesters for the selected academic year where teacher has classes
        const result = await getTeacherSemestersAction(filters.academicYearId);
        if (result.success && result.data) {
          setSemesters(result.data);
        } else {
          setSemesters([]);
        }
      } catch (error) {
        console.error("Error loading semesters:", error);
        setSemesters([]);
      }
    };

    loadSemesters();
  }, [filters.academicYearId, academicYears]);

  const handleFilterChange = useCallback((key: keyof TeacherTimetableFilters, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value };

    // Reset dependent filters when parent changes
    if (key === 'academicYearId') {
      newFilters.semesterId = undefined;
      newFilters.studyWeek = undefined;
    } else if (key === 'semesterId') {
      newFilters.studyWeek = undefined;
    }

    onFiltersChange(newFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFiltersChange]);

  const getWeekOptions = () => {
    return Array.from({ length: 52 }, (_, i) => i + 1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <span>Bộ Lọc Lịch Học</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading || isLoadingData}>
            <RefreshCw className={`mr-2 h-4 w-4 ${(loading || isLoadingData) ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Academic Year, Semester, and Week Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Academic Year Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Năm Học</label>
            <Select
              value={filters.academicYearId || ""}
              onValueChange={(value) => handleFilterChange('academicYearId', value)}
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
              value={filters.semesterId || ""}
              onValueChange={(value) => handleFilterChange('semesterId', value)}
              disabled={!filters.academicYearId || semesters.length === 0}
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
              value={filters.studyWeek?.toString() || ""}
              onValueChange={(value) => handleFilterChange('studyWeek', parseInt(value))}
              disabled={!filters.semesterId}
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
          {filters.academicYearId && filters.semesterId && filters.studyWeek ? (
            <span className="text-green-600">
              ✓ Sẵn sàng xem lịch học cho Tuần {filters.studyWeek}
            </span>
          ) : (
            <span>
              Vui lòng chọn năm học, học kỳ và tuần để xem lịch giảng dạy của bạn
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
