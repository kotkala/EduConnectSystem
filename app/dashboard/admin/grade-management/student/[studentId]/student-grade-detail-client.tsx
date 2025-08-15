'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Edit, Save, X, Send, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { getDetailedGradesAction, createDetailedGradeAction, sendGradesToHomeroomTeacherAction, checkClassGradeCompletionAction } from '@/lib/actions/detailed-grade-actions'
import { getGradeReportingPeriodsAction } from '@/lib/actions/grade-management-actions'

interface StudentGrade {
  id: string
  grade_value: number
  component_type: string
  is_locked: boolean
  subject: {
    id: string
    name_vietnamese: string
    code: string
  }
}

interface StudentInfo {
  id: string
  full_name: string
  student_id: string
  class: {
    id: string
    name: string
  }
}

interface GradeReportingPeriod {
  id: string
  name: string
  is_active: boolean
}

interface StudentGradeDetailClientProps {
  studentId: string
}

const COMPONENT_TYPES = [
  { value: 'regular_1', label: 'Điểm thường xuyên 1' },
  { value: 'regular_2', label: 'Điểm thường xuyên 2' },
  { value: 'regular_3', label: 'Điểm thường xuyên 3' },
  { value: 'regular_4', label: 'Điểm thường xuyên 4' },
  { value: 'midterm', label: 'Điểm giữa kỳ' },
  { value: 'final', label: 'Điểm cuối kỳ' },
  { value: 'semester_1', label: 'Điểm học kỳ 1' },
  { value: 'semester_2', label: 'Điểm học kỳ 2' },
  { value: 'yearly', label: 'Điểm cả năm' }
]

export function StudentGradeDetailClient({ studentId }: StudentGradeDetailClientProps) {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [grades, setGrades] = useState<StudentGrade[]>([])
  const [periods, setPeriods] = useState<GradeReportingPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [editingGrade, setEditingGrade] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [sendingToTeacher, setSendingToTeacher] = useState(false)

  // Load student data
  const loadStudentData = useCallback(async () => {
    if (!selectedPeriod) return

    try {
      setLoading(true)
      
      // Load grades for this student in the selected period
      const gradesResult = await getDetailedGradesAction(selectedPeriod, {
        student_id: studentId,
        limit: 1000
      })

      if (gradesResult.success && gradesResult.data) {
        const gradeData = gradesResult.data as Array<{
          id: string
          grade_value: number
          component_type: string
          is_locked: boolean
          student_id: string
          class_id: string
          subject_id: string
          student?: { full_name: string; student_id: string }
          class?: { name: string }
          subject?: { name_vietnamese: string; code: string }
        }>
        
        if (gradeData.length > 0) {
          // Set student info from first grade record
          const firstGrade = gradeData[0]
          setStudentInfo({
            id: firstGrade.student_id,
            full_name: firstGrade.student?.full_name || 'N/A',
            student_id: firstGrade.student?.student_id || 'N/A',
            class: {
              id: firstGrade.class_id,
              name: firstGrade.class?.name || 'N/A'
            }
          })

          // Transform grades data
          const transformedGrades: StudentGrade[] = gradeData.map(grade => ({
            id: grade.id,
            grade_value: grade.grade_value,
            component_type: grade.component_type,
            is_locked: grade.is_locked,
            subject: {
              id: grade.subject_id,
              name_vietnamese: grade.subject?.name_vietnamese || 'N/A',
              code: grade.subject?.code || 'N/A'
            }
          }))

          setGrades(transformedGrades)
        } else {
          setGrades([])
          setStudentInfo(null)
        }
      } else {
        toast.error(gradesResult.error || 'Không thể tải dữ liệu học sinh')
        setGrades([])
        setStudentInfo(null)
      }
    } catch (error) {
      console.error('Error loading student data:', error)
      toast.error('Có lỗi xảy ra khi tải dữ liệu học sinh')
      setGrades([])
      setStudentInfo(null)
    } finally {
      setLoading(false)
    }
  }, [studentId, selectedPeriod])

  // Load periods
  const loadPeriods = useCallback(async () => {
    try {
      const result = await getGradeReportingPeriodsAction({ limit: 100 })
      if (result.success && result.data) {
        const periodsData = result.data as unknown as GradeReportingPeriod[]
        setPeriods(periodsData)
        
        // Auto-select active period
        const activePeriod = periodsData.find(p => p.is_active)
        if (activePeriod) {
          setSelectedPeriod(activePeriod.id)
        }
      }
    } catch (error) {
      console.error('Error loading periods:', error)
      toast.error('Không thể tải danh sách kỳ báo cáo')
    }
  }, [])

  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  useEffect(() => {
    if (selectedPeriod) {
      loadStudentData()
    }
  }, [selectedPeriod, loadStudentData])

  // Handle edit grade
  const handleEditGrade = (gradeId: string, currentValue: number) => {
    setEditingGrade(gradeId)
    setEditValue(currentValue.toString())
  }

  // Handle save grade
  const handleSaveGrade = async (gradeId: string) => {
    if (!studentInfo) return

    try {
      setSaving(true)
      const newValue = parseFloat(editValue)
      
      if (isNaN(newValue) || newValue < 0 || newValue > 10) {
        toast.error('Điểm số phải từ 0 đến 10')
        return
      }

      const grade = grades.find(g => g.id === gradeId)
      if (!grade) return

      const result = await createDetailedGradeAction({
        period_id: selectedPeriod,
        student_id: studentInfo.id,
        subject_id: grade.subject.id,
        class_id: studentInfo.class.id,
        component_type: grade.component_type as 'regular_1' | 'regular_2' | 'regular_3' | 'regular_4' | 'midterm' | 'final' | 'semester_1' | 'semester_2' | 'yearly',
        grade_value: newValue
      })

      if (result.success) {
        toast.success('Cập nhật điểm số thành công')
        setEditingGrade(null)
        setEditValue('')
        await loadStudentData()
      } else {
        toast.error(result.error || 'Không thể cập nhật điểm số')
      }
    } catch (error) {
      console.error('Error saving grade:', error)
      toast.error('Có lỗi xảy ra khi cập nhật điểm số')
    } finally {
      setSaving(false)
    }
  }

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingGrade(null)
    setEditValue('')
  }

  // Send to homeroom teacher
  const handleSendToTeacher = async () => {
    if (!studentInfo) return

    try {
      setSendingToTeacher(true)
      
      // Check completion first
      const completionResult = await checkClassGradeCompletionAction(selectedPeriod, studentInfo.class.id)
      if (!completionResult.success) {
        toast.error('Không thể kiểm tra tình trạng hoàn thành điểm số')
        return
      }

      // Send to homeroom teacher
      const result = await sendGradesToHomeroomTeacherAction(selectedPeriod, studentInfo.class.id)
      if (result.success) {
        toast.success(result.message || 'Đã gửi bảng điểm tới giáo viên chủ nhiệm')
      } else {
        toast.error(result.error || 'Không thể gửi bảng điểm tới giáo viên chủ nhiệm')
      }
    } catch (error) {
      console.error('Error sending to teacher:', error)
      toast.error('Có lỗi xảy ra khi gửi bảng điểm')
    } finally {
      setSendingToTeacher(false)
    }
  }

  // Group grades by subject
  const gradesBySubject = grades.reduce((acc, grade) => {
    const subjectKey = grade.subject.id
    if (!acc[subjectKey]) {
      acc[subjectKey] = {
        subject: grade.subject,
        grades: []
      }
    }
    acc[subjectKey].grades.push(grade)
    return acc
  }, {} as Record<string, { subject: { id: string, name_vietnamese: string, code: string }, grades: StudentGrade[] }>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-muted-foreground">Đang tải dữ liệu học sinh...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/grade-management">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </Link>
        
        {/* Period Selection */}
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Chọn kỳ báo cáo</option>
          {periods.map(period => (
            <option key={period.id} value={period.id}>
              {period.name}
            </option>
          ))}
        </select>

        {/* Send to Teacher Button */}
        {studentInfo && (
          <Button
            onClick={handleSendToTeacher}
            disabled={sendingToTeacher}
            className="flex items-center gap-2 ml-auto"
          >
            {sendingToTeacher ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Gửi cho GVCN
          </Button>
        )}
      </div>

      {!selectedPeriod ? (
        <EmptyState
          icon={CheckCircle}
          title="Chọn kỳ báo cáo"
          description="Vui lòng chọn kỳ báo cáo để xem điểm số của học sinh."
        />
      ) : !studentInfo ? (
        <EmptyState
          icon={CheckCircle}
          title="Không tìm thấy dữ liệu"
          description="Không tìm thấy thông tin học sinh hoặc điểm số trong kỳ báo cáo này."
        />
      ) : (
        <>
          {/* Student Info Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="" alt={studentInfo.full_name} />
                  <AvatarFallback className="text-lg font-bold">
                    {studentInfo.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{studentInfo.full_name}</CardTitle>
                  <CardDescription className="text-lg">
                    Mã HS: {studentInfo.student_id} • Lớp: {studentInfo.class.name}
                  </CardDescription>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">
                      {Object.keys(gradesBySubject).length} môn học
                    </Badge>
                    <Badge variant="outline">
                      {grades.length} điểm số
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Grades by Subject */}
          {Object.keys(gradesBySubject).length === 0 ? (
            <EmptyState
              icon={CheckCircle}
              title="Chưa có điểm số"
              description="Học sinh chưa có điểm số nào trong kỳ báo cáo này."
            />
          ) : (
            <div className="space-y-6">
              {Object.values(gradesBySubject).map(({ subject, grades: subjectGrades }) => (
                <Card key={subject.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {subject.name_vietnamese}
                      <Badge variant="outline">{subject.code}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Loại điểm</TableHead>
                          <TableHead>Điểm số</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Thao tác</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subjectGrades.map((grade) => (
                          <TableRow key={grade.id}>
                            <TableCell>
                              {COMPONENT_TYPES.find(ct => ct.value === grade.component_type)?.label || grade.component_type}
                            </TableCell>
                            <TableCell>
                              {editingGrade === grade.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.1"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="w-20"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveGrade(grade.id)}
                                    disabled={saving}
                                  >
                                    {saving ? <LoadingSpinner size="sm" /> : <Save className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <span className="font-medium text-lg">
                                  {grade.grade_value.toFixed(1)}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {grade.is_locked ? (
                                <Badge variant="secondary">Đã khóa</Badge>
                              ) : (
                                <Badge variant="default">Có thể sửa</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {!grade.is_locked && editingGrade !== grade.id && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditGrade(grade.id, grade.grade_value)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
