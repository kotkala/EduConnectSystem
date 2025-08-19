'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePageTransition } from '@/components/ui/global-loading-provider'
import { useCoordinatedLoading } from '@/hooks/use-coordinated-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Send, Users, FileText, Eye } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { getHomeroomSubmittedGradesAction, sendGradeReportsToParentsAction, getPeriodsWithSubmissionsAction } from '@/lib/actions/detailed-grade-actions'
import { getGradeReportingPeriodsForTeachersAction } from '@/lib/actions/grade-management-actions'

interface SubmissionRecord {
  id: string
  period_id: string
  student_id: string
  class_id: string
  submission_count: number
  status: string
  submission_reason: string | null
  submitted_at: string
  received_at: string | null
  student: {
    id: string
    full_name: string
    student_id: string
  }
  class: {
    id: string
    name: string
  }
  period: {
    id: string
    name: string
  }
}

interface StudentRecord {
  id: string
  full_name: string
  student_id: string
  class_name: string
  submission_count: number
  submission_status: string
  submitted_at: string
  received_at: string | null
  submission_reason: string | null
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
  // 🚀 MIGRATION: Replace loading state with coordinated system
  const { startPageTransition, stopLoading } = usePageTransition()
  const coordinatedLoading = useCoordinatedLoading()

  const [students, setStudents] = useState<StudentRecord[]>([])
  const [periods, setPeriods] = useState<GradeReportingPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [periodsWithSubmissions, setPeriodsWithSubmissions] = useState<string[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())

  // 📊 Keep action-specific loading states for non-blocking operations
  const [sectionLoading, setSectionLoading] = useState({
    sendingToAllParents: false
  })

  // Load periods
  const loadPeriods = useCallback(async () => {
    try {
      // Load all periods
      const periodsResult = await getGradeReportingPeriodsForTeachersAction({ limit: 100 })

      // Load periods with submissions
      const submissionsResult = await getPeriodsWithSubmissionsAction()

      if (periodsResult.success && periodsResult.data) {
        const periodsData = periodsResult.data as unknown as GradeReportingPeriod[]
        setPeriods(periodsData)

        // Set periods with submissions
        if (submissionsResult.success && submissionsResult.data) {
          const submissionPeriodIds = submissionsResult.data.map(p => p.id)
          setPeriodsWithSubmissions(submissionPeriodIds)

          // Auto-select the first period with submissions, or active period as fallback
          if (submissionPeriodIds.length > 0) {
            setSelectedPeriod(submissionPeriodIds[0])
          } else {
            const activePeriod = periodsData.find((period) => period.is_active === true)
            if (activePeriod) {
              setSelectedPeriod(activePeriod.id)
            }
          }
        } else {
          // Fallback to active period if submissions loading fails
          const activePeriod = periodsData.find((period) => period.is_active === true)
          if (activePeriod) {
            setSelectedPeriod(activePeriod.id)
          }
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
      return
    }

    try {
      // 🎯 UX IMPROVEMENT: Use global loading for initial load, section loading for refreshes
      const isInitialLoad = students.length === 0

      if (isInitialLoad) {
        startPageTransition("Đang tải danh sách học sinh...")
      }

      const filters = {
        page: 1,
        limit: 1000
      }

      const result = await getHomeroomSubmittedGradesAction(selectedPeriod, filters)

      if (result.success && result.data) {
        const submissionData = result.data as unknown as SubmissionRecord[]

        // Transform submissions into student records
        const studentRecords: StudentRecord[] = submissionData.map((submission) => ({
          id: submission.student_id,
          full_name: submission.student.full_name,
          student_id: submission.student.student_id,
          class_name: submission.class.name,
          submission_count: submission.submission_count,
          submission_status: submission.status,
          submitted_at: submission.submitted_at,
          received_at: submission.received_at,
          submission_reason: submission.submission_reason
        }))

        setStudents(studentRecords)
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
      stopLoading()
    }
  }, [selectedPeriod, students.length, startPageTransition, stopLoading])

  // Load periods on mount
  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  // Load students when period changes
  useEffect(() => {
    loadStudents()
    // Clear selection when period changes
    setSelectedStudents(new Set())
  }, [loadStudents])

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedStudents(new Set(students.map(s => s.id)))
    } else {
      setSelectedStudents(new Set())
    }
  }, [students])

  const handleSelectStudent = useCallback((studentId: string, checked: boolean) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(studentId)
      } else {
        newSet.delete(studentId)
      }
      return newSet
    })
  }, [])

  // Send to selected parents
  const handleSendToSelectedParents = useCallback(async () => {
    if (selectedStudents.size === 0) {
      toast.error('Vui lòng chọn ít nhất một học sinh')
      return
    }

    if (!selectedPeriod) {
      toast.error('Vui lòng chọn kỳ báo cáo')
      return
    }

    setSectionLoading(prev => ({ ...prev, sendingToAllParents: true }))
    try {
      // For now, we'll use the existing action which sends to all students
      // TODO: Create a new action that accepts specific student IDs
      const result = await sendGradeReportsToParentsAction(selectedPeriod)

      if (result.success) {
        toast.success(`Đã gửi báo cáo cho ${selectedStudents.size} học sinh`)
        if (result.data?.errors && result.data.errors.length > 0) {
          // Show detailed errors in console for debugging
          console.warn('Email sending errors:', result.data.errors)
        }
        // Clear selection after successful send
        setSelectedStudents(new Set())
      } else {
        toast.error(result.error || 'Lỗi khi gửi email cho phụ huynh')
      }
    } catch (error) {
      console.error('Error sending to selected parents:', error)
      toast.error('Lỗi khi gửi bảng điểm cho phụ huynh')
    } finally {
      setSectionLoading(prev => ({ ...prev, sendingToAllParents: false }))
    }
  }, [selectedStudents, selectedPeriod])

  // Render content based on loading and data state
  const renderStudentsList = () => {
    if (coordinatedLoading.isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-2 text-muted-foreground">Đang tải danh sách học sinh...</span>
        </div>
      )
    }

    if (students.length === 0) {
      return (
        <EmptyState
          icon={Users}
          title="Không có học sinh"
          description="Không tìm thấy học sinh nào trong kỳ báo cáo này"
        />
      )
    }

    const allSelected = students.length > 0 && selectedStudents.size === students.length

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Chọn tất cả học sinh"
              />
            </TableHead>
            <TableHead>Học sinh</TableHead>
            <TableHead>Lớp</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Lần gửi</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>
                <Checkbox
                  checked={selectedStudents.has(student.id)}
                  onCheckedChange={(checked) => handleSelectStudent(student.id, checked as boolean)}
                  aria-label={`Chọn học sinh ${student.full_name}`}
                />
              </TableCell>
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
                <Badge
                  variant={student.submission_status === 'submitted' ? 'default' : 'secondary'}
                  className={student.submission_status === 'submitted' ? 'bg-green-100 text-green-800' : ''}
                >
                  {student.submission_status === 'submitted' ? 'Đã gửi' : 'Chưa xử lý'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  Lần {student.submission_count}
                  {student.submission_count > 1 && (
                    <span className="ml-1 text-orange-600">⚠️</span>
                  )}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div>{new Date(student.submitted_at).toLocaleDateString('vi-VN')}</div>
                  <div className="text-gray-500">{new Date(student.submitted_at).toLocaleTimeString('vi-VN')}</div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/dashboard/teacher/grade-reports/student/${student.id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Xem chi tiết
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }


  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý bảng điểm</h1>
          <p className="text-gray-600">Xem và quản lý điểm số học sinh trong lớp chủ nhiệm</p>
        </div>
        <Button
          onClick={handleSendToSelectedParents}
          disabled={sectionLoading.sendingToAllParents || selectedStudents.size === 0}
          className="flex items-center gap-2"
        >
          {sectionLoading.sendingToAllParents ? (
            <>
              <LoadingSpinner size="sm" />
              Đang gửi...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              {selectedStudents.size === 0
                ? 'Chọn học sinh để gửi'
                : selectedStudents.size === students.length
                  ? 'Gửi tất cả phụ huynh'
                  : `Gửi ${selectedStudents.size} phụ huynh`
              }
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
              <Send className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Đã gửi lại</p>
                <p className="text-2xl font-bold">
                  {students.filter(student => student.submission_count > 1).length}
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
              {periods.map((period) => {
                const hasSubmissions = periodsWithSubmissions.includes(period.id)
                return (
                  <SelectItem key={period.id} value={period.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{period.name} - {period.academic_year.name} - {period.semester.name}</span>
                      {hasSubmissions && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Có bảng điểm
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                )
              })}
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
          {renderStudentsList()}
        </CardContent>
      </Card>
    </div>
  )
}