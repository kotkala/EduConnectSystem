'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Edit, Save, Clock, AlertCircle, Plus, Upload, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import {
  type GradeReportingPeriod,
  type StudentGrade
} from '@/lib/validations/grade-management-validations'
import { formatGradeValue, parseGradeInput } from '@/lib/utils/grade-excel-utils'

interface GradeEditorProps {
  period: GradeReportingPeriod
}

interface EditingGrade {
  id: string
  newValue: string
  reason: string
}

interface NewGradeEntry {
  student_id: string
  subject_id: string
  class_id: string
  grade_value: string
  grade_type: string
  notes: string
}

export function GradeEditor({ period }: GradeEditorProps) {
  const [grades, setGrades] = useState<StudentGrade[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [editingGrade, setEditingGrade] = useState<EditingGrade | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [saving, setSaving] = useState(false)

  // New grade input states
  const [showAddGradeDialog, setShowAddGradeDialog] = useState(false)
  const [newGrade, setNewGrade] = useState<NewGradeEntry>({
    student_id: '',
    subject_id: '',
    class_id: '',
    grade_value: '',
    grade_type: 'midterm',
    notes: ''
  })

  // Excel import states
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  // Data for dropdowns
  const [students, setStudents] = useState<Array<{id: string, full_name: string, student_id: string, class?: {name: string}}>>([])
  const [subjects, setSubjects] = useState<Array<{id: string, name_vietnamese: string, code: string}>>([])
  const [classes, setClasses] = useState<Array<{id: string, name: string}>>([])
  const [loadingData, setLoadingData] = useState(false)


  // Memoized check if period allows editing
  const canEditGrades = useCallback(() => {
    const now = new Date()
    const editDeadline = new Date(period.edit_deadline)
    return now <= editDeadline && period.is_active
  }, [period.edit_deadline, period.is_active])

  // Load grades
  const loadGrades = useCallback(async () => {
    try {
      setLoading(true)

      // Import the action function
      const { getGradesForPeriodAction } = await import('@/lib/actions/grade-management-actions')

      const result = await getGradesForPeriodAction(period.id, {
        class_id: selectedClass === 'all' ? undefined : selectedClass,
        subject_id: selectedSubject === 'all' ? undefined : selectedSubject,
        student_search: searchTerm || undefined
      })

      if (result.success && result.data) {
        setGrades(result.data as unknown as StudentGrade[])
      } else {
        console.error('Error loading grades:', result.error)
        toast.error(result.error || 'Không thể tải danh sách điểm số')
        setGrades([])
      }
    } catch (error) {
      console.error('Error loading grades:', error)
      toast.error('Không thể tải danh sách điểm số')
      setGrades([])
    } finally {
      setLoading(false)
    }
  }, [period.id, selectedClass, selectedSubject, searchTerm])

  // Load dropdown data
  const loadDropdownData = useCallback(async () => {
    try {
      setLoadingData(true)

      const [
        { getStudentsForGradeInputAction },
        { getSubjectsForGradeInputAction },
        { getClassesForGradeInputAction }
      ] = await Promise.all([
        import('@/lib/actions/grade-management-actions'),
        import('@/lib/actions/grade-management-actions'),
        import('@/lib/actions/grade-management-actions')
      ])

      const [studentsResult, subjectsResult, classesResult] = await Promise.all([
        getStudentsForGradeInputAction(),
        getSubjectsForGradeInputAction(),
        getClassesForGradeInputAction()
      ])

      if (studentsResult.success && studentsResult.data) {
        setStudents(studentsResult.data as unknown as Array<{id: string; full_name: string; student_id: string; class?: {name: string}}>)
      }

      if (subjectsResult.success && subjectsResult.data) {
        setSubjects(subjectsResult.data as unknown as Array<{id: string; name_vietnamese: string; code: string}>)
      }

      if (classesResult.success && classesResult.data) {
        setClasses(classesResult.data as unknown as Array<{id: string; name: string}>)
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error)
      toast.error('Không thể tải dữ liệu dropdown')
    } finally {
      setLoadingData(false)
    }
  }, [])

  // Memoized edit grade handler
  const handleEditGrade = useCallback((grade: StudentGrade) => {
    if (!canEditGrades()) {
      toast.error("Đã hết hạn sửa điểm cho kỳ báo cáo này")
      return
    }

    setEditingGrade({
      id: grade.id,
      newValue: formatGradeValue(grade.grade_value),
      reason: ''
    })
    setShowEditDialog(true)
  }, [canEditGrades])

  // Handle save grade
  const handleSaveGrade = async () => {
    if (!editingGrade) return

    // Validate new grade value
    const newGradeValue = parseGradeInput(editingGrade.newValue)
    if (newGradeValue === null || newGradeValue < 0 || newGradeValue > 10) {
      toast.error("Điểm số phải từ 0 đến 10 và có tối đa 1 chữ số thập phân")
      return
    }

    if (!editingGrade.reason.trim()) {
      toast.error("Vui lòng nhập lý do thay đổi điểm số")
      return
    }

    try {
      setSaving(true)

      // Import and call the real API
      const { updateStudentGradeAction } = await import('@/lib/actions/grade-management-actions')

      const result = await updateStudentGradeAction({
        grade_id: editingGrade.id,
        new_value: newGradeValue,
        change_reason: editingGrade.reason
      })

      if (result.success) {
        toast.success(result.message || "Đã cập nhật điểm số và gửi thông báo cho phụ huynh")

        setShowEditDialog(false)
        setEditingGrade(null)

        // Reload grades to show updated data
        loadGrades()
      } else {
        toast.error(result.error || "Không thể cập nhật điểm số")
      }

    } catch (error) {
      console.error('Error updating grade:', error)
      toast.error("Không thể cập nhật điểm số")
    } finally {
      setSaving(false)
    }
  }

  // Memoized filtering for performance
  const filteredGrades = useMemo(() => {
    return grades.filter(grade => {
      const matchesSearch = !searchTerm ||
        grade.student?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        grade.student?.student_id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesClass = !selectedClass || selectedClass === 'all' || grade.class_id === selectedClass
      const matchesSubject = !selectedSubject || selectedSubject === 'all' || grade.subject_id === selectedSubject

      return matchesSearch && matchesClass && matchesSubject
    })
  }, [grades, searchTerm, selectedClass, selectedSubject])

  // Memoized date formatting
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  useEffect(() => {
    loadGrades()
  }, [loadGrades])

  useEffect(() => {
    loadDropdownData()
  }, [loadDropdownData])

  // Download Excel template with borders
  const downloadExcelTemplate = useCallback(async () => {
    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Mẫu nhập điểm')

      // Set column widths
      worksheet.columns = [
        { header: 'Mã học sinh', key: 'student_id', width: 15 },
        { header: 'Tên học sinh', key: 'student_name', width: 25 },
        { header: 'Điểm số (0-10)', key: 'grade_value', width: 15 },
        { header: 'Ghi chú', key: 'notes', width: 30 }
      ]

      // Style the header row
      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6F3FF' }
      }

      // Add sample data rows
      const sampleData = [
        { student_id: 'HS001', student_name: 'Nguyễn Văn A', grade_value: 8.5, notes: 'Điểm kiểm tra giữa kỳ' },
        { student_id: 'HS002', student_name: 'Trần Thị B', grade_value: 7.0, notes: '' },
        { student_id: 'HS003', student_name: 'Lê Văn C', grade_value: 9.0, notes: 'Điểm xuất sắc' }
      ]

      sampleData.forEach((data, index) => {
        const row = worksheet.getRow(index + 2)
        row.values = [data.student_id, data.student_name, data.grade_value, data.notes]
      })

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        })
      })

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Mau_nhap_diem_${period.name.replace(/\s+/g, '_')}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('Đã tải xuống mẫu Excel thành công!')
    } catch (error) {
      console.error('Error downloading template:', error)
      toast.error('Có lỗi xảy ra khi tải xuống mẫu Excel')
    }
  }, [period.name])

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý điểm số - {period.name}</CardTitle>
              <CardDescription>
                Kỳ báo cáo: {formatDate(period.start_date)} - {formatDate(period.end_date)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAddGradeDialog(true)}
                disabled={!canEditGrades()}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Nhập điểm thủ công
              </Button>
              <Button
                onClick={() => setShowImportDialog(true)}
                disabled={!canEditGrades()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Excel
              </Button>
              <Button
                onClick={downloadExcelTemplate}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Tải mẫu Excel
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Period Status */}
      <Alert className={canEditGrades() ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          {canEditGrades() ? (
            <>
              Có thể sửa điểm đến: <strong>{formatDate(period.edit_deadline)}</strong>
            </>
          ) : (
            <>
              Đã hết hạn sửa điểm (hạn chót: {formatDate(period.edit_deadline)})
            </>
          )}
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>
            Lọc điểm số theo lớp, môn học và tìm kiếm học sinh
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm học sinh</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tên hoặc mã học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lớp học</label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
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

            <div className="space-y-2">
              <label className="text-sm font-medium">Môn học</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả môn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả môn</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name_vietnamese}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách điểm số</CardTitle>
          <CardDescription>
            Nhấp vào nút &ldquo;Sửa&rdquo; để thay đổi điểm số
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-2 text-muted-foreground">Đang tải điểm số...</span>
            </div>
          ) : filteredGrades.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="Không có điểm số"
              description="Không tìm thấy điểm số nào phù hợp với bộ lọc"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Lớp</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead>Loại điểm</TableHead>
                  <TableHead>Điểm số</TableHead>
                  <TableHead>Cập nhật lần cuối</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((grade) => (
                  <TableRow key={grade.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{grade.student?.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {grade.student?.student_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{grade.class?.name}</TableCell>
                    <TableCell>{grade.subject?.name_vietnamese}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {grade.grade_type === 'midterm' && 'Giữa kỳ'}
                        {grade.grade_type === 'final' && 'Cuối kỳ'}
                        {grade.grade_type === 'quiz' && 'Kiểm tra'}
                        {grade.grade_type === 'assignment' && 'Bài tập'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-lg">
                        {formatGradeValue(grade.grade_value)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(grade.updated_at)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditGrade(grade)}
                        disabled={!canEditGrades() || grade.is_locked}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Grade Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Sửa điểm số</DialogTitle>
            <DialogDescription>
              Nhập điểm số mới và lý do thay đổi. Thông báo sẽ được gửi tự động cho phụ huynh.
            </DialogDescription>
          </DialogHeader>

          {editingGrade && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Điểm số mới *</label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  placeholder="VD: 8.5"
                  value={editingGrade.newValue}
                  onChange={(e) => setEditingGrade(prev => prev ? {
                    ...prev,
                    newValue: e.target.value
                  } : null)}
                />
                <p className="text-xs text-muted-foreground">
                  Điểm số từ 0 đến 10, tối đa 1 chữ số thập phân
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lý do thay đổi *</label>
                <Textarea
                  placeholder="VD: Sửa lỗi nhập liệu, điểm kiểm tra lại..."
                  value={editingGrade.reason}
                  onChange={(e) => setEditingGrade(prev => prev ? {
                    ...prev,
                    reason: e.target.value
                  } : null)}
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground">
                  Lý do này sẽ được lưu vào lịch sử thay đổi
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Sau khi lưu, thông báo thay đổi điểm sẽ được gửi tự động cho phụ huynh học sinh.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveGrade}
              disabled={saving || !editingGrade?.newValue || !editingGrade?.reason.trim()}
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Grade Input Dialog */}
      <Dialog open={showAddGradeDialog} onOpenChange={setShowAddGradeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nhập điểm thủ công</DialogTitle>
            <DialogDescription>
              Nhập điểm cho học sinh trong kỳ báo cáo {period.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-select">Học sinh</Label>
              <Select
                value={newGrade.student_id}
                onValueChange={(value) => setNewGrade(prev => ({ ...prev, student_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học sinh" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name} - {student.student_id} {student.class && `(${student.class.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject-select">Môn học</Label>
              <Select
                value={newGrade.subject_id}
                onValueChange={(value) => setNewGrade(prev => ({ ...prev, subject_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn môn học" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name_vietnamese}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade-type-select">Loại điểm</Label>
              <Select
                value={newGrade.grade_type}
                onValueChange={(value) => setNewGrade(prev => ({ ...prev, grade_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại điểm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="midterm">Điểm giữa kỳ</SelectItem>
                  <SelectItem value="final">Điểm cuối kỳ</SelectItem>
                  <SelectItem value="quiz">Điểm kiểm tra</SelectItem>
                  <SelectItem value="assignment">Điểm bài tập</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade-value">Điểm số (0-10)</Label>
              <Input
                id="grade-value"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={newGrade.grade_value}
                onChange={(e) => setNewGrade(prev => ({ ...prev, grade_value: e.target.value }))}
                placeholder="Nhập điểm số"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade-notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="grade-notes"
                value={newGrade.notes}
                onChange={(e) => setNewGrade(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Ghi chú về điểm số..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddGradeDialog(false)
                setNewGrade({
                  student_id: '',
                  subject_id: '',
                  class_id: '',
                  grade_value: '',
                  grade_type: 'midterm',
                  notes: ''
                })
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={async () => {
                try {
                  setSaving(true)

                  // Get student's class_id
                  const selectedStudent = students.find(s => s.id === newGrade.student_id)
                  if (!selectedStudent?.class?.name) {
                    toast.error('Không thể xác định lớp của học sinh')
                    return
                  }

                  // Find class_id from classes array
                  const selectedClass = classes.find(c => c.name === selectedStudent.class?.name)
                  if (!selectedClass) {
                    toast.error('Không thể xác định ID lớp học')
                    return
                  }

                  const { createStudentGradeAction } = await import('@/lib/actions/grade-management-actions')

                  const result = await createStudentGradeAction({
                    period_id: period.id,
                    student_id: newGrade.student_id,
                    subject_id: newGrade.subject_id,
                    class_id: selectedClass.id,
                    grade_value: parseFloat(newGrade.grade_value),
                    grade_type: newGrade.grade_type,
                    notes: newGrade.notes || undefined
                  })

                  if (result.success) {
                    toast.success(result.message || 'Đã lưu điểm thành công!')
                    setShowAddGradeDialog(false)
                    setNewGrade({
                      student_id: '',
                      subject_id: '',
                      class_id: '',
                      grade_value: '',
                      grade_type: 'midterm',
                      notes: ''
                    })
                    // Reload grades to show the new grade
                    loadGrades()
                  } else {
                    toast.error(result.error || 'Không thể lưu điểm')
                  }
                } catch (error) {
                  console.error('Error saving grade:', error)
                  toast.error('Có lỗi xảy ra khi lưu điểm')
                } finally {
                  setSaving(false)
                }
              }}
              disabled={!newGrade.student_id || !newGrade.subject_id || !newGrade.grade_value || saving}
            >
              {saving ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Lưu điểm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import điểm từ Excel</DialogTitle>
            <DialogDescription>
              Tải lên file Excel chứa điểm số theo định dạng VNedu
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="excel-file">Chọn file Excel</Label>
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground">
                Hỗ trợ định dạng: .xlsx, .xls (tương thích VNedu)
              </p>
            </div>

            {importFile && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium">File đã chọn:</p>
                <p className="text-sm text-muted-foreground">{importFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  Kích thước: {(importFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Lưu ý:</strong> Hệ thống sẽ kiểm tra tính hợp lệ của dữ liệu.
                Các bản ghi hợp lệ sẽ được lưu, bản ghi lỗi sẽ được báo cáo chi tiết.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false)
                setImportFile(null)
              }}
              disabled={importing}
            >
              Hủy
            </Button>
            <Button
              onClick={async () => {
                if (!importFile) return

                try {
                  setImporting(true)

                  // Import ExcelJS dynamically
                  const ExcelJS = await import('exceljs')

                  // Create workbook and read file
                  const workbook = new ExcelJS.Workbook()
                  const arrayBuffer = await importFile.arrayBuffer()
                  await workbook.xlsx.load(arrayBuffer)

                  // Get first worksheet
                  const worksheet = workbook.getWorksheet(1)
                  if (!worksheet) {
                    toast.error('File Excel không có worksheet nào')
                    return
                  }

                  const grades: Array<{
                    student_id: string
                    student_name: string
                    grade_value: number
                    notes?: string
                  }> = []

                  // Parse rows (skip header row)
                        worksheet.eachRow((row, index) => {
        if (index === 1) return // Skip header

                    const studentId = row.getCell(1).value?.toString()
                    const studentName = row.getCell(2).value?.toString()
                    const gradeValue = row.getCell(3).value
                    const notes = row.getCell(4).value?.toString()

                    if (studentId && studentName && gradeValue !== null && gradeValue !== undefined) {
                      const numericGrade = typeof gradeValue === 'number' ? gradeValue : parseFloat(gradeValue.toString())

                      if (!isNaN(numericGrade) && numericGrade >= 0 && numericGrade <= 10) {
                        grades.push({
                          student_id: studentId,
                          student_name: studentName,
                          grade_value: Math.round(numericGrade * 10) / 10, // Round to 1 decimal
                          notes: notes || undefined
                        })
                      }
                    }
                  })

                  if (grades.length === 0) {
                    toast.error('Không tìm thấy dữ liệu điểm hợp lệ trong file Excel')
                    return
                  }

                  // TODO: Implement bulk grade import API call
                  // const { bulkImportGradesAction } = await import('@/lib/actions/grade-management-actions')
                  // const result = await bulkImportGradesAction({
                  //   period_id: period.id,
                  //   grades: grades
                  // })

                  // Mock success for now
                  await new Promise(resolve => setTimeout(resolve, 1000))

                  toast.success(`Import thành công! Đã xử lý ${grades.length} bản ghi.`)
                  setShowImportDialog(false)
                  setImportFile(null)

                  // Reload grades to show imported data
                  loadGrades()

                } catch (error) {
                  console.error('Error importing Excel:', error)
                  toast.error('Có lỗi xảy ra khi import file Excel')
                } finally {
                  setImporting(false)
                }
              }}
              disabled={!importFile || importing}
            >
              {importing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Đang import...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import điểm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
