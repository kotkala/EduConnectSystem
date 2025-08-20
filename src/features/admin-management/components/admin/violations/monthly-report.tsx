'use client'

import { useState, useEffect } from 'react'
import { startOfWeek, endOfWeek, addWeeks, format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Calendar, TrendingUp, AlertTriangle, Award } from 'lucide-react'
import { getMonthlyRankingAction, markMonthlyAlertSeenAction } from '@/features/violations/actions/violation-actions'


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
  const [selectedBlock, setSelectedBlock] = useState('all')
  const [selectedClass, setSelectedClass] = useState('all')

  function getCurrentMonth(): number {
    // TÃ­nh thÃ¡ng hiá»‡n táº¡i dá»±a trÃªn tuáº§n (má»—i thÃ¡ng = 4 tuáº§n)
    const currentWeek = getCurrentWeek()
    return Math.ceil(currentWeek / 4)
  }

  function getCurrentWeek(): number {
    // TÃ­nh tuáº§n hiá»‡n táº¡i dá»±a trÃªn ngÃ y báº¯t Ä‘áº§u há»c kÃ¬
    // TODO: Láº¥y tá»« semester.start_date thá»±c táº¿
    const semesterStart = new Date('2024-01-01')
    const now = new Date()
    const diffTime = now.getTime() - semesterStart.getTime()
    const diffWeeks = Math.ceil(diffTime / (7 * 24 * 60 * 60 * 1000))
    return Math.max(1, diffWeeks)
  }

  function getMonthDateRange(monthIndex: number): { start: Date; end: Date; label: string } {
    // TÃ­nh ngÃ y báº¯t Ä‘áº§u vÃ  káº¿t thÃºc cá»§a thÃ¡ng dá»±a trÃªn 4 tuáº§n
    const semesterStart = new Date('2024-01-01')
    const startWeekNumber = (monthIndex - 1) * 4 + 1
    const endWeekNumber = monthIndex * 4

    const monthStart = addWeeks(startOfWeek(semesterStart, { weekStartsOn: 1 }), startWeekNumber - 1)
    const monthEnd = endOfWeek(addWeeks(startOfWeek(semesterStart, { weekStartsOn: 1 }), endWeekNumber - 1), { weekStartsOn: 1 })

    const label = `ThÃ¡ng ${monthIndex} (${format(monthStart, 'dd/MM', { locale: vi })} - ${format(monthEnd, 'dd/MM/yyyy', { locale: vi })})`

    return { start: monthStart, end: monthEnd, label }
  }

  function getMonthOptions(): Array<{ value: number; label: string }> {
    const currentMonth = getCurrentMonth()
    const options = []
    for (let i = 1; i <= Math.max(currentMonth, 5); i++) {
      const monthRange = getMonthDateRange(i)
      options.push({
        value: i,
        label: `${monthRange.label}${i === currentMonth ? ' - Hiá»‡n táº¡i' : ''}`
      })
    }
    return options
  }

  useEffect(() => {
    loadBlocks()
  }, [])

  // Load dá»¯ liá»‡u khi thÃ¡ng/lá»›p thay Ä‘á»•i (khÃ´ng tá»± reset)
  useEffect(() => {
    loadMonthlyData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSemester, selectedMonth, selectedClass])

  const loadBlocks = async () => {
    try {
      // TODO: Implement getClassBlocksAction
      // Táº¡m thá»i dÃ¹ng dá»¯ liá»‡u mock
      const mockBlocks = [
        { id: '10', name: 'Khá»‘i 10' },
        { id: '11', name: 'Khá»‘i 11' },
        { id: '12', name: 'Khá»‘i 12' }
      ]
      setBlocks(mockBlocks)
    } catch (error) {
      console.error('Lá»—i táº£i khá»‘i lá»›p:', error)
    }
  }

  const handleBlockChange = async (blockId: string) => {
    setSelectedBlock(blockId)
    setSelectedClass('all')
    setClasses([])

    if (blockId && blockId !== 'all') {
      try {
        // TODO: Implement getClassesByBlockAction
        // Táº¡m thá»i dÃ¹ng dá»¯ liá»‡u mock
        const mockClasses = [
          { id: '10A1', name: '10A1', block: blockId },
          { id: '10A2', name: '10A2', block: blockId },
          { id: '10A3', name: '10A3', block: blockId }
        ]
        setClasses(mockClasses)
      } catch (error) {
        console.error('Lá»—i táº£i lá»›p:', error)
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
      console.error('Lá»—i táº£i dá»¯ liá»‡u thÃ¡ng:', error)
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
        // Trigger custom event to refresh violation alert count
        window.dispatchEvent(new CustomEvent('violation-alert-updated'))
        console.log('ÄÃ£ Ä‘Ã¡nh dáº¥u xem cho há»c sinh:', studentId)
      }
    } catch (error) {
      console.error('Lá»—i Ä‘Ã¡nh dáº¥u Ä‘Ã£ xem:', error)
    }
  }

  const getRankBadge = (index: number) => {
    if (index === 0) return { variant: 'destructive' as const, icon: 'ðŸ¥‡', label: 'Nhiá»u nháº¥t' }
    if (index === 1) return { variant: 'secondary' as const, icon: 'ðŸ¥ˆ', label: 'Thá»© 2' }
    if (index === 2) return { variant: 'outline' as const, icon: 'ðŸ¥‰', label: 'Thá»© 3' }
    return { variant: 'outline' as const, icon: '', label: `Thá»© ${index + 1}` }
  }

  const getViolationLevel = (violations: number) => {
    if (violations >= 5) return { variant: 'destructive' as const, label: 'NghiÃªm trá»ng' }
    if (violations >= 3) return { variant: 'secondary' as const, label: 'Cáº£nh bÃ¡o' }
    if (violations >= 1) return { variant: 'outline' as const, label: 'Nháº¹' }
    return { variant: 'default' as const, label: 'Tá»‘t' }
  }

  const totalStudentsWithViolations = monthlyData.length
  const totalViolations = monthlyData.reduce((sum, item) => sum + item.total_violations, 0)
  const totalPointsDeducted = monthlyData.reduce((sum, item) => sum + item.total_points, 0)
  const studentsWithWarning = monthlyData.filter(item => item.total_violations >= 3).length

  return (
    <div className="space-y-6">
      {/* Bá»™ lá»c */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            BÃ¡o cÃ¡o vi pháº¡m theo thÃ¡ng há»c kÃ¬
          </CardTitle>
          <CardDescription>
            Xáº¿p háº¡ng há»c sinh theo sá»‘ láº§n vi pháº¡m trong thÃ¡ng (4 tuáº§n)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label htmlFor="month-select" className="text-sm font-medium">ThÃ¡ng há»c kÃ¬</label>
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
              <label className="text-sm font-medium">Khá»‘i lá»›p</label>
              <Select value={selectedBlock} onValueChange={handleBlockChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Táº¥t cáº£ khá»‘i" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Táº¥t cáº£ khá»‘i</SelectItem>
                  {blocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lá»›p</label>
              <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedBlock}>
                <SelectTrigger>
                  <SelectValue placeholder="Táº¥t cáº£ lá»›p" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Táº¥t cáº£ lá»›p</SelectItem>
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
                {isLoading ? 'Äang táº£i...' : 'Táº£i dá»¯ liá»‡u'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thá»‘ng kÃª tá»•ng quan */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Há»c sinh vi pháº¡m</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudentsWithViolations}</div>
            <p className="text-xs text-muted-foreground">
              ThÃ¡ng {selectedMonth}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tá»•ng vi pháº¡m</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViolations}</div>
            <p className="text-xs text-muted-foreground">
              Láº§n vi pháº¡m
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cáº§n cáº£nh bÃ¡o</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{studentsWithWarning}</div>
            <p className="text-xs text-muted-foreground">
              â‰¥3 láº§n vi pháº¡m
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Äiá»ƒm bá»‹ trá»«</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPointsDeducted}</div>
            <p className="text-xs text-muted-foreground">
              Tá»•ng Ä‘iá»ƒm trá»«
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Báº£ng xáº¿p háº¡ng */}
      <Card>
        <CardHeader>
          <CardTitle>Xáº¿p háº¡ng vi pháº¡m theo thÃ¡ng</CardTitle>
          <CardDescription>
            Há»c sinh vi pháº¡m nhiá»u nháº¥t hiá»ƒn thá»‹ trÃªn cÃ¹ng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Äang táº£i dá»¯ liá»‡u...</div>
          ) : monthlyData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Háº¡ng</TableHead>
                  <TableHead>Há»c sinh</TableHead>
                  <TableHead>Lá»›p</TableHead>
                  <TableHead>Sá»‘ vi pháº¡m</TableHead>
                  <TableHead>Äiá»ƒm trá»«</TableHead>
                  <TableHead>Má»©c Ä‘á»™</TableHead>
                  <TableHead className="text-right">Thao tÃ¡c</TableHead>
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
                          {item.total_violations} láº§n
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          -{item.total_points} Ä‘iá»ƒm
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
                            ÄÃ¡nh dáº¥u Ä‘Ã£ xem
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
              KhÃ´ng cÃ³ vi pháº¡m nÃ o trong thÃ¡ng {selectedMonth}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
