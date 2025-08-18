"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye,
  Edit
} from "lucide-react"
import { getGradeOverviewAction } from "@/lib/actions/teacher-grade-import-actions"

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

interface GradeOverviewStats {
  totalStudents: number
  studentsWithGrades: number
  completionRate: number
  averageGrade: number | null
  gradeDistribution: {
    excellent: number
    good: number
    average: number
    poor: number
  }
}

interface TeacherGradeOverviewProps {
  periodId: string
  classId: string
  subjectId: string
  className: string
  subjectName: string
  periodName: string
  onTrackingClick: () => void
  onImportClick: () => void
}

export function TeacherGradeOverview({
  periodId,
  classId,
  subjectId,
  className,
  subjectName,
  periodName,
  onTrackingClick,
  onImportClick
}: TeacherGradeOverviewProps) {
  const [loading, setLoading] = useState(false)
  const [grades, setGrades] = useState<StudentGrade[]>([])
  const [stats, setStats] = useState<GradeOverviewStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadGradeData = async () => {
    if (!periodId || !classId || !subjectId) return

    setLoading(true)
    setError(null)

    try {
      // Get grade data from API
      const result = await getGradeOverviewAction(periodId, classId, subjectId)

      if (result.success && result.data) {
        setGrades(result.data)

        // Calculate statistics
        const calculatedStats = calculateStats(result.data)
        setStats(calculatedStats)
      } else {
        setError(result.error || 'Không thể tải dữ liệu điểm số')
      }

    } catch (error) {
      console.error('Error loading grade data:', error)
      setError('Không thể tải dữ liệu điểm số')
    } finally {
      setLoading(false)
    }
  }

  // Vietnamese grade calculation formula
  const calculateSubjectAverage = (student: StudentGrade): number | null => {
    const regularGrades = student.regularGrades.filter(g => g !== null) as number[]
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
  }

  const calculateStats = (gradeData: StudentGrade[]): GradeOverviewStats => {
    const totalStudents = gradeData.length
    let studentsWithGrades = 0
    const allGrades: number[] = []

    const gradeDistribution = {
      excellent: 0, // >= 8
      good: 0,      // 6.5-7.9
      average: 0,   // 5-6.4
      poor: 0       // < 5
    }

    gradeData.forEach(student => {
      let hasAnyGrade = false

      // Check regular grades
      student.regularGrades.forEach(grade => {
        if (grade !== null) {
          allGrades.push(grade)
          hasAnyGrade = true
        }
      })

      // Check other grades
      if (student.midtermGrade !== null && student.midtermGrade !== undefined) {
        allGrades.push(student.midtermGrade)
        hasAnyGrade = true
      }

      if (student.finalGrade !== null && student.finalGrade !== undefined) {
        allGrades.push(student.finalGrade)
        hasAnyGrade = true
      }

      if (hasAnyGrade) {
        studentsWithGrades++
      }

      // Calculate grade distribution based on Vietnamese formula or summary grade
      const representativeGrade = student.summaryGrade || calculateSubjectAverage(student)

      if (representativeGrade !== null) {
        if (representativeGrade >= 8) gradeDistribution.excellent++
        else if (representativeGrade >= 6.5) gradeDistribution.good++
        else if (representativeGrade >= 5) gradeDistribution.average++
        else gradeDistribution.poor++
      }
    })

    const completionRate = totalStudents > 0 ? (studentsWithGrades / totalStudents) * 100 : 0
    const averageGrade = allGrades.length > 0
      ? Math.round((allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length) * 10) / 10
      : null

    return {
      totalStudents,
      studentsWithGrades,
      completionRate,
      averageGrade,
      gradeDistribution
    }
  }

  const getGradeStatusBadge = (grade: number | null | undefined) => {
    if (grade === null || grade === undefined) {
      return <Badge variant="outline" className="text-gray-500">-</Badge>
    }
    
    if (grade >= 8) {
      return <Badge variant="default" className="bg-green-100 text-green-800">{grade}</Badge>
    } else if (grade >= 6.5) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">{grade}</Badge>
    } else if (grade >= 5) {
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">{grade}</Badge>
    } else {
      return <Badge variant="destructive">{grade}</Badge>
    }
  }

  const exportGrades = () => {
    // TODO: Implement export functionality
    console.log('Exporting grades...')
  }

  useEffect(() => {
    if (periodId && classId && subjectId) {
      loadGradeData()
    }
  }, [periodId, classId, subjectId])

  if (!periodId || !classId || !subjectId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Vui lòng chọn kỳ báo cáo, lớp học và môn học để xem điểm số</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Tổng quan điểm số</h3>
          <p className="text-sm text-muted-foreground">
            {className} - {subjectName} - {periodName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadGradeData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
          <Button variant="outline" onClick={exportGrades}>
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
          <Button variant="outline" onClick={onTrackingClick}>
            <Eye className="mr-2 h-4 w-4" />
            Theo dõi chi tiết
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng học sinh</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.studentsWithGrades} có điểm
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tỷ lệ hoàn thành</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(stats.completionRate)}%</div>
              <Progress value={stats.completionRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageGrade !== null ? stats.averageGrade : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Trên {stats.studentsWithGrades} học sinh
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Phân bố điểm</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Xuất sắc</span>
                  <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                    {stats.gradeDistribution.excellent}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Khá</span>
                  <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                    {stats.gradeDistribution.good}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>TB</span>
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800 text-xs">
                    {stats.gradeDistribution.average}
                  </Badge>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Yếu</span>
                  <Badge variant="destructive" className="text-xs">
                    {stats.gradeDistribution.poor}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Grade Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bảng điểm chi tiết</span>
            <Button variant="outline" size="sm" onClick={onImportClick}>
              <Edit className="mr-2 h-4 w-4" />
              Nhập điểm
            </Button>
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
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Đang tải dữ liệu điểm số...</p>
              </div>
            </div>
          ) : grades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">STT</th>
                    <th className="text-left p-4 font-medium">Họ và tên</th>
                    <th className="text-left p-4 font-medium">TX1</th>
                    <th className="text-left p-4 font-medium">TX2</th>
                    <th className="text-left p-4 font-medium">TX3</th>
                    <th className="text-left p-4 font-medium">TX4</th>
                    <th className="text-left p-4 font-medium">Giữa kì</th>
                    <th className="text-left p-4 font-medium">Cuối kì</th>
                    <th className="text-left p-4 font-medium">Tổng kết</th>
                    <th className="text-left p-4 font-medium">Thời gian nhập</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((student, index) => {
                    // Calculate Vietnamese average if summary grade is not available
                    const calculatedAverage = student.summaryGrade || calculateSubjectAverage(student)

                    return (
                      <tr key={student.id} className="border-b hover:bg-muted/50">
                        <td className="p-4 text-lg font-medium">{index + 1}</td>
                        <td className="p-4 font-medium">{student.studentName}</td>
                        {student.regularGrades.map((grade, gradeIndex) => (
                          <td key={gradeIndex} className="p-4">
                            <div className="text-lg font-bold text-center min-w-[60px]">
                              {grade !== null ? (
                                <span className={`px-3 py-1 rounded-lg ${
                                  grade >= 8 ? 'bg-green-100 text-green-800' :
                                  grade >= 6.5 ? 'bg-blue-100 text-blue-800' :
                                  grade >= 5 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {grade}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                        ))}
                        <td className="p-4">
                          <div className="text-lg font-bold text-center min-w-[60px]">
                            {student.midtermGrade !== null && student.midtermGrade !== undefined ? (
                              <span className={`px-3 py-1 rounded-lg ${
                                student.midtermGrade >= 8 ? 'bg-green-100 text-green-800' :
                                student.midtermGrade >= 6.5 ? 'bg-blue-100 text-blue-800' :
                                student.midtermGrade >= 5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {student.midtermGrade}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-lg font-bold text-center min-w-[60px]">
                            {student.finalGrade !== null && student.finalGrade !== undefined ? (
                              <span className={`px-3 py-1 rounded-lg ${
                                student.finalGrade >= 8 ? 'bg-green-100 text-green-800' :
                                student.finalGrade >= 6.5 ? 'bg-blue-100 text-blue-800' :
                                student.finalGrade >= 5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {student.finalGrade}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-lg font-bold text-center min-w-[60px]">
                            {calculatedAverage !== null ? (
                              <span className={`px-3 py-1 rounded-lg font-bold ${
                                calculatedAverage >= 8 ? 'bg-green-100 text-green-800' :
                                calculatedAverage >= 6.5 ? 'bg-blue-100 text-blue-800' :
                                calculatedAverage >= 5 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {calculatedAverage}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {student.lastModified ? (
                            <div className="space-y-1">
                              <div className="font-medium">
                                {new Date(student.lastModified).toLocaleDateString('vi-VN')}
                              </div>
                              <div className="text-xs">
                                {new Date(student.lastModified).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="text-xs text-blue-600">
                                {student.modifiedBy || 'Hệ thống'}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Chưa nhập</span>
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
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
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
