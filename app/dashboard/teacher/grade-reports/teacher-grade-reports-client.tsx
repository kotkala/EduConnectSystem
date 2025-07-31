'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Send, Users, FileText, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { getClassGradeSummariesAction, getClassGradeDetailsAction, sendGradesToParentAction, getStudentParentsAction, sendAllGradesToParentsAction } from '@/lib/actions/teacher-grade-actions'
import { createClassSummaryExcel, downloadExcelFile, type ClassSummaryData, type StudentGradeData, type SubjectGradeData } from '@/lib/utils/class-summary-excel-utils'

interface ClassGradeSummary {
  id: string
  summary_name: string
  total_students: number
  submitted_students: number
  sent_at: string
  academic_year: { name: string }
  semester: { name: string }
  class: { id: string; name: string }
  sent_by_profile: { full_name: string }
}

interface StudentSubmission {
  id: string
  student_id: string
  student: {
    id: string
    full_name: string
    student_id: string
    email: string
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

      const excelBuffer = createClassSummaryExcel(classData)
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

      const parentIds = (parentsResult.data as unknown as Array<{ id: string }>).map(p => p.id)
      const result = await sendGradesToParentAction(submission.id, parentIds)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error || "Không thể gửi bảng điểm cho phụ huynh")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi gửi bảng điểm")
    } finally {
      setLoadingStates(prev => ({ ...prev, sendingToParent: false }))
    }
  }

  const handleSendToAllParents = async () => {
    if (!selectedSummary) return

    setLoadingStates(prev => ({ ...prev, sendingToAllParents: true }))
    try {
      const result = await sendAllGradesToParentsAction(selectedSummary.id)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.error || "Không thể gửi bảng điểm cho tất cả phụ huynh")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi gửi bảng điểm")
    } finally {
      setLoadingStates(prev => ({ ...prev, sendingToAllParents: false }))
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bảng Điểm Đã Nhận</CardTitle>
          <CardDescription>
            Danh sách bảng điểm các lớp chủ nhiệm đã được gửi từ admin
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStates.summaries ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : summaries.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có bảng điểm</h3>
              <p className="text-gray-500">Chưa có bảng điểm nào được gửi từ admin.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {summaries.map((summary) => (
                <div
                  key={summary.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedSummary?.id === summary.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => loadSummaryDetails(summary)}
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Summary Details */}
      {selectedSummary && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
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
          </CardHeader>
          <CardContent>
            {loadingStates.details ? (
              <div className="text-center py-8">Đang tải chi tiết...</div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Không có dữ liệu học sinh.</p>
              </div>
            ) : (
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
                    <Button
                      onClick={() => handleSendToParent(submission)}
                      disabled={loadingStates.sendingToParent}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Gửi PH
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
