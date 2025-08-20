'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Calendar, AlertTriangle, Award, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { getMonthlyRankingAction } from '@/features/violations/actions/violation-actions'
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
        label: `ThÃ¡ng ${i} (Tuáº§n ${startWeek}-${endWeek})${i === currentMonth ? ' - Hiá»‡n táº¡i' : ''}`
      })
    }
    return options
  }

  useEffect(() => {
    loadCurrentSemester()
  }, [])

  // Chá»‰ Ä‘áº·t thÃ¡ng hiá»‡n táº¡i khi semester Ä‘Æ°á»£c táº£i
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
      console.error('Lá»—i táº£i há»c kÃ¬ hiá»‡n táº¡i:', error)
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
          id: item.student!.id,
          student: {
            id: item.student!.id,
            full_name: item.student!.full_name,
            student_id: item.student!.student_id
          },
          class: {
            id: item.class!.id,
            name: item.class!.name
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
      console.error('Lá»—i táº£i tá»•ng káº¿t thÃ¡ng:', error)
      setSummaries([])
    } finally {
      setIsLoading(false)
    }
  }, [currentSemester, selectedMonth, selectedClass])

  // Load dá»¯ liá»‡u khi thÃ¡ng/lá»›p thay Ä‘á»•i
  useEffect(() => {
    if (currentSemester) {
      loadMonthlySummaries()
    }
  }, [currentSemester, selectedMonth, selectedClass, loadMonthlySummaries])

  const handleMarkAsViewed = async (summaryId: string) => {
    try {
      const student = summaries.find(s => s.id === summaryId)?.student
      if (!student || !currentSemester) return

      const { markMonthlyAlertSeenAction } = await import('@/features/violations/actions/violation-actions')
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

        toast.success('ÄÃ£ Ä‘Ã¡nh dáº¥u Ä‘Ã£ xem')
      } else {
        toast.error(res.error || 'KhÃ´ng thá»ƒ lÆ°u tráº¡ng thÃ¡i Ä‘Ã£ xem')
      }
    } catch (error) {
      console.error('Lá»—i Ä‘Ã¡nh dáº¥u Ä‘Ã£ xem:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi Ä‘Ã¡nh dáº¥u Ä‘Ã£ xem')
    }
  }

  // Simplified rendering; remove unused helpers to satisfy lint. Levels handled inline.

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-center py-8">Äang táº£i dá»¯ liá»‡u...</div>
    }

    if (summaries.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          KhÃ´ng cÃ³ vi pháº¡m nÃ o trong thÃ¡ng {selectedMonth}
        </div>
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Háº¡ng</TableHead>
            <TableHead>Há»c sinh</TableHead>
            <TableHead>Lá»›p</TableHead>
            <TableHead>Sá»‘ vi pháº¡m</TableHead>
            <TableHead>Äiá»ƒm trá»«</TableHead>
            <TableHead>Tráº¡ng thÃ¡i</TableHead>
            <TableHead>Thao tÃ¡c</TableHead>
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
                  {summary.total_violations} láº§n
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="destructive">
                  -{summary.total_points_deducted} Ä‘iá»ƒm
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {summary.is_flagged && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Cáº£nh bÃ¡o
                    </Badge>
                  )}
                  {summary.is_admin_viewed && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      ÄÃ£ xem
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
                    ÄÃ¡nh dáº¥u Ä‘Ã£ xem
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
      {/* Bá»™ lá»c */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tá»•ng káº¿t vi pháº¡m theo thÃ¡ng há»c kÃ¬
          </CardTitle>
          <CardDescription>
            Xáº¿p háº¡ng há»c sinh theo sá»‘ láº§n vi pháº¡m trong thÃ¡ng (4 tuáº§n) - Cáº£nh bÃ¡o khi â‰¥3 vi pháº¡m
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="month-select" className="text-sm font-medium">ThÃ¡ng há»c kÃ¬</label>
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
              <label htmlFor="class-select" className="text-sm font-medium">Lá»›p (tÃ¹y chá»n)</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="Táº¥t cáº£ lá»›p" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Táº¥t cáº£ lá»›p</SelectItem>
                  <SelectItem value="10A1">10A1</SelectItem>
                  <SelectItem value="10A2">10A2</SelectItem>
                  <SelectItem value="10A3">10A3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button onClick={loadMonthlySummaries} disabled={isLoading} className="w-full">
                {isLoading ? 'Äang táº£i...' : 'Táº£i dá»¯ liá»‡u'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>



      {/* Báº£ng xáº¿p háº¡ng */}
      <Card>
        <CardHeader>
          <CardTitle>Xáº¿p háº¡ng vi pháº¡m theo thÃ¡ng</CardTitle>
          <CardDescription>
            Há»c sinh vi pháº¡m nhiá»u nháº¥t hiá»ƒn thá»‹ trÃªn cÃ¹ng - Click &quot;ÄÃ£ xem&quot; Ä‘á»ƒ giáº£m sá»‘ Ä‘áº¿m á»Ÿ sidebar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}
