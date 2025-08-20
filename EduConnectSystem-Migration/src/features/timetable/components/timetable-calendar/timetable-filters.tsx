"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { format, addWeeks, startOfWeek, endOfWeek } from "date-fns";
import { getAcademicYearsAction, getSemestersAction } from "@/features/admin-management/actions/academic-actions";
import { getClassesAction } from "@/features/admin-management/actions/class-actions";

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

interface GradeLevel {
  level: string;
  display_name: string;
}

interface ClassItem {
  id: string;
  name: string;
  grade_level: string;
}

export interface TimetableFilters {
  academicYearId?: string;
  semesterId?: string;
  gradeLevel?: string;
  classId?: string;
  studyWeek?: number;
}

interface TimetableFiltersProps {
  readonly filters: TimetableFilters;
  readonly onFiltersChange: (filters: TimetableFilters) => void;
  readonly onRefresh: () => void;
  readonly loading?: boolean;
}

export function TimetableFilters({
  filters,
  onFiltersChange,
  onRefresh,
  loading = false,
}: TimetableFiltersProps) {
  // Generate unique IDs for form labels
  const formId = useId();

  // Filter data state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Week calculation state
  const [semesterWeeks, setSemesterWeeks] = useState<Array<{
    number: number;
    startDate: Date;
    endDate: Date;
    label: string;
  }>>([]);

  // Calculate weeks based on semester
  useEffect(() => {
    if (!filters.semesterId) {
      setSemesterWeeks([]);
      return;
    }

    const selectedSemester = semesters.find(s => s.id === filters.semesterId);
    if (!selectedSemester) {
      setSemesterWeeks([]);
      return;
    }

    // Determine max weeks based on semester name
    const maxWeeks = selectedSemester.name.toLowerCase().includes('semester 1') ? 18 : 17;

    const weeks = [];
    for (let i = 1; i <= maxWeeks; i++) {
      weeks.push({
        number: i,
        startDate: new Date(), // This would be calculated based on semester start date
        endDate: new Date(),   // This would be calculated based on week duration
        label: `Week ${i}`,
      });
    }
    setSemesterWeeks(weeks);
  }, [filters.semesterId, semesters]);

  // Load academic years on mount
  useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        const result = await getAcademicYearsAction({ page: 1, limit: 100 });
        if (result.success) {
          setAcademicYears(result.data.map(ay => ({
            id: ay.id,
            name: ay.name,
            start_date: ay.start_date,
            end_date: ay.end_date
          })));
        } else {
          console.error("Failed to load academic years:", result.error);
        }
      } catch (error) {
        console.error("Failed to load academic years:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadAcademicYears();
  }, []);

  // Load semesters when academic year changes
  useEffect(() => {
    if (!filters.academicYearId) {
      setSemesters([]);
      return;
    }

    const loadSemesters = async () => {
      try {
        const result = await getSemestersAction({ page: 1, limit: 100 });
        if (result.success) {
          // Filter semesters by academic year
          const filteredSemesters = result.data
            .filter(semester => semester.academic_year_id === filters.academicYearId)
            .map(semester => ({
              id: semester.id,
              name: semester.name,
              start_date: semester.start_date,
              end_date: semester.end_date,
              academic_year_id: semester.academic_year_id
            }));
          setSemesters(filteredSemesters);
        } else {
          console.error("Failed to load semesters:", result.error);
        }
      } catch (error) {
        console.error("Failed to load semesters:", error);
      }
    };

    loadSemesters();
  }, [filters.academicYearId]);

  // Load grade levels when semester changes
  useEffect(() => {
    if (!filters.semesterId) {
      setGradeLevels([]);
      return;
    }

    const loadGradeLevels = async () => {
      try {
        // Use standard Vietnamese grade levels
        const gradeLevels: GradeLevel[] = [
          { level: "10", display_name: "Lớp 10" },
          { level: "11", display_name: "Lớp 11" },
          { level: "12", display_name: "Lớp 12" },
        ];
        setGradeLevels(gradeLevels);
      } catch (error) {
        console.error("Failed to load grade levels:", error);
      }
    };

    loadGradeLevels();
  }, [filters.semesterId]);

  // Load classes when grade level changes
  useEffect(() => {
    if (!filters.gradeLevel || !filters.semesterId) {
      setClasses([]);
      return;
    }

    const loadClasses = async () => {
      try {
        const result = await getClassesAction({
          page: 1,
          limit: 100,
          semester_id: filters.semesterId
        });
        if (result.success) {
          // Filter classes by grade level (extract from class name)
          const filteredClasses = result.data
            .filter(classItem => {
              // Extract grade level from class name (e.g., "10A1" -> "10")
              const gradeRegex = /^(\d+)/;
              const gradeMatch = gradeRegex.exec(classItem.name);
              return gradeMatch && gradeMatch[1] === filters.gradeLevel;
            })
            .map(classItem => ({
              id: classItem.id,
              name: classItem.name,
              grade_level: filters.gradeLevel || ""
            }));
          setClasses(filteredClasses);
        } else {
          console.error("Failed to load classes:", result.error);
        }
      } catch (error) {
        console.error("Failed to load classes:", error);
      }
    };

    loadClasses();
  }, [filters.gradeLevel, filters.semesterId]);

  // Calculate semester weeks when semester changes
  useEffect(() => {
    if (!filters.semesterId) {
      setSemesterWeeks([]);
      return;
    }

    const selectedSemester = semesters.find(s => s.id === filters.semesterId);
    if (!selectedSemester) return;

    const startDate = new Date(selectedSemester.start_date);
    const endDate = new Date(selectedSemester.end_date);
    
    const weeks = [];
    let currentWeek = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday
    let weekNumber = 1;

    while (currentWeek <= endDate) {
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
      weeks.push({
        number: weekNumber,
        startDate: currentWeek,
        endDate: weekEnd,
        label: `Week ${weekNumber} (${format(currentWeek, "MMM d")} - ${format(weekEnd, "MMM d")})`,
      });
      currentWeek = addWeeks(currentWeek, 1);
      weekNumber++;
    }

    setSemesterWeeks(weeks);
  }, [filters.semesterId, semesters]);

  const handleFilterChange = useCallback((key: keyof TimetableFilters, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset dependent filters when parent changes
    if (key === 'academicYearId') {
      newFilters.semesterId = undefined;
      newFilters.gradeLevel = undefined;
      newFilters.classId = undefined;
      newFilters.studyWeek = undefined;
    } else if (key === 'semesterId') {
      newFilters.gradeLevel = undefined;
      newFilters.classId = undefined;
      newFilters.studyWeek = undefined;
    } else if (key === 'gradeLevel') {
      newFilters.classId = undefined;
    }

    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleWeekNavigation = (direction: 'prev' | 'next') => {
    if (!filters.studyWeek) return;
    
    const newWeek = direction === 'prev' 
      ? Math.max(1, filters.studyWeek - 1)
      : Math.min(semesterWeeks.length, filters.studyWeek + 1);
    
    handleFilterChange('studyWeek', newWeek);
  };

  const currentWeek = semesterWeeks.find(w => w.number === filters.studyWeek);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <CalendarDays className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Timetable Filters</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="w-full sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Academic Year Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="space-y-2">
            <label htmlFor={formId + '-academicYear'} className="text-sm font-medium">Academic Year</label>
            <Select
              value={filters.academicYearId || ""}
              onValueChange={(value) => handleFilterChange('academicYearId', value)}
              disabled={loadingData}
            >
              <SelectTrigger id={formId + '-academicYear'}>
                <SelectValue placeholder={loadingData ? "Loading..." : "Select year"} />
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
            <label htmlFor={formId + '-semester'} className="text-sm font-medium">Semester</label>
            <Select
              value={filters.semesterId || ""}
              onValueChange={(value) => handleFilterChange('semesterId', value)}
              disabled={!filters.academicYearId || semesters.length === 0}
            >
              <SelectTrigger id={formId + '-semester'}>
                <SelectValue placeholder="Select semester" />
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

          {/* Grade Level Selection */}
          <div className="space-y-2">
            <label htmlFor={formId + '-gradeLevel'} className="text-sm font-medium">Grade Level</label>
            <Select
              value={filters.gradeLevel || ""}
              onValueChange={(value) => handleFilterChange('gradeLevel', value)}
              disabled={!filters.semesterId || gradeLevels.length === 0}
            >
              <SelectTrigger id={formId + '-gradeLevel'}>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevels.map((grade) => (
                  <SelectItem key={grade.level} value={grade.level}>
                    {grade.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Class Selection */}
          <div className="space-y-2">
            <label htmlFor={formId + '-class'} className="text-sm font-medium">Class</label>
            <Select
              value={filters.classId || ""}
              onValueChange={(value) => handleFilterChange('classId', value)}
              disabled={!filters.gradeLevel || classes.length === 0}
            >
              <SelectTrigger id={formId + '-class'}>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((classItem) => (
                  <SelectItem key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Study Week Selection */}
          <div className="space-y-2">
            <label htmlFor={formId + '-studyWeek'} className="text-sm font-medium">Study Week</label>
            <Select
              value={filters.studyWeek?.toString() || ""}
              onValueChange={(value) => handleFilterChange('studyWeek', parseInt(value))}
              disabled={!filters.classId || semesterWeeks.length === 0}
            >
              <SelectTrigger id={formId + '-studyWeek'}>
                <SelectValue placeholder="Select week" />
              </SelectTrigger>
              <SelectContent>
                {semesterWeeks.map((week) => (
                  <SelectItem key={week.number} value={week.number.toString()}>
                    {week.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Week Navigation */}
        {currentWeek && (
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleWeekNavigation('prev')}
              disabled={!filters.studyWeek || filters.studyWeek <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous Week
            </Button>
            
            <div className="text-center">
              <Badge variant="outline" className="text-sm">
                {currentWeek.label}
              </Badge>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleWeekNavigation('next')}
              disabled={!filters.studyWeek || filters.studyWeek >= semesterWeeks.length}
            >
              Next Week
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
