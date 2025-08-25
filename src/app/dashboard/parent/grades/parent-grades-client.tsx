'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Users, Eye, Award } from 'lucide-react'
import { toast } from 'sonner'
import { SandyLoading } from '@/shared/components/ui/sandy-loading'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { getChildrenGradeReportsAction } from '@/lib/actions/parent-grade-actions-new'




interface GradeSubmission {
  id: string
  submission_name: string
  student_id: string
  created_at: string
  student: {
    id: string
    full_name: string
    student_id: string
  }
  class: {
    name: string
    homeroom_teacher: { full_name: string }
  }
  academic_year: { name: string }
  semester: { name: string }
  period: {
    id: string
    name: string
    period_type: string
  }
  grades: Array<{
    subject_id: string
    midterm_grade: number | null
    final_grade: number | null
    average_grade: number | null
    subject: {
      id: string
      code: string
      name_vietnamese: string
      category: string
    }
  }>
  ai_feedback?: {
    text: string
    created_at: string
    rating: number | null
  } | null
}

interface StudentRecord {
  id: string
  full_name: string
  student_id: string
  class_name: string
  total_grades: number
  submissions: GradeSubmission[]
  subjects: Array<{
    id: string
    name_vietnamese: string
    code: string
  }>
}

export default function ParentGradesClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<GradeSubmission[]>([])
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [availablePeriods, setAvailablePeriods] = useState<Array<{id: string, name: string}>>([])

  // Load grade reports
  const loadGradeReports = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getChildrenGradeReportsAction()
      if (result.success) {
        const submissionsData = result.data as GradeSubmission[]
        setSubmissions(submissionsData)

        // Extract unique periods from individual report periods (not just semesters)
        const periodsMap = new Map<string, {id: string, name: string}>()
        submissionsData.forEach(submission => {
          if (submission.period?.id && submission.period?.name && !periodsMap.has(submission.period.id)) {
            periodsMap.set(submission.period.id, {
              id: submission.period.id,
              name: submission.period.name
            })
          }
        })
        const periods = Array.from(periodsMap.values())
        setAvailablePeriods(periods)
      } else {
        toast.error(result.error || "Không thể tải bảng điểm")
        setStudents([])
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải bảng điểm")
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGradeReports()
  }, [loadGradeReports])

  // Filter submissions by selected period
  const filteredSubmissions = selectedPeriod === 'all'
    ? submissions
    : submissions.filter(submission => submission.period.id === selectedPeriod)

  // Process filtered submissions into student records
  const processStudentRecords = useCallback((submissionsData: GradeSubmission[]) => {
    const studentMap = new Map<string, StudentRecord>()

    submissionsData.forEach((submission) => {
      const studentUUID = submission.student.id
      if (!studentMap.has(studentUUID)) {
        studentMap.set(studentUUID, {
          id: studentUUID,
          full_name: submission.student.full_name,
          student_id: submission.student.student_id,
          class_name: submission.class.name,
          total_grades: 0,
          submissions: [],
          subjects: []
        })
      }

      const student = studentMap.get(studentUUID)!
      student.submissions.push(submission)
      student.total_grades += submission.grades.length

      // Add unique subjects
      submission.grades.forEach((grade) => {
        const subjectExists = student.subjects.some(s => s.code === grade.subject.code)
        if (!subjectExists) {
          student.subjects.push({
            id: grade.subject.id,
            name_vietnamese: grade.subject.name_vietnamese,
            code: grade.subject.code
          })
        }
      })
    })

    return Array.from(studentMap.values())
  }, [])

  // Update students when filtered submissions change
  useEffect(() => {
    const processedStudents = processStudentRecords(filteredSubmissions)
    setStudents(processedStudents)
  }, [filteredSubmissions, processStudentRecords])

  // Handle view submission
  const handleViewSubmission = useCallback((submission: GradeSubmission) => {
    router.push(`/dashboard/parent/grades/${submission.id}`)
  }, [router])

  // Render content based on loading and data state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <SandyLoading message="Đang tải danh sách học sinh..." />
        </div>
      )
    }

    if (students.length === 0) {
      return (
        <EmptyState
          icon={Users}
          title="Không có bảng điểm"
          description="Chưa có bảng điểm nào được gửi từ giáo viên chủ nhiệm"
        />
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Học sinh</TableHead>
            <TableHead>Lớp</TableHead>
            <TableHead>Số bảng điểm</TableHead>
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
                <Badge variant="secondary">{student.submissions.length} bảng điểm</Badge>
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
                <div className="flex items-center gap-2 justify-end">
                  {student.submissions.map((submission) => (
                    <div key={submission.id} className="flex items-center gap-2">
                      <Button
                        onClick={() => handleViewSubmission(submission)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {submission.period.name}
                      </Button>
                    </div>
                  ))}
                </div>
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
          <h1 className="text-2xl font-bold">Bảng điểm con em</h1>
          <p className="text-gray-600">Xem bảng điểm các con được gửi từ giáo viên chủ nhiệm</p>
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="period-select" className="text-sm font-medium">
            Kỳ báo cáo:
          </label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Chọn kỳ báo cáo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả kỳ</SelectItem>
              {availablePeriods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
              <Award className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bảng điểm</p>
                <p className="text-2xl font-bold">{submissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-purple-600" />
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

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách học sinh</CardTitle>
          <CardDescription>
            Hiển thị {students.length} học sinh
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}