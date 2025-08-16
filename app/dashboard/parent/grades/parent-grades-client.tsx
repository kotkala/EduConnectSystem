'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Users, FileText, Eye, Award } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { getChildrenGradeReportsAction } from '@/lib/actions/parent-grade-actions'
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
  const [loading, setLoading] = useState(false)
  const [submissions, setSubmissions] = useState<GradeSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<GradeSubmission | null>(null)
  const [gradeStats, setGradeStats] = useState<GradeStats | null>(null)
  const [loadingStates, setLoadingStates] = useState({
    submissions: false,
    details: false,
    stats: false
  })
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingSubmission, setViewingSubmission] = useState<GradeSubmission | null>(null)

  const loadGradeReports = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, submissions: true }))
    try {
      setLoading(true)
      const result = await getChildrenGradeReportsAction()
      if (result.success) {
        const submissionsData = result.data as GradeSubmission[]
        setSubmissions(submissionsData)

        // Transform submissions into student records similar to teacher interface
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
          const addUniqueSubjects = (grades: typeof submission.grades, subjects: typeof student.subjects) => {
            grades.forEach((grade) => {
              const subjectExists = subjects.some(s => s.code === grade.subject.code)
              if (!subjectExists) {
                subjects.push({
                  id: grade.subject.id,
                  name_vietnamese: grade.subject.name_vietnamese,
                  code: grade.subject.code
                })
              }
            })
          }
          addUniqueSubjects(submission.grades, student.subjects)
        })

        setStudents(Array.from(studentMap.values()))
      } else {
        toast.error(result.error || "Không thể tải bảng điểm")
        setStudents([])
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải bảng điểm")
      setStudents([])
    } finally {
      setLoadingStates(prev => ({ ...prev, submissions: false }))
    }
  }, [startPageTransition, stopLoading])

  useEffect(() => {
    loadGradeReports()
  }, [loadGradeReports])

  // Memoize grouped submissions to prevent unnecessary re-renders
  const groupedSubmissions = useMemo(() => {
    const groups = new Map<string, { student: { id: string, full_name: string, student_id: string }, submissions: GradeSubmission[] }>()

    submissions.forEach(submission => {
      const studentKey = submission.student.id
      if (!groups.has(studentKey)) {
        groups.set(studentKey, {
          student: submission.student,
          submissions: []
        })
      }
      groups.get(studentKey)!.submissions.push(submission)
    })

    return Array.from(groups.values())
  }, [submissions])

  const loadSubmissionDetails = useCallback(async (submission: GradeSubmission) => {
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
  }, [])

  const handleViewSubmission = useCallback((submission: GradeSubmission) => {
    setViewingSubmission(submission)
    setViewDialogOpen(true)
  }, [])

  const handleCloseDetails = useCallback(() => {
    setSelectedSubmission(null)
    setGradeStats(null)
  }, [])

  const handleDownloadExcel = useCallback(async (submission: GradeSubmission) => {
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

      const excelBuffer = await createIndividualGradeTemplate(exportData)
      const filename = `BangDiem_${submission.student.student_id}_${submission.student.full_name}_${submission.semester.name}.xlsx`

      downloadExcelFile(excelBuffer, filename)
      toast.success(`Đã tải bảng điểm của ${submission.student.full_name}`)
    } catch {
      toast.error("Có lỗi xảy ra khi tải file Excel")
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle view submission
  const handleViewSubmission = useCallback((submission: GradeSubmission) => {
    router.push(`/dashboard/parent/grades/${submission.id}`)
  }, [router])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bảng điểm con em</h1>
          <p className="text-gray-600">Xem bảng điểm các con được gửi từ giáo viên chủ nhiệm</p>
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
              <FileText className="h-5 w-5 text-green-600" />
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

          {/* Main Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 p-6 sm:p-8">
            {(() => {
              if (loadingStates.submissions) {
                return (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-medium">Đang tải bảng điểm...</p>
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
            <div className="space-y-6">
              {groupedSubmissions.map(({ student, submissions: studentSubmissions }) => (
                <StudentGroup
                  key={student.id}
                  student={student}
                  submissions={studentSubmissions}
                  selectedSubmissionId={selectedSubmission?.id || null}
                  loading={loading}
                  onSelectSubmission={loadSubmissionDetails}
                  onDownloadSubmission={handleDownloadExcel}
                  onViewSubmission={handleViewSubmission}
                />
              ))}
            </div>
            )
            })()}
          </div>

          {/* Selected Submission Details */}
          {selectedSubmission && (
            <>
              {/* Modern Statistics Card */}
              {gradeStats && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Thống Kê Điểm Số</h2>
                        <p className="text-gray-600">
                          {selectedSubmission.student.full_name} - {selectedSubmission.semester.name}
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleCloseDetails}
                      variant="ghost"
                      size="sm"
                      className="rounded-lg hover:bg-gray-100 flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Đóng
                    </Button>
                  </div>

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
                </div>
          )}

          {/* Modern Detailed Grades Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Chi Tiết Điểm Số</h2>
                <p className="text-gray-600">
                  {selectedSubmission.student.full_name} - {selectedSubmission.class.name} - {selectedSubmission.semester.name}
                </p>
              </div>
            </div>
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
                                {submission.semester.name}
                              </Button>
                              <Button
                                onClick={() => handleDownloadExcel(submission)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <Download className="h-4 w-4" />
                                Excel
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
          })()}
        </CardContent>
      </Card>
    </div>
  )
}


