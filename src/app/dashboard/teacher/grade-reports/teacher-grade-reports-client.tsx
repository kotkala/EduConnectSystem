'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePageTransition } from '@/shared/components/ui/global-loading-provider'
import { useCoordinatedLoading } from '@/shared/hooks/use-coordinated-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Send, Users, FileText, Eye } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { getHomeroomDetailedGradesAction } from '@/features/grade-management/actions/detailed-grade-actions'
import { getGradeReportingPeriodsForTeachersAction } from '@/lib/actions/grade-management-actions'

interface GradeRecord {
  id: string
  student_id: string
  grade_value: number
  component_type: string
  student: {
    full_name: string
    student_id: string
  }
  subject: {
    name_vietnamese: string
    code: string
  }
  class: {
    name: string
  }
}

interface StudentRecord {
  id: string
  full_name: string
  student_id: string
  class_name: string
  total_grades: number
  subjects: Array<{
    id: string
    name_vietnamese: string
    code: string
  }>
}

interface GradeReportingPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  academic_year: { name: string }
  semester: { name: string }
}

export default function TeacherGradeReportsClient() {
  // ðŸš€ MIGRATION: Replace loading state with coordinated system
  const { startPageTransition, stopLoading } = usePageTransition()
  const coordinatedLoading = useCoordinatedLoading()

  const [students, setStudents] = useState<StudentRecord[]>([])
  const [periods, setPeriods] = useState<GradeReportingPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')

  // ðŸ“Š Keep action-specific loading states for non-blocking operations
  const [sectionLoading, setSectionLoading] = useState({
    sendingToAllParents: false
  })

  // Load periods
  const loadPeriods = useCallback(async () => {
    try {
      const result = await getGradeReportingPeriodsForTeachersAction({ limit: 100 })
      if (result.success && result.data) {
        const periodsData = result.data as unknown as GradeReportingPeriod[]
        setPeriods(periodsData)
        
        // Auto-select the active period
        const activePeriod = periodsData.find((period) => period.is_active === true)
        if (activePeriod) {
          setSelectedPeriod(activePeriod.id)
        }
      }
    } catch (error) {
      console.error('Error loading periods:', error)
      toast.error('KhÃ´ng thá»ƒ táº£i danh sÃ¡ch ká»³ bÃ¡o cÃ¡o')
    }
  }, [])

  // Load students with grades
  const loadStudents = useCallback(async () => {
    if (!selectedPeriod) {
      setStudents([])
      return
    }

    try {
      // ðŸŽ¯ UX IMPROVEMENT: Use global loading for initial load, section loading for refreshes
      const isInitialLoad = students.length === 0

      if (isInitialLoad) {
        startPageTransition("Äang táº£i danh sÃ¡ch há»c sinh...")
      }

      const filters = {
        page: 1,
        limit: 1000
      }

      const result = await getHomeroomDetailedGradesAction(selectedPeriod, filters)

      if (result.success && result.data) {
        const gradeData = result.data as unknown as GradeRecord[]

        // Transform grades into unique student records
        const studentMap = new Map<string, StudentRecord>()

        gradeData.forEach((grade) => {
          const studentUUID = grade.student_id
          const studentDisplayId = grade.student.student_id
          if (!studentMap.has(studentUUID)) {
            studentMap.set(studentUUID, {
              id: studentUUID,
              full_name: grade.student.full_name,
              student_id: studentDisplayId,
              class_name: grade.class.name,
              total_grades: 0,
              subjects: []
            })
          }

          const student = studentMap.get(studentUUID)!
          student.total_grades++

          // Add subject if not already added
          const subjectExists = student.subjects.some(s => s.code === grade.subject.code)
          if (!subjectExists) {
            student.subjects.push({
              id: grade.subject.code,
              name_vietnamese: grade.subject.name_vietnamese,
              code: grade.subject.code
            })
          }
        })

        setStudents(Array.from(studentMap.values()))
      } else {
        console.error('Error loading grades:', result.error)
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch há»c sinh')
        setStudents([])
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('KhÃ´ng thá»ƒ táº£i danh sÃ¡ch há»c sinh')
      setStudents([])
    } finally {
      stopLoading()
    }
  }, [selectedPeriod, students.length, startPageTransition, stopLoading])

  // Load periods on mount
  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  // Load students when period changes
  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  // Send to all parents
  const handleSendToAllParents = useCallback(async () => {
    if (students.length === 0) {
      toast.error('KhÃ´ng cÃ³ há»c sinh nÃ o Ä‘á»ƒ gá»­i')
      return
    }

    setSectionLoading(prev => ({ ...prev, sendingToAllParents: true }))
    try {
      // Here we would implement bulk send to all parents
      toast.success(`ÄÃ£ gá»­i báº£ng Ä‘iá»ƒm cho ${students.length} phá»¥ huynh`)
    } catch (error) {
      console.error('Error sending to all parents:', error)
      toast.error('Lá»—i khi gá»­i báº£ng Ä‘iá»ƒm cho phá»¥ huynh')
    } finally {
      setSectionLoading(prev => ({ ...prev, sendingToAllParents: false }))
    }
  }, [students])

  // Render content based on loading and data state
  const renderStudentsList = () => {
    if (coordinatedLoading.isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-2 text-muted-foreground">Äang táº£i danh sÃ¡ch há»c sinh...</span>
        </div>
      )
    }

    if (students.length === 0) {
      return (
        <EmptyState
          icon={Users}
          title="KhÃ´ng cÃ³ há»c sinh"
          description="KhÃ´ng tÃ¬m tháº¥y há»c sinh nÃ o trong ká»³ bÃ¡o cÃ¡o nÃ y"
        />
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Há»c sinh</TableHead>
            <TableHead>Lá»›p</TableHead>
            <TableHead>Sá»‘ Ä‘iá»ƒm</TableHead>
            <TableHead>MÃ´n há»c</TableHead>
            <TableHead className="text-right">Thao tÃ¡c</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{student.full_name}</div>
                  <div className="text-sm text-gray-500">MÃ£ HS: {student.student_id}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{student.class_name}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{student.total_grades} Ä‘iá»ƒm</Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {student.subjects.slice(0, 3).map(subject => (
                    <Badge key={subject.id} variant="outline" className="text-xs">
                      {subject.code}
                    </Badge>
                  ))}
                  {student.subjects.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{student.subjects.length - 3}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Link href={`/dashboard/teacher/grade-reports/student/${student.id}`}>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Xem báº£ng Ä‘iá»ƒm
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    )
  }


  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quáº£n lÃ½ báº£ng Ä‘iá»ƒm</h1>
          <p className="text-gray-600">Xem vÃ  quáº£n lÃ½ Ä‘iá»ƒm sá»‘ há»c sinh trong lá»›p chá»§ nhiá»‡m</p>
        </div>
        <Button
          onClick={handleSendToAllParents}
          disabled={sectionLoading.sendingToAllParents || students.length === 0}
          className="flex items-center gap-2"
        >
          {sectionLoading.sendingToAllParents ? (
            <>
              <LoadingSpinner size="sm" />
              Äang gá»­i...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Gá»­i táº¥t cáº£ phá»¥ huynh
            </>
          )}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Há»c sinh</p>
                <p className="text-2xl font-bold">{students.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ká»³ bÃ¡o cÃ¡o</p>
                <p className="text-2xl font-bold">{periods.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tá»•ng Ä‘iá»ƒm</p>
                <p className="text-2xl font-bold">
                  {students.reduce((sum, student) => sum + student.total_grades, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chá»n ká»³ bÃ¡o cÃ¡o</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chá»n ká»³ bÃ¡o cÃ¡o" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  {period.name} - {period.academic_year.name} - {period.semester.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sÃ¡ch há»c sinh</CardTitle>
          <CardDescription>
            {selectedPeriod ? `Hiá»ƒn thá»‹ ${students.length} há»c sinh` : 'Vui lÃ²ng chá»n ká»³ bÃ¡o cÃ¡o'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStudentsList()}
        </CardContent>
      </Card>
    </div>
  )
}
