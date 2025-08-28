'use client'

import { Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import {
  Users,
  AlertTriangle,
  Edit
} from "lucide-react"
import { getGradeOverviewAction } from "@/lib/actions/teacher-grade-import-actions"




interface PendingGradeStatus {
  componentType: string
  oldValue: number
  newValue: number
  reason: string
  requestedAt: string
}

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
  pendingGrades?: PendingGradeStatus[]
}



interface TeacherGradeOverviewProps {
  readonly periodId: string
  readonly classId: string
  readonly subjectId: string
  readonly onImportClick: () => void
  readonly onGradeDataChange?: (grades: StudentGrade[]) => void
}

export function TeacherGradeOverview({
  periodId,
  classId,
  subjectId,
  onImportClick,
  onGradeDataChange
}: TeacherGradeOverviewProps) {
  const [loading, setLoading] = useState(false)
  const [grades, setGrades] = useState<StudentGrade[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadGradeData = useCallback(async () => {
    if (!periodId || !classId || !subjectId) return

    setLoading(true)
    setError(null)

    try {
      // Get grade data from API
      const result = await getGradeOverviewAction(periodId, classId, subjectId)

      if (result.success && result.data) {
        setGrades(result.data)
        // Note: onGradeDataChange is now handled in separate useEffect to prevent circular dependency
      } else {
        setError(result.error || 'Không thể tải dữ liệu điểm số')
      }

    } catch (error) {
      console.error('Error loading grade data:', error)
      setError('Không thể tải dữ liệu điểm số')
    } finally {
      setLoading(false)
    }
  }, [periodId, classId, subjectId]) // Remove onGradeDataChange from dependencies

  // Vietnamese grade calculation formula - memoized for performance
  const calculateSubjectAverage = useCallback((student: StudentGrade): number | null => {
    const regularGrades = student.regularGrades.filter((g): g is number => g !== null)
    const midtermGrade = student.midtermGrade
    const finalGrade = student.finalGrade

    // Need at least midterm and final grades for calculation
    if (midtermGrade === null || midtermGrade === undefined ||
        finalGrade === null || finalGrade === undefined) {
      return null
    }

    // Vietnamese formula: ĐTBmhk = (Tổng điểm thường xuyên + 2 x Điểm giữa kỳ + 3 x Điểm cuối kỳ) / (Số bài thường xuyên + 5)
    const regularSum = regularGrades.reduce((sum, grade) => sum + grade, 0)
    const regularCount = regularGrades.length
    const totalScore = regularSum + (2 * midtermGrade) + (3 * finalGrade)
    const totalWeight = regularCount + 5

    return Math.round((totalScore / totalWeight) * 10) / 10
  }, [])




  useEffect(() => {
    if (periodId && classId && subjectId) {
      loadGradeData()
    }
  }, [periodId, classId, subjectId, loadGradeData])

  // Separate effect for grade data change callback to prevent circular dependency
  useEffect(() => {
    if (grades.length > 0 && onGradeDataChange) {
      onGradeDataChange(grades)
    }
  }, [grades, onGradeDataChange])

  if (!periodId || !classId || !subjectId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Users className="mx-auto h-12 md:h-14 lg:h-16 w-12 mb-4 opacity-50" />
            <p>Vui lòng chọn kỳ báo cáo, lớp học và môn học để xem điểm số</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Grade Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bảng điểm chi tiết</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadGradeData}
                disabled={loading}
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                Làm mới
              </Button>
              <Button variant="outline" size="sm" onClick={onImportClick}>
                <Edit className="mr-2 h-4 w-4" />
                Nhập điểm
              </Button>
            </div>
          </CardTitle>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">Cách tính điểm trung bình môn học kỳ:</p>
            <p className="text-xs text-blue-700">
              ĐTBmhk = (Tổng điểm thường xuyên + 2 × Điểm giữa kỳ + 3 × Điểm cuối kỳ) / (Số bài thường xuyên + 5)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Điểm thường xuyên (hệ số 1) • Điểm giữa kỳ (hệ số 2) • Điểm cuối kỳ (hệ số 3)
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p>Đang tải dữ liệu điểm số...</p>
              </div>
            </div>
          ) : grades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-blue-600 text-white">
                  <tr>
                    <th className="text-center p-3 font-medium border-r border-blue-500">STT</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Mã học sinh</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Họ và tên</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Điểm thường xuyên 1</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Điểm thường xuyên 2</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Điểm thường xuyên 3</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Điểm thường xuyên 4</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Điểm giữa kì</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Điểm cuối kì</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Điểm tổng kết học kì</th>
                    <th className="text-center p-3 font-medium">Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((student, index) => {
                    const calculatedAverage = student.summaryGrade || calculateSubjectAverage(student)

                    return (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-center font-medium border-r border-gray-200">{index + 1}</td>
                        <td className="p-3 text-center font-medium border-r border-gray-200">{student.studentId}</td>
                        <td className="p-3 font-medium border-r border-gray-200">{student.studentName}</td>
                        {student.regularGrades.map((grade, gradeIndex) => (
                          <td key={gradeIndex} className="p-3 text-center border-r border-gray-200">
                            <span className={`text-lg font-medium ${
                              grade !== null ? (
                                grade >= 8 ? 'text-green-600' :
                                grade >= 6.5 ? 'text-blue-600' :
                                grade >= 5 ? 'text-yellow-600' :
                                'text-red-600'
                              ) : 'text-gray-400'
                            }`}>
                              {grade !== null ? grade : '-'}
                            </span>
                          </td>
                        ))}
                        <td className="p-3 text-center border-r border-gray-200">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`text-lg font-medium ${
                              student.midtermGrade !== null && student.midtermGrade !== undefined ? (
                                student.midtermGrade >= 8 ? 'text-green-600' :
                                student.midtermGrade >= 6.5 ? 'text-blue-600' :
                                student.midtermGrade >= 5 ? 'text-yellow-600' :
                                'text-red-600'
                              ) : 'text-gray-400'
                            }`}>
                              {student.midtermGrade !== null && student.midtermGrade !== undefined ? student.midtermGrade : '-'}
                            </span>
                            {student.pendingGrades?.some(p => p.componentType === 'midterm') && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                                Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center border-r border-gray-200">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`text-lg font-medium ${
                              student.finalGrade !== null && student.finalGrade !== undefined ? (
                                student.finalGrade >= 8 ? 'text-green-600' :
                                student.finalGrade >= 6.5 ? 'text-blue-600' :
                                student.finalGrade >= 5 ? 'text-yellow-600' :
                                'text-red-600'
                              ) : 'text-gray-400'
                            }`}>
                              {student.finalGrade !== null && student.finalGrade !== undefined ? student.finalGrade : '-'}
                            </span>
                            {student.pendingGrades?.some(p => p.componentType === 'final') && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                                Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center border-r border-gray-200">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`text-lg font-bold ${
                              calculatedAverage !== null ? (
                                calculatedAverage >= 8 ? 'text-green-600' :
                                calculatedAverage >= 6.5 ? 'text-blue-600' :
                                calculatedAverage >= 5 ? 'text-yellow-600' :
                                'text-red-600'
                              ) : 'text-gray-400'
                            }`}>
                              {calculatedAverage !== null ? calculatedAverage : '-'}
                            </span>
                            {student.pendingGrades?.some(p => ['summary', 'semester_1', 'semester_2', 'yearly'].includes(p.componentType)) && (
                              <span className="text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                                Pending
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center text-sm text-gray-600">
                          {student.lastModified ? (
                            <div>{new Date(student.lastModified).toLocaleDateString('vi-VN')}</div>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 md:h-14 lg:h-16 w-12 mb-4 opacity-50" />
              <p>Chưa có dữ liệu điểm số</p>
              <Button variant="outline" className="mt-4" onClick={onImportClick}>
                <Edit className="mr-2 h-4 w-4" />
                Nhập điểm đầu tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
