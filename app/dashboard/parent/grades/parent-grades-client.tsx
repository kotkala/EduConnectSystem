'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, TrendingUp, TrendingDown, Award, BookOpen, BarChart3, Users } from 'lucide-react'
import { toast } from 'sonner'
import { getChildrenGradeReportsAction, getStudentGradeDetailAction, getStudentGradeStatsAction } from '@/lib/actions/parent-grade-actions'
import { createIndividualGradeTemplate, downloadExcelFile, type IndividualGradeExportData } from '@/lib/utils/individual-excel-utils'

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

interface GradeStats {
  totalSubjects: number
  gradedSubjects: number
  averageGrade: number | null
  highestGrade: number | null
  lowestGrade: number | null
  excellentCount: number
  goodCount: number
  averageCount: number
  belowAverageCount: number
}

export default function ParentGradesClient() {
  const [loading, setLoading] = useState(false)
  const [submissions, setSubmissions] = useState<GradeSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<GradeSubmission | null>(null)
  const [gradeStats, setGradeStats] = useState<GradeStats | null>(null)
  const [loadingStates, setLoadingStates] = useState({
    submissions: false,
    details: false,
    stats: false
  })

  useEffect(() => {
    loadGradeReports()
  }, [])

  const loadGradeReports = async () => {
    setLoadingStates(prev => ({ ...prev, submissions: true }))
    try {
      const result = await getChildrenGradeReportsAction()
      if (result.success) {
        setSubmissions(result.data as GradeSubmission[])
      } else {
        toast.error(result.error || "Không thể tải bảng điểm")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải bảng điểm")
    } finally {
      setLoadingStates(prev => ({ ...prev, submissions: false }))
    }
  }

  const loadSubmissionDetails = async (submission: GradeSubmission) => {
    setLoadingStates(prev => ({ ...prev, details: true, stats: true }))
    try {
      // Load detailed submission
      const detailResult = await getStudentGradeDetailAction(submission.id)
      if (detailResult.success && detailResult.data) {
        setSelectedSubmission(detailResult.data as GradeSubmission)
      }

      // Load statistics
      const statsResult = await getStudentGradeStatsAction(submission.id)
      if (statsResult.success && statsResult.data) {
        setGradeStats(statsResult.data as GradeStats)
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải chi tiết bảng điểm")
    } finally {
      setLoadingStates(prev => ({ ...prev, details: false, stats: false }))
    }
  }

  const handleDownloadExcel = async (submission: GradeSubmission) => {
    setLoading(true)
    try {
      // Prepare data for Excel export
      const subjects = submission.grades.map(grade => ({
        id: grade.subject.id,
        code: grade.subject.code,
        name_vietnamese: grade.subject.name_vietnamese,
        name_english: grade.subject.name_vietnamese, // Use Vietnamese as fallback
        category: grade.subject.category
      }))

      const exportData: IndividualGradeExportData = {
        student: {
          id: submission.student.id,
          full_name: submission.student.full_name,
          student_id: submission.student.student_id,
          email: '' // Not needed for parent view
        },
        subjects,
        className: submission.class.name,
        academicYear: submission.academic_year.name,
        semester: submission.semester.name
      }

      const excelBuffer = createIndividualGradeTemplate(exportData)
      const filename = `BangDiem_${submission.student.student_id}_${submission.student.full_name}_${submission.semester.name}.xlsx`
      
      downloadExcelFile(excelBuffer, filename)
      toast.success(`Đã tải bảng điểm của ${submission.student.full_name}`)
    } catch {
      toast.error("Có lỗi xảy ra khi tải file Excel")
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade: number | null) => {
    if (!grade) return 'text-gray-400'
    if (grade >= 8.5) return 'text-green-600'
    if (grade >= 7.0) return 'text-blue-600'
    if (grade >= 5.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeBadgeVariant = (grade: number | null) => {
    if (!grade) return 'secondary'
    if (grade >= 8.5) return 'default'
    if (grade >= 7.0) return 'secondary'
    if (grade >= 5.0) return 'outline'
    return 'destructive'
  }

  // Group submissions by student
  const studentGroups = submissions.reduce((groups, submission) => {
    const studentId = submission.student_id
    if (!groups[studentId]) {
      groups[studentId] = {
        student: submission.student,
        submissions: []
      }
    }
    groups[studentId].submissions.push(submission)
    return groups
  }, {} as Record<string, { student: { id: string, full_name: string, student_id: string }, submissions: GradeSubmission[] }>)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Bảng Điểm Con Em
          </CardTitle>
          <CardDescription>
            Xem bảng điểm và thành tích học tập của con bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStates.submissions ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : Object.keys(studentGroups).length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có bảng điểm</h3>
              <p className="text-gray-500">Chưa có bảng điểm nào được gửi từ giáo viên.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.values(studentGroups).map(({ student, submissions: studentSubmissions }) => (
                <div key={student.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{student.full_name}</h3>
                      <p className="text-sm text-gray-500">Mã học sinh: {student.student_id}</p>
                    </div>
                    <Badge variant="outline">
                      {studentSubmissions.length} bảng điểm
                    </Badge>
                  </div>
                  
                  <div className="grid gap-3">
                    {studentSubmissions.map((submission) => (
                      <div
                        key={submission.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSubmission?.id === submission.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => loadSubmissionDetails(submission)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{submission.semester.name} - {submission.academic_year.name}</h4>
                            <p className="text-sm text-gray-500">
                              Lớp: {submission.class.name} • GVCN: {submission.class.homeroom_teacher.full_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {submission.grades.length} môn học • {new Date(submission.created_at).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownloadExcel(submission)
                              }}
                              disabled={loading}
                              size="sm"
                              variant="outline"
                              className="flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Tải Excel
                            </Button>
                            {selectedSubmission?.id === submission.id && (
                              <Badge variant="default">Đang xem</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Submission Details */}
      {selectedSubmission && (
        <>
          {/* Statistics Card */}
          {gradeStats && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Thống Kê Điểm Số
                </CardTitle>
                <CardDescription>
                  {selectedSubmission.student.full_name} - {selectedSubmission.semester.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {gradeStats.averageGrade?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Điểm Trung Bình</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                      <TrendingUp className="h-5 w-5" />
                      {gradeStats.highestGrade?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Điểm Cao Nhất</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                      <TrendingDown className="h-5 w-5" />
                      {gradeStats.lowestGrade?.toFixed(1) || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Điểm Thấp Nhất</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                      <Award className="h-5 w-5" />
                      {gradeStats.excellentCount}
                    </div>
                    <div className="text-sm text-gray-600">Môn Xuất Sắc</div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <div>
                    <div className="text-lg font-semibold text-green-600">{gradeStats.excellentCount}</div>
                    <div className="text-xs text-gray-500">Xuất sắc (≥8.5)</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-blue-600">{gradeStats.goodCount}</div>
                    <div className="text-xs text-gray-500">Khá (7.0-8.4)</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-yellow-600">{gradeStats.averageCount}</div>
                    <div className="text-xs text-gray-500">Trung bình (5.0-6.9)</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-red-600">{gradeStats.belowAverageCount}</div>
                    <div className="text-xs text-gray-500">Yếu (&lt;5.0)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Grades Card */}
          <Card>
            <CardHeader>
              <CardTitle>Chi Tiết Điểm Số</CardTitle>
              <CardDescription>
                {selectedSubmission.student.full_name} - {selectedSubmission.class.name} - {selectedSubmission.semester.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStates.details ? (
                <div className="text-center py-8">Đang tải chi tiết...</div>
              ) : (
                <div className="space-y-3">
                  {selectedSubmission.grades.map((grade) => (
                    <div
                      key={grade.subject_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <h4 className="font-medium">{grade.subject.name_vietnamese}</h4>
                        <p className="text-sm text-gray-500">Mã môn: {grade.subject.code}</p>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-sm text-gray-500">Giữa kì</div>
                          <div className={`font-medium ${getGradeColor(grade.midterm_grade)}`}>
                            {grade.midterm_grade?.toFixed(1) || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Cuối kì</div>
                          <div className={`font-medium ${getGradeColor(grade.final_grade)}`}>
                            {grade.final_grade?.toFixed(1) || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Trung bình</div>
                          <Badge variant={getGradeBadgeVariant(grade.average_grade)}>
                            {grade.average_grade?.toFixed(1) || 'N/A'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
