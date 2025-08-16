'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Save, X, Send } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

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
  readonly studentId: string
}



// Helper function to organize grades by component type for table display
const organizeGradesForTable = (subjectGrades: StudentGrade[]) => {
  const organized = {
    regular: [] as StudentGrade[],
    midterm: null as StudentGrade | null,
    final: null as StudentGrade | null,
    semester: [] as StudentGrade[],
    yearly: null as StudentGrade | null
  }

  subjectGrades.forEach(grade => {
    if (grade.component_type.startsWith('regular_')) {
      organized.regular.push(grade)
    } else if (grade.component_type === 'midterm') {
      organized.midterm = grade
    } else if (grade.component_type === 'final') {
      organized.final = grade
    } else if (grade.component_type.startsWith('semester_')) {
      organized.semester.push(grade)
    } else if (grade.component_type === 'yearly') {
      organized.yearly = grade
    }
  })

  return organized
}

// Calculate TBM (Trung Bình Môn) according to Vietnamese formula
const calculateTBM = (organized: ReturnType<typeof organizeGradesForTable>, editingGrades: Record<string, string>) => {
  const allGrades: number[] = []

  // Add regular grades (Điểm miệng)
  organized.regular.forEach(grade => {
    const editedValue = editingGrades[grade.id]
    const value = editedValue ? parseFloat(editedValue) : grade.grade_value
    if (!isNaN(value)) allGrades.push(value)
  })

  // Add midterm grade (Điểm giữa kì)
  if (organized.midterm) {
    const editedValue = editingGrades[organized.midterm.id]
    const value = editedValue ? parseFloat(editedValue) : organized.midterm.grade_value
    if (!isNaN(value)) allGrades.push(value)
  }

  // Add final grade (Điểm cuối kì)
  if (organized.final) {
    const editedValue = editingGrades[organized.final.id]
    const value = editedValue ? parseFloat(editedValue) : organized.final.grade_value
    if (!isNaN(value)) allGrades.push(value)
  }

  // Calculate average: sum of all grades / total number of grades
  if (allGrades.length === 0) return null

  const sum = allGrades.reduce((acc, grade) => acc + grade, 0)
  const average = sum / allGrades.length

  return Math.round(average * 10) / 10 // Round to 1 decimal place
}

export function StudentGradeDetailClient({ studentId }: StudentGradeDetailClientProps) {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [grades, setGrades] = useState<StudentGrade[]>([])
  const [periods, setPeriods] = useState<GradeReportingPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [editingGrades, setEditingGrades] = useState<Record<string, string>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
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

  // Handle grade value change with validation
  const handleGradeChange = (gradeId: string, value: string) => {
    // Allow empty string for clearing
    if (value === '') {
      setEditingGrades(prev => ({
        ...prev,
        [gradeId]: value
      }))
      setHasUnsavedChanges(true)
      return
    }

    // Validate decimal format (up to 2 decimal places)
    const decimalRegex = /^\d+(\.\d{0,2})?$/
    if (!decimalRegex.test(value)) {
      return // Don't update if invalid format
    }

    const numValue = parseFloat(value)

    // Validate range (0 to 10)
    if (numValue < 0 || numValue > 10) {
      return // Don't update if out of range
    }

    setEditingGrades(prev => ({
      ...prev,
      [gradeId]: value
    }))
    setHasUnsavedChanges(true)
  }

  // Handle save all grades
  const handleSaveAllGrades = async () => {
    if (!studentInfo || Object.keys(editingGrades).length === 0) return

    try {
      setSaving(true)
      const savePromises = []

      for (const [gradeId, value] of Object.entries(editingGrades)) {
        const newValue = parseFloat(value)

        // Validate range and format
        if (isNaN(newValue) || newValue < 0 || newValue > 10) {
          toast.error(`Điểm số phải từ 0 đến 10 (Điểm: ${value})`)
          return
        }

        // Validate decimal places (max 2 decimal places)
        const decimalPlaces = (value.split('.')[1] || '').length
        if (decimalPlaces > 2) {
          toast.error(`Điểm số chỉ được có tối đa 2 chữ số thập phân (Điểm: ${value})`)
          return
        }

        const grade = grades.find(g => g.id === gradeId)
        if (!grade) continue

        // Round to 1 decimal place for storage
        const roundedValue = Math.round(newValue * 10) / 10

        const savePromise = createDetailedGradeAction({
          period_id: selectedPeriod,
          student_id: studentInfo.id,
          subject_id: grade.subject.id,
          class_id: studentInfo.class.id,
          component_type: grade.component_type as 'regular_1' | 'regular_2' | 'regular_3' | 'regular_4' | 'midterm' | 'final' | 'semester_1' | 'semester_2' | 'yearly',
          grade_value: roundedValue
        })

        savePromises.push(savePromise)
      }

      const results = await Promise.all(savePromises)
      const failedSaves = results.filter(result => !result.success)

      if (failedSaves.length === 0) {
        toast.success(`Đã lưu thành công ${results.length} điểm số`)
        setEditingGrades({})
        setHasUnsavedChanges(false)
        await loadStudentData()
      } else {
        toast.error(`Lưu thất bại ${failedSaves.length}/${results.length} điểm số`)
      }
    } catch (error) {
      console.error('Error saving grades:', error)
      toast.error('Có lỗi xảy ra khi lưu điểm số')
    } finally {
      setSaving(false)
    }
  }

  // Handle cancel all edits
  const handleCancelAllEdits = () => {
    setEditingGrades({})
    setHasUnsavedChanges(false)
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

  // Check if all subjects have complete grades (at least one grade per subject)
  const isAllSubjectsComplete = Object.values(gradesBySubject).every(({ grades: subjectGrades }) =>
    subjectGrades.length > 0
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-muted-foreground">Đang tải dữ liệu học sinh...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/grade-management/view-grades">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
              </Button>
            </Link>

            {/* Period Selection */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Kỳ báo cáo:</span>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Chọn kỳ báo cáo</option>
                {periods.map(period => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          {studentInfo && (
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && (
                <>
                  <Button
                    onClick={handleSaveAllGrades}
                    disabled={saving}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Lưu tất cả ({Object.keys(editingGrades).length})
                  </Button>
                  <Button
                    onClick={handleCancelAllEdits}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Hủy
                  </Button>
                </>
              )}
              <Button
                onClick={handleSendToTeacher}
                disabled={sendingToTeacher || !isAllSubjectsComplete || hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                {sendingToTeacher ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Gửi cho GVCN
              </Button>
            </div>
          )}
        </div>

        {!selectedPeriod ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Chọn kỳ báo cáo</h3>
              <p className="text-gray-600">Vui lòng chọn kỳ báo cáo để xem điểm số của học sinh.</p>
            </div>
          </div>
        ) : !studentInfo ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Không tìm thấy dữ liệu</h3>
              <p className="text-gray-600">Không tìm thấy thông tin học sinh hoặc điểm số trong kỳ báo cáo này.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Student Info */}
            <div className="border-b pb-4 mb-6">
              <h1 className="text-2xl font-bold mb-2">{studentInfo.full_name}</h1>
              <p className="text-gray-600">
                Mã HS: {studentInfo.student_id} • Lớp: {studentInfo.class.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {Object.keys(gradesBySubject).length} môn học • {grades.length} điểm số
                {isAllSubjectsComplete ? ' • Hoàn thành' : ' • Chưa đủ điểm'}
              </p>
            </div>

            {/* Grades Table */}
            {Object.keys(gradesBySubject).length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Chưa có điểm số</h3>
                  <p className="text-gray-600">Học sinh chưa có điểm số nào trong kỳ báo cáo này.</p>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Môn học</TableHead>
                      <TableHead>Điểm miệng</TableHead>
                      <TableHead>Điểm giữa kì</TableHead>
                      <TableHead>Điểm cuối kì</TableHead>
                      <TableHead>TBM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.values(gradesBySubject).map(({ subject, grades: subjectGrades }) => {
                      const organized = organizeGradesForTable(subjectGrades)
                      return (
                        <TableRow key={subject.id}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{subject.name_vietnamese}</div>
                              <div className="text-xs text-gray-500">{subject.code}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {organized.regular.map((grade) => (
                              <div key={grade.id} className="inline-flex items-center gap-1 mr-2">
                                {!grade.is_locked ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max="10"
                                    step="0.01"
                                    value={editingGrades[grade.id] ?? grade.grade_value.toString()}
                                    onChange={(e) => handleGradeChange(grade.id, e.target.value)}
                                    className="w-16 h-6 text-xs"
                                  />
                                ) : (
                                  <span className="text-gray-500 px-1">
                                    {grade.grade_value.toFixed(1)}
                                  </span>
                                )}
                              </div>
                            ))}
                          </TableCell>
                          <TableCell>
                            {organized.midterm && (
                              !organized.midterm.is_locked ? (
                                <Input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.01"
                                  value={editingGrades[organized.midterm.id] ?? organized.midterm.grade_value.toString()}
                                  onChange={(e) => organized.midterm && handleGradeChange(organized.midterm.id, e.target.value)}
                                  className="w-16 h-6 text-xs"
                                />
                              ) : (
                                <span className="text-gray-500 px-1">
                                  {organized.midterm.grade_value.toFixed(1)}
                                </span>
                              )
                            )}
                          </TableCell>
                          <TableCell>
                            {organized.final && (
                              !organized.final.is_locked ? (
                                <Input
                                  type="number"
                                  min="0"
                                  max="10"
                                  step="0.01"
                                  value={editingGrades[organized.final.id] ?? organized.final.grade_value.toString()}
                                  onChange={(e) => organized.final && handleGradeChange(organized.final.id, e.target.value)}
                                  className="w-16 h-6 text-xs"
                                />
                              ) : (
                                <span className="text-gray-500 px-1">
                                  {organized.final.grade_value.toFixed(1)}
                                </span>
                              )
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              const calculatedTBM = calculateTBM(organized, editingGrades)
                              return (
                                <span className="font-medium text-blue-600 px-1">
                                  {calculatedTBM ? calculatedTBM.toFixed(1) : '-'}
                                </span>
                              )
                            })()}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
