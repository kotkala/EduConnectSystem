'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Calendar, AlertTriangle, Award, Eye } from 'lucide-react'
import { toast } from 'sonner'
import {
  getMonthlyRankingAction,
  markMonthlyViolationAsViewedAction
} from '@/features/violations/actions'
import { getSemestersAction } from '@/features/admin-management/actions/academic-actions'
import { getClassesAction } from '@/features/admin-management/actions/class-actions'

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
  const [currentSemester, setCurrentSemester] = useState<{ id: string; name: string; start_date: string; end_date: string } | null>(null)
  const [semesterError, setSemesterError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(1) // Academic month (1-5 for semester)
  const [selectedClass, setSelectedClass] = useState('all')
  const [availableMonths, setAvailableMonths] = useState<number[]>([]) // Tháng có data
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)

  const getCurrentAcademicMonth = useCallback((): number => {
    if (!currentSemester?.start_date) return 1

    const semesterStart = new Date(currentSemester.start_date)
    const now = new Date()
    const diffTime = now.getTime() - semesterStart.getTime()
    const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000))
    // Use 28 days per month to align with buildMonthDateRange function
    const academicMonth = Math.floor(diffDays / 28) + 1

    return Math.max(1, Math.min(4, academicMonth)) // Clamp to 1-4 (4 tháng học kỳ)
  }, [currentSemester?.start_date])

  function getMaxAcademicMonths(): number {
    if (!currentSemester?.start_date || !currentSemester?.end_date) {
      // Default: 4 tháng theo chuẩn giáo dục VN
      return 4
    }

    // Tính duration thực tế của học kỳ
    const start = new Date(currentSemester.start_date)
    const end = new Date(currentSemester.end_date)
    const diffTime = end.getTime() - start.getTime()
    const diffMonths = Math.ceil(diffTime / (30.44 * 24 * 60 * 60 * 1000))

    // Cap giữa 3-5 tháng (reasonable range)
    return Math.max(3, Math.min(5, diffMonths))
  }



  function getMonthOptions(): Array<{ value: number; label: string; disabled?: boolean }> {
    const currentMonth = getCurrentAcademicMonth()
    const maxMonths = getMaxAcademicMonths()
    const options = []

    for (let i = 1; i <= Math.max(currentMonth, maxMonths); i++) {
      const hasData = availableMonths.includes(i)
      const isFuture = i > currentMonth

      options.push({
        value: i,
        label: `Tháng ${i} học kỳ${i === currentMonth ? ' - Hiện tại' : ''}${!hasData && !isFuture ? ' (Chưa có dữ liệu)' : ''}${isFuture ? ' (Chưa đến)' : ''}`,
        disabled: !hasData || isFuture
      })
    }
    return options
  }

  const loadClasses = useCallback(async () => {
    setIsLoadingClasses(true)
    try {
      const result = await getClassesAction({
        page: 1,
        limit: 100,
        semester_id: currentSemester?.id
      })
      if (result.success && result.data) {
        // Extract just id and name for the dropdown
        const classOptions = result.data.map(cls => ({
          id: cls.id,
          name: cls.name
        }))
        setClasses(classOptions)
      } else {
        console.error('Lỗi tải danh sách lớp:', result.error)
        setClasses([])
      }
    } catch (error) {
      console.error('Lỗi tải danh sách lớp:', error)
      setClasses([])
    } finally {
      setIsLoadingClasses(false)
    }
  }, [currentSemester?.id])

  useEffect(() => {
    loadCurrentSemester()
  }, [])

  // Chỉ đặt tháng hiện tại khi semester được tải
  // Set selectedMonth to current academic month when semester loads
  useEffect(() => {
    if (currentSemester?.start_date) {
      setSelectedMonth(getCurrentAcademicMonth())
    }
  }, [currentSemester, getCurrentAcademicMonth])

  // Load classes when current semester is available
  useEffect(() => {
    if (currentSemester) {
      loadClasses()
    }
  }, [currentSemester, loadClasses])

  const loadCurrentSemester = async () => {
    try {
      setSemesterError(null)
      const result = await getSemestersAction()
      if (result.success && result.data) {
        const current = result.data.find(s => s.is_current)
        if (current) {
          setCurrentSemester({
            id: current.id,
            name: current.name,
            start_date: current.start_date,
            end_date: current.end_date
          })
        } else {
          const errorMsg = 'Không tìm thấy học kỳ hiện tại. Vui lòng liên hệ quản trị viên để thiết lập học kỳ hiện tại.'
          console.error(errorMsg)
          setSemesterError(errorMsg)
        }
      } else {
        const errorMsg = result.error || 'Không thể tải danh sách học kỳ'
        console.error('Lỗi tải danh sách học kỳ:', errorMsg)
        setSemesterError(errorMsg)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Lỗi không xác định khi tải học kỳ'
      console.error('Lỗi tải học kì hiện tại:', error)
      setSemesterError(errorMsg)
    }
  }



  const loadAvailableMonths = useCallback(async () => {
    if (!currentSemester) return

    try {
      // Logic đơn giản: tháng có data = từ tháng 1 đến tháng hiện tại
      const currentMonth = getCurrentAcademicMonth()
      const months = []

      // Chỉ enable tháng từ 1 đến current month
      for (let i = 1; i <= currentMonth; i++) {
        months.push(i)
      }

      setAvailableMonths(months)
    } catch (error) {
      console.error('Lỗi tải tháng có sẵn:', error)
    }
  }, [currentSemester, getCurrentAcademicMonth])

  const loadMonthlySummaries = useCallback(async () => {
    if (!currentSemester) return

    setIsLoading(true)
    try {
      const result = await getMonthlyRankingAction({
        semester_id: currentSemester.id,
        academic_month: selectedMonth,
        class_id: selectedClass === 'all' ? undefined : selectedClass || undefined
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
          is_admin_viewed: item.is_admin_viewed,
          admin_viewed_at: item.admin_viewed_at
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

  // Load available months khi semester/class thay đổi
  useEffect(() => {
    if (currentSemester) {
      loadAvailableMonths()
    }
  }, [currentSemester, selectedClass, loadAvailableMonths])

  // Load dữ liệu khi tháng/lớp thay đổi
  useEffect(() => {
    if (currentSemester) {
      loadMonthlySummaries()
    }
  }, [currentSemester, selectedMonth, selectedClass, loadMonthlySummaries])

  const handleMarkAsViewed = async (summaryId: string) => {
    if (!currentSemester) return

    try {
      const result = await markMonthlyViolationAsViewedAction({
        student_id: summaryId,
        semester_id: currentSemester.id,
        academic_month: selectedMonth
      })

      if (result.success) {
        setSummaries(prev => prev.map(summary =>
          summary.id === summaryId
            ? { ...summary, is_admin_viewed: true, admin_viewed_at: new Date().toISOString() }
            : summary
        ))
        toast.success('Đã đánh dấu đã xem')
      } else {
        toast.error(result.error || 'Không thể lưu trạng thái đã xem')
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

  // Show error state if semester loading failed
  if (semesterError) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-lg font-semibold">Lỗi tải học kỳ</div>
            <p className="text-muted-foreground">{semesterError}</p>
            <Button onClick={loadCurrentSemester} variant="outline">
              Thử lại
            </Button>
          </div>
        </CardContent>
      </Card>
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
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => {
                  const monthValue = parseInt(value)
                  const monthOption = getMonthOptions().find(opt => opt.value === monthValue)
                  if (!monthOption?.disabled) {
                    setSelectedMonth(monthValue)
                  }
                }}
              >
                <SelectTrigger id="month-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getMonthOptions().map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                      disabled={option.disabled}
                      className={option.disabled ? 'text-gray-400 cursor-not-allowed' : ''}
                    >
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
                  {isLoadingClasses ? (
                    <SelectItem value="loading" disabled>Đang tải lớp...</SelectItem>
                  ) : (
                    classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </SelectItem>
                    ))
                  )}
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
