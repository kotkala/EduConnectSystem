// EXAMPLE: How to update admin pages to use global academic year context
// This shows the pattern for updating app/dashboard/admin/classes/page.tsx

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, GraduationCap, Users, BookOpen, RefreshCw } from "lucide-react"
import { ClassTable } from "@/components/admin/class-table"
import { ClassForm } from "@/components/admin/class-form"
import { getClassesAction, getHomeroomEnabledTeachersAction } from "@/lib/actions/class-actions"
import { getSemestersAction } from "@/lib/actions/academic-actions"
import {
  type ClassWithDetails,
  type ClassFilters
} from "@/lib/validations/class-validations"
import { type Semester } from "@/lib/validations/academic-validations"

// IMPORTANT: Import the academic year context
import { useAcademicYear, useSelectedAcademicYearId } from "@/contexts/academic-year-context"

// Simple teacher interface for dropdown
interface SimpleTeacher {
  id: string
  full_name: string
  employee_id: string
}

export default function ClassManagementPage() {
  // STEP 1: Use the global academic year context
  const { selectedAcademicYear, loading: academicYearLoading } = useAcademicYear()
  const selectedAcademicYearId = useSelectedAcademicYearId()

  // Classes State
  const [classes, setClasses] = useState<ClassWithDetails[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [classesError, setClassesError] = useState<string | null>(null)
  const [classesTotal, setClassesTotal] = useState(0)
  const [classesPage, setClassesPage] = useState(1)
  const [classesFilters, setClassesFilters] = useState<ClassFilters>({ page: 1, limit: 10 })

  // Form Data State - REMOVED academicYears since it's now global
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [teachers, setTeachers] = useState<SimpleTeacher[]>([])

  // Dialog States
  const [showCreateClassDialog, setShowCreateClassDialog] = useState(false)

  // STEP 2: Update filters to include selected academic year automatically
  const enhancedFilters = useMemo(() => {
    return {
      ...classesFilters,
      academic_year_id: selectedAcademicYearId || undefined // Automatically filter by selected year
    }
  }, [classesFilters, selectedAcademicYearId])

  // Fetch Classes - UPDATED to use enhanced filters
  const fetchClasses = useCallback(async () => {
    // Don't fetch if no academic year is selected
    if (!selectedAcademicYearId) {
      setClasses([])
      setClassesTotal(0)
      setClassesLoading(false)
      return
    }

    setClassesLoading(true)
    setClassesError(null)

    try {
      const result = await getClassesAction(enhancedFilters)
      
      if (result.success) {
        setClasses(result.data)
        setClassesTotal(result.total)
        setClassesPage(result.page || 1)
      } else {
        setClassesError(result.error || "Không thể tải danh sách lớp học")
      }
    } catch (err) {
      setClassesError(err instanceof Error ? err.message : "Không thể tải danh sách lớp học")
    } finally {
      setClassesLoading(false)
    }
  }, [enhancedFilters, selectedAcademicYearId])

  // STEP 3: Update form data fetching to filter by selected academic year
  const fetchFormData = useCallback(async () => {
    if (!selectedAcademicYearId) return

    try {
      const [semestersResult, teachersResult] = await Promise.all([
        // Get all semesters (filtering will be done client-side or in a custom action)
        getSemestersAction({
          page: 1,
          limit: 50
        }),
        getHomeroomEnabledTeachersAction()
      ])

      if (semestersResult.success) {
        // Filter semesters by selected academic year
        const filteredSemesters = semestersResult.data.filter(
          semester => semester.academic_year_id === selectedAcademicYearId
        )
        setSemesters(filteredSemesters)
      }

      if (teachersResult.success) {
        setTeachers(teachersResult.data)
      }
    } catch (error) {
      console.error("Lỗi tải dữ liệu biểu mẫu:", error)
    }
  }, [selectedAcademicYearId])

  // STEP 4: Refetch data when academic year changes
  useEffect(() => {
    if (!academicYearLoading && selectedAcademicYearId) {
      fetchClasses()
      fetchFormData()
    }
  }, [selectedAcademicYearId, academicYearLoading, fetchClasses, fetchFormData])

  // Event Handlers
  const handleClassPageChange = (page: number) => {
    setClassesFilters(prev => ({ ...prev, page }))
  }

  const handleClassFiltersChange = (newFilters: Partial<ClassFilters>) => {
    setClassesFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleCreateClassSuccess = () => {
    setShowCreateClassDialog(false)
    fetchClasses()
  }

  const handleRefresh = () => {
    fetchClasses()
    fetchFormData()
  }

  // STEP 5: Show loading state while academic year is loading
  if (academicYearLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải thông tin năm học...</span>
        </div>
      </div>
    )
  }

  // STEP 6: Show message if no academic year is selected
  if (!selectedAcademicYear) {
    return (
      <div className="p-6">
        <Alert>
          <AlertDescription>
            Vui lòng chọn năm học từ dropdown ở góc phải trên để quản lý lớp học.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header - UPDATED to show selected academic year */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quản lý lớp học</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Năm học: <strong>{selectedAcademicYear.name}</strong>
            </p>
          </div>
          <Button
            onClick={() => setShowCreateClassDialog(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm lớp học
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Tổng số lớp</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{classesTotal}</div>
              <p className="text-xs text-muted-foreground">
                Trong năm học {selectedAcademicYear.name}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Học kỳ</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{semesters.length}</div>
              <p className="text-xs text-muted-foreground">
                Học kỳ trong năm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Giáo viên chủ nhiệm</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{teachers.length}</div>
              <p className="text-xs text-muted-foreground">
                Có thể làm chủ nhiệm
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Error Alert */}
        {classesError && (
          <Alert variant="destructive">
            <AlertDescription>{classesError}</AlertDescription>
          </Alert>
        )}

        {/* Classes Table - UPDATED to remove academic year filter since it's global */}
        <ClassTable
          data={classes}
          total={classesTotal}
          currentPage={classesPage}
          limit={classesFilters.limit}
          onPageChange={handleClassPageChange}
          onFiltersChange={handleClassFiltersChange}
          onRefresh={handleRefresh}
          // REMOVED: academicYears prop since filtering is now automatic
          semesters={semesters}
          teachers={teachers}
        />

        {/* Create Class Dialog - UPDATED to pass selected academic year */}
        <Dialog open={showCreateClassDialog} onOpenChange={setShowCreateClassDialog}>
          <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Thêm lớp học mới - {selectedAcademicYear.name}
              </DialogTitle>
            </DialogHeader>
            <ClassForm
              // UPDATED: ClassForm now handles all data loading internally
              // Only need to pass callbacks and optional defaultAcademicYearId
              defaultAcademicYearId={selectedAcademicYearId || undefined}
              onSuccess={handleCreateClassSuccess}
              onCancel={() => setShowCreateClassDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

/*
SUMMARY OF CHANGES NEEDED FOR ALL ADMIN PAGES:

1. Import useAcademicYear and useSelectedAcademicYearId
2. Remove academicYears state and fetching
3. Add selectedAcademicYearId to filters automatically
4. Update data fetching to depend on selected academic year
5. Show loading/empty states appropriately
6. Update UI to show selected academic year context
7. Remove academic year dropdowns from forms (use global context)
8. Update table components to not show academic year filters

PAGES THAT NEED UPDATES:
- app/dashboard/admin/classes/page.tsx
- app/dashboard/admin/report-periods/page.tsx  
- components/admin/class-form.tsx
- components/admin/class-table.tsx
- components/admin/report-periods/report-period-form.tsx
- components/admin/grade-management/grade-reporting-period-form.tsx
- components/admin/semester-form.tsx
- And any other admin pages that have academic year dropdowns
*/
