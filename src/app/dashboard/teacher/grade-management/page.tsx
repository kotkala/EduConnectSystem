"use client"

import { useState, useMemo, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"

import { Badge } from "@/shared/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import {
  Download,
  Upload,
  Eye,
  Send
} from "lucide-react"
import { toast } from "sonner"

import { TeacherGradeImportDialog } from "@/shared/components/teacher/teacher-grade-import-dialog"
import { TeacherGradeTrackingDialog } from "@/shared/components/teacher/teacher-grade-tracking-dialog"
import { TeacherGradeOverview } from "@/shared/components/teacher/teacher-grade-overview"


import { Skeleton } from "@/shared/components/ui/skeleton";// Import StudentGrade type from the overview component
interface StudentGrade {
  id: string
  studentId: string
  studentName: string
  regularGrades: (number | null)[]
  midtermGrade?: number | null
  finalGrade?: number | null
  summaryGrade?: number | null
  lastModified?: string
  modifiedBy?: string
}

import {
  getEnhancedGradeReportingPeriodsAction,
  getTeacherClassesAction,
  getTeacherSubjectsAction
} from "@/lib/actions/enhanced-grade-actions"

import {
  createTeacherGradeTemplate,
  downloadExcelFile,
  generateExcelFilename,
  getPeriodTypeDisplayName,
  type GradePeriodType,
  type TeacherExcelTemplateData
} from "@/lib/utils/teacher-excel-utils"

export default function TeacherGradeManagementPage() {
  const queryClient = useQueryClient()

  // Selection states
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedPeriodType, setSelectedPeriodType] = useState<GradePeriodType>('regular_1')

  // Dialog states
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false)

  // Grade data state
  const [currentGradeData, setCurrentGradeData] = useState<StudentGrade[]>([])

  // Optimized refresh function using TanStack Query
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['teacher-grade-periods'] })
    queryClient.invalidateQueries({ queryKey: ['teacher-classes'] })
    queryClient.invalidateQueries({ queryKey: ['teacher-subjects'] })
  }

  // TanStack Query: Optimized data fetching with caching
  const {
    data: periods = [],
    isLoading: periodsLoading,
    error: periodsError
  } = useQuery({
    queryKey: ['teacher-grade-periods'],
    queryFn: async () => {
      const result = await getEnhancedGradeReportingPeriodsAction({
        status: 'open',
        page: 1,
        limit: 100
      })
      if (!result.success) {
        throw new Error(result.error || 'Không thể tải danh sách kỳ báo cáo điểm')
      }
      return result.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  const {
    data: classes = [],
    isLoading: classesLoading
  } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: async () => {
      const result = await getTeacherClassesAction()
      if (!result.success) {
        throw new Error(result.error || 'Không thể tải danh sách lớp học')
      }
      return result.data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  })

  const {
    data: subjects = [],
    isLoading: subjectsLoading
  } = useQuery({
    queryKey: ['teacher-subjects'],
    queryFn: async () => {
      const result = await getTeacherSubjectsAction()
      if (!result.success) {
        throw new Error(result.error || 'Không thể tải danh sách môn học')
      }
      return result.data || []
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  })

  // Memoized computed values
  const loading = useMemo(() =>
    periodsLoading || classesLoading || subjectsLoading,
    [periodsLoading, classesLoading, subjectsLoading]
  )

  const error = useMemo(() =>
    periodsError?.message || null,
    [periodsError]
  )

  // Auto-selection logic with memoization
  useMemo(() => {
    if (!selectedPeriod && periods.length > 0) {
      setSelectedPeriod(periods[0].id)
    }
  }, [periods, selectedPeriod])

  useMemo(() => {
    if (!selectedClass && classes.length > 0) {
      setSelectedClass(classes[0].id)
    }
  }, [classes, selectedClass])

  useMemo(() => {
    if (!selectedSubject && subjects.length > 0) {
      setSelectedSubject(subjects[0].id)
    }
  }, [subjects, selectedSubject])

  const handlePeriodChange = (periodId: string) => {
    setSelectedPeriod(periodId)
  }

  const handleDownloadTemplate = async () => {
    if (!selectedPeriod || !selectedClass || !selectedSubject) {
      toast.error('Vui lòng chọn đầy đủ kỳ báo cáo, lớp học và môn học')
      return
    }

    // Show loading state
    const loadingToast = toast.loading('Đang tạo template Excel...')

    try {
      const selectedPeriodData = periods.find(p => p.id === selectedPeriod)
      const selectedClassData = classes.find(c => c.id === selectedClass)
      const selectedSubjectData = subjects.find(s => s.id === selectedSubject)

      if (!selectedPeriodData || !selectedClassData || !selectedSubjectData) {
        toast.error('Không tìm thấy thông tin kỳ báo cáo, lớp học hoặc môn học')
        return
      }

      // Get real student data for the selected class
      const { getClassStudentsAction } = await import('@/lib/actions/teacher-feedback-actions')
      const studentsResult = await getClassStudentsAction(selectedClass)

      if (!studentsResult.success) {
        toast.dismiss(loadingToast)
        toast.error(studentsResult.error || 'Không thể lấy danh sách học sinh')
        return
      }

      const students = studentsResult.data || []
      if (students.length === 0) {
        toast.dismiss(loadingToast)
        toast.error('Lớp học này chưa có học sinh nào')
        return
      }

      const templateData: TeacherExcelTemplateData = {
        period_type: selectedPeriodType,
        period_name: selectedPeriodData.name,
        class_name: selectedClassData.name,
        subject_name: selectedSubjectData.name_vietnamese,
        subject_code: selectedSubjectData.code,
        academic_year: selectedPeriodData.academic_year?.name || '',
        semester: selectedPeriodData.semester?.name || '',
        students: students.map(student => ({
          id: student.id,
          full_name: student.full_name,
          student_id: student.student_id
        }))
        // regular_grade_count will be automatically calculated from subject_name
      }

      const excelBuffer = await createTeacherGradeTemplate(templateData)
      const filename = generateExcelFilename(templateData)

      downloadExcelFile(excelBuffer, filename)

      // Dismiss loading and show success
      toast.dismiss(loadingToast)
      toast.success(`Tải template thành công! (${students.length} học sinh)`)
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.dismiss(loadingToast)
      toast.error(error instanceof Error ? error.message : 'Lỗi khi tải template')
    }
  }

  const handleImportGrades = () => {
    if (!selectedPeriod) {
      toast.error('Vui lòng chọn kỳ nhập điểm')
      return
    }
    setImportDialogOpen(true)
  }

  const handleTrackGrades = () => {
    if (!selectedPeriod || !selectedClass || !selectedSubject) {
      toast.error('Vui lòng chọn đầy đủ kỳ báo cáo, lớp học và môn học')
      return
    }
    setTrackingDialogOpen(true)
  }

  const handleImportSuccess = () => {
    setImportDialogOpen(false)
    toast.success('Nhập điểm thành công!')
  }

  const handleSubmitGradesToAdmin = async () => {
    if (!selectedPeriod || !selectedClass || !selectedSubject) {
      toast.error('Vui lòng chọn đầy đủ kỳ báo cáo, lớp học và môn học')
      return
    }

    // Allow submission for any valid period type selection
    // The validation will be done on the server side

    const loadingToast = toast.loading('Đang gửi bảng điểm cho admin...')

    try {
      // Import the submission action
      const { submitTeacherGradesToAdminAction } = await import('@/lib/actions/teacher-grade-submission-actions')

      const selectedClassData = classes.find(c => c.id === selectedClass)
      const selectedSubjectData = subjects.find(s => s.id === selectedSubject)
      const selectedPeriodData = periods.find(p => p.id === selectedPeriod)

      // Create mock grade data if currentGradeData is empty
      const gradeDataToSubmit = currentGradeData.length > 0 ? currentGradeData : [{
        studentId: 'mock',
        studentName: 'Mock Student',
        regularGrades: [null, null, null, null],
        midtermGrade: null,
        finalGrade: null,
        summaryGrade: null
      }]

      const result = await submitTeacherGradesToAdminAction({
        periodId: selectedPeriod,
        classId: selectedClass,
        subjectId: selectedSubject,
        className: selectedClassData?.name || 'Unknown Class',
        subjectName: selectedSubjectData?.name_vietnamese || 'Unknown Subject',
        periodName: selectedPeriodData?.name || 'Unknown Period',
        gradeData: gradeDataToSubmit,
        submissionReason: `Gửi bảng điểm ${getPeriodTypeDisplayName(selectedPeriodType)} môn ${selectedSubjectData?.name_vietnamese} lớp ${selectedClassData?.name}`
      })

      toast.dismiss(loadingToast)

      if (result.success) {
        toast.success('Gửi bảng điểm cho admin thành công!')
      } else {
        toast.error(result.error || 'Lỗi khi gửi bảng điểm')
      }
    } catch (error) {
      console.error('Error submitting grades:', error)
      toast.dismiss(loadingToast)
      toast.error('Lỗi khi gửi bảng điểm')
    }
  }

  const handleGradeDataChange = useCallback((grades: StudentGrade[]) => {
    // Store grade data for submission
    setCurrentGradeData(grades)
  }, []) // Empty dependency array since this function doesn't depend on any props or state



  const selectedPeriodData = useMemo(() =>
    periods.find(p => p.id === selectedPeriod),
    [periods, selectedPeriod]
  )

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quản lý điểm số</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Nhập và quản lý điểm số học sinh theo từng kỳ báo cáo
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading} className="w-full sm:w-auto">
              <Skeleton className="h-32 w-full rounded-lg" />
              Làm mới
            </Button>
          </div>
        </div>

        {/* Period Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Chọn kỳ nhập điểm</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="period-select" className="text-sm font-medium">Kỳ báo cáo</label>
                <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                  <SelectTrigger id="period-select">
                    <SelectValue placeholder="Chọn kỳ báo cáo" />
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name} - {period.academic_year?.name} - {period.semester?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedPeriodData && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Thông tin kỳ</span>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{selectedPeriodData.name}</span>
                      <Badge variant={selectedPeriodData.status === 'open' ? 'default' : 'secondary'}>
                        {selectedPeriodData.status === 'open' ? 'Đang mở' : 'Đã đóng'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Hạn nhập: {new Date(selectedPeriodData.import_deadline).toLocaleDateString('vi-VN')}</p>
                      <p>Hạn sửa: {new Date(selectedPeriodData.edit_deadline).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Class and Subject Filters */}
        {selectedPeriod && (
          <Card>
            <CardHeader>
              <CardTitle>Chọn lớp học và môn học</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="class-select" className="text-sm font-medium">Lớp học</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger id="class-select">
                      <SelectValue placeholder="Chọn lớp học" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name} (Khối {classItem.grade_level})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject-select" className="text-sm font-medium">Môn học</label>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger id="subject-select">
                      <SelectValue placeholder="Chọn môn học" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name_vietnamese} ({subject.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="period-type-select" className="text-sm font-medium">Loại điểm</label>
                  <Select value={selectedPeriodType} onValueChange={(value) => setSelectedPeriodType(value as GradePeriodType)}>
                    <SelectTrigger id="period-type-select">
                      <SelectValue placeholder="Chọn loại điểm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular_1">Điểm thường xuyên HK1</SelectItem>
                      <SelectItem value="regular_2">Điểm thường xuyên HK2</SelectItem>
                      <SelectItem value="midterm_1">Điểm giữa kì 1</SelectItem>
                      <SelectItem value="midterm_2">Điểm giữa kì 2</SelectItem>
                      <SelectItem value="final_1">Điểm cuối kì 1</SelectItem>
                      <SelectItem value="final_2">Điểm cuối kì 2</SelectItem>
                      <SelectItem value="summary_1">Điểm tổng kết HK1</SelectItem>
                      <SelectItem value="summary_2">Điểm tổng kết HK2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedClass && selectedSubject && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">
                        {classes.find(c => c.id === selectedClass)?.name} - {subjects.find(s => s.id === selectedSubject)?.name_vietnamese}
                      </p>
                      <p className="text-sm text-blue-700">
                        Loại điểm: {getPeriodTypeDisplayName(selectedPeriodType)}
                      </p>
                      <p className="text-sm text-blue-700">
                        Số cột điểm thường xuyên: {subjects.find(s => s.id === selectedSubject)?.regular_grade_count || 3}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {selectedPeriod && selectedClass && selectedSubject && (
          <Card>
            <CardHeader>
              <CardTitle>Thao tác nhập điểm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <Button onClick={handleDownloadTemplate} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Tải template Excel
                </Button>
                <Button onClick={handleImportGrades}>
                  <Upload className="mr-2 h-4 w-4" />
                  Nhập điểm từ Excel
                </Button>
                <Button onClick={handleTrackGrades} variant="secondary">
                  <Eye className="mr-2 h-4 w-4" />
                  Theo dõi điểm số
                </Button>
                <Button onClick={handleSubmitGradesToAdmin} className="bg-green-600 hover:bg-green-700">
                  <Send className="mr-2 h-4 w-4" />
                  Gửi cho Admin
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}



        {/* Grade Overview */}
        <TeacherGradeOverview
          periodId={selectedPeriod}
          classId={selectedClass}
          subjectId={selectedSubject}
          onImportClick={handleImportGrades}
          onGradeDataChange={handleGradeDataChange}
        />

        {/* Import Dialog */}
        <TeacherGradeImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          periodId={selectedPeriod}
          classId={selectedClass}
          subjectId={selectedSubject}
          subjectName={subjects.find(s => s.id === selectedSubject)?.name_vietnamese}
          periodType={selectedPeriodType}
          onSuccess={handleImportSuccess}
        />



        {/* Grade Tracking Dialog */}
        <TeacherGradeTrackingDialog
          open={trackingDialogOpen}
          onOpenChange={setTrackingDialogOpen}
          periodId={selectedPeriod}
          classId={selectedClass}
          subjectId={selectedSubject}
          className={classes.find(c => c.id === selectedClass)?.name || ''}
          subjectName={subjects.find(s => s.id === selectedSubject)?.name_vietnamese || ''}
          periodName={selectedPeriodData?.name || ''}
        />
      </div>
    </div>
  )
}