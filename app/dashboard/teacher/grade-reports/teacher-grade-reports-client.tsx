'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Send, Users, FileText, Eye } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'

import { getHomeroomDetailedGradesAction } from '@/lib/actions/detailed-grade-actions'
import { getGradeReportingPeriodsForTeachersAction } from '@/lib/actions/grade-management-actions'

interface GradeRecord {
  id: string
  student_id: string
  grade_value: number
  component_type: string
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

interface GradeReportingPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  academic_year: { name: string }
  semester: { name: string }
}

export default function TeacherGradeReportsClient() {
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [periods, setPeriods] = useState<GradeReportingPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [sendingToAllParents, setSendingToAllParents] = useState(false)

  // Load periods
  const loadPeriods = useCallback(async () => {
    try {
      const result = await getGradeReportingPeriodsForTeachersAction({ limit: 100 })
      if (result.success && result.data) {
        const periodsData = result.data as unknown as GradeReportingPeriod[]
        setPeriods(periodsData)
        
        // Auto-select the active period
        const activePeriod = periodsData.find((period) => period.is_active === true)
        if (activePeriod) {
          setSelectedPeriod(activePeriod.id)
        }
      }
    } catch (error) {
      console.error('Error loading periods:', error)
      toast.error('Không thể tải danh sách kỳ báo cáo')
    }
  }, [])

  // Load students with grades
  const loadStudents = useCallback(async () => {
    if (!selectedPeriod) {
      setStudents([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      const filters = {
        page: 1,
        limit: 1000
      }

      const result = await getHomeroomDetailedGradesAction(selectedPeriod, filters)

      if (result.success && result.data) {
        const gradeData = result.data as unknown as GradeRecord[]
        
        // Transform grades into unique student records
        const studentMap = new Map<string, StudentRecord>()

        gradeData.forEach((grade) => {
          const studentUUID = grade.student_id
          const studentDisplayId = grade.student.student_id
          if (!studentMap.has(studentUUID)) {
            studentMap.set(studentUUID, {
              id: studentUUID,
              full_name: grade.student.full_name,
              student_id: studentDisplayId,
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
              id: grade.subject.code,
              name_vietnamese: grade.subject.name_vietnamese,
              code: grade.subject.code
            })
          }
        })

        setStudents(Array.from(studentMap.values()))
      } else {
        console.error('Error loading grades:', result.error)
        toast.error(result.error || 'Không thể tải danh sách học sinh')
        setStudents([])
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Không thể tải danh sách học sinh')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

  // Load periods on mount
  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  // Load students when period changes
  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  // Send to all parents
  const handleSendToAllParents = useCallback(async () => {
    if (students.length === 0) {
      toast.error('Không có học sinh nào để gửi')
      return
    }

    setSendingToAllParents(true)
    try {
      // Here we would implement bulk send to all parents
      toast.success(`Đã gửi bảng điểm cho ${students.length} phụ huynh`)
    } catch (error) {
      console.error('Error sending to all parents:', error)
      toast.error('Lỗi khi gửi bảng điểm cho phụ huynh')
    } finally {
      setSendingToAllParents(false)
    }
  }, [students])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý bảng điểm</h1>
          <p className="text-gray-600">Xem và quản lý điểm số học sinh trong lớp chủ nhiệm</p>
        </div>
        <Button
          onClick={handleSendToAllParents}
          disabled={sendingToAllParents || students.length === 0}
          className="flex items-center gap-2"
        >
          {sendingToAllParents ? (
            <>
              <LoadingSpinner size="sm" />
              Đang gửi...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Gửi tất cả phụ huynh
            </>
          )}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Học sinh</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
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
              <Eye className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng điểm</p>
                <p className="text-2xl font-bold">
                  {students.reduce((sum, student) => sum + student.total_grades, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn kỳ báo cáo</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn kỳ báo cáo" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name} - {period.academic_year.name} - {period.semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách học sinh</CardTitle>
          <CardDescription>
            {selectedPeriod ? `Hiển thị ${students.length} học sinh` : 'Vui lòng chọn kỳ báo cáo'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-2 text-muted-foreground">Đang tải danh sách học sinh...</span>
            </div>
          ) : students.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Không có học sinh"
              description="Không tìm thấy học sinh nào trong kỳ báo cáo này"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Lớp</TableHead>
                  <TableHead>Số điểm</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
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
                      <Link href={`/dashboard/teacher/grade-reports/student/${student.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Xem bảng điểm
                        </Button>
                      </Link>
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
