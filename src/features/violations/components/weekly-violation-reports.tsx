'use client'

import { useState, useEffect, useCallback } from 'react'
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { CalendarDays, Users, AlertTriangle, Send, FileText, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { toast } from 'sonner'
import {
  getWeeklyGroupedViolationsAction,
  markWeeklyReportsAsSentAction,
  getWeeklyReportStatusAction
} from '@/features/violations/actions'
import { getSemestersAction } from '@/features/admin-management/actions/academic-actions'
import { getClassesAction } from '@/features/admin-management/actions/class-actions'
import OutdatedReportsAlert from './outdated-reports-alert'

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
  const [isInitializing, setIsInitializing] = useState(true) // Loading state cho việc khởi tạo component
  const [isSentToTeacher, setIsSentToTeacher] = useState(false)
  const [sentAt, setSentAt] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [currentSemester, setCurrentSemester] = useState<{ id: string; name: string; start_date: string } | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedClass, setSelectedClass] = useState('all')
  const [isWeekInitialized, setIsWeekInitialized] = useState(false)
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([])
  const [isLoadingClasses, setIsLoadingClasses] = useState(false)
  const [syncInfo, setSyncInfo] = useState<{
    has_existing_report: boolean
    report_was_sent: boolean
    report_sent_at?: string | null
    data_changed_since_sent: boolean
    needs_resync: boolean
    current_violation_count: number
    current_total_points: number
    last_report_updated?: string | null
    data_source?: 'cached' | 'realtime'
  } | null>(null)


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
    if (!currentSemester?.start_date) {
      // Nếu chưa có dữ liệu học kỳ, trả về placeholder với ngày hiện tại
      const now = new Date()
      return {
        start: now,
        end: now,
        label: `Tuần ${weekNumber} (Chưa có dữ liệu học kỳ)`
      }
    }

    const semesterStart = new Date(currentSemester.start_date)
    const weekStart = addWeeks(startOfWeek(semesterStart, { weekStartsOn: 1 }), weekNumber - 1)
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

    const label = `Tuần ${weekNumber} (${format(weekStart, 'dd/MM', { locale: vi })} - ${format(weekEnd, 'dd/MM/yyyy', { locale: vi })})`

    return { start: weekStart, end: weekEnd, label }
  }

  function getWeekOptions(): Array<{ value: number; label: string }> {
    // Chỉ tính toán khi đã có dữ liệu học kỳ
    if (!currentSemester?.start_date) {
      return [
        { value: 1, label: 'Tuần 1 (Chưa có dữ liệu học kỳ)' },
        { value: 2, label: 'Tuần 2 (Chưa có dữ liệu học kỳ)' },
        { value: 3, label: 'Tuần 3 (Chưa có dữ liệu học kỳ)' },
        { value: 4, label: 'Tuần 4 (Chưa có dữ liệu học kỳ)' }
      ]
    }

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

    // Timeout để tránh loading vô hạn
    const timeout = setTimeout(() => {
      setIsInitializing(false)
      console.warn('Timeout loading semester data, showing UI anyway')
    }, 10000) // 10 giây timeout

    return () => clearTimeout(timeout)
  }, [])

  // Load classes when current semester is available
  useEffect(() => {
    if (currentSemester) {
      loadClasses()
    }
  }, [currentSemester, loadClasses])

  // Khởi tạo tuần hiện tại một lần khi học kì sẵn sàng
  useEffect(() => {
    if (currentSemester?.start_date && !isWeekInitialized) {
      const semesterStart = new Date(currentSemester.start_date)
      const now = new Date()
      const diffTime = now.getTime() - semesterStart.getTime()
      const diffWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000))
      setSelectedWeek(Math.max(1, diffWeeks))
      setIsWeekInitialized(true)
      setIsInitializing(false) // Đánh dấu đã khởi tạo xong
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
        } else {
          // Không tìm thấy học kỳ hiện tại
          console.error('Không tìm thấy học kỳ hiện tại')
          setIsInitializing(false) // Vẫn cho phép hiển thị UI
        }
      } else {
        console.error('Lỗi tải danh sách học kỳ:', result.error)
        setIsInitializing(false) // Vẫn cho phép hiển thị UI
      }
    } catch (error) {
      console.error('Lỗi tải học kì hiện tại:', error)
      setIsInitializing(false) // Vẫn cho phép hiển thị UI
    }
  }



  const loadWeeklyReportStatus = async () => {
    if (!currentSemester) return

    try {
      const result = await getWeeklyReportStatusAction({
        semester_id: currentSemester.id,
        week_index: selectedWeek,
        class_id: selectedClass === 'all' ? undefined : selectedClass || undefined
      })

      if (result.success && result.data) {
        setIsSentToTeacher(result.data.is_sent_to_teacher)
        setSentAt(result.data.sent_at)
        return {
          is_sent_to_teacher: result.data.is_sent_to_teacher,
          sent_at: result.data.sent_at
        }
      } else {
        setIsSentToTeacher(false)
        setSentAt(null)
        return {
          is_sent_to_teacher: false,
          sent_at: null
        }
      }
    } catch (error) {
      console.error('Lỗi tải trạng thái báo cáo:', error)
      setIsSentToTeacher(false)
      setSentAt(null)
      return {
        is_sent_to_teacher: false,
        sent_at: null
      }
    }
  }

  const loadWeeklyReports = async () => {
    if (!currentSemester) return

    setIsLoading(true)
    try {
      // Load status first to get current state
      const statusData = await loadWeeklyReportStatus()

      // Then load reports data
      const reportsResult = await getWeeklyGroupedViolationsAction({
        semester_id: currentSemester.id,
        week_index: selectedWeek,
        class_id: selectedClass === 'all' ? undefined : selectedClass || undefined
      })

      if (reportsResult.success && reportsResult.data) {
        // Store sync info for display
        if (reportsResult.sync_info) {
          setSyncInfo({
            has_existing_report: reportsResult.sync_info.has_existing_report,
            report_was_sent: Boolean(reportsResult.sync_info.report_was_sent),
            report_sent_at: reportsResult.sync_info.report_sent_at,
            data_changed_since_sent: Boolean(reportsResult.sync_info.data_changed_since_sent),
            needs_resync: Boolean(reportsResult.sync_info.needs_resync),
            current_violation_count: reportsResult.sync_info.current_violation_count,
            current_total_points: reportsResult.sync_info.current_total_points,
            last_report_updated: reportsResult.sync_info.last_report_updated,
            data_source: reportsResult.sync_info.data_source as 'cached' | 'realtime' | undefined
          })
        }

        // Transform the grouped violations data into weekly reports format (match new actions shape)
        const transformedReports: WeeklyViolationReport[] = (reportsResult.data || [])
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
              is_sent_to_teacher: !item.has_unsent_violations && item.sent_violations > 0,
              sent_at: statusData?.sent_at || null
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
    if (!currentSemester) return

    try {
      const result = await markWeeklyReportsAsSentAction({
        semester_id: currentSemester.id,
        week_index: selectedWeek,
        class_id: selectedClass === 'all' ? undefined : selectedClass || undefined
      })

      if (result.success) {
        setIsSentToTeacher(true)
        setSentAt(new Date().toISOString())

        // Update reports state to reflect sent status
        setReports(prev => prev.map(report => ({
          ...report,
          is_sent_to_teacher: true,
          sent_at: new Date().toISOString()
        })))

        toast.success(`Đã gửi báo cáo tuần ${selectedWeek} cho các GVCN`)
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi gửi báo cáo')
      }
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

  // Hiển thị loading screen khi đang khởi tạo
  if (isInitializing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Báo cáo vi phạm theo tuần
            </CardTitle>
            <CardDescription>
              Đang tải dữ liệu học kỳ...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Đang khởi tạo báo cáo tuần...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Outdated Reports Alert */}
      {currentSemester && (
        <OutdatedReportsAlert
          key={refreshKey}
          semester_id={currentSemester.id}
          class_id={selectedClass === 'all' ? undefined : selectedClass || undefined}
          onReportsResent={() => {
            // Refresh the weekly reports when outdated reports are resent
            setRefreshKey(prev => prev + 1)
            loadWeeklyReports()
          }}
        />
      )}

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
                  disabled={selectedWeek <= 1 || !currentSemester?.start_date}
                  className="px-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Select
                  value={selectedWeek.toString()}
                  onValueChange={(value) => setSelectedWeek(parseInt(value))}
                  disabled={!currentSemester?.start_date}
                >
                  <SelectTrigger id="week-select" className="flex-1">
                    <SelectValue placeholder={!currentSemester?.start_date ? "Đang tải học kỳ..." : undefined} />
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
                  disabled={selectedWeek >= Math.max(getCurrentWeek(), 20) || !currentSemester?.start_date}
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

            <div className="flex items-end gap-2">
              <Button onClick={loadWeeklyReports} disabled={isLoading} variant="outline">
                {isLoading ? 'Đang tải...' : 'Tải dữ liệu'}
              </Button>
              {reports.length > 0 && !isSentToTeacher && (
                <Button onClick={handleSendToTeachers} className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Gửi cho GVCN
                </Button>
              )}
              {isSentToTeacher && sentAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="default" className="bg-green-100 text-green-800">
                    ✓ Đã gửi GVCN
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(sentAt).toLocaleString('vi-VN')}
                  </span>
                  {syncInfo && syncInfo.needs_resync && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      Cần cập nhật
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thống kê tổng quan */}
      <div className="grid gap-4 md:grid-cols-5">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${syncInfo?.needs_resync ? 'animate-spin text-amber-500' : ''}`} />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {syncInfo?.needs_resync ? (
                <span className="text-amber-600">Cần sync</span>
              ) : syncInfo?.report_was_sent ? (
                <span className="text-green-600">Đã gửi</span>
              ) : (
                <span className="text-gray-600">Chưa gửi</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {syncInfo?.data_source === 'cached' ? 'Dữ liệu đã gửi' : 'Dữ liệu real-time'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sync Status Alert */}
      {syncInfo && syncInfo.needs_resync && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Dữ liệu đã thay đổi sau khi gửi báo cáo</AlertTitle>
          <AlertDescription className="text-amber-700">
            <div className="space-y-1">
              <p>
                Báo cáo tuần {selectedWeek} đã được gửi lúc{' '}
                <strong>{syncInfo.report_sent_at ? new Date(syncInfo.report_sent_at).toLocaleString('vi-VN') : 'N/A'}</strong>
              </p>
              <p>
                Hiện tại có <strong>{syncInfo.current_violation_count} vi phạm</strong> và{' '}
                <strong>{syncInfo.current_total_points} điểm trừ</strong> (dữ liệu mới nhất)
              </p>
              <p className="text-sm">
                💡 Sử dụng nút &quot;Gửi lại tất cả&quot; ở phần &quot;Báo cáo cần cập nhật&quot; để gửi dữ liệu mới nhất cho GVCN
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Bảng chi tiết */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Chi tiết vi phạm theo học sinh</CardTitle>
              <CardDescription>
                Mỗi học sinh là một item gộp tất cả vi phạm trong tuần
                {syncInfo && (
                  <span className="ml-2 text-xs space-x-1">
                    {syncInfo.needs_resync ? (
                      <Badge variant="destructive" className="text-xs">Dữ liệu mới</Badge>
                    ) : syncInfo.report_was_sent ? (
                      <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                        {syncInfo.data_source === 'cached' ? 'Đã gửi (Cached)' : 'Đã đồng bộ'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Chưa gửi</Badge>
                    )}
                    {syncInfo.data_source === 'cached' && (
                      <Badge variant="secondary" className="text-xs">
                        📋 Hiển thị data đã gửi
                      </Badge>
                    )}
                  </span>
                )}
              </CardDescription>
            </div>
            {syncInfo && (
              <div className="text-right text-xs text-muted-foreground">
                <div>
                  {syncInfo.data_source === 'cached' ? 'Vi phạm đã gửi' : 'Vi phạm hiện tại'}: {syncInfo.current_violation_count}
                </div>
                <div>
                  {syncInfo.data_source === 'cached' ? 'Điểm trừ đã gửi' : 'Tổng điểm trừ'}: {syncInfo.current_total_points}
                </div>
                <div className="text-xs">
                  {syncInfo.data_source === 'cached' ? (
                    <span className="text-blue-600">📋 Hiển thị data đã gửi GVCN</span>
                  ) : (
                    <span className="text-orange-600">🔄 Hiển thị data real-time</span>
                  )}
                </div>
                {syncInfo.last_report_updated && (
                  <div>Cập nhật: {new Date(syncInfo.last_report_updated).toLocaleString('vi-VN')}</div>
                )}
              </div>
            )}
          </div>
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
