'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { FileText, Clock, User, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/shared/utils/supabase/client'
import { toast } from 'sonner'
import { getSeverityLabel, getSeverityColor, type ViolationSeverity, violationSeverityLevels } from '@/lib/validations/violation-validations'

// Simple types matching database structure
interface ViolationRecord {
  id: string
  student_id: string
  class_id: string
  violation_type_id: string
  severity: ViolationSeverity
  description: string | null
  recorded_by: string
  recorded_at: string
  violation_date: string
  // Joined data
  student: {
    id: string
    full_name: string
    student_id: string
  }
  class: {
    id: string
    name: string
  }
  violation_type: {
    id: string
    name: string
    category: {
      id: string
      name: string
    }
  }
  recorded_by_user: {
    id: string
    full_name: string
  }
}

// Using existing validation functions for consistency

// Helper function to render violations content - Context7 pattern
function renderViolationsContent(
  loading: boolean,
  violations: ViolationRecord[],
  currentPage: number,
  totalPages: number,
  setCurrentPage: (page: number) => void
) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Đang tải vi phạm...</p>
      </div>
    )
  }

  if (violations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Chưa có vi phạm nào được ghi nhận</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Violation</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Ngày</TableHead>
            <TableHead>Người ghi nhận</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {violations.map((violation) => (
          <TableRow key={violation.id}>
            <TableCell>
              <div>
                <div className="font-medium">{violation.student?.full_name || 'Không xác định'}</div>
                <div className="text-sm text-muted-foreground">
                  {violation.student?.student_id || 'N/A'}
                </div>
              </div>
            </TableCell>
            <TableCell>{violation.class?.name || 'Unknown'}</TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{violation.violation_type?.name || 'Không xác định'}</div>
                <div className="text-sm text-muted-foreground">
                  {violation.violation_type?.category?.name || 'Không xác định'}
                </div>
                {violation.description && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {violation.description}
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell>
              <Badge className={getSeverityColor(violation.severity)}>
                {getSeverityLabel(violation.severity)}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="h-3 w-3" />
                {new Date(violation.violation_date).toLocaleDateString('vi-VN')}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <User className="h-3 w-3" />
                {violation.recorded_by_user?.full_name || 'Không xác định'}
              </div>
            </TableCell>
          </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Trang {currentPage} / {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Tiếp
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      )}
    </>
  )
}

export default function SimpleViolationsTable() {
  const [violations, setViolations] = useState<ViolationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20) // Increased page size for better performance
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [academicYearFilter, setAcademicYearFilter] = useState<string>('all')
  const [classes, setClasses] = useState<Array<{id: string, name: string}>>([])
  const [academicYears, setAcademicYears] = useState<Array<{id: string, name: string}>>([])
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const supabase = createClient()

  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    loadClasses()
    loadAcademicYears()
    loadViolations()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadViolations()
  }, [currentPage, debouncedSearchTerm, severityFilter, classFilter, monthFilter, academicYearFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('Error loading classes:', error)
        toast.error(`Failed to load classes: ${error.message}`)
        return
      }

      if (!Array.isArray(data)) {
        console.error('Invalid classes data structure:', data)
        toast.error('Invalid classes data received')
        return
      }

      setClasses(data)
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.error(`An error occurred while loading classes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const loadAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('id, name')
        .order('name', { ascending: false })

      if (error) {
        console.error('Error loading academic years:', error)
        toast.error(`Failed to load academic years: ${error.message}`)
        return
      }

      if (!Array.isArray(data)) {
        console.error('Invalid academic years data structure:', data)
        toast.error('Invalid academic years data received')
        return
      }

      setAcademicYears(data)
    } catch (error) {
      console.error('Error loading academic years:', error)
      toast.error(`An error occurred while loading academic years: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const loadViolations = async () => {
    try {
      setLoading(true)

      // Build base query with proper joins - Context7 pattern
      let query = supabase
        .from('student_violations')
        .select(`
          id,
          student_id,
          class_id,
          violation_type_id,
          severity,
          description,
          recorded_by,
          recorded_at,
          violation_date,
          student:profiles!student_id(id, full_name, student_id),
          class:classes!class_id(id, name),
          violation_type:violation_types!violation_type_id(
            id,
            name,
            category:violation_categories!category_id(id, name)
          ),
          recorded_by_user:profiles!recorded_by(id, full_name)
        `, { count: 'exact' })

      // Apply search filter - simplified approach for reliability
      if (debouncedSearchTerm) {
        // First get student IDs that match the search term
        const { data: matchingStudents } = await supabase
          .from('profiles')
          .select('id')
          .or(`full_name.ilike.%${debouncedSearchTerm}%,student_id.ilike.%${debouncedSearchTerm}%`)

        if (matchingStudents && matchingStudents.length > 0) {
          const studentIds = matchingStudents.map(s => s.id)
          query = query.in('student_id', studentIds)
        } else {
          // No matching students found, return empty result
          setViolations([])
          setTotal(0)
          return
        }
      }

      // Apply severity filter
      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter)
      }

      // Apply class filter
      if (classFilter !== 'all') {
        query = query.eq('class_id', classFilter)
      }

      // Apply month filter
      if (monthFilter !== 'all') {
        const year = new Date().getFullYear()
        const month = parseInt(monthFilter)
        const startDate = new Date(year, month - 1, 1).toISOString()
        const endDate = new Date(year, month, 0, 23, 59, 59).toISOString()
        query = query.gte('recorded_at', startDate).lte('recorded_at', endDate)
      }

      // Apply academic year filter
      if (academicYearFilter !== 'all') {
        // Get semesters for the selected academic year
        const { data: semesters } = await supabase
          .from('semesters')
          .select('id')
          .eq('academic_year_id', academicYearFilter)

        if (semesters && semesters.length > 0) {
          const semesterIds = semesters.map(s => s.id)
          query = query.in('semester_id', semesterIds)
        } else {
          // No semesters found for this academic year, return empty result
          setViolations([])
          setTotal(0)
          return
        }
      }

      // Pagination
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1

      // Execute query with proper error handling
      const { data, error, count } = await query
        .order('recorded_at', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('Error loading violations:', error)
        toast.error(`Failed to load violations: ${error.message}`)
        return
      }

      // Validate data structure
      if (!Array.isArray(data)) {
        console.error('Invalid data structure received:', data)
        toast.error('Invalid data received from server')
        return
      }

      // Type cast and validate the data structure
      const validatedViolations = data.map(violation => {
        const violationType = Array.isArray(violation.violation_type) ? violation.violation_type[0] : violation.violation_type
        return {
          ...violation,
          student: Array.isArray(violation.student) ? violation.student[0] : violation.student,
          class: Array.isArray(violation.class) ? violation.class[0] : violation.class,
          violation_type: {
            ...violationType,
            category: Array.isArray(violationType?.category) ? violationType.category[0] : violationType?.category
          },
          recorded_by_user: Array.isArray(violation.recorded_by_user) ? violation.recorded_by_user[0] : violation.recorded_by_user
        }
      }) as ViolationRecord[]

      setViolations(validatedViolations)
      setTotal(count || 0)
    } catch (error) {
      console.error('Error loading violations:', error)
      toast.error(`An error occurred while loading violations: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSeverityFilter('all')
    setClassFilter('all')
    setMonthFilter('all')
    setAcademicYearFilter('all')
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(total / pageSize)



  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mã học sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả năm học" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả năm học</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả tháng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tháng</SelectItem>
                <SelectItem value="1">Tháng 1</SelectItem>
                <SelectItem value="2">Tháng 2</SelectItem>
                <SelectItem value="3">Tháng 3</SelectItem>
                <SelectItem value="4">Tháng 4</SelectItem>
                <SelectItem value="5">Tháng 5</SelectItem>
                <SelectItem value="6">Tháng 6</SelectItem>
                <SelectItem value="7">Tháng 7</SelectItem>
                <SelectItem value="8">Tháng 8</SelectItem>
                <SelectItem value="9">Tháng 9</SelectItem>
                <SelectItem value="10">Tháng 10</SelectItem>
                <SelectItem value="11">Tháng 11</SelectItem>
                <SelectItem value="12">Tháng 12</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả mức độ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                {violationSeverityLevels.map((severity) => (
                  <SelectItem key={severity} value={severity}>
                    <Badge className={getSeverityColor(severity)}>
                      {getSeverityLabel(severity)}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả lớp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả lớp</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Xoá bộ lọc
            </Button>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Đang hiển thị {violations.length}/{total} vi phạm
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Tất cả vi phạm
          </CardTitle>
          <CardDescription>
            Danh sách vi phạm học sinh đã ghi nhận
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderViolationsContent(loading, violations, currentPage, totalPages, setCurrentPage)}
        </CardContent>
    </Card>
    </div>
  )
}
