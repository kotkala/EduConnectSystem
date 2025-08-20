'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePageTransition } from '@/shared/components/ui/global-loading-provider'
import { useCoordinatedLoading } from '@/hooks/use-coordinated-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/shared/components/ui/tabs'
import {
  Award,
  BookOpen,
  BarChart3,
  Calendar,
  User,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { getStudentGradesAction, getStudentGradeSummaryAction } from '@/lib/actions/student-timetable-actions'

interface Grade {
  id: string
  grade_value: number
  component_type: string
  notes?: string
  created_at: string
  subject: {
    id: string
    name_vietnamese: string
    code: string
    category: string
  }
  class: {
    id: string
    name: string
  }
  period: {
    id: string
    name: string
    start_date: string
    end_date: string
  }
}

interface GradeSummary {
  subject: {
    id: string
    name_vietnamese: string
    code: string
    category: string
  }
  period: {
    id: string
    name: string
    start_date: string
    end_date: string
  }
  grades: Array<{
    value: number
    type: string
    weight: number
  }>
  average: number
}

export function StudentGradesClient() {
  // 🚀 COORDINATED LOADING: Replace scattered loading with coordinated system
  const { startPageTransition, stopLoading } = usePageTransition()
  const coordinatedLoading = useCoordinatedLoading()

  // State management
  const [grades, setGrades] = useState<Grade[]>([])
  const [gradeSummary, setGradeSummary] = useState<GradeSummary[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')

  // Load student grades
  const loadStudentGrades = useCallback(async () => {
    try {
      // 🎯 UX IMPROVEMENT: Use global loading for initial load
      const isInitialLoad = grades.length === 0
      
      if (isInitialLoad) {
        startPageTransition("Đang tải bảng điểm...")
      }

      const [gradesResult, summaryResult] = await Promise.all([
        getStudentGradesAction(),
        getStudentGradeSummaryAction()
      ])

      if (gradesResult.success && gradesResult.data) {
        setGrades(gradesResult.data as unknown as Grade[])
      } else {
        toast.error(gradesResult.error || 'Không thể tải bảng điểm')
      }

      if (summaryResult.success && summaryResult.data) {
        setGradeSummary(summaryResult.data)
      } else {
        toast.error(summaryResult.error || 'Không thể tải tổng hợp điểm')
      }
    } catch (error) {
      console.error('Error loading student grades:', error)
      toast.error('Lỗi khi tải bảng điểm')
    } finally {
      stopLoading()
    }
  }, [grades.length, startPageTransition, stopLoading])

  // Initial data loading
  useEffect(() => {
    loadStudentGrades()
  }, [loadStudentGrades])

  // Get unique periods and subjects for filtering
  const { periods, subjects } = useMemo(() => {
    const periodsSet = new Set<string>()
    const subjectsSet = new Set<string>()
    
    grades.forEach(grade => {
      periodsSet.add(JSON.stringify({
        id: grade.period.id,
        name: grade.period.name
      }))
      subjectsSet.add(JSON.stringify({
        id: grade.subject.id,
        name: grade.subject.name_vietnamese,
        code: grade.subject.code
      }))
    })

    return {
      periods: Array.from(periodsSet).map(p => JSON.parse(p)),
      subjects: Array.from(subjectsSet).map(s => JSON.parse(s))
    }
  }, [grades])

  // Filter grades based on selected period and subject
  const filteredGrades = useMemo(() => {
    return grades.filter(grade => {
      const periodMatch = selectedPeriod === 'all' || grade.period.id === selectedPeriod
      const subjectMatch = selectedSubject === 'all' || grade.subject.id === selectedSubject
      return periodMatch && subjectMatch
    })
  }, [grades, selectedPeriod, selectedSubject])

  // Filter grade summary
  const filteredGradeSummary = useMemo(() => {
    return gradeSummary.filter(summary => {
      const periodMatch = selectedPeriod === 'all' || summary.period.id === selectedPeriod
      const subjectMatch = selectedSubject === 'all' || summary.subject.id === selectedSubject
      return periodMatch && subjectMatch
    })
  }, [gradeSummary, selectedPeriod, selectedSubject])

  // Calculate overall statistics
  const statistics = useMemo(() => {
    if (filteredGradeSummary.length === 0) {
      return {
        totalSubjects: 0,
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0,
        excellentCount: 0,
        goodCount: 0,
        averageCount: 0,
        belowAverageCount: 0
      }
    }

    const averages = filteredGradeSummary.map(s => s.average).filter(avg => avg > 0)
    const totalSubjects = averages.length
    const overallAverage = totalSubjects > 0 ? averages.reduce((sum, avg) => sum + avg, 0) / totalSubjects : 0
    
    return {
      totalSubjects,
      averageGrade: overallAverage,
      highestGrade: totalSubjects > 0 ? Math.max(...averages) : 0,
      lowestGrade: totalSubjects > 0 ? Math.min(...averages) : 0,
      excellentCount: averages.filter(avg => avg >= 8.5).length,
      goodCount: averages.filter(avg => avg >= 7.0 && avg < 8.5).length,
      averageCount: averages.filter(avg => avg >= 5.0 && avg < 7.0).length,
      belowAverageCount: averages.filter(avg => avg < 5.0).length
    }
  }, [filteredGradeSummary])

  // Grade type badge component
  const GradeTypeBadge = useMemo(() => {
    const GradeTypeBadgeComponent = ({ type }: { type: string }) => {
      const getVariant = (type: string) => {
        switch (type.toLowerCase()) {
          case 'midterm':
          case 'giữa kỳ':
            return 'default' as const
          case 'final':
          case 'cuối kỳ':
            return 'destructive' as const
          case 'quiz':
          case 'kiểm tra':
            return 'secondary' as const
          default:
            return 'outline' as const
        }
      }

      return (
        <Badge variant={getVariant(type)} className="text-xs">
          {type}
        </Badge>
      )
    }
    GradeTypeBadgeComponent.displayName = 'GradeTypeBadge'
    return GradeTypeBadgeComponent
  }, [])

  // Grade value component with color coding
  const GradeValue = useMemo(() => {
    const GradeValueComponent = ({ value }: { value: number }) => {
      const getColor = (grade: number) => {
        if (grade >= 8.5) return 'text-green-600 font-semibold'
        if (grade >= 7.0) return 'text-blue-600 font-semibold'
        if (grade >= 5.0) return 'text-yellow-600 font-semibold'
        return 'text-red-600 font-semibold'
      }

      const getIcon = (grade: number) => {
        if (grade >= 7.0) return <TrendingUp className="h-3 w-3" />
        if (grade >= 5.0) return <Minus className="h-3 w-3" />
        return <TrendingDown className="h-3 w-3" />
      }

      return (
        <div className={`flex items-center gap-1 ${getColor(value)}`}>
          {getIcon(value)}
          <span>{value.toFixed(1)}</span>
        </div>
      )
    }
    GradeValueComponent.displayName = 'GradeValue'
    return GradeValueComponent
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6" />
            Bảng điểm cá nhân
          </h1>
          <p className="text-muted-foreground">
            Xem bảng điểm và thống kê học tập của bạn
          </p>
        </div>
        <Button onClick={loadStudentGrades} disabled={coordinatedLoading.isLoading}>
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Kỳ báo cáo điểm</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn kỳ báo cáo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kỳ</SelectItem>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Môn học</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn môn học" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả môn</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{statistics.totalSubjects}</div>
                <div className="text-sm text-muted-foreground">Tổng môn học</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{statistics.averageGrade.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Điểm trung bình</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <div>
                <div className="text-2xl font-bold">{statistics.highestGrade.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Điểm cao nhất</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{statistics.lowestGrade > 0 ? statistics.lowestGrade.toFixed(1) : 'N/A'}</div>
                <div className="text-sm text-muted-foreground">Điểm thấp nhất</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Phân bố điểm số
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{statistics.excellentCount}</div>
              <div className="text-sm text-green-700">Xuất sắc (≥8.5)</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{statistics.goodCount}</div>
              <div className="text-sm text-blue-700">Khá (7.0-8.4)</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{statistics.averageCount}</div>
              <div className="text-sm text-yellow-700">Trung bình (5.0-6.9)</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{statistics.belowAverageCount}</div>
              <div className="text-sm text-red-700">Yếu (&lt;5.0)</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Data */}
      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList>
          <TabsTrigger value="summary">Tổng hợp điểm</TabsTrigger>
          <TabsTrigger value="detailed">Chi tiết điểm</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Tổng hợp điểm theo môn học</CardTitle>
              <CardDescription>
                Điểm trung bình của từng môn học theo kỳ báo cáo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coordinatedLoading.isLoading && gradeSummary.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Đang tải tổng hợp điểm...</p>
                  </div>
                </div>
              ) : filteredGradeSummary.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có dữ liệu điểm số</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Môn học</TableHead>
                      <TableHead>Kỳ báo cáo</TableHead>
                      <TableHead>Số điểm</TableHead>
                      <TableHead>Điểm trung bình</TableHead>
                      <TableHead>Xếp loại</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGradeSummary.map((summary, index) => {
                      const classification = summary.average >= 8.5 ? 'Xuất sắc' :
                                           summary.average >= 7.0 ? 'Khá' :
                                           summary.average >= 5.0 ? 'Trung bình' : 'Yếu'
                      
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{summary.subject.name_vietnamese}</div>
                              <div className="text-sm text-muted-foreground">{summary.subject.code}</div>
                            </div>
                          </TableCell>
                          <TableCell>{summary.period.name}</TableCell>
                          <TableCell>{summary.grades.length}</TableCell>
                          <TableCell>
                            <GradeValue value={summary.average} />
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              classification === 'Xuất sắc' ? 'default' :
                              classification === 'Khá' ? 'secondary' :
                              classification === 'Trung bình' ? 'outline' : 'destructive'
                            }>
                              {classification}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết điểm số</CardTitle>
              <CardDescription>
                Tất cả điểm số chi tiết theo từng bài kiểm tra
              </CardDescription>
            </CardHeader>
            <CardContent>
              {coordinatedLoading.isLoading && grades.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Đang tải chi tiết điểm...</p>
                  </div>
                </div>
              ) : filteredGrades.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Không có dữ liệu điểm số</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Môn học</TableHead>
                      <TableHead>Loại điểm</TableHead>
                      <TableHead>Điểm số</TableHead>
                      <TableHead>Giáo viên</TableHead>
                      <TableHead>Ngày nhập</TableHead>
                      <TableHead>Ghi chú</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrades.map((grade) => (
                      <TableRow key={grade.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{grade.subject.name_vietnamese}</div>
                            <div className="text-sm text-muted-foreground">{grade.subject.code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <GradeTypeBadge type={grade.component_type} />
                        </TableCell>
                        <TableCell>
                          <GradeValue value={grade.grade_value} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">Chưa có thông tin</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {format(new Date(grade.created_at), 'dd/MM/yyyy', { locale: vi })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {grade.notes || 'Không có ghi chú'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
