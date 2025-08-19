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
import { getWeeklyGroupedViolationsAction } from '@/features/violations/actions/violation-actions'
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
    // TÃ­nh ngÃ y báº¯t Ä‘áº§u vÃ  káº¿t thÃºc cá»§a tuáº§n dá»±a trÃªn sá»‘ tuáº§n
    const semesterStart = currentSemester?.start_date ? new Date(currentSemester.start_date) : new Date('2024-01-01')
    const weekStart = addWeeks(startOfWeek(semesterStart, { weekStartsOn: 1 }), weekNumber - 1)
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })

    const label = `Tuáº§n ${weekNumber} (${format(weekStart, 'dd/MM', { locale: vi })} - ${format(weekEnd, 'dd/MM/yyyy', { locale: vi })})`

    return { start: weekStart, end: weekEnd, label }
  }

  function getWeekOptions(): Array<{ value: number; label: string }> {
    const currentWeek = getCurrentWeek()
    const options = []
    for (let i = 1; i <= Math.max(currentWeek, 20); i++) {
      const weekRange = getWeekDateRange(i)
      options.push({
        value: i,
        label: `${weekRange.label}${i === currentWeek ? ' - Hiá»‡n táº¡i' : ''}`
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

  // Khá»Ÿi táº¡o tuáº§n hiá»‡n táº¡i má»™t láº§n khi há»c kÃ¬ sáºµn sÃ ng
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


  // Chá»‰ load dá»¯ liá»‡u sau khi Ä‘Ã£ khá»Ÿi táº¡o tuáº§n hiá»‡n táº¡i
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
      console.error('Lá»—i táº£i há»c kÃ¬ hiá»‡n táº¡i:', error)
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
        // Transform the grouped violations data into weekly reports format
        const transformedReports: WeeklyViolationReport[] = result.data.map(item => ({
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
          week_number: selectedWeek,
          week_start_date: new Date(Date.now() - (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          week_end_date: new Date().toISOString().split('T')[0],
          total_violations: item.total_violations,
          total_points_deducted: item.total_points,
          weekly_score: Math.max(0, 100 - item.total_points),
          violation_details: item.violations.map(v => ({
            type: v.name,
            points: v.points,
            description: v.description || '',
            date: v.date || new Date().toISOString().split('T')[0]
          })),
          is_sent_to_teacher: false,
          sent_at: null
        }))
        setReports(transformedReports)
      } else {
        setReports([])
      }
    } catch (error) {
      console.error('Lá»—i táº£i bÃ¡o cÃ¡o tuáº§n:', error)
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendToTeachers = async () => {
    try {
      // For now, just mark as sent - can implement actual sending later
      toast.success(`ÄÃ£ gá»­i bÃ¡o cÃ¡o tuáº§n ${selectedWeek} cho cÃ¡c GVCN`)
      loadWeeklyReports()
    } catch (error) {
      console.error('Lá»—i gá»­i bÃ¡o cÃ¡o:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi gá»­i bÃ¡o cÃ¡o')
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
      {/* Bá»™ lá»c */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            BÃ¡o cÃ¡o vi pháº¡m theo tuáº§n
          </CardTitle>
          <CardDescription>
            Gá»™p vi pháº¡m theo há»c sinh trong tá»«ng tuáº§n há»c - Má»—i há»c sinh báº¯t Ä‘áº§u vá»›i 100 Ä‘iá»ƒm/tuáº§n
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label htmlFor="week-select" className="text-sm font-medium">Tuáº§n</label>
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

            <div className="flex items-end gap-2">
              <Button onClick={loadWeeklyReports} disabled={isLoading} variant="outline">
                {isLoading ? 'Äang táº£i...' : 'Táº£i dá»¯ liá»‡u'}
              </Button>
              {reports.length > 0 && (
                <Button onClick={handleSendToTeachers} className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Gá»­i cho GVCN
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Thá»‘ng kÃª tá»•ng quan */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Há»c sinh vi pháº¡m</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudentsWithViolations}</div>
            <p className="text-xs text-muted-foreground">
              Tuáº§n {selectedWeek}
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
            <CardTitle className="text-sm font-medium">Äiá»ƒm bá»‹ trá»«</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPointsDeducted}</div>
            <p className="text-xs text-muted-foreground">
              Tá»•ng Ä‘iá»ƒm trá»«
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Äiá»ƒm TB</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Äiá»ƒm trung bÃ¬nh
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Báº£ng chi tiáº¿t */}
      <Card>
        <CardHeader>
          <CardTitle>Chi tiáº¿t vi pháº¡m theo há»c sinh</CardTitle>
          <CardDescription>
            Má»—i há»c sinh lÃ  má»™t item gá»™p táº¥t cáº£ vi pháº¡m trong tuáº§n
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            if (isLoading) return <div className="text-center py-8">Äang táº£i dá»¯ liá»‡u...</div>
            if (reports.length === 0) return (
              <div className="text-center text-muted-foreground py-8">
                KhÃ´ng cÃ³ vi pháº¡m nÃ o trong tuáº§n {selectedWeek}
              </div>
            )
            return (
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Há»c sinh</TableHead>
                  <TableHead>Lá»›p</TableHead>
                  <TableHead>Sá»‘ vi pháº¡m</TableHead>
                  <TableHead>Äiá»ƒm trá»«</TableHead>
                  <TableHead>Äiá»ƒm tuáº§n</TableHead>
                  <TableHead>Chi tiáº¿t vi pháº¡m</TableHead>
                  <TableHead>Tráº¡ng thÃ¡i</TableHead>
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
                        {report.total_violations} láº§n
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">
                        -{report.total_points_deducted} Ä‘iá»ƒm
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
                            <span className="text-muted-foreground"> (-{violation.points} Ä‘iá»ƒm)</span>
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
                        <Badge variant="default">ÄÃ£ gá»­i GVCN</Badge>
                      ) : (
                        <Badge variant="secondary">ChÆ°a gá»­i</Badge>
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
