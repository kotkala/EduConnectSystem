'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Download, Upload, Send, CheckCircle, Clock, FileText, Users } from 'lucide-react'
import { toast } from 'sonner'
import { getAcademicYearsAction, getSemestersAction } from '@/lib/actions/academic-actions'
import { getClassesAction } from '@/lib/actions/class-actions'
import { getStudentsForGradeSubmissionAction, createStudentGradeSubmissionAction, getStudentGradeSubmissionsAction, submitStudentGradesAction, sendGradesToHomeroomTeacherAction } from '@/lib/actions/individual-grade-actions'
import { createIndividualGradeTemplate, parseIndividualGradeExcel, downloadExcelFile, type IndividualGradeExportData } from '@/lib/utils/individual-excel-utils'
import type { AcademicYear, Semester } from '@/lib/validations/academic-validations'
import type { ClassWithDetails } from '@/lib/validations/class-validations'
import type { StudentGradeSubmissionWithDetails } from '@/lib/validations/individual-grade-validations'

interface IndividualGradeForm {
  academic_year_id: string
  semester_id: string
  class_id: string
}

interface StudentInfo {
  id: string
  full_name: string
  student_id: string
  email: string
}

interface SubjectInfo {
  id: string
  code: string
  name_vietnamese: string
  name_english: string
  category: string
}

export default function IndividualGradesClient() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [classes, setClasses] = useState<ClassWithDetails[]>([])
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [subjects, setSubjects] = useState<SubjectInfo[]>([])
  const [submissions, setSubmissions] = useState<StudentGradeSubmissionWithDetails[]>([])
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null)
  const [form, setForm] = useState<IndividualGradeForm>({
    academic_year_id: '',
    semester_id: '',
    class_id: ''
  })
  const [loadingStates, setLoadingStates] = useState({
    academicYears: false,
    semesters: false,
    classes: false,
    students: false,
    submissions: false
  })

  const loadAcademicYears = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, academicYears: true }))
    try {
      const result = await getAcademicYearsAction({ page: 1, limit: 50 })
      if (result.success) {
        setAcademicYears(result.data || [])
      }
    } catch (error) {
      console.error('Error loading academic years:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, academicYears: false }))
    }
  }, [])

  const loadSemesters = useCallback(async (academicYearId: string) => {
    setLoadingStates(prev => ({ ...prev, semesters: true }))
    try {
      const result = await getSemestersAction({ page: 1, limit: 20 })
      if (result.success) {
        const filteredSemesters = result.data?.filter(
          s => s.academic_year_id === academicYearId
        ) || []
        setSemesters(filteredSemesters)
      }
    } catch (error) {
      console.error('Error loading semesters:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, semesters: false }))
    }
  }, [])

  const loadClasses = useCallback(async (semesterId: string) => {
    setLoadingStates(prev => ({ ...prev, classes: true }))
    try {
      const result = await getClassesAction({ 
        page: 1, 
        limit: 100, 
        semester_id: semesterId 
      })
      if (result.success) {
        setClasses(result.data || [])
      }
    } catch (error) {
      console.error('Error loading classes:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, classes: false }))
    }
  }, [])

  const loadStudentsAndSubjects = useCallback(async (classId: string) => {
    setLoadingStates(prev => ({ ...prev, students: true }))
    try {
      const result = await getStudentsForGradeSubmissionAction(classId)
      if (result.success && result.data) {
        setStudents(result.data.students as unknown as StudentInfo[])
        setSubjects(result.data.subjects as unknown as SubjectInfo[])
      }
    } catch (error) {
      console.error('Error loading students and subjects:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, students: false }))
    }
  }, [])

  const loadSubmissions = useCallback(async () => {
    if (!form.class_id || !form.academic_year_id || !form.semester_id) return

    setLoadingStates(prev => ({ ...prev, submissions: true }))
    try {
      const result = await getStudentGradeSubmissionsAction(
        form.class_id,
        form.academic_year_id,
        form.semester_id
      )
      if (result.success) {
        setSubmissions(result.data || [])
      }
    } catch (error) {
      console.error('Error loading submissions:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, submissions: false }))
    }
  }, [form.class_id, form.academic_year_id, form.semester_id])

  // Load academic years on mount
  useEffect(() => {
    loadAcademicYears()
  }, [loadAcademicYears])

  // Load semesters when academic year changes
  useEffect(() => {
    if (form.academic_year_id) {
      loadSemesters(form.academic_year_id)
    } else {
      setSemesters([])
    }
  }, [form.academic_year_id, loadSemesters])

  // Load classes when semester changes
  useEffect(() => {
    if (form.semester_id) {
      loadClasses(form.semester_id)
    } else {
      setClasses([])
    }
  }, [form.semester_id, loadClasses])

  // Load students when class changes
  useEffect(() => {
    if (form.class_id) {
      loadStudentsAndSubjects(form.class_id)
      loadSubmissions()
    } else {
      setStudents([])
      setSubjects([])
      setSubmissions([])
    }
  }, [form.class_id, form.academic_year_id, form.semester_id, loadStudentsAndSubjects, loadSubmissions])

  const handleFormChange = useCallback((field: keyof IndividualGradeForm, value: string) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value }
      
      // Reset dependent fields
      if (field === 'academic_year_id') {
        newForm.semester_id = ''
        newForm.class_id = ''
      } else if (field === 'semester_id') {
        newForm.class_id = ''
      }
      
      return newForm
    })
    setSelectedSubmissionId(null)
  }, [])

  const canShowStudents = () => {
    return form.academic_year_id && form.semester_id && form.class_id
  }

  const handleDownloadStudentExcel = async (student: StudentInfo) => {
    if (!canShowStudents()) return

    setLoading(true)
    try {
      const selectedClass = classes.find(c => c.id === form.class_id)
      const selectedSemester = semesters.find(s => s.id === form.semester_id)
      const selectedAcademicYear = academicYears.find(ay => ay.id === form.academic_year_id)

      const exportData: IndividualGradeExportData = {
        student,
        subjects,
        className: selectedClass?.name || '',
        academicYear: selectedAcademicYear?.name || '',
        semester: selectedSemester?.name || ''
      }

      const excelBuffer = createIndividualGradeTemplate(exportData)
      const filename = `BangDiem_${student.student_id}_${student.full_name}_${selectedSemester?.name}.xlsx`
      
      downloadExcelFile(excelBuffer, filename)
      
      toast.success(`Đã tải file Excel cho ${student.full_name}`)
    } catch {
      toast.error("Có lỗi xảy ra khi tải file Excel")
    } finally {
      setLoading(false)
    }
  }

  const handleImportStudentExcel = (student: StudentInfo) => {
    setSelectedSubmissionId(student.id)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedSubmissionId) return

    const student = students.find(s => s.id === selectedSubmissionId)
    if (!student) return

    setLoading(true)
    try {
      // Create submission if not exists
      const selectedSemester = semesters.find(s => s.id === form.semester_id)
      const selectedAcademicYear = academicYears.find(ay => ay.id === form.academic_year_id)

      const submissionName = `Bảng điểm ${student.full_name} - ${selectedSemester?.name} - ${selectedAcademicYear?.name}`

      const createResult = await createStudentGradeSubmissionAction({
        academic_year_id: form.academic_year_id,
        semester_id: form.semester_id,
        class_id: form.class_id,
        student_id: student.id,
        submission_name: submissionName
      })

      let submissionId: string
      if (createResult.success) {
        submissionId = createResult.data?.id || ''
      } else {
        // If submission exists, find it
        const existingSubmission = submissions.find(s => s.student_id === student.id)
        if (existingSubmission) {
          submissionId = existingSubmission.id
        } else {
          toast.error(createResult.error || "Không thể tạo submission")
          return
        }
      }

      // Parse Excel file
      const arrayBuffer = await file.arrayBuffer()
      const parseResult = parseIndividualGradeExcel(arrayBuffer, subjects)

      if (!parseResult.success) {
        toast.error(`Lỗi đọc file Excel: ${parseResult.errors?.join(', ')}`)
        return
      }

      if (!parseResult.data || parseResult.data.length === 0) {
        toast.error("Không tìm thấy dữ liệu điểm trong file Excel")
        return
      }

      // Submit grades
      const submitResult = await submitStudentGradesAction({
        submission_id: submissionId,
        grades: parseResult.data.map(grade => ({
          subject_id: grade.subject_id,
          midterm_grade: grade.midterm_grade,
          final_grade: grade.final_grade,
          notes: grade.notes
        }))
      })

      if (submitResult.success) {
        toast.success(`Đã nhập điểm thành công cho ${student.full_name}`)
        loadSubmissions() // Refresh submissions
      } else {
        toast.error(submitResult.error || "Không thể nhập điểm")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi nhập file Excel")
    } finally {
      setLoading(false)
      setSelectedSubmissionId(null)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getStudentSubmissionStatus = (studentId: string) => {
    const submission = submissions.find(s => s.student_id === studentId)
    return submission?.status || 'draft'
  }

  const getSubmittedCount = () => {
    return submissions.filter(s => s.status === 'submitted').length
  }

  const handleSendToTeacher = async () => {
    if (!canShowStudents()) return

    setLoading(true)
    try {
      const result = await sendGradesToHomeroomTeacherAction(
        form.class_id,
        form.academic_year_id,
        form.semester_id
      )

      if (result.success) {
        toast.success(result.message)
        loadSubmissions() // Refresh submissions to show updated status
      } else {
        toast.error(result.error || "Không thể gửi bảng điểm cho giáo viên")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi gửi bảng điểm")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Quản Lý Điểm Theo Học Sinh</CardTitle>
          <CardDescription>
            Chọn lớp để hiển thị danh sách học sinh và quản lý điểm cá nhân
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Academic Year Selection */}
            <div className="space-y-2">
              <Label htmlFor="academic-year">Năm học</Label>
              <Select
                value={form.academic_year_id}
                onValueChange={(value) => handleFormChange('academic_year_id', value)}
                disabled={loadingStates.academicYears}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingStates.academicYears ? "Đang tải..." : "Chọn năm học"} />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semester Selection */}
            <div className="space-y-2">
              <Label htmlFor="semester">Học kì</Label>
              <Select
                value={form.semester_id}
                onValueChange={(value) => handleFormChange('semester_id', value)}
                disabled={!form.academic_year_id || loadingStates.semesters}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !form.academic_year_id ? "Chọn năm học trước" :
                    loadingStates.semesters ? "Đang tải..." : "Chọn học kì"
                  } />
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

            {/* Class Selection */}
            <div className="space-y-2">
              <Label htmlFor="class">Lớp</Label>
              <Select
                value={form.class_id}
                onValueChange={(value) => handleFormChange('class_id', value)}
                disabled={!form.semester_id || loadingStates.classes}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !form.semester_id ? "Chọn học kì trước" :
                    loadingStates.classes ? "Đang tải..." : "Chọn lớp"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {canShowStudents() && students.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Danh Sách Học Sinh
                </CardTitle>
                <CardDescription>
                  Tải file Excel cho từng học sinh và nhập điểm
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Đã nhập: {getSubmittedCount()}/{students.length}
                </div>
                <Button
                  onClick={handleSendToTeacher}
                  disabled={getSubmittedCount() === 0}
                  className="flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Gửi cho GVCN
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {students.map((student) => {
                const status = getStudentSubmissionStatus(student.id)
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-medium">{student.full_name}</h4>
                        <p className="text-sm text-gray-500">
                          Mã HS: {student.student_id} • {student.email}
                        </p>
                      </div>
                      <Badge variant={
                        status === 'submitted' ? 'default' :
                        status === 'draft' ? 'secondary' : 'outline'
                      }>
                        {status === 'submitted' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Đã nhập
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Chưa nhập
                          </>
                        )}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleDownloadStudentExcel(student)}
                        disabled={loading}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Tải Excel
                      </Button>
                      <Button
                        onClick={() => handleImportStudentExcel(student)}
                        disabled={loading}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Nhập Excel
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {canShowStudents() && students.length === 0 && !loadingStates.students && (
        <Card>
          <CardContent className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có học sinh</h3>
            <p className="text-gray-500">Lớp này chưa có học sinh nào được phân công.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
