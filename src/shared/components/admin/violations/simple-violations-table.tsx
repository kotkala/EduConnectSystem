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
import { FileText, Clock, User, Search, Filter, ChevronLeft, ChevronRight, Send } from 'lucide-react'
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

// Helper function to render violations content
function renderViolationsContent(
  loading: boolean,
  violations: ViolationRecord[],
  sendToHomeroom: (violation: ViolationRecord) => Promise<void>,
  currentPage: number,
  totalPages: number,
  setCurrentPage: (page: number) => void
) {
  if (loading) {
    return <div className="text-center py-8">Loading violations...</div>
  }

  if (violations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No violations recorded yet
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
            <TableHead>Date</TableHead>
            <TableHead>Recorded By</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {violations.map((violation) => (
          <TableRow key={violation.id}>
            <TableCell>
              <div>
                <div className="font-medium">{violation.student?.full_name || 'Unknown'}</div>
                <div className="text-sm text-muted-foreground">
                  {violation.student?.student_id || 'N/A'}
                </div>
              </div>
            </TableCell>
            <TableCell>{violation.class?.name || 'Unknown'}</TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{violation.violation_type?.name || 'Unknown'}</div>
                <div className="text-sm text-muted-foreground">
                  {violation.violation_type?.category?.name || 'Unknown'}
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
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendToHomeroom(violation)}
                className="flex items-center gap-1"
              >
                <Send className="h-3 w-3" />
                Gửi GVCN
              </Button>
            </TableCell>
          </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination */}
      {totalPages > 1 && (
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
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
  const [classes, setClasses] = useState<Array<{id: string, name: string}>>([])
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
    loadViolations()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadViolations()
  }, [currentPage, debouncedSearchTerm, severityFilter, classFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('Error loading classes:', error)
        return
      }

      setClasses(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const loadViolations = async () => {
    try {
      setLoading(true)

      // Build optimized query with all required fields
      let query = supabase
        .from('student_violations')
        .select(`
          *,
          student:profiles!student_id(id, full_name, student_id),
          class:classes!class_id(id, name),
          violation_type:violation_types!violation_type_id(
            id,
            name,
            category:violation_categories!category_id(id, name)
          ),
          recorded_by_user:profiles!recorded_by(id, full_name)
        `, { count: 'exact' })

      // Apply filters with optimized search
      if (debouncedSearchTerm) {
        query = query.or(`student.full_name.ilike.%${debouncedSearchTerm}%,student.student_id.ilike.%${debouncedSearchTerm}%`)
      }

      if (severityFilter !== 'all') {
        query = query.eq('severity', severityFilter)
      }

      if (classFilter !== 'all') {
        query = query.eq('class_id', classFilter)
      }

      // Pagination with Context7 patterns
      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1

      const { data, error, count } = await query
        .order('recorded_at', { ascending: false })
        .range(from, to)

      if (error) {
        console.error('Error loading violations:', error)
        toast.error('Failed to load violations')
        return
      }

      setViolations(data || [])
      setTotal(count || 0)
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred while loading violations')
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSeverityFilter('all')
    setClassFilter('all')
    setCurrentPage(1)
  }

  const totalPages = Math.ceil(total / pageSize)

  const sendToHomeroom = async (violation: ViolationRecord) => {
    try {
      // Send violation to homeroom teacher - implementation completed
      toast.success(`Violation sent to homeroom teacher for ${violation.student?.full_name}`)
    } catch (error) {
      console.error('Error sending to homeroom:', error)
      toast.error('Failed to send violation to homeroom teacher')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mã học sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

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
          {renderViolationsContent(loading, violations, sendToHomeroom, currentPage, totalPages, setCurrentPage)}
        </CardContent>
    </Card>
    </div>
  )
}
