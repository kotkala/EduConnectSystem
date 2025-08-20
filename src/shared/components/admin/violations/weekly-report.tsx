'use client'

import { useState, useEffect } from 'react'
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { CalendarDays, Users, AlertTriangle, TrendingDown } from 'lucide-react'
import { getWeeklyGroupedViolationsAction, getClassBlocksAction, getClassesByBlockAction } from '@/lib/actions/violation-actions'
import { getSemestersAction } from '@/lib/actions/academic-actions'

interface WeeklyViolationGroup {
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
  violations: Array<{
    id: string
    name: string
    points: number
    date: string
    description: string | null
  }>
}

interface ClassBlock {
  id: string
  name: string
}

interface Class {
  id: string
  name: string
  academic_year: { name: string }
  semester: { name: string }
}

export default function WeeklyReport() {
  const [weeklyData, setWeeklyData] = useState<WeeklyViolationGroup[]>([])
  const [blocks, setBlocks] = useState<ClassBlock[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const [currentSemester, setCurrentSemester] = useState<{ id: string; name: string; start_date: string } | null>(null)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [selectedBlock, setSelectedBlock] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [isWeekInitialized, setIsWeekInitialized] = useState(false)


  function getCurrentWeek(): number {
    // Tính tuần hiện tại dựa trên ngày bắt đầu học kì
    if (currentSemester?.start_date) {
      const semesterStart = new Date(currentSemester.start_date)
      const now = new Date()
      const diffTime = now.getTime() - semesterStart.getTime()
      const diffWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000))
      return Math.max(1, diffWeeks)
    }
    // Fallback if no semester data
    const semesterStart = new Date('2024-01-01')
    const now = new Date()
    const diffTime = now.getTime() - semesterStart.getTime()
    const diffWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, diffWeeks)
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

  useEffect(() => {
    loadCurrentSemester()
    loadBlocks()
  }, [])

  // Khi currentSemester thay đổi, chỉ set tuần hiện tại một lần
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
      loadWeeklyData()
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

  const loadBlocks = async () => {
    try {
      const result = await getClassBlocksAction()
      if (result.success && result.data) {
        setBlocks(result.data)
      }
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
        const result = await getClassesByBlockAction(blockId)
        if (result.success && result.data) {
          setClasses(result.data)
        }
      } catch (error) {
        console.error('Lỗi tải lớp:', error)
      }
    }
  }

  const loadWeeklyData = async () => {
    setIsLoading(true)
    try {
      const result = await getWeeklyGroupedViolationsAction({
        semester_id: currentSemester!.id,
        week_index: selectedWeek,
        class_id: selectedClass || undefined
      })

      if (result.success && result.data) {
        // Filter null values và sắp xếp theo số vi phạm giảm dần, rồi theo điểm giảm dần
        const validData = (result.data || []).filter(item => item.student && item.class)
        const sortedData = validData.toSorted((a, b) => {
          if (b.total_violations !== a.total_violations) {
            return b.total_violations - a.total_violations
          }
          if (b.total_points !== a.total_points) {
            return b.total_points - a.total_points
          }
          return a.student!.full_name.localeCompare(b.student!.full_name)
        })
        setWeeklyData(sortedData)
      } else {
        setWeeklyData([])
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu tuần:', error)
      setWeeklyData([])
    } finally {
      setIsLoading(false)
    }
  }

  const getWeeklyScore = (totalPoints: number): number => {
    return Math.max(0, 100 - totalPoints)
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default'
    if (score >= 70) return 'secondary'
    if (score >= 50) return 'outline'
    return 'destructive'
  }

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center py-8">Đang tải dữ liệu...</div>
    }

    if (weeklyData.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          Không có dữ liệu vi phạm cho tuần này
        </div>
      )
    }

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
          </TableRow>
        </TableHeader>
        <TableBody>
          {weeklyData.map((item) => {
            const weeklyScore = getWeeklyScore(item.total_points)
            return (
              <TableRow key={item.student!.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{item.student!.full_name}</div>
                    <div className="text-sm text-muted-foreground">{item.student!.student_id}</div>
                  </div>
                </TableCell>
                <TableCell>{item.class!.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {item.total_violations} lần
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="destructive">
                    -{item.total_points} điểm
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getScoreBadgeVariant(weeklyScore)}>
                    {weeklyScore}/100
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {item.violations.map((violation) => (
                      <div key={violation.id} className="text-sm">
                        <span className="font-medium">{violation.name}</span>
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
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    )
  }

  const totalStudentsWithViolations = weeklyData.length
  const totalViolations = weeklyData.reduce((sum, item) => sum + item.total_violations, 0)
  const totalPointsDeducted = weeklyData.reduce((sum, item) => sum + item.total_points, 0)
  const averageScore = totalStudentsWithViolations > 0
    ? weeklyData.reduce((sum, item) => sum + getWeeklyScore(item.total_points), 0) / totalStudentsWithViolations
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
            Xem vi phạm được gộp theo học sinh trong từng tuần học
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label htmlFor="week-select" className="text-sm font-medium">Tuần</label>
              <Select value={selectedWeek.toString()} onValueChange={(value) => setSelectedWeek(parseInt(value))}>
                <SelectTrigger id="week-select">
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
            </div>

            <div className="space-y-2">
              <label htmlFor="block-select" className="text-sm font-medium">Khối lớp</label>
              <Select value={selectedBlock} onValueChange={handleBlockChange}>
                <SelectTrigger id="block-select">
                  <SelectValue placeholder="Tất cả khối" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khối</SelectItem>
                  {blocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="class-select" className="text-sm font-medium">Lớp</label>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedBlock}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Tất cả lớp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả lớp</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadWeeklyData} disabled={isLoading} className="w-full">
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
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
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
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
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
            Mỗi học sinh là một item gồm tất cả vi phạm trong tuần
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}
