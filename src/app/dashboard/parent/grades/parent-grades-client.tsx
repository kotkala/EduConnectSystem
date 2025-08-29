'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Users, Eye, Award } from 'lucide-react'
import { toast } from 'sonner'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { getChildrenGradeReportsAction, getAllGradeReportingPeriodsAction, getAllAcademicYearsAction } from '@/lib/actions/parent-grade-actions'




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
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all')
  const [allPeriods, setAllPeriods] = useState<Array<{
    id: string,
    name: string,
    academic_year?: {name: string},
    semester?: {name: string}
  }>>([])
  const [allAcademicYears, setAllAcademicYears] = useState<Array<{
    id: string,
    name: string,
    is_current: boolean
  }>>([])

  // Load grade reports - OPTIMIZED with parallel loading
  const loadGradeReports = useCallback(async () => {
    try {
      setLoading(true)

      // OPTIMIZATION: Load all data in parallel instead of sequential
      const [academicYearsResult, periodsResult, gradesResult] = await Promise.all([
        getAllAcademicYearsAction(),
        getAllGradeReportingPeriodsAction(),
        getChildrenGradeReportsAction()
      ]);

      // Process academic years
      if (academicYearsResult.success) {
        setAllAcademicYears(academicYearsResult.data as Array<{
          id: string,
          name: string,
          is_current: boolean
        }>)
      } else {
        console.error('Failed to fetch academic years:', academicYearsResult.error)
        toast.error(`Không thể tải danh sách năm học: ${academicYearsResult.error}`)
      }

      // Process periods
      if (periodsResult.success) {
        setAllPeriods(periodsResult.data as Array<{
          id: string,
          name: string,
          academic_year?: {name: string},
          semester?: {name: string}
        }>)
      } else {
        console.error('Failed to fetch periods:', periodsResult.error)
        toast.error(`Không thể tải danh sách kỳ báo cáo: ${periodsResult.error}`)
      }

      // Process grade submissions
      if (gradesResult.success) {
        const submissionsData = gradesResult.data as GradeSubmission[]
        setSubmissions(submissionsData)
      } else {
        toast.error(gradesResult.error || "Không thể tải bảng điểm")
        setSubmissions([])
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải bảng điểm")
      setSubmissions([])
    } finally {
      setLoading(false)
    }
  }, []) // Remove state setters from dependency array

  useEffect(() => {
    loadGradeReports()
  }, [loadGradeReports])

  // Process submissions into student records with memoization
  const students = useMemo(() => {
    // Filter submissions by selected academic year and period
    let filteredSubmissions = submissions

    // Filter by academic year first
    if (selectedAcademicYear !== 'all') {
      filteredSubmissions = filteredSubmissions.filter(submission =>
        submission.academic_year?.name === allAcademicYears.find(ay => ay.id === selectedAcademicYear)?.name
      )
    }

    // Then filter by period
    if (selectedPeriod !== 'all') {
      filteredSubmissions = filteredSubmissions.filter(submission =>
        submission.period.id === selectedPeriod
      )
    }

    // Process filtered submissions into student records
    const studentMap = new Map<string, StudentRecord>()

    filteredSubmissions.forEach((submission) => {
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
  }, [submissions, selectedPeriod, selectedAcademicYear, allAcademicYears])

  // Handle view submission
  const handleViewSubmission = useCallback((submission: GradeSubmission) => {
    router.push(`/dashboard/parent/grades/${submission.id}`)
  }, [router])

  // Render content based on loading and data state
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="space-y-4 mb-4">
            <Skeleton className="h-12 md:h-14 lg:h-16 w-12 rounded-full mx-auto" aria-label="Loading content" role="status" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px] mx-auto" aria-label="Loading content" role="status" />
              <Skeleton className="h-4 w-[150px] mx-auto" aria-label="Loading content" role="status" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Đang tải danh sách học sinh...</p>
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

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="academic-year-select" className="text-sm font-medium">
            Năm học:
          </label>
          <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Chọn năm học" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả năm</SelectItem>
              {allAcademicYears.map((academicYear) => (
                <SelectItem key={academicYear.id} value={academicYear.id}>
                  {academicYear.name} {academicYear.is_current ? '(Hiện tại)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              {allPeriods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name} - {period.academic_year?.name} - {period.semester?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistics - Standardized with Admin Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-5" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Học sinh</CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {students.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tổng số học sinh
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-5" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Bảng điểm</CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {submissions.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Số bảng điểm
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-5" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-600">Tổng điểm</CardTitle>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {students.reduce((sum, student) => sum + student.total_grades, 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Điểm tích lũy
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