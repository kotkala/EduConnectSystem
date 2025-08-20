"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Loader2, BookOpen, TrendingUp, Award, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import { getStudentGradeDetailAction, getStudentGradeStatsAction } from '@/lib/actions/parent-grade-actions'

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

interface ParentGradeViewDialogProps {
  readonly submission: GradeSubmission | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function ParentGradeViewDialog({
  submission,
  open,
  onOpenChange
}: ParentGradeViewDialogProps) {
  const [detailedSubmission, setDetailedSubmission] = useState<GradeSubmission | null>(null)
  const [gradeStats, setGradeStats] = useState<GradeStats | null>(null)
  const [loading, setLoading] = useState(false)

  const loadSubmissionDetails = useCallback(async () => {
    if (!submission) return

    setLoading(true)
    try {
      const [detailResult, statsResult] = await Promise.all([
        getStudentGradeDetailAction(submission.id),
        getStudentGradeStatsAction(submission.id)
      ])

      if (detailResult.success && detailResult.data) {
        setDetailedSubmission(detailResult.data as GradeSubmission)
      } else {
        toast.error(detailResult.error || "Không thể tải chi tiết bảng điểm")
      }

      if (statsResult.success && statsResult.data) {
        setGradeStats(statsResult.data as GradeStats)
      }
    } catch (error) {
      console.error('Error loading submission details:', error)
      toast.error("Có lỗi xảy ra khi tải chi tiết bảng điểm")
    } finally {
      setLoading(false)
    }
  }, [submission])

  useEffect(() => {
    if (open && submission) {
      loadSubmissionDetails()
    }
  }, [open, submission, loadSubmissionDetails])

  const getGradeColor = (grade: number | null) => {
    if (!grade) return 'text-gray-400'
    if (grade >= 8.5) return 'text-green-600 font-semibold'
    if (grade >= 6.5) return 'text-blue-600'
    if (grade >= 5.0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeLabel = (grade: number | null) => {
    if (!grade) return 'Chưa có'
    if (grade >= 8.5) return 'Giỏi'
    if (grade >= 6.5) return 'Khá'
    if (grade >= 5.0) return 'Trung bình'
    return 'Yếu'
  }

  const formatGrade = (grade: number | null) => {
    return grade ? grade.toFixed(1) : '-'
  }

  if (!submission) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Bảng Điểm - {submission.student.full_name}
          </DialogTitle>
          <DialogDescription>
            {submission.class.name} â€¢ {submission.semester.name} - {submission.academic_year.name}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Đang tải chi tiết bảng điểm...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Grade Statistics */}
            {gradeStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Điểm TB
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {gradeStats.averageGrade ? gradeStats.averageGrade.toFixed(1) : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {gradeStats.gradedSubjects}/{gradeStats.totalSubjects} môn
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Cao nhất
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {gradeStats.highestGrade ? gradeStats.highestGrade.toFixed(1) : 'N/A'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Giỏi/Khá
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {gradeStats.excellentCount + gradeStats.goodCount}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {gradeStats.excellentCount} giỏi, {gradeStats.goodCount} khá
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Xếp loại</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant={gradeStats.averageGrade && gradeStats.averageGrade >= 8.5 ? "default" : "secondary"}>
                      {gradeStats.averageGrade ? getGradeLabel(gradeStats.averageGrade) : 'Chưa đủ dữ liệu'}
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Grades Table */}
            <Card>
              <CardHeader>
                <CardTitle>Chi Tiết Điểm Số</CardTitle>
                <CardDescription>
                  Bảng điểm chi tiết theo từng môn học
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Môn học</TableHead>
                        <TableHead className="text-center">Mã môn</TableHead>
                        <TableHead className="text-center">Điểm giữa kỳ</TableHead>
                        <TableHead className="text-center">Điểm cuối kỳ</TableHead>
                        <TableHead className="text-center">Điểm trung bình</TableHead>
                        <TableHead className="text-center">Xếp loại</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(detailedSubmission || submission).grades.map((grade) => (
                        <TableRow key={grade.subject.id}>
                          <TableCell className="font-medium">
                            {grade.subject.name_vietnamese}
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">
                            {grade.subject.code}
                          </TableCell>
                          <TableCell className={`text-center ${getGradeColor(grade.midterm_grade)}`}>
                            {formatGrade(grade.midterm_grade)}
                          </TableCell>
                          <TableCell className={`text-center ${getGradeColor(grade.final_grade)}`}>
                            {formatGrade(grade.final_grade)}
                          </TableCell>
                          <TableCell className={`text-center ${getGradeColor(grade.average_grade)}`}>
                            {formatGrade(grade.average_grade)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={grade.average_grade && grade.average_grade >= 6.5 ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {getGradeLabel(grade.average_grade)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
