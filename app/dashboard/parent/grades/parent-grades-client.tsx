'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, TrendingUp, TrendingDown, Award, BookOpen, BarChart3, Users, Eye, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { getChildrenGradeReportsAction, getStudentGradeDetailAction, getStudentGradeStatsAction } from '@/lib/actions/parent-grade-actions'
import { createIndividualGradeTemplate, downloadExcelFile, type IndividualGradeExportData } from '@/lib/utils/individual-excel-utils'

// Lazy load heavy dialog component to improve initial page load
const ParentGradeViewDialog = dynamic(() => import('@/components/parent-dashboard/parent-grade-view-dialog').then(mod => ({ default: mod.ParentGradeViewDialog })), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded animate-pulse"></div>
})

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

// Separate component for submission item to reduce nesting
interface SubmissionItemProps {
  readonly submission: GradeSubmission
  readonly isSelected: boolean
  readonly loading: boolean
  readonly onSelect: (submission: GradeSubmission) => void
  readonly onDownload: (submission: GradeSubmission) => void
  readonly onView: (submission: GradeSubmission) => void
}

function SubmissionItem({ submission, isSelected, loading, onSelect, onDownload, onView }: SubmissionItemProps) {
  const handleClick = () => {
    onSelect(submission)
  }

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onView(submission)
  }

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload(submission)
  }

  return (
    <button
      type="button"
      className={`w-full text-left p-3 border rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={handleClick}
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
            onClick={handleViewClick}
            disabled={loading}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            Xem nhanh
          </Button>
          <Button
            onClick={handleDownloadClick}
            disabled={loading}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Tải Excel
          </Button>
          {isSelected && (
            <Badge variant="default">Đang xem</Badge>
          )}
        </div>
      </div>
    </button>
  )
}

// Separate component for student group to reduce nesting
interface StudentGroupProps {
  readonly student: { id: string, full_name: string, student_id: string }
  readonly submissions: GradeSubmission[]
  readonly selectedSubmissionId: string | null
  readonly loading: boolean
  readonly onSelectSubmission: (submission: GradeSubmission) => void
  readonly onDownloadSubmission: (submission: GradeSubmission) => void
  readonly onViewSubmission: (submission: GradeSubmission) => void
}

function StudentGroup({ student, submissions, selectedSubmissionId, loading, onSelectSubmission, onDownloadSubmission, onViewSubmission }: StudentGroupProps) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{student.full_name}</h3>
          <p className="text-sm text-gray-500">Mã học sinh: {student.student_id}</p>
        </div>
        <Badge variant="outline">
          {submissions.length} bảng điểm
        </Badge>
      </div>

      <div className="grid gap-3">
        {submissions.map((submission) => (
          <SubmissionItem
            key={submission.id}
            submission={submission}
            isSelected={selectedSubmissionId === submission.id}
            loading={loading}
            onSelect={onSelectSubmission}
            onDownload={onDownloadSubmission}
            onView={onViewSubmission}
          />
        ))}
      </div>
    </div>
  )
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
  }, [])

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

      const excelBuffer = createIndividualGradeTemplate(exportData)
      const filename = `BangDiem_${submission.student.student_id}_${submission.student.full_name}_${submission.semester.name}.xlsx`
      
      downloadExcelFile(excelBuffer, filename)
      toast.success(`Đã tải bảng điểm của ${submission.student.full_name}`)
    } catch {
      toast.error("Có lỗi xảy ra khi tải file Excel")
    } finally {
      setLoading(false)
    }
  }, [])

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

  // Use memoized grouped submissions for better performance

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
          {(() => {
            if (loadingStates.submissions) {
              return <div className="text-center py-8">Đang tải...</div>
            }

            if (groupedSubmissions.length === 0) {
              return (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có bảng điểm</h3>
                  <p className="text-gray-500">Chưa có bảng điểm nào được gửi từ giáo viên.</p>
                </div>
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
        </CardContent>
      </Card>

      {/* Selected Submission Details */}
      {selectedSubmission && (
        <>
          {/* Statistics Card */}
          {gradeStats && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Thống Kê Điểm Số
                    </CardTitle>
                    <CardDescription>
                      {selectedSubmission.student.full_name} - {selectedSubmission.semester.name}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={handleCloseDetails}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Đóng
                  </Button>
                </div>
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

          {/* AI Feedback Card */}
          {selectedSubmission.ai_feedback && (
            <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Sparkles className="h-5 w-5" />
                  Nhận Xét Từ Giáo Viên Chủ Nhiệm
                </CardTitle>
                <CardDescription>
                  {selectedSubmission.class.homeroom_teacher.full_name} • {new Date(selectedSubmission.ai_feedback.created_at).toLocaleDateString('vi-VN')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-white rounded-lg p-4 border border-purple-200/50">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {selectedSubmission.ai_feedback.text}
                  </div>
                  {selectedSubmission.ai_feedback.rating && (
                    <div className="mt-3 pt-3 border-t border-purple-200/50">
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <Award className="h-4 w-4" />
                        <span>Đánh giá: {selectedSubmission.ai_feedback.rating}/5</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Grade View Dialog */}
      <ParentGradeViewDialog
        submission={viewingSubmission}
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
      />
    </div>
  )
}
