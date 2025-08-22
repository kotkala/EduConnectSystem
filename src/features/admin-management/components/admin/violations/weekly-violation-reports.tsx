'use client'

import { useState, useEffect } from 'react'
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { CalendarDays, Users, AlertTriangle, Send, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { getWeeklyGroupedViolationsAction } from '@/features/violations/actions'
import { getSemestersAction } from '@/features/admin-management/actions/academic-actions'

interface WeeklyViolationReport {
  id: string
  student: {
    id: string
    full_name: string
    student_id: string
  }
  class: {
    id: string
    name: string
  }
  week_number: number
  week_start_date: string
  week_end_date: string
  total_violations: number
  total_points_deducted: number
  weekly_score: number
  violation_details: Array<{
    type: string
    points: number
    description: string
    date: string
  }>
  is_sent_to_teacher: boolean
  sent_at: string | null
}

export default function WeeklyViolationReports() {
  const [reports, setReports] = useState<WeeklyViolationReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSemester, setCurrentSemester] = useState<{ id: string; name: string; start_date: string } | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedClass, setSelectedClass] = useState('')
  const [isWeekInitialized, setIsWeekInitialized] = useState(false)


  function getCurrentWeek(): number {
    if (currentSemester?.start_date) {
      const semesterStart = new Date(currentSemester.start_date)
      const now = new Date()
      const diffTime = now.getTime() - semesterStart.getTime()
      const diffWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000))
      return Math.max(1, diffWeeks)
    }
    return 1
  }

  function getWeekDateRange(weekNumber: number): { start: Date; end: Date; label: string } {
    // Tính ngày bắt đầu và kết thúc của tuần dựa trên số tuần
    const semesterStart = currentSemester?.start_date ? new Date(currentSemester.start_date) : new Date('2024-01-01')
    const weekStart = addWeeks(startOfWeek(semesterStart, { weekStartsOn: 1 }), weekNumber - 1)
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

    const label = `Tuần ${weekNumber} (${format(weekStart, 'dd/MM', { locale: vi })} - ${format(weekEnd, 'dd/MM/yyyy', { locale: vi })})`

    return { start: weekStart, end: weekEnd, label }
  }

  function getWeekOptions(): Array<{ value: number; label: string }> {
    const currentWeek = getCurrentWeek()
    const options = []
    for (let i = 1; i <= Math.max(currentWeek, 20); i++) {
      const weekRange = getWeekDateRange(i)
      options.push({
        value: i,
        label: `${weekRange.label}${i === currentWeek ? ' - Hiện tại' : ''}`
      })
    }
    return options
  }

  const handlePreviousWeek = () => {
    if (selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1)
    }
  }

  const handleNextWeek = () => {
    const currentWeek = getCurrentWeek()
    if (selectedWeek < Math.max(currentWeek, 20)) {
      setSelectedWeek(selectedWeek + 1)
    }
  }

  useEffect(() => {
    loadCurrentSemester()
  }, [])

  // Khởi tạo tuần hiện tại một lần khi học kì sẵn sàng
  useEffect(() => {
    if (currentSemester?.start_date && !isWeekInitialized) {
      const semesterStart = new Date(currentSemester.start_date)
      const now = new Date()
      const diffTime = now.getTime() - semesterStart.getTime()
      const diffWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000))
      setSelectedWeek(Math.max(1, diffWeeks))
      setIsWeekInitialized(true)
    }
  }, [currentSemester, isWeekInitialized])


  // Chỉ load dữ liệu sau khi đã khởi tạo tuần hiện tại
  useEffect(() => {
    if (currentSemester && isWeekInitialized) {
      loadWeeklyReports()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSemester, isWeekInitialized, selectedWeek, selectedClass])

  const loadCurrentSemester = async () => {
    try {
      const result = await getSemestersAction()
      if (result.success && result.data) {
        const current = result.data.find(s => s.is_current)
        if (current) {
          setCurrentSemester({
            id: current.id,
            name: current.name,
            start_date: current.start_date
          })
        }
      }
    } catch (error) {
      console.error('Lỗi tải học kì hiện tại:', error)
    }
  }

  const loadWeeklyReports = async () => {
    if (!currentSemester) return

    setIsLoading(true)
    try {
      const result = await getWeeklyGroupedViolationsAction({
        semester_id: currentSemester.id,
        week_index: selectedWeek,
        class_id: selectedClass || undefined
      })

      if (result.success && result.data) {
        // Transform the grouped violations data into weekly reports format (match new actions shape)
        const transformedReports: WeeklyViolationReport[] = (result.data || [])
          .filter(item => item.student && item.class)
          .map(item => {
            const { start, end } = getWeekDateRange(selectedWeek)
            const totalPoints = Number(item.total_points ?? 0)
            return {
              id: item.student!.id || item.student!.student_id,
              student: {
                id: item.student!.id,
                full_name: item.student!.full_name,
                student_id: item.student!.student_id
              },
              class: {
                id: item.class!.id,
                name: item.class!.name
              },
              week_number: selectedWeek,
              week_start_date: start.toISOString().split('T')[0],
              week_end_date: end.toISOString().split('T')[0],
              total_violations: item.total_violations ?? item.violations.length,
              total_points_deducted: totalPoints,
              weekly_score: Math.max(0, 100 - totalPoints),
              violation_details: item.violations.map(v => ({
                type: v.name || 'Không xác định',
                points: Number(v.points ?? 0),
                description: v.description || '',
                date: v.date || start.toISOString().split('T')[0]
              })),
              is_sent_to_teacher: false,
              sent_at: null
            }
          })
        setReports(transformedReports)
      } else {
        setReports([])
      }
    } catch (error) {
      console.error('Lỗi tải báo cáo tuần:', error)
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendToTeachers = async () => {
    try {
      // For now, just mark as sent - can implement actual sending later
      toast.success(`Đã gửi báo cáo tuần ${selectedWeek} cho các GVCN`)
      loadWeeklyReports()
    } catch (error) {
      console.error('Lỗi gửi báo cáo:', error)
      toast.error('Có lỗi xảy ra khi gửi báo cáo')
    }
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default'
    if (score >= 70) return 'secondary'
    if (score >= 50) return 'outline'
    return 'destructive'
  }

  const totalStudentsWithViolations = reports.length
  const totalViolations = reports.reduce((sum, item) => sum + item.total_violations, 0)
  const totalPointsDeducted = reports.reduce((sum, item) => sum + item.total_points_deducted, 0)
  const averageScore = totalStudentsWithViolations > 0
    ? reports.reduce((sum, item) => sum + item.weekly_score, 0) / totalStudentsWithViolations
    : 100

  return (
    <div className="space-y-6">
      {/* Bộ lọc */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Báo cáo vi phạm theo tuần
          </CardTitle>
          <CardDescription>
            Gộp vi phạm theo học sinh trong từng tuần học - Mỗi học sinh bắt đầu với 100 điểm/tuần
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="week-select" className="text-sm font-medium">Tuần</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousWeek}
                  disabled={selectedWeek <= 1}
                  className="px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(parseInt(value))}>
                  <SelectTrigger id="week-select" className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getWeekOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextWeek}
                  disabled={selectedWeek >= Math.max(getCurrentWeek(), 20)}
                  className="px-2"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="class-select" className="text-sm font-medium">Lớp (tùy chọn)</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Tất cả lớp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lớp</SelectItem>
                  <SelectItem value="10A1">10A1</SelectItem>
                  <SelectItem value="10A2">10A2</SelectItem>
                  <SelectItem value="10A3">10A3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={loadWeeklyReports} disabled={isLoading} variant="outline">
                {isLoading ? 'Đang tải...' : 'Tải dữ liệu'}
              </Button>
              {reports.length > 0 && (
                <Button onClick={handleSendToTeachers} className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Gửi cho GVCN
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thống kê tổng quan */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Học sinh vi phạm</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudentsWithViolations}</div>
            <p className="text-xs text-muted-foreground">
              Tuần {selectedWeek}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng vi phạm</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViolations}</div>
            <p className="text-xs text-muted-foreground">
              Lần vi phạm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm bị trừ</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPointsDeducted}</div>
            <p className="text-xs text-muted-foreground">
              Tổng điểm trừ
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm TB</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Điểm trung bình
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bảng chi tiết */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiết vi phạm theo học sinh</CardTitle>
          <CardDescription>
            Mỗi học sinh là một item gộp tất cả vi phạm trong tuần
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            if (isLoading) return <div className="text-center py-8">Đang tải dữ liệu...</div>
            if (reports.length === 0) return (
              <div className="text-center text-muted-foreground py-8">
                Không có vi phạm nào trong tuần {selectedWeek}
              </div>
            )
            return (
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Lớp</TableHead>
                  <TableHead>Số vi phạm</TableHead>
                  <TableHead>Điểm trừ</TableHead>
                  <TableHead>Điểm tuần</TableHead>
                  <TableHead>Chi tiết vi phạm</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.student.full_name}</div>
                        <div className="text-sm text-muted-foreground">{report.student.student_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{report.class.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {report.total_violations} lần
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        -{report.total_points_deducted} điểm
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getScoreBadgeVariant(report.weekly_score)}>
                        {report.weekly_score}/100
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {report.violation_details.map((violation) => (
                          <div key={`${violation.type}-${violation.points}-${violation.description ?? ''}`} className="text-sm">
                            <span className="font-medium">{violation.type}</span>
                            <span className="text-muted-foreground"> (-{violation.points} điểm)</span>
                            {violation.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {violation.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {report.is_sent_to_teacher ? (
                        <Badge variant="default">Đã gửi GVCN</Badge>
                      ) : (
                        <Badge variant="secondary">Chưa gửi</Badge>
                      )}
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
