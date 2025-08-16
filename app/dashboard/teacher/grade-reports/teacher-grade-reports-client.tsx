'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Send, Users, FileText, Eye } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { getHomeroomDetailedGradesAction } from '@/lib/actions/detailed-grade-actions'
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
  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [periods, setPeriods] = useState<GradeReportingPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [sendingToAllParents, setSendingToAllParents] = useState(false)

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
      toast.error('Không thể tải danh sách kỳ báo cáo')
    }
  }, [])

  // Load students with grades
  const loadStudents = useCallback(async () => {
    if (!selectedPeriod) {
      setStudents([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

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
        toast.error(result.error || 'Không thể tải danh sách học sinh')
        setStudents([])
      }
    } catch (error) {
      console.error('Error loading students:', error)
      toast.error('Không thể tải danh sách học sinh')
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

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
      toast.error('Không có học sinh nào để gửi')
      return
    }

    setSendingToAllParents(true)
    try {
      // Here we would implement bulk send to all parents
      toast.success(`Đã gửi bảng điểm cho ${students.length} phụ huynh`)
    } catch (error) {
      console.error('Error sending to all parents:', error)
      toast.error('Lỗi khi gửi bảng điểm cho phụ huynh')
    } finally {
      setSendingToAllParents(false)
    }
  }, [students])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản lý bảng điểm</h1>
      <p>Đang phát triển...</p>
    </div>
  )
}