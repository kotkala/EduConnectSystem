'use client'

import { useState, useEffect } from 'react'
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Calendar, TrendingUp, AlertTriangle, Award } from 'lucide-react'
import { getMonthlyRankingAction, markMonthlyAlertSeenAction } from '@/lib/actions/violation-actions'


interface MonthlyRanking {
  student: {
    id: string
    full_name: string
    student_id: string
  } | null
  class: {
    id: string
    name: string
  } | null
  total_points: number
  total_violations: number
}

interface ClassBlock {
  id: string
  name: string
}

interface Class {
  id: string
  name: string
  block: string
}

export default function MonthlyReport() {
  const [monthlyData, setMonthlyData] = useState<MonthlyRanking[]>([])
  const [blocks, setBlocks] = useState<ClassBlock[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const [selectedSemester] = useState('current-semester-id') // TODO: Get current semester
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth())
  const [selectedBlock, setSelectedBlock] = useState('')
  const [selectedClass, setSelectedClass] = useState('')

  function getCurrentMonth(): number {
    // Tính tháng hiện tại dựa trên tuần (mỗi tháng = 4 tuần)
    const currentWeek = getCurrentWeek()
    return Math.ceil(currentWeek / 4)
  }

  function getCurrentWeek(): number {
    // Tính tuần hiện tại dựa trên ngày bắt đầu học kì
    // TODO: Lấy từ semester.start_date thực tế
    const semesterStart = new Date('2024-01-01')
    const now = new Date()
    const diffTime = now.getTime() - semesterStart.getTime()
    const diffWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, diffWeeks)
  }

  function getMonthDateRange(monthIndex: number): { start: Date; end: Date; label: string } {
    // Tính ngày bắt đầu và kết thúc của tháng dựa trên 4 tuần
    const semesterStart = new Date('2024-01-01')
    const startWeekNumber = (monthIndex - 1) * 4 + 1
    const endWeekNumber = monthIndex * 4

    const monthStart = addWeeks(startOfWeek(semesterStart, { weekStartsOn: 1 }), startWeekNumber - 1)
    const monthEnd = endOfWeek(addWeeks(startOfWeek(semesterStart, { weekStartsOn: 1 }), endWeekNumber - 1), { weekStartsOn: 1 })

    const label = `Tháng ${monthIndex} (${format(monthStart, 'dd/MM', { locale: vi })} - ${format(monthEnd, 'dd/MM/yyyy', { locale: vi })})`

    return { start: monthStart, end: monthEnd, label }
  }

  function getMonthOptions(): Array<{ value: number; label: string }> {
    const currentMonth = getCurrentMonth()
    const options = []
    for (let i = 1; i <= Math.max(currentMonth, 5); i++) {
      const monthRange = getMonthDateRange(i)
      options.push({
        value: i,
        label: `${monthRange.label}${i === currentMonth ? ' - Hiện tại' : ''}`
      })
    }
    return options
  }

  useEffect(() => {
    loadBlocks()
  }, [])

  // Load dữ liệu khi tháng/lớp thay đổi (không tự reset)
  useEffect(() => {
    loadMonthlyData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester, selectedMonth, selectedClass])

  const loadBlocks = async () => {
    try {
      // TODO: Implement getClassBlocksAction
      // Tạm thời dùng dữ liệu mock
      const mockBlocks = [
        { id: '10', name: 'Khối 10' },
        { id: '11', name: 'Khối 11' },
        { id: '12', name: 'Khối 12' }
      ]
      setBlocks(mockBlocks)
    } catch (error) {
      console.error('Lỗi tải khối lớp:', error)
    }
  }

  const handleBlockChange = async (blockId: string) => {
    setSelectedBlock(blockId)
    setSelectedClass('')
    setClasses([])
    
    if (blockId) {
      try {
        // TODO: Implement getClassesByBlockAction
        // Tạm thời dùng dữ liệu mock
        const mockClasses = [
          { id: '10A1', name: '10A1', block: blockId },
          { id: '10A2', name: '10A2', block: blockId },
          { id: '10A3', name: '10A3', block: blockId }
        ]
        setClasses(mockClasses)
      } catch (error) {
        console.error('Lỗi tải lớp:', error)
      }
    }
  }

  const loadMonthlyData = async () => {
    setIsLoading(true)
    try {
      const result = await getMonthlyRankingAction({
        semester_id: selectedSemester,
        month_index: selectedMonth,
        class_id: selectedClass || undefined
      })

      if (result.success && result.data) {
        setMonthlyData(result.data)
      } else {
        setMonthlyData([])
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu tháng:', error)
      setMonthlyData([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleMarkSeen = async (studentId: string) => {
    try {
      const result = await markMonthlyAlertSeenAction({
        student_id: studentId,
        semester_id: selectedSemester,
        month_index: selectedMonth
      })

      if (result.success) {
        // Có thể cập nhật UI để hiển thị đã xem
        console.log('Đã đánh dấu xem cho học sinh:', studentId)
      }
    } catch (error) {
      console.error('Lỗi đánh dấu đã xem:', error)
    }
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return { variant: 'destructive' as const, icon: '🥇', label: 'Nhiều nhất' }
    if (index === 1) return { variant: 'secondary' as const, icon: '🥈', label: 'Thứ 2' }
    if (index === 2) return { variant: 'outline' as const, icon: '🥉', label: 'Thứ 3' }
    return { variant: 'outline' as const, icon: '', label: `Thứ ${index + 1}` }
  }

  const getViolationLevel = (violations: number) => {
    if (violations >= 5) return { variant: 'destructive' as const, label: 'Nghiêm trọng' }
    if (violations >= 3) return { variant: 'secondary' as const, label: 'Cảnh báo' }
    if (violations >= 1) return { variant: 'outline' as const, label: 'Nhẹ' }
    return { variant: 'default' as const, label: 'Tốt' }
  }

  const totalStudentsWithViolations = monthlyData.length
  const totalViolations = monthlyData.reduce((sum, item) => sum + item.total_violations, 0)
  const totalPointsDeducted = monthlyData.reduce((sum, item) => sum + item.total_points, 0)
  const studentsWithWarning = monthlyData.filter(item => item.total_violations >= 3).length

  return (
    <div className="space-y-6">
      {/* Bộ lọc */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Báo cáo vi phạm theo tháng học kì
          </CardTitle>
          <CardDescription>
            Xếp hạng học sinh theo số lần vi phạm trong tháng (4 tuần)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label htmlFor="month-select" className="text-sm font-medium">Tháng học kì</label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
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
              <label className="text-sm font-medium">Khối lớp</label>
              <Select value={selectedBlock} onValueChange={handleBlockChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả khối" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả khối</SelectItem>
                  {blocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lớp</label>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedBlock}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả lớp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả lớp</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadMonthlyData} disabled={isLoading} className="w-full">
                {isLoading ? 'Đang tải...' : 'Tải dữ liệu'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thống kê tổng quan */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Học sinh vi phạm</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudentsWithViolations}</div>
            <p className="text-xs text-muted-foreground">
              Tháng {selectedMonth}
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
            <CardTitle className="text-sm font-medium">Cần cảnh báo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{studentsWithWarning}</div>
            <p className="text-xs text-muted-foreground">
              ≥3 lần vi phạm
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm bị trừ</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPointsDeducted}</div>
            <p className="text-xs text-muted-foreground">
              Tổng điểm trừ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bảng xếp hạng */}
      <Card>
        <CardHeader>
          <CardTitle>Xếp hạng vi phạm theo tháng</CardTitle>
          <CardDescription>
            Học sinh vi phạm nhiều nhất hiển thị trên cùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : monthlyData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hạng</TableHead>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Lớp</TableHead>
                  <TableHead>Số vi phạm</TableHead>
                  <TableHead>Điểm trừ</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyData.filter(item => item.student && item.class).map((item, index) => {
                  const rank = getRankBadge(index)
                  const level = getViolationLevel(item.total_violations)
                  const needsAttention = item.total_violations >= 3

                  return (
                    <TableRow key={item.student!.id} className={needsAttention ? 'bg-orange-50' : ''}>
                      <TableCell>
                        <Badge variant={rank.variant}>
                          {rank.icon} {rank.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{item.student!.full_name}</div>
                          <div className="text-sm text-muted-foreground">{item.student!.student_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>{item.class!.name}</TableCell>
                      <TableCell>
                        <Badge variant={item.total_violations >= 3 ? 'destructive' : 'outline'}>
                          {item.total_violations} lần
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          -{item.total_points} điểm
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={level.variant}>
                          {level.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {needsAttention && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkSeen(item.student!.id)}
                          >
                            Đánh dấu đã xem
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Không có vi phạm nào trong tháng {selectedMonth}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
