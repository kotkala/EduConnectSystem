'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useCoordinatedLoading, usePageTransition } from '@/components/ui/global-loading-provider'
import { Button } from '@/components/ui/button'
import { Download, TrendingUp, TrendingDown, Award, BookOpen, BarChart3, Users, Eye, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { getChildrenGradeReportsAction, getStudentGradeDetailAction, getStudentGradeStatsAction } from '@/lib/actions/parent-grade-actions'
import { createIndividualGradeTemplate, downloadExcelFile, type IndividualGradeExportData } from '@/lib/utils/individual-excel-utils'

// Lazy load heavy dialog component to improve initial page load
import { LoadingFallback } from '@/components/ui/loading-fallback'
const ParentGradeViewDialog = dynamic(() => import('@/components/parent-dashboard/parent-grade-view-dialog').then(mod => ({ default: mod.ParentGradeViewDialog })), {
  ssr: false,
  loading: () => <LoadingFallback size="lg" />
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
    <div
      className={`w-full p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-lg shadow-blue-500/20'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
      }`}
      onClick={handleClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <h4 className="font-bold text-gray-900">{submission.semester.name} - {submission.academic_year.name}</h4>
          </div>
          <div className="space-y-1 ml-11">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Lớp:</span> {submission.class.name} • <span className="font-medium">GVCN:</span> {submission.class.homeroom_teacher.full_name}
            </p>
            <p className="text-sm text-gray-500">
              {submission.grades.length} môn học • {new Date(submission.created_at).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            onClick={handleViewClick}
            disabled={loading}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 rounded-lg border-gray-300 hover:border-blue-400 hover:bg-blue-50"
          >
            <Eye className="h-4 w-4" />
            Xem nhanh
          </Button>
          <Button
            onClick={handleDownloadClick}
            disabled={loading}
            size="sm"
            variant="outline"
            className="flex items-center gap-2 rounded-lg border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
          >
            <Download className="h-4 w-4" />
            Tải Excel
          </Button>
          {isSelected && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Đang xem
            </span>
          )}
        </div>
      </div>
    </div>
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
    <div className="bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200/50 p-6 shadow-lg shadow-gray-500/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">{student.full_name}</h3>
            <p className="text-sm text-gray-600">Mã học sinh: <span className="font-mono font-medium">{student.student_id}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            {submissions.length} bảng điểm
          </span>
        </div>
      </div>

      <div className="grid gap-4">
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
  // 🚀 MIGRATION: Replace scattered loading with coordinated system
  const { startPageTransition, stopLoading } = usePageTransition()
  const coordinatedLoading = useCoordinatedLoading()
  
  const [submissions, setSubmissions] = useState<GradeSubmission[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<GradeSubmission | null>(null)
  const [gradeStats, setGradeStats] = useState<GradeStats | null>(null)
  
  // 📊 Keep minimal loading state for specific sections only
  const [sectionLoading, setSectionLoading] = useState({
    details: false, // For non-blocking detail loading
    stats: false    // For secondary stats loading
  })
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewingSubmission, setViewingSubmission] = useState<GradeSubmission | null>(null)

  const loadGradeReports = useCallback(async () => {
    // 🎯 UX IMPROVEMENT: Use global loading with meaningful message
    startPageTransition("Đang tải bảng điểm của con...")
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
      stopLoading()
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
    setSectionLoading(prev => ({ ...prev, details: true, stats: true }))
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
      setSectionLoading(prev => ({ ...prev, details: false, stats: false }))
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
    startPageTransition("Đang tải dữ liệu...")
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
      stopLoading()
    }
  }, [])

  const getGradeColor = (grade: number | null) => {
    if (!grade) return 'text-gray-400'
    if (grade >= 8.5) return 'text-green-600'
    if (grade >= 7.0) return 'text-blue-600'
    if (grade >= 5.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeBadgeColor = (grade: number | null) => {
    if (!grade) return 'bg-gray-100 text-gray-800'
    if (grade >= 8.5) return 'bg-emerald-100 text-emerald-800'
    if (grade >= 7.0) return 'bg-blue-100 text-blue-800'
    if (grade >= 5.0) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  // Use memoized grouped submissions for better performance

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-8">
          {/* Modern Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Bảng Điểm Con Em
                </h1>
                <p className="text-gray-600 mt-1">
                  Theo dõi thành tích học tập và tiến bộ của con em qua từng kỳ học
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 p-6 sm:p-8">
            {(() => {
              if (coordinatedLoading.isLoading && submissions.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-600 font-medium">Đang tải bảng điểm...</p>
                  </div>
                )
              }

              if (groupedSubmissions.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Award className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Chưa có bảng điểm</h3>
                    <p className="text-gray-500 text-center">Chưa có bảng điểm nào được gửi từ giáo viên.</p>
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
                  loading={coordinatedLoading.isLoading}
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
              {sectionLoading.details ? (
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
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getGradeBadgeColor(grade.average_grade)}`}>
                            {grade.average_grade?.toFixed(1) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          {/* Modern AI Feedback Card */}
          {selectedSubmission.ai_feedback && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-purple-800">Nhận Xét Từ Giáo Viên Chủ Nhiệm</h3>
                  <p className="text-sm text-purple-600">
                    {selectedSubmission.class.homeroom_teacher.full_name} • {new Date(selectedSubmission.ai_feedback.created_at).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>
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
            </div>
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
      </div>
    </div>
  )
}
