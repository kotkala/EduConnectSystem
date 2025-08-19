'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Download, TrendingUp, TrendingDown, Award, BookOpen, BarChart3, Sparkles, User, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { getStudentGradeDetailAction, getStudentGradeStatsAction } from '@/lib/actions/parent-grade-actions'
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
    regular_grades: number[]
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
  teacher_notes?: string | null
  sent_to_parents_at: string
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

interface ParentGradeDetailClientProps {
  submissionId: string
}

export default function ParentGradeDetailClient({ submissionId }: ParentGradeDetailClientProps) {
  const [submission, setSubmission] = useState<GradeSubmission | null>(null)
  const [stats, setStats] = useState<GradeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const loadSubmissionDetail = async () => {
      try {
        setLoading(true)

        // Load submission details
        const detailResult = await getStudentGradeDetailAction(submissionId)
        if (detailResult.success) {
          setSubmission(detailResult.data as GradeSubmission)

          // Load statistics
          const statsResult = await getStudentGradeStatsAction(submissionId)
          if (statsResult.success) {
            setStats(statsResult.data as GradeStats)
          }
        } else {
          toast.error(detailResult.error || "Không thể tải chi tiết bảng điểm")
        }
      } catch {
        toast.error("Có lỗi xảy ra khi tải chi tiết bảng điểm")
      } finally {
        setLoading(false)
      }
    }

    loadSubmissionDetail()
  }, [submissionId])

  const handleDownloadExcel = async () => {
    if (!submission) return

    setDownloading(true)
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

      // Create and download Excel file
      const excelBuffer = await createIndividualGradeTemplate(exportData)
      await downloadExcelFile(excelBuffer, `BangDiem_${submission.student.student_id}_${submission.semester.name}`)

      toast.success("Đã tải xuống file Excel thành công!")
    } catch {
      toast.error("Không thể tải xuống file Excel")
    } finally {
      setDownloading(false)
    }
  }

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-400'
    if (grade >= 8.5) return 'text-green-600'
    if (grade >= 7.0) return 'text-blue-600'
    if (grade >= 5.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeBadge = (grade: number | null) => {
    if (grade === null) return <Badge variant="secondary">Chưa có</Badge>
    if (grade >= 8.5) return <Badge className="bg-green-100 text-green-800">Giỏi</Badge>
    if (grade >= 7.0) return <Badge className="bg-blue-100 text-blue-800">Khá</Badge>
    if (grade >= 5.0) return <Badge className="bg-yellow-100 text-yellow-800">Trung bình</Badge>
    return <Badge className="bg-red-100 text-red-800">Yếu</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2 text-muted-foreground">Đang tải chi tiết...</span>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Không tìm thấy bảng điểm</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{submission.student.full_name}</CardTitle>
                <CardDescription className="text-lg">
                  {submission.student.student_id} • Lớp {submission.class.name}
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={handleDownloadExcel}
              disabled={downloading}
              className="flex items-center gap-2"
            >
              {downloading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang tải...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Tải Excel
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Kỳ học</p>
                <p className="font-medium">{submission.semester.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Năm học</p>
                <p className="font-medium">{submission.academic_year.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">GVCN</p>
                <p className="font-medium">{submission.class.homeroom_teacher.full_name}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.averageGrade?.toFixed(1) || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Điểm trung bình</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.highestGrade?.toFixed(1) || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Điểm cao nhất</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.lowestGrade?.toFixed(1) || 'N/A'}</p>
                  <p className="text-sm text-gray-500">Điểm thấp nhất</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.excellentCount}</p>
                  <p className="text-sm text-gray-500">Môn giỏi</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bảng điểm chi tiết</CardTitle>
          <CardDescription>
            Điểm số các môn học trong kỳ {submission.semester.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Môn học</th>
                  <th className="text-center py-3 px-4 font-medium">Điểm miệng</th>
                  <th className="text-center py-3 px-4 font-medium">Điểm giữa kỳ</th>
                  <th className="text-center py-3 px-4 font-medium">Điểm cuối kỳ</th>
                  <th className="text-center py-3 px-4 font-medium">TBM</th>
                  <th className="text-center py-3 px-4 font-medium">Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {submission.grades.map((grade) => (
                  <tr key={grade.subject_id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{grade.subject.name_vietnamese}</p>
                        <p className="text-sm text-gray-500">{grade.subject.code}</p>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="font-medium">
                        {grade.regular_grades && grade.regular_grades.length > 0
                          ? grade.regular_grades.map(g => g.toFixed(1)).join(', ')
                          : '--'
                        }
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-medium ${getGradeColor(grade.midterm_grade)}`}>
                        {grade.midterm_grade?.toFixed(1) || '--'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-medium ${getGradeColor(grade.final_grade)}`}>
                        {grade.final_grade?.toFixed(1) || '--'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-bold text-lg ${getGradeColor(grade.average_grade)}`}>
                        {grade.average_grade?.toFixed(1) || '--'}
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">
                      {getGradeBadge(grade.average_grade)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* AI Feedback */}
      {submission.ai_feedback && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Nhận xét từ Giáo viên Chủ nhiệm</CardTitle>
                <CardDescription>
                  {submission.class.homeroom_teacher.full_name} • {new Date(submission.ai_feedback.created_at).toLocaleDateString('vi-VN')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
              <p className="text-gray-800 leading-relaxed">{submission.ai_feedback.text}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teacher Notes */}
      {submission.teacher_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Ghi chú từ giáo viên</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 border rounded-lg p-4">
              <p className="text-gray-800">{submission.teacher_notes}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
