'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { AlertTriangle, Send, Clock, Filter, Search, Calendar } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { createClient } from '@/shared/utils/supabase/client'
import { getSeverityLabel, getSeverityColor, type StudentViolationWithDetails, violationSeverityLevels } from '@/lib/validations/violation-validations'
import { toast } from 'sonner'
import { format, endOfWeek } from 'date-fns'
import { getWeekStartDate } from '@/features/timetable/components/timetable-calendar/data-mappers'
import TeacherDisciplinaryCases from '@/features/teacher-management/components/teacher/violations/teacher-disciplinary-cases'

interface TeacherViolationsPageClientProps {
  homeroomClass: {
    id: string
    name: string
  } | null
  isHomeroomTeacher: boolean
  user: {
    id: string
    email?: string
  }
}

interface WeekOption {
  number: number
  startDate: Date
  endDate: Date
  label: string
}

interface Semester {
  id: string
  name: string
  start_date: string
  end_date: string
}

export default function TeacherViolationsPageClient({ homeroomClass, isHomeroomTeacher, user }: Readonly<TeacherViolationsPageClientProps>) {
  const [violations, setViolations] = useState<StudentViolationWithDetails[]>([])
  const [filteredViolations, setFilteredViolations] = useState<StudentViolationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [weekOptions, setWeekOptions] = useState<WeekOption[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedSemester, setSelectedSemester] = useState<string>('')
  const [activeTab, setActiveTab] = useState('violations')
  const supabase = createClient()

  useEffect(() => {
    loadSemesters()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadViolations()
  }, [selectedSemester, selectedWeek]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    filterViolations()
  }, [violations, searchTerm, severityFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedSemester) {
      generateWeekOptions()
    }
  }, [selectedSemester]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSemesters = async () => {
    try {
      const { data, error } = await supabase
        .from('semesters')
        .select('id, name, start_date, end_date')
        .order('start_date', { ascending: false })

      if (error) {
        console.error('Error loading semesters:', error)
        return
      }

      setSemesters(data || [])
      // Auto-select current semester if available
      if (data && data.length > 0) {
        setSelectedSemester(data[0].id)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const generateWeekOptions = () => {
    const semester = semesters.find(s => s.id === selectedSemester)
    if (!semester) {
      setWeekOptions([])
      return
    }

    const semesterStartDate = new Date(semester.start_date)
    const semesterEndDate = new Date(semester.end_date)

    const weeks: WeekOption[] = []
    let weekNumber = 1

    while (weekNumber <= 20) { // Max 20 weeks per semester
      // Use the same calculation as timetable system
      const weekStartDate = getWeekStartDate(semesterStartDate, weekNumber)
      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 })

      // Stop if week starts after semester ends
      if (weekStartDate > semesterEndDate) {
        break
      }

      weeks.push({
        number: weekNumber,
        startDate: weekStartDate,
        endDate: weekEndDate,
        label: `Tuáº§n ${weekNumber} (${format(weekStartDate, "dd/MM")} - ${format(weekEndDate, "dd/MM")})`,
      })
      weekNumber++
    }

    setWeekOptions(weeks)
  }

  const filterViolations = () => {
    let filtered = violations

    if (searchTerm) {
      filtered = filtered.filter(violation =>
        violation.student?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        violation.student?.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (severityFilter !== 'all') {
      filtered = filtered.filter(violation => violation.severity === severityFilter)
    }

    setFilteredViolations(filtered)
  }

  const loadViolations = async () => {
    try {
      setLoading(true)

      if (!isHomeroomTeacher || !homeroomClass) {
        // If not homeroom teacher, show empty state
        setViolations([])
        setFilteredViolations([])
        setLoading(false)
        return
      }

      // Build query with optional week filtering
      let query = supabase
        .from('student_violations')
        .select(`
          *,
          student:profiles!student_id(id, full_name, student_id),
          class:classes!class_id(id, name),
          violation_type:violation_types!violation_type_id(
            id,
            name,
            category:violation_categories!category_id(id, name)
          ),
          recorded_by:profiles!recorded_by(id, full_name)
        `)
        .eq('class_id', homeroomClass.id)

      // Add semester filter if selected
      if (selectedSemester) {
        query = query.eq('semester_id', selectedSemester)
      }

      // Add week filter if selected
      if (selectedWeek && selectedSemester) {
        const selectedWeekOption = weekOptions.find(w => w.number === selectedWeek)
        if (selectedWeekOption) {
          const startDate = selectedWeekOption.startDate.toISOString()
          const endDate = selectedWeekOption.endDate.toISOString()
          query = query
            .gte('recorded_at', startDate)
            .lte('recorded_at', endDate)
        }
      }

      const { data, error } = await query.order('recorded_at', { ascending: false })

      if (error) {
        console.error('Error loading violations:', error)
        toast.error('KhÃ´ng thá»ƒ táº£i danh sÃ¡ch vi pháº¡m')
        return
      }

      setViolations(data || [])
      setFilteredViolations(data || [])
    } catch (error) {
      console.error('Error:', error)
      toast.error('ÄÃ£ xáº£y ra lá»—i khi táº£i danh sÃ¡ch vi pháº¡m')
    } finally {
      setLoading(false)
    }
  }



  const handleSendAllToParents = async () => {
    if (filteredViolations.length === 0) {
      toast.error('KhÃ´ng cÃ³ vi pháº¡m nÃ o Ä‘á»ƒ gá»­i')
      return
    }

    try {
      // Group violations by student to avoid duplicate notifications
      const violationsByStudent = filteredViolations.reduce((acc, violation) => {
        const studentId = violation.student?.id
        if (studentId) {
          if (!acc[studentId]) {
            acc[studentId] = []
          }
          acc[studentId].push(violation)
        }
        return acc
      }, {} as Record<string, StudentViolationWithDetails[]>)

      let totalNotificationsSent = 0

      // Process each student's violations
      for (const [studentId, studentViolations] of Object.entries(violationsByStudent)) {
        // Find parent of the student
        const { data: parentStudentRelations, error: parentError } = await supabase
          .from('parent_student_relationships')
          .select('parent_id')
          .eq('student_id', studentId)

        if (parentError) {
          console.error('Error finding parent for student:', studentId, parentError)
          continue
        }

        if (!parentStudentRelations || parentStudentRelations.length === 0) {
          console.warn('No parent found for student:', studentId)
          continue
        }

        // Create summary message for all violations of this student
        const student = studentViolations[0].student
        const violationSummary = studentViolations.map(v =>
          `â€¢ ${v.violation_type?.name} (${getSeverityLabel(v.severity)})`
        ).join('\n')

        const weekInfo = selectedWeek ? ` trong tuáº§n ${selectedWeek}` : ''
        const content = `Tá»•ng há»£p vi pháº¡m cá»§a há»c sinh ${student?.full_name} (${student?.student_id})${weekInfo}:\n\n${violationSummary}\n\nVui lÃ²ng liÃªn há»‡ vá»›i giÃ¡o viÃªn chá»§ nhiá»‡m Ä‘á»ƒ biáº¿t thÃªm chi tiáº¿t.`

        // Send notification to all parents of the student
        const notifications = parentStudentRelations.map(relation => ({
          recipient_id: relation.parent_id,
          title: `Tá»•ng há»£p vi pháº¡m - ${student?.full_name}${weekInfo}`,
          content: content,
          type: 'violation_summary' as const,
          sender_id: user.id,
          target_roles: ['parent'] as string[]
        }))

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications)

        if (notificationError) {
          console.error('Error sending notifications for student:', studentId, notificationError)
          continue
        }

        totalNotificationsSent += notifications.length
      }

      if (totalNotificationsSent > 0) {
        toast.success(`ÄÃ£ gá»­i thÃ nh cÃ´ng ${totalNotificationsSent} thÃ´ng bÃ¡o tá»›i phá»¥ huynh`)
      } else {
        toast.error('KhÃ´ng thá»ƒ gá»­i thÃ´ng bÃ¡o nÃ o. Vui lÃ²ng kiá»ƒm tra láº¡i.')
      }
    } catch (error) {
      console.error('Error sending bulk notifications:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi gá»­i thÃ´ng bÃ¡o')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSeverityFilter('all')
    setSelectedWeek(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vi pháº¡m há»c sinh</h1>
            <p className="text-muted-foreground">
              {homeroomClass ? `Lá»›p: ${homeroomClass.name}` : 'Báº£ng Ä‘iá»u khiá»ƒn giÃ¡o viÃªn'}
            </p>
          </div>
        </div>
        <div className="text-center py-8">Äang táº£i danh sÃ¡ch vi pháº¡m...</div>
      </div>
    )
  }

  // Handle non-homeroom teachers
  if (!isHomeroomTeacher) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vi pháº¡m há»c sinh</h1>
            <p className="text-muted-foreground">Báº£ng Ä‘iá»u khiá»ƒn giÃ¡o viÃªn</p>
          </div>
        </div>

        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Homeroom Teacher Access Required</h3>
            <p className="text-muted-foreground mb-4">
              Only homeroom teachers can view and manage student violations.
            </p>
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vi pháº¡m lá»›p há»c</h1>
          <p className="text-muted-foreground">
            {isHomeroomTeacher && homeroomClass
              ? `Quáº£n lÃ½ vi pháº¡m cho lá»›p chá»§ nhiá»‡m: ${homeroomClass.name}`
              : "Xem vi pháº¡m cho cÃ¡c lá»›p cá»§a báº¡n"}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="violations">Vi pháº¡m lá»›p</TabsTrigger>
          <TabsTrigger value="discipline">Xá»­ lÃ½ ká»· luáº­t</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Vi pháº¡m há»c sinh</h2>
              <p className="text-muted-foreground">
                Lá»›p: {homeroomClass?.name} â€¢ {violations.length} vi pháº¡m
                {selectedWeek && (
                  <span className="text-primary ml-2">
                    â€¢ Tuáº§n {selectedWeek}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {filteredViolations.length > 0 && (
                <Button
                  onClick={handleSendAllToParents}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <Send className="h-4 w-4" />
                  Gá»­i táº¥t cáº£ cho phá»¥ huynh ({filteredViolations.length})
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bá»™ Lá»c Vi Pháº¡m
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Semester Selection */}
            <div className="space-y-2">
              <label htmlFor="semester-select" className="text-sm font-medium">Há»c Ká»³</label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger id="semester-select">
                  <SelectValue placeholder="Chá»n há»c ká»³" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id}>
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Week Selection */}
            <div className="space-y-2">
              <label htmlFor="week-select" className="text-sm font-medium">Tuáº§n Há»c</label>
              <Select
                value={selectedWeek?.toString() || "all"}
                onValueChange={(value) => setSelectedWeek(value === "all" ? null : parseInt(value))}
                disabled={!selectedSemester}
              >
                <SelectTrigger id="week-select">
                  <SelectValue placeholder="Táº¥t cáº£ tuáº§n" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Táº¥t cáº£ tuáº§n</SelectItem>
                  {weekOptions.map((week) => (
                    <SelectItem key={week.number} value={week.number.toString()}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search */}
            <div className="relative space-y-2">
              <label htmlFor="search-input" className="text-sm font-medium">TÃ¬m Kiáº¿m</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-input"
                  placeholder="TÃªn hoáº·c mÃ£ há»c sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Severity Filter */}
            <div className="space-y-2">
              <label htmlFor="severity-select" className="text-sm font-medium">Má»©c Äá»™</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger id="severity-select">
                  <SelectValue placeholder="Táº¥t cáº£ má»©c Ä‘á»™" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Táº¥t cáº£ má»©c Ä‘á»™</SelectItem>
                  {violationSeverityLevels.map((severity) => (
                    <SelectItem key={severity} value={severity}>
                      <Badge className={getSeverityColor(severity)}>
                        {getSeverityLabel(severity)}
                      </Badge>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <div className="space-y-2">
              <div className="text-sm font-medium" aria-hidden="true">&nbsp;</div>
              <Button variant="outline" onClick={clearFilters} className="w-full">
                XÃ³a Bá»™ Lá»c
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Hiá»ƒn thá»‹ {filteredViolations.length} trong tá»•ng sá»‘ {violations.length} vi pháº¡m
            {selectedWeek && (
              <span className="text-primary">
                â€¢ Tuáº§n {selectedWeek}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{violations.length}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{violations.filter(v => new Date(v.recorded_at).getMonth() === new Date().getMonth()).length}</div>
            <p className="text-xs text-muted-foreground">
              Current month
            </p>
          </CardContent>
        </Card>
      </div>

      {violations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No violations recorded</h3>
            <p className="text-muted-foreground">
              Your homeroom class has no recorded violations yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredViolations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Class Violations ({filteredViolations.length})
                </CardTitle>
                <CardDescription>
                  Violations for your homeroom class students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredViolations.map((violation) => (
                  <div key={violation.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{violation.student.full_name}</h4>
                          <Badge variant="outline">{violation.student.student_id}</Badge>
                          <Badge className={getSeverityColor(violation.severity)}>
                            {getSeverityLabel(violation.severity)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {violation.violation_type.category.name} â€¢ {violation.violation_type.name}
                        </p>
                        {violation.description && (
                          <p className="text-sm">{violation.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(violation.recorded_at).toLocaleDateString('vi-VN')}
                          </span>
                          <span>Recorded by: {violation.recorded_by.full_name}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No violations found</h3>
                <p className="text-muted-foreground">
                  {violations.length === 0
                    ? "No violations recorded for your class yet."
                    : "No violations match your current filters."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
        </TabsContent>

        <TabsContent value="discipline" className="space-y-6">
          <TeacherDisciplinaryCases />
        </TabsContent>
      </Tabs>
    </div>
  )
}
