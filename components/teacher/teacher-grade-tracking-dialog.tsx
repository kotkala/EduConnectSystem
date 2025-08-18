"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  TrendingUp,
  Eye,
  Download,
  RefreshCw
} from "lucide-react"

interface GradeTrackingData {
  id: string
  studentId: string
  studentName: string
  regularGrades: (number | null)[]
  midtermGrade?: number | null
  finalGrade?: number | null
  summaryGrade?: number | null
  notes?: string
  lastModified: string
  modifiedBy: string
}

interface GradeTrackingStatistics {
  totalStudents: number
  studentsWithGrades: number
  studentsWithoutGrades: number
  totalGrades: number
  validGrades: number
  missingGrades: number
  averageGrade: number | null
  gradeDistribution: {
    excellent: number // >= 8
    good: number      // 6.5-7.9
    average: number   // 5-6.4
    belowAverage: number // < 5
  }
}

interface TeacherGradeTrackingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  periodId: string
  classId: string
  subjectId: string
  className: string
  subjectName: string
  periodName: string
}

export function TeacherGradeTrackingDialog({
  open,
  onOpenChange,
  periodId,
  classId,
  subjectId,
  className,
  subjectName,
  periodName
}: TeacherGradeTrackingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GradeTrackingData[]>([])
  const [statistics, setStatistics] = useState<GradeTrackingStatistics | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  const loadGradeData = async () => {
    if (!periodId || !classId || !subjectId) return

    setLoading(true)
    setError(null)

    try {
      // TODO: Implement actual API call to get grade tracking data
      // This would call an action like getGradeTrackingDataAction
      
      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockData: GradeTrackingData[] = [
        {
          id: '1',
          studentId: 'HS001',
          studentName: 'Nguyễn Văn A',
          regularGrades: [8.5, 7.0, null, 9.0],
          midtermGrade: 8.0,
          finalGrade: null,
          summaryGrade: null,
          notes: 'Học sinh chăm chỉ',
          lastModified: new Date().toISOString(),
          modifiedBy: 'Giáo viên Toán'
        },
        {
          id: '2',
          studentId: 'HS002',
          studentName: 'Trần Thị B',
          regularGrades: [9.0, 8.5, 7.5, 8.0],
          midtermGrade: 8.5,
          finalGrade: 9.0,
          summaryGrade: 8.7,
          notes: '',
          lastModified: new Date().toISOString(),
          modifiedBy: 'Giáo viên Toán'
        },
        {
          id: '3',
          studentId: 'HS003',
          studentName: 'Lê Văn C',
          regularGrades: [null, null, null, null],
          midtermGrade: null,
          finalGrade: null,
          summaryGrade: null,
          notes: '',
          lastModified: new Date().toISOString(),
          modifiedBy: 'Giáo viên Toán'
        }
      ]

      setData(mockData)

      // Calculate statistics
      const stats = calculateStatistics(mockData)
      setStatistics(stats)

    } catch (error) {
      console.error('Error loading grade data:', error)
      setError('Không thể tải dữ liệu điểm số')
    } finally {
      setLoading(false)
    }
  }

  const calculateStatistics = (gradeData: GradeTrackingData[]): GradeTrackingStatistics => {
    const totalStudents = gradeData.length
    let studentsWithGrades = 0
    let totalGrades = 0
    let validGrades = 0
    let missingGrades = 0
    const allGrades: number[] = []
    
    const gradeDistribution = {
      excellent: 0,
      good: 0,
      average: 0,
      belowAverage: 0
    }

    gradeData.forEach(student => {
      let hasAnyGrade = false
      
      // Count regular grades
      student.regularGrades.forEach(grade => {
        totalGrades++
        if (grade !== null) {
          validGrades++
          allGrades.push(grade)
          hasAnyGrade = true
        } else {
          missingGrades++
        }
      })
      
      // Count other grades
      if (student.midtermGrade !== null && student.midtermGrade !== undefined) {
        totalGrades++
        validGrades++
        allGrades.push(student.midtermGrade)
        hasAnyGrade = true
      } else {
        totalGrades++
        missingGrades++
      }
      
      if (student.finalGrade !== null && student.finalGrade !== undefined) {
        totalGrades++
        validGrades++
        allGrades.push(student.finalGrade)
        hasAnyGrade = true
      } else {
        totalGrades++
        missingGrades++
      }
      
      if (student.summaryGrade !== null && student.summaryGrade !== undefined) {
        totalGrades++
        validGrades++
        allGrades.push(student.summaryGrade)
        hasAnyGrade = true
      } else {
        totalGrades++
        missingGrades++
      }
      
      if (hasAnyGrade) {
        studentsWithGrades++
      }
      
      // Calculate grade distribution based on summary grade or average
      const representativeGrade = student.summaryGrade || 
        (student.regularGrades.filter(g => g !== null).length > 0 
          ? student.regularGrades.filter(g => g !== null).reduce((sum, g) => sum + g!, 0) / student.regularGrades.filter(g => g !== null).length
          : null)
      
      if (representativeGrade !== null) {
        if (representativeGrade >= 8) gradeDistribution.excellent++
        else if (representativeGrade >= 6.5) gradeDistribution.good++
        else if (representativeGrade >= 5) gradeDistribution.average++
        else gradeDistribution.belowAverage++
      }
    })

    const averageGrade = allGrades.length > 0 
      ? Math.round((allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length) * 10) / 10
      : null

    return {
      totalStudents,
      studentsWithGrades,
      studentsWithoutGrades: totalStudents - studentsWithGrades,
      totalGrades,
      validGrades,
      missingGrades,
      averageGrade,
      gradeDistribution
    }
  }

  const getGradeStatusBadge = (grade: number | null | undefined) => {
    if (grade === null || grade === undefined) {
      return <Badge variant="outline" className="text-gray-500">Chưa có</Badge>
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

  const exportGradeData = () => {
    // TODO: Implement export functionality
    console.log('Exporting grade data...')
  }

  useEffect(() => {
    if (open) {
      loadGradeData()
    }
  }, [open, periodId, classId, subjectId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Theo dõi điểm số - {className} - {subjectName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Kỳ: {periodName}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={loadGradeData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
            <Button variant="outline" onClick={exportGradeData}>
              <Download className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Đang tải dữ liệu điểm số...</p>
              </div>
            </div>
          )}

          {/* Content */}
          {!loading && !error && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Tổng quan</TabsTrigger>
                <TabsTrigger value="details">Chi tiết</TabsTrigger>
                <TabsTrigger value="statistics">Thống kê</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {statistics && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng học sinh</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{statistics.totalStudents}</div>
                        <p className="text-xs text-muted-foreground">
                          {statistics.studentsWithGrades} có điểm, {statistics.studentsWithoutGrades} chưa có
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Điểm hợp lệ</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">{statistics.validGrades}</div>
                        <p className="text-xs text-muted-foreground">
                          /{statistics.totalGrades} tổng điểm
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Điểm thiếu</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-600">{statistics.missingGrades}</div>
                        <p className="text-xs text-muted-foreground">
                          {Math.round((statistics.missingGrades / statistics.totalGrades) * 100)}% tổng điểm
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {statistics.averageGrade !== null ? statistics.averageGrade : 'N/A'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Trên {statistics.validGrades} điểm
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Progress Overview */}
                {statistics && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tiến độ nhập điểm</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Điểm đã nhập</span>
                          <span>{statistics.validGrades}/{statistics.totalGrades}</span>
                        </div>
                        <Progress 
                          value={(statistics.validGrades / statistics.totalGrades) * 100} 
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          {Math.round((statistics.validGrades / statistics.totalGrades) * 100)}% hoàn thành
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="border rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">STT</th>
                          <th className="text-left p-3 font-medium">Mã HS</th>
                          <th className="text-left p-3 font-medium">Họ và tên</th>
                          <th className="text-left p-3 font-medium">TX1</th>
                          <th className="text-left p-3 font-medium">TX2</th>
                          <th className="text-left p-3 font-medium">TX3</th>
                          <th className="text-left p-3 font-medium">TX4</th>
                          <th className="text-left p-3 font-medium">Giữa kì</th>
                          <th className="text-left p-3 font-medium">Cuối kì</th>
                          <th className="text-left p-3 font-medium">Tổng kết</th>
                          <th className="text-left p-3 font-medium">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((student, index) => (
                          <tr key={student.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">{index + 1}</td>
                            <td className="p-3 font-mono">{student.studentId}</td>
                            <td className="p-3 font-medium">{student.studentName}</td>
                            {student.regularGrades.map((grade, gradeIndex) => (
                              <td key={gradeIndex} className="p-3">
                                {getGradeStatusBadge(grade)}
                              </td>
                            ))}
                            <td className="p-3">{getGradeStatusBadge(student.midtermGrade)}</td>
                            <td className="p-3">{getGradeStatusBadge(student.finalGrade)}</td>
                            <td className="p-3">{getGradeStatusBadge(student.summaryGrade)}</td>
                            <td className="p-3 text-sm text-muted-foreground max-w-32 truncate">
                              {student.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="statistics" className="space-y-4">
                {statistics && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Phân bố điểm số</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Xuất sắc (≥8.0)</span>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {statistics.gradeDistribution.excellent}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Khá (6.5-7.9)</span>
                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                            {statistics.gradeDistribution.good}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Trung bình (5.0-6.4)</span>
                          <Badge variant="default" className="bg-yellow-100 text-yellow-800">
                            {statistics.gradeDistribution.average}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Yếu (&lt;5.0)</span>
                          <Badge variant="destructive">
                            {statistics.gradeDistribution.belowAverage}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Thống kê chi tiết</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tỷ lệ hoàn thành</span>
                          <span className="font-medium">
                            {Math.round((statistics.validGrades / statistics.totalGrades) * 100)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Học sinh có điểm</span>
                          <span className="font-medium">
                            {statistics.studentsWithGrades}/{statistics.totalStudents}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Điểm trung bình lớp</span>
                          <span className="font-medium">
                            {statistics.averageGrade !== null ? statistics.averageGrade : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tổng số điểm</span>
                          <span className="font-medium">{statistics.totalGrades}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
