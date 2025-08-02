'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Clock, User, Filter } from 'lucide-react'
import { getParentViolationsAction } from '@/lib/actions/violation-actions'
import { getParentStudentsAction, type StudentInfo } from '@/lib/actions/parent-actions'
import { getSeverityLabel, getSeverityColor, type StudentViolationWithDetails, violationSeverityLevels } from '@/lib/validations/violation-validations'
import { getWeekNumberFromDate } from '@/components/timetable-calendar/data-mappers'
import { SharedPaginationControls } from '@/components/shared/shared-pagination-controls'
import { toast } from 'sonner'

// Helper function to render violations content
function renderViolationsContent(
  loading: boolean,
  violations: StudentViolationWithDetails[],
  selectedStudent: StudentInfo | undefined
) {
  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          Loading violations...
        </CardContent>
      </Card>
    )
  }

  if (violations.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No violations recorded</h3>
          <p className="text-muted-foreground">
            {selectedStudent
              ? `${selectedStudent.full_name} has no recorded violations.`
              : 'Your children have no recorded violations.'
            }
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Violations ({violations.length})
            </CardTitle>
            <CardDescription>
              All recorded violations for your children
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {violations.map((violation) => (
              <div key={violation.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{violation.student.full_name}</h4>
                      <Badge variant="outline">{violation.student.student_id}</Badge>
                      <Badge variant="outline">{violation.class.name}</Badge>
                      <Badge className={getSeverityColor(violation.severity)}>
                        {getSeverityLabel(violation.severity)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {violation.violation_type.category.name} • {violation.violation_type.name}
                    </p>
                    {violation.description && (
                      <p className="text-sm">{violation.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(violation.recorded_at).toLocaleDateString('vi-VN')}
                      </span>
                      <span>Recorded by: {violation.recorded_by.full_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ParentViolationsPageClient() {
  const [violations, setViolations] = useState<StudentViolationWithDetails[]>([])
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all')
  const [selectedWeek, setSelectedWeek] = useState<string>('all')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([])

  const pageSize = 10

  useEffect(() => {
    // Move loadStudents logic inside useEffect (Context7 pattern)
    const loadStudents = async () => {
      try {
        const result = await getParentStudentsAction()

        if (result && result.success && result.data) {
          setStudents(result.data)
          // Auto-select first student if only one
          if (result.data.length === 1) {
            setSelectedStudentId(result.data[0].id)
          }
        } else {
          toast.error(result?.error || 'Failed to load students')
        }
      } catch {
        toast.error('An error occurred while loading students')
      }
    }

    loadStudents()
  }, []) // ✅ All dependencies declared

  useEffect(() => {
    // Move loadViolations logic inside useEffect (Context7 pattern)
    const loadViolations = async () => {
      try {
        setLoading(true)

        // Prepare filters (only severity and pagination for server-side)
        const filters = {
          severity: selectedSeverity !== 'all' ? selectedSeverity : undefined,
          page: 1, // Get all data for client-side filtering
          limit: 1000 // Large limit to get all violations
        }

        const studentId = selectedStudentId !== 'all' ? selectedStudentId : undefined
        const result = await getParentViolationsAction(studentId, filters)

        if (result && result.success && result.data) {
          // Calculate week numbers for all violations
          const violationsWithWeeks = result.data.map(v => {
            let weekNumber = null
            if (v.semester?.start_date) {
              const semesterStartDate = new Date(v.semester.start_date)
              const recordedDate = new Date(v.recorded_at)
              weekNumber = getWeekNumberFromDate(recordedDate, semesterStartDate)
            }
            return { ...v, calculatedWeekNumber: weekNumber }
          })

          // Client-side week filtering
          let filteredViolations = violationsWithWeeks
          if (selectedWeek !== 'all') {
            const targetWeek = parseInt(selectedWeek)
            filteredViolations = violationsWithWeeks.filter(v => v.calculatedWeekNumber === targetWeek)
          }

          // Client-side pagination
          const startIndex = (currentPage - 1) * pageSize
          const endIndex = startIndex + pageSize
          const paginatedViolations = filteredViolations.slice(startIndex, endIndex)

          setViolations(paginatedViolations)
          setTotalPages(Math.ceil(filteredViolations.length / pageSize))
          setTotalCount(filteredViolations.length)

          // Extract available weeks from all violations data
          const weeks = [...new Set(violationsWithWeeks.map(v => v.calculatedWeekNumber).filter((week): week is number => week !== null))]
          setAvailableWeeks(weeks.toSorted((a, b) => a - b))
        } else {
          toast.error(result?.error || 'Failed to load violations')
        }
      } catch {
        toast.error('An error occurred while loading violations')
      } finally {
        setLoading(false)
      }
    }

    loadViolations()
  }, [selectedStudentId, selectedWeek, selectedSeverity, currentPage]) // ✅ All dependencies declared

  // Reset filters function
  const resetFilters = () => {
    setSelectedStudentId('all')
    setSelectedWeek('all')
    setSelectedSeverity('all')
    setCurrentPage(1)
  }

  const selectedStudent = students.find(s => s.id === selectedStudentId)

  if (loading && students.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vi Phạm Con Em</h1>
            <p className="text-muted-foreground">
              View your children&apos;s violation records
            </p>
          </div>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vi Phạm Con Em</h1>
          <p className="text-muted-foreground">
            Theo dõi các vi phạm của con em trong quá trình học tập
          </p>
        </div>

        {/* Filters Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Bộ Lọc
            </CardTitle>
            <CardDescription>
              Lọc vi phạm theo học sinh, tuần học và mức độ nghiêm trọng
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              {/* Student Selection */}
              <div className="flex items-center gap-2 min-w-[200px]">
                <User className="h-4 w-4" />
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn con em" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả con em</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} ({student.student_id})
                        {student.current_class && ` - ${student.current_class.name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Week Filter */}
              <div className="flex items-center gap-2 min-w-[150px]">
                <Clock className="h-4 w-4" />
                <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tuần học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả tuần</SelectItem>
                    {availableWeeks.map((week) => (
                      <SelectItem key={week} value={week.toString()}>
                        Tuần {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Severity Filter */}
              <div className="flex items-center gap-2 min-w-[150px]">
                <AlertTriangle className="h-4 w-4" />
                <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    {violationSeverityLevels.map((severity) => (
                      <SelectItem key={severity} value={severity}>
                        {getSeverityLabel(severity)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reset Filters Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="ml-auto"
              >
                Đặt lại bộ lọc
              </Button>

              {/* Results Summary */}
              <div className="text-sm text-muted-foreground">
                Hiển thị {violations.length} / {totalCount} vi phạm
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{violations.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedStudent ? `For ${selectedStudent.full_name}` : 'All children'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{violations.length}</div>
            <p className="text-xs text-muted-foreground">
              All recorded violations
            </p>
          </CardContent>
        </Card>
      </div>

      {renderViolationsContent(loading, violations, selectedStudent)}

      {/* Pagination Controls */}
      <SharedPaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        itemName="vi phạm"
      />
    </div>
  )
}
