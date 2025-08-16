'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Download, Eye, Calendar, Users, BookOpen, RefreshCw, Send } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
import { getDetailedGradesAction, bulkSendGradesToHomeroomTeachersAction } from '@/lib/actions/detailed-grade-actions'
import { formatGradeValue } from '@/lib/utils/grade-excel-utils'

interface GradeRecord {
  id: string
  student_id: string
  grade_value: number
  component_type: string
  is_locked: boolean
  created_by: string
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

interface StudentRecord {
  id: string
  full_name: string
  student_id: string
  class_name: string
  total_grades: number
  subjects: Array<{
    id: string
    name_vietnamese: string
    code: string
  }>
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



interface GradeReportingPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  academic_year: { name: string }
  semester: { name: string }
}

export function ViewGradesClient() {
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [studentList, setStudentList] = useState<StudentRecord[]>([])
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
  const [sendingToTeachers, setSendingToTeachers] = useState(false)
  const limit = 10

  // Error boundary state
  const [hasError, setHasError] = useState(false)

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      const [periodsResult, classesResult, subjectsResult] = await Promise.all([
        getGradeReportingPeriodsAction({ limit: 100 }),
        getClassesForGradeInputAction(),
        getSubjectsForGradeInputAction()
      ])
      if (periodsResult.success && periodsResult.data) {
        const periodsData = periodsResult.data as unknown as GradeReportingPeriod[]
        setPeriods(periodsData)

        // Auto-select the active period if available
        const activePeriod = periodsData.find((period) => period.is_active === true)
        if (activePeriod && selectedPeriod === 'all') {
          setSelectedPeriod(activePeriod.id)
        }
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
      setHasError(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load students with their grade information
  const loadGrades = useCallback(async () => {
    if (selectedPeriod === 'all') {
      setGrades([])
      setStudentList([])
      setTotalRecords(0)
      setTotalPages(1)
      return
    }

    try {
      setLoading(true)

      // First get all grades for the period to build student list
      const filters = {
        class_id: selectedClass === 'all' ? undefined : selectedClass,
        subject_id: selectedSubject === 'all' ? undefined : selectedSubject,
        component_type: selectedComponentType === 'all' ? undefined : selectedComponentType,
        student_search: searchTerm || undefined,
        page: 1, // Get all data first
        limit: 1000 // Large limit to get all students
      }

      const result = await getDetailedGradesAction(selectedPeriod, filters)

      if (result.success && result.data) {
        const gradeData = result.data as unknown as GradeRecord[]
        setGrades(gradeData)

        // Transform grades into unique student records
        const studentMap = new Map<string, StudentRecord>()

        gradeData.forEach((grade) => {
          const studentUUID = grade.student_id
          const studentDisplayId = grade.student.student_id
          if (!studentMap.has(studentUUID)) {
            studentMap.set(studentUUID, {
              id: studentUUID, // Use the actual UUID for the link
              full_name: grade.student.full_name,
              student_id: studentDisplayId, // Display ID like "SU002"
              class_name: grade.class.name,
              total_grades: 0,
              subjects: []
            })
          }

          const student = studentMap.get(studentUUID)!
          student.total_grades++

          // Add subject if not already added
          const subjectExists = student.subjects.some(s => s.code === grade.subject.code)
          if (!subjectExists) {
            student.subjects.push({
              id: grade.subject.code, // Using code as ID since we don't have subject ID
              name_vietnamese: grade.subject.name_vietnamese,
              code: grade.subject.code
            })
          }
        })

        // Convert to array and apply pagination
        const allStudents = Array.from(studentMap.values())
        const totalStudents = allStudents.length
        const startIndex = (currentPage - 1) * limit
        const endIndex = startIndex + limit
        const paginatedStudents = allStudents.slice(startIndex, endIndex)

        setStudentList(paginatedStudents)
        setTotalRecords(totalStudents)
        setTotalPages(Math.ceil(totalStudents / limit))
      } else {
        console.error('Error loading grades:', result.error)
        toast.error(result.error || 'Không thể tải danh sách điểm số')
        setGrades([])
        setStudentList([])
        setTotalRecords(0)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error loading grades:', error)
      toast.error('Không thể tải danh sách điểm số')
      setGrades([])
      setStudentList([])
      setTotalRecords(0)
      setTotalPages(1)
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, selectedClass, selectedSubject, selectedComponentType, searchTerm, currentPage, limit])

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

  // Handle bulk send to homeroom teachers
  const handleBulkSendToTeachers = useCallback(async () => {
    if (selectedPeriod === 'all') {
      toast.error('Vui lòng chọn kỳ báo cáo cụ thể')
      return
    }

    try {
      setSendingToTeachers(true)
      const result = await bulkSendGradesToHomeroomTeachersAction(selectedPeriod)

      if (result.success) {
        toast.success(result.message || 'Đã gửi bảng điểm tới các giáo viên chủ nhiệm')
      } else {
        toast.error(result.error || 'Không thể gửi bảng điểm')
      }
    } catch (error) {
      console.error('Error sending to teachers:', error)
      toast.error('Có lỗi xảy ra khi gửi bảng điểm')
    } finally {
      setSendingToTeachers(false)
    }
  }, [selectedPeriod])







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

      // Add data rows with null safety
      grades.forEach((grade, index) => {
        const row = worksheet.getRow(index + 2)
        row.values = [
          grade.student?.full_name || 'N/A',
          grade.student?.student_id || 'N/A',
          grade.class?.name || 'N/A',
          grade.subject?.name_vietnamese || 'N/A',
          getComponentTypeDisplay(grade.component_type),
          formatGradeValue(grade.grade_value),
          new Date(grade.created_at).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })
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
  }, [grades])

  // Error boundary fallback
  if (hasError) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">Có lỗi xảy ra</h2>
          <p className="text-muted-foreground mt-2">Vui lòng tải lại trang hoặc liên hệ quản trị viên</p>
          <Button
            onClick={() => {
              setHasError(false)
              window.location.reload()
            }}
            className="mt-4"
          >
            Tải lại trang
          </Button>
        </div>
      </div>
    )
  }

  try {
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
                <p className="text-sm font-medium text-muted-foreground">Học sinh</p>
                <p className="text-2xl font-bold">
                  {selectedPeriod === 'all' ? '-' : totalRecords}
                </p>
                {selectedPeriod === 'all' && (
                  <p className="text-xs text-muted-foreground">Chọn kỳ để xem</p>
                )}
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

            {/* Action Buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Thao tác</label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => {
                    setCurrentPage(1)
                    loadGrades()
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Làm mới
                </Button>
                <Button
                  onClick={exportToExcel}
                  disabled={studentList.length === 0}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Xuất Excel
                </Button>
                <Button
                  onClick={handleBulkSendToTeachers}
                  disabled={selectedPeriod === 'all' || sendingToTeachers}
                  size="sm"
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                >
                  {sendingToTeachers ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Gửi tất cả GVCN
                </Button>
              </div>
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
                  ? 'Vui lòng chọn kỳ báo cáo để xem học sinh'
                  : `Hiển thị ${studentList.length} / ${totalRecords} học sinh`
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
              description={`Vui lòng chọn kỳ báo cáo để xem điểm số đã được nhập. Hiện có ${periods.length} kỳ báo cáo khả dụng.`}
            />
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-2 text-muted-foreground">Đang tải danh sách học sinh...</span>
            </div>
          ) : studentList.length === 0 ? (
            <EmptyState
              icon={Eye}
              title="Không có học sinh"
              description="Không tìm thấy học sinh nào phù hợp với bộ lọc đã chọn"
            />
          ) : (
            <div className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Học sinh</TableHead>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Số điểm</TableHead>
                    <TableHead>Môn học</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentList.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{student.full_name}</div>
                          <div className="text-sm text-gray-500">Mã HS: {student.student_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.class_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{student.total_grades} điểm</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {student.subjects.slice(0, 3).map(subject => (
                            <Badge key={subject.id} variant="outline" className="text-xs">
                              {subject.code}
                            </Badge>
                          ))}
                          {student.subjects.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{student.subjects.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/dashboard/admin/grade-management/student/${student.id}`}>
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            Xem điểm
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    )
  } catch (error) {
    console.error('ViewGradesClient error:', error)
    setHasError(true)
    return null
  }
}
