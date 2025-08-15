'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Download, Eye, Calendar, Users, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import {
  getGradeReportingPeriodsAction,
  getClassesForGradeInputAction,
  getSubjectsForGradeInputAction
} from '@/lib/actions/grade-management-actions'
import { getDetailedGradesAction } from '@/lib/actions/detailed-grade-actions'
import { formatGradeValue } from '@/lib/utils/grade-excel-utils'

interface GradeRecord {
  id: string
  grade_value: number
  component_type: string
  notes?: string
  is_locked: boolean
  created_at: string
  updated_at: string
  student: {
    full_name: string
    student_id: string
  }
  subject: {
    name_vietnamese: string
    code: string
  }
  class: {
    name: string
  }
}

// Component type mapping for user-friendly display
const getComponentTypeDisplay = (componentType: string): string => {
  const mapping: Record<string, string> = {
    'regular_1': 'Điểm thường xuyên 1',
    'regular_2': 'Điểm thường xuyên 2',
    'regular_3': 'Điểm thường xuyên 3',
    'regular_4': 'Điểm thường xuyên 4',
    'midterm': 'Điểm giữa kỳ',
    'final': 'Điểm cuối kỳ',
    'semester_1': 'Điểm học kỳ 1',
    'semester_2': 'Điểm học kỳ 2',
    'yearly': 'Điểm cả năm'
  }
  return mapping[componentType] || componentType
}

// Component type color mapping
const getComponentTypeColor = (componentType: string): string => {
  const colorMapping: Record<string, string> = {
    'regular_1': 'bg-blue-100 text-blue-800',
    'regular_2': 'bg-blue-100 text-blue-800',
    'regular_3': 'bg-blue-100 text-blue-800',
    'regular_4': 'bg-blue-100 text-blue-800',
    'midterm': 'bg-orange-100 text-orange-800',
    'final': 'bg-red-100 text-red-800',
    'semester_1': 'bg-green-100 text-green-800',
    'semester_2': 'bg-green-100 text-green-800',
    'yearly': 'bg-purple-100 text-purple-800'
  }
  return colorMapping[componentType] || 'bg-gray-100 text-gray-800'
}

interface GradeReportingPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  academic_year: { name: string }
  semester: { name: string }
}

export function ViewGradesClient() {
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [periods, setPeriods] = useState<GradeReportingPeriod[]>([])
  const [classes, setClasses] = useState<Array<{id: string, name: string}>>([])
  const [subjects, setSubjects] = useState<Array<{id: string, name_vietnamese: string, code: string}>>([])
  
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedComponentType, setSelectedComponentType] = useState<string>('all')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const limit = 50

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      const [periodsResult, classesResult, subjectsResult] = await Promise.all([
        getGradeReportingPeriodsAction({ limit: 100 }),
        getClassesForGradeInputAction(),
        getSubjectsForGradeInputAction()
      ])

      if (periodsResult.success && periodsResult.data) {
        console.log('Loaded periods:', periodsResult.data)
        setPeriods(periodsResult.data as unknown as GradeReportingPeriod[])
      } else {
        console.error('Failed to load periods:', periodsResult.error)
      }

      if (classesResult.success && classesResult.data) {
        setClasses(classesResult.data as unknown as Array<{id: string, name: string}>)
      }

      if (subjectsResult.success && subjectsResult.data) {
        setSubjects(subjectsResult.data as unknown as Array<{id: string, name_vietnamese: string, code: string}>)
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      toast.error('Không thể tải dữ liệu ban đầu')
    }
  }, [])

  // Load grades with filters
  const loadGrades = useCallback(async () => {
    if (selectedPeriod === 'all') {
      setGrades([])
      setTotalRecords(0)
      setTotalPages(1)
      return
    }

    try {
      setLoading(true)

      console.log('Loading grades for period:', selectedPeriod)

      const result = await getDetailedGradesAction(selectedPeriod, {
        class_id: selectedClass === 'all' ? undefined : selectedClass,
        subject_id: selectedSubject === 'all' ? undefined : selectedSubject,
        student_search: searchTerm || undefined,
        page: currentPage,
        limit
      })

      console.log('Grades result:', result)

      if (result.success && result.data) {
        console.log('Grades data:', result.data)
        setGrades(result.data as unknown as GradeRecord[])
        setTotalRecords(result.count || 0)
        setTotalPages(Math.ceil((result.count || 0) / limit))
      } else {
        console.error('Error loading grades:', result.error)
        toast.error(result.error || 'Không thể tải danh sách điểm số')
        setGrades([])
        setTotalRecords(0)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error loading grades:', error)
      toast.error('Không thể tải danh sách điểm số')
      setGrades([])
      setTotalRecords(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, selectedClass, selectedSubject, searchTerm, currentPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedPeriod, selectedClass, selectedSubject, selectedComponentType, searchTerm])

  // Load grades when dependencies change
  useEffect(() => {
    loadGrades()
  }, [loadGrades])

  // Load initial data on mount
  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])



  // Export to Excel
  const exportToExcel = useCallback(async () => {
    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Điểm số')

      // Set column headers
      worksheet.columns = [
        { header: 'Học sinh', key: 'student_name', width: 25 },
        { header: 'Mã học sinh', key: 'student_id', width: 15 },
        { header: 'Lớp', key: 'class_name', width: 15 },
        { header: 'Môn học', key: 'subject_name', width: 20 },
        { header: 'Loại điểm', key: 'component_type', width: 20 },
        { header: 'Điểm số', key: 'grade_value', width: 10 },
        { header: 'Ghi chú', key: 'notes', width: 30 },
        { header: 'Ngày tạo', key: 'created_at', width: 20 }
      ]

      // Style header row
      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      }

      // Add data rows
      grades.forEach((grade, index) => {
        const row = worksheet.getRow(index + 2)
        row.values = [
          grade.student.full_name,
          grade.student.student_id,
          grade.class.name,
          grade.subject.name_vietnamese,
          getComponentTypeDisplay(grade.component_type),
          formatGradeValue(grade.grade_value),
          grade.notes || '',
          formatDate(grade.created_at)
        ]
      })

      // Add borders
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        })
      })

      // Generate and download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Diem_so_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Đã xuất file Excel thành công!')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Có lỗi xảy ra khi xuất file Excel')
    }
  }, [grades, formatDate])

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kỳ báo cáo</p>
                <p className="text-2xl font-bold">{periods.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lớp học</p>
                <p className="text-2xl font-bold">{classes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Môn học</p>
                <p className="text-2xl font-bold">{subjects.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Điểm số</p>
                <p className="text-2xl font-bold">{totalRecords}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc tìm kiếm
          </CardTitle>
          <CardDescription>
            Chọn kỳ báo cáo và áp dụng các bộ lọc để tìm kiếm điểm số
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Period Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Kỳ báo cáo *</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kỳ báo cáo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kỳ</SelectItem>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Lớp học</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
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
            </div>

            {/* Subject Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Môn học</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả môn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả môn</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name_vietnamese}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Component Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Loại điểm</label>
              <Select value={selectedComponentType} onValueChange={setSelectedComponentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="regular_1">Điểm thường xuyên 1</SelectItem>
                  <SelectItem value="regular_2">Điểm thường xuyên 2</SelectItem>
                  <SelectItem value="regular_3">Điểm thường xuyên 3</SelectItem>
                  <SelectItem value="regular_4">Điểm thường xuyên 4</SelectItem>
                  <SelectItem value="midterm">Điểm giữa kỳ</SelectItem>
                  <SelectItem value="final">Điểm cuối kỳ</SelectItem>
                  <SelectItem value="semester_1">Điểm học kỳ 1</SelectItem>
                  <SelectItem value="semester_2">Điểm học kỳ 2</SelectItem>
                  <SelectItem value="yearly">Điểm cả năm</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Student Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm học sinh</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tên hoặc mã học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Export Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Xuất dữ liệu</label>
              <Button
                onClick={exportToExcel}
                disabled={grades.length === 0}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Xuất Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kết quả tìm kiếm</CardTitle>
              <CardDescription>
                {selectedPeriod === 'all'
                  ? 'Vui lòng chọn kỳ báo cáo để xem điểm số'
                  : `Hiển thị ${grades.length} / ${totalRecords} điểm số`
                }
              </CardDescription>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Trước
                </Button>
                <span className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedPeriod === 'all' ? (
            <EmptyState
              icon={Calendar}
              title="Chọn kỳ báo cáo"
              description="Vui lòng chọn kỳ báo cáo để xem điểm số đã được nhập"
            />
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-2 text-muted-foreground">Đang tải điểm số...</span>
            </div>
          ) : grades.length === 0 ? (
            <EmptyState
              icon={Eye}
              title="Không có điểm số"
              description="Không tìm thấy điểm số nào phù hợp với bộ lọc đã chọn"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Lớp</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead>Loại điểm</TableHead>
                  <TableHead>Điểm số</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{grade.student.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {grade.student.student_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{grade.class.name}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{grade.subject.name_vietnamese}</div>
                        <div className="text-sm text-muted-foreground">
                          {grade.subject.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getComponentTypeColor(grade.component_type)}>
                        {getComponentTypeDisplay(grade.component_type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-lg">
                        {formatGradeValue(grade.grade_value)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {grade.notes || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(grade.created_at)}
                    </TableCell>
                    <TableCell>
                      {grade.is_locked ? (
                        <Badge variant="secondary">Đã khóa</Badge>
                      ) : (
                        <Badge variant="default">Có thể sửa</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
