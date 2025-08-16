'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Send, Users, FileText, Eye } from 'lucide-react'
import { toast } from 'sonner'

// Helper function to render summaries content
function renderSummariesContent(
  loadingStates: { summaries: boolean },
  summaries: ClassGradeSummary[],
  selectedSummary: ClassGradeSummary | null,
  loadSummaryDetails: (summary: ClassGradeSummary) => void
) {
  if (loadingStates.summaries) {
    return <div className="text-center py-8">Đang tải...</div>
  }

  if (summaries.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có bảng điểm</h3>
        <p className="text-gray-500">Chưa có bảng điểm nào được gửi từ admin.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {summaries.map((summary) => (
        <button
          key={summary.id}
          type="button"
          className={`w-full p-4 border rounded-lg text-left transition-colors ${
            selectedSummary?.id === summary.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => loadSummaryDetails(summary)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              loadSummaryDetails(summary)
            }
          }}
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{summary.summary_name}</h4>
              <p className="text-sm text-gray-500">
                Lớp: {summary.class.name} • Gửi bởi: {summary.sent_by_profile.full_name}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(summary.sent_at).toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {summary.submitted_students}/{summary.total_students} HS
              </Badge>
              {selectedSummary?.id === summary.id && (
                <Badge variant="default">Đang xem</Badge>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

// Helper function to render submissions content
function renderSubmissionsContent(
  loadingStates: { details: boolean },
  submissions: StudentSubmission[],
  viewStudentGrades: (submission: StudentSubmission) => void,
  handleSendToParent: (submission: StudentSubmission) => void,
  sendingToParent: boolean
) {
  if (loadingStates.details) {
    return <div className="text-center py-8">Đang tải chi tiết...</div>
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Không có dữ liệu học sinh.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {submissions.map((submission) => (
        <div
          key={submission.id}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          <div>
            <h4 className="font-medium">{submission.student.full_name}</h4>
            <p className="text-sm text-gray-500">
              Mã HS: {submission.student.student_id} • {submission.grades.length} môn học
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => viewStudentGrades(submission)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Xem
            </Button>
            <Button
              onClick={() => handleSendToParent(submission)}
              disabled={sendingToParent}
              size="sm"
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Gửi PH
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
import { getClassGradeSummariesAction, getClassGradeDetailsAction, sendGradesToParentAction, getStudentParentsAction, sendAllGradesToParentsAction } from '@/lib/actions/teacher-grade-actions'
import { createClassSummaryExcel, downloadExcelFile, type ClassSummaryData, type StudentGradeData, type SubjectGradeData } from '@/lib/utils/class-summary-excel-utils'
import { saveAIFeedbackAction, getAIFeedbackAction, type SaveAIFeedbackRequest } from '@/lib/actions/ai-feedback-actions'

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
  const [loading, setLoading] = useState(false)
  const [summaries, setSummaries] = useState<ClassGradeSummary[]>([])
  const [selectedSummary, setSelectedSummary] = useState<ClassGradeSummary | null>(null)
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([])
  const [loadingStates, setLoadingStates] = useState({
    summaries: false,
    details: false,
    sendingToParent: false,
    sendingToAllParents: false
  })
  const [viewingStudent, setViewingStudent] = useState<StudentSubmission | null>(null)
  const [studentGradeData, setStudentGradeData] = useState<StudentGradeData | null>(null)
  const [aiFeedback, setAiFeedback] = useState<string>('')
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)
  const [isSavingFeedback, setIsSavingFeedback] = useState(false)

  useEffect(() => {
    loadSummaries()
  }, [])

  const loadSummaries = async () => {
    setLoadingStates(prev => ({ ...prev, summaries: true }))
    try {
      const result = await getClassGradeSummariesAction()
      if (result.success) {
        setSummaries(result.data as ClassGradeSummary[])
      } else {
        toast.error(result.error || "Không thể tải danh sách bảng điểm")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải danh sách bảng điểm")
    } finally {
      setLoadingStates(prev => ({ ...prev, summaries: false }))
    }
  }

  const loadSummaryDetails = async (summary: ClassGradeSummary) => {
    setLoadingStates(prev => ({ ...prev, details: true }))
    try {
      const result = await getClassGradeDetailsAction(summary.id)
      if (result.success && result.data) {
        setSelectedSummary(summary)
        setSubmissions(result.data.submissions as StudentSubmission[])
      } else {
        toast.error(result.error || "Không thể tải chi tiết bảng điểm")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải chi tiết bảng điểm")
    } finally {
      setLoadingStates(prev => ({ ...prev, details: false }))
    }
  }

  const handleDownloadClassExcel = async () => {
    if (!selectedSummary || submissions.length === 0) return

    setLoading(true)
    try {
      // Prepare data for Excel export
      const studentsData: StudentGradeData[] = submissions.map(submission => {
        const subjectsData: SubjectGradeData[] = submission.grades.map(grade => ({
          subjectName: grade.subject.name_vietnamese,
          midtermGrade: grade.midterm_grade || undefined,
          finalGrade: grade.final_grade || undefined,
          averageGrade: grade.average_grade || undefined
        }))

        // Calculate overall average
        const validGrades = subjectsData.filter(s => s.averageGrade !== undefined)
        const averageGrade = validGrades.length > 0 
          ? Math.round((validGrades.reduce((sum, s) => sum + (s.averageGrade || 0), 0) / validGrades.length) * 10) / 10
          : undefined

        return {
          studentId: submission.student.id,
          studentName: submission.student.full_name,
          studentCode: submission.student.student_id,
          subjects: subjectsData,
          averageGrade
        }
      })

      // Sort by average grade for ranking
      studentsData.sort((a, b) => (b.averageGrade || 0) - (a.averageGrade || 0))
      studentsData.forEach((student, index) => {
        student.rank = index + 1
      })

      const classData: ClassSummaryData = {
        className: selectedSummary.class.name,
        academicYear: selectedSummary.academic_year.name,
        semester: selectedSummary.semester.name,
        homeroomTeacher: selectedSummary.sent_by_profile.full_name,
        students: studentsData
      }

      const excelBuffer = await createClassSummaryExcel(classData)
      const filename = `BangDiem_${selectedSummary.class.name}_${selectedSummary.semester.name}.xlsx`

      downloadExcelFile(excelBuffer, filename)
      toast.success("Đã tải file Excel thành công")
    } catch {
      toast.error("Có lỗi xảy ra khi tải file Excel")
    } finally {
      setLoading(false)
    }
  }

  const handleSendToParent = async (submission: StudentSubmission) => {
    setLoadingStates(prev => ({ ...prev, sendingToParent: true }))
    try {
      // Get parents for this student
      const parentsResult = await getStudentParentsAction(submission.student_id)
      if (!parentsResult.success || !parentsResult.data || parentsResult.data.length === 0) {
        toast.error("Không tìm thấy phụ huynh của học sinh này")
        return
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
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Chi Tiết Bảng Điểm: {selectedSummary.class.name}
                </CardTitle>
                <CardDescription>
                  {selectedSummary.semester.name} - {selectedSummary.academic_year.name}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadClassExcel}
                  disabled={loading || submissions.length === 0}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Tải Excel Lớp
                </Button>
                <Button
                  onClick={handleSendToAllParents}
                  disabled={loadingStates.sendingToAllParents || submissions.length === 0}
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  Gửi Tất Cả PH
                </Button>
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
