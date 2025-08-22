'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Calendar, AlertTriangle, Award, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { getMonthlyRankingAction } from '@/features/violations/actions'
import { getSemestersAction } from '@/features/admin-management/actions/academic-actions'

interface MonthlyViolationSummary {
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
  month_number: number
  total_violations: number
  total_points_deducted: number
  is_flagged: boolean
  is_admin_viewed: boolean
  admin_viewed_at: string | null
}

export default function MonthlyViolationSummary() {
  const [summaries, setSummaries] = useState<MonthlyViolationSummary[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSemester, setCurrentSemester] = useState<{ id: string; name: string; start_date: string } | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(1)
  const [selectedClass, setSelectedClass] = useState('')

  function getCurrentMonth(): number {
    if (currentSemester?.start_date) {
      const currentWeek = getCurrentWeek()
      return Math.ceil(currentWeek / 4)
    }
    return 1
  }

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

  function getMonthOptions(): Array<{ value: number; label: string }> {
    const currentMonth = getCurrentMonth()
    const options = []
    for (let i = 1; i <= Math.max(currentMonth, 5); i++) {
      const startWeek = (i - 1) * 4 + 1
      const endWeek = i * 4
      options.push({
        value: i,
        label: `Tháng ${i} (Tuần ${startWeek}-${endWeek})${i === currentMonth ? ' - Hiện tại' : ''}`
      })
    }
    return options
  }

  useEffect(() => {
    loadCurrentSemester()
  }, [])

  // Chỉ đặt tháng hiện tại khi semester được tải
  useEffect(() => {
    if (currentSemester?.start_date) {
      const start = new Date(currentSemester.start_date)
      const now = new Date()
      const diffWeeks = Math.ceil((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000))
      const currentWeek = Math.max(1, diffWeeks)
      setSelectedMonth(Math.ceil(currentWeek / 4))
    }
  }, [currentSemester])

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

  const loadMonthlySummaries = useCallback(async () => {
    if (!currentSemester) return

    setIsLoading(true)
    try {
      const result = await getMonthlyRankingAction({
        semester_id: currentSemester.id,
        month_index: selectedMonth,
        class_id: selectedClass || undefined
      })

      if (result.success && result.data) {
        const transformedData: MonthlyViolationSummary[] = result.data.map(item => ({
          id: item.student_id,
          student: {
            id: item.student_id,
            full_name: item.student_name,
            student_id: item.student_code
          },
          class: {
            id: item.student_id, // Use student_id as fallback
            name: item.class_name
          },
          month_number: selectedMonth,
          total_violations: item.total_violations,
          total_points_deducted: item.total_points,
          is_flagged: item.total_violations >= 3,
          is_admin_viewed: false,
          admin_viewed_at: null
        }))
        setSummaries(transformedData.toSorted((a, b) => b.total_violations - a.total_violations))
      } else {
        setSummaries([])
      }
    } catch (error) {
      console.error('Lỗi tải tổng kết tháng:', error)
      setSummaries([])
    } finally {
      setIsLoading(false)
    }
  }, [currentSemester, selectedMonth, selectedClass])

  // Load dữ liệu khi tháng/lớp thay đổi
  useEffect(() => {
    if (currentSemester) {
      loadMonthlySummaries()
    }
  }, [currentSemester, selectedMonth, selectedClass, loadMonthlySummaries])

  const handleMarkAsViewed = async (summaryId: string) => {
    try {
      const student = summaries.find(s => s.id === summaryId)?.student
      if (!student || !currentSemester) return

      const { markMonthlyAlertSeenAction } = await import('@/features/violations/actions')
      const res = await markMonthlyAlertSeenAction({
        student_id: student.id,
        semester_id: currentSemester.id,
        month_index: selectedMonth
      })
      if (res.success) {
        setSummaries(prev => prev.map(summary =>
          summary.id === summaryId
            ? { ...summary, is_admin_viewed: true, admin_viewed_at: new Date().toISOString() }
            : summary
        ))

        // Trigger custom event to refresh violation alert count
        window.dispatchEvent(new CustomEvent('violation-alert-updated'))

        toast.success('Đã đánh dấu đã xem')
      } else {
        toast.error(res.error || 'Không thể lưu trạng thái đã xem')
      }
    } catch (error) {
      console.error('Lỗi đánh dấu đã xem:', error)
      toast.error('Có lỗi xảy ra khi đánh dấu đã xem')
    }
  }

  // Simplified rendering; remove unused helpers to satisfy lint. Levels handled inline.

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center py-8">Đang tải dữ liệu...</div>
    }

    if (summaries.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          Không có vi phạm nào trong tháng {selectedMonth}
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hạng</TableHead>
            <TableHead>Học sinh</TableHead>
            <TableHead>Lớp</TableHead>
            <TableHead>Số vi phạm</TableHead>
            <TableHead>Điểm trừ</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summaries.map((summary, index) => (
            <TableRow key={summary.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={index < 3 ? 'destructive' : 'outline'}>
                    #{index + 1}
                  </Badge>
                  {index < 3 && <Award className="h-4 w-4 text-yellow-500" />}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{summary.student.full_name}</div>
                  <div className="text-sm text-muted-foreground">{summary.student.student_id}</div>
                </div>
              </TableCell>
              <TableCell>{summary.class.name}</TableCell>
              <TableCell>
                <Badge variant={summary.total_violations >= 3 ? 'destructive' : 'outline'}>
                  {summary.total_violations} lần
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="destructive">
                  -{summary.total_points_deducted} điểm
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {summary.is_flagged && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Cảnh báo
                    </Badge>
                  )}
                  {summary.is_admin_viewed && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      Đã xem
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {summary.is_flagged && !summary.is_admin_viewed && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsViewed(summary.id)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    Đánh dấu đã xem
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }

  return (
    <div className="space-y-6">
      {/* Bộ lọc */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tổng kết vi phạm theo tháng học kì
          </CardTitle>
          <CardDescription>
            Xếp hạng học sinh theo số lần vi phạm trong tháng (4 tuần) - Cảnh báo khi â‰¥3 vi phạm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="month-select" className="text-sm font-medium">Tháng học kì</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger id="month-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="flex items-end">
              <Button onClick={loadMonthlySummaries} disabled={isLoading} className="w-full">
                {isLoading ? 'Đang tải...' : 'Tải dữ liệu'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Bảng xếp hạng */}
      <Card>
        <CardHeader>
          <CardTitle>Xếp hạng vi phạm theo tháng</CardTitle>
          <CardDescription>
            Học sinh vi phạm nhiều nhất hiển thị trên cùng - Click &quot;Đã xem&quot; để giảm số đếm ở sidebar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}
