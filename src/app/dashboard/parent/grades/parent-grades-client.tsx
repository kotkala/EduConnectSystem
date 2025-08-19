'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Download, Users, FileText, Eye, Award } from 'lucide-react'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/shared/components/ui/loading-spinner'
import { EmptyState } from '@/shared/components/ui/empty-state'
import { getChildrenGradeReportsAction } from '@/lib/actions/parent-grade-actions'
import { createIndividualGradeTemplate, downloadExcelFile, type IndividualGradeExportData } from '@/lib/utils/individual-excel-utils'




interface GradeSubmission {
  id: string
  submission_name: string
  student_id: string
  created_at: string
  student: {
    id: string
    full_name: string
    student_id: string
  }
  class: {
    name: string
    homeroom_teacher: { full_name: string }
  }
  academic_year: { name: string }
  semester: { name: string }
  grades: Array<{
    subject_id: string
    midterm_grade: number | null
    final_grade: number | null
    average_grade: number | null
    subject: {
      id: string
      code: string
      name_vietnamese: string
      category: string
    }
  }>
  ai_feedback?: {
    text: string
    created_at: string
    rating: number | null
  } | null
}

interface StudentRecord {
  id: string
  full_name: string
  student_id: string
  class_name: string
  total_grades: number
  submissions: GradeSubmission[]
  subjects: Array<{
    id: string
    name_vietnamese: string
    code: string
  }>
}

export default function ParentGradesClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<GradeSubmission[]>([])
  const [students, setStudents] = useState<StudentRecord[]>([])

  // Load grade reports
  const loadGradeReports = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getChildrenGradeReportsAction()
      if (result.success) {
        const submissionsData = result.data as GradeSubmission[]
        setSubmissions(submissionsData)

        // Transform submissions into student records similar to teacher interface
        const studentMap = new Map<string, StudentRecord>()

        submissionsData.forEach((submission) => {
          const studentUUID = submission.student.id
          if (!studentMap.has(studentUUID)) {
            studentMap.set(studentUUID, {
              id: studentUUID,
              full_name: submission.student.full_name,
              student_id: submission.student.student_id,
              class_name: submission.class.name,
              total_grades: 0,
              submissions: [],
              subjects: []
            })
          }

          const student = studentMap.get(studentUUID)!
          student.submissions.push(submission)
          student.total_grades += submission.grades.length

          // Add unique subjects
          submission.grades.forEach((grade) => {
            const subjectExists = student.subjects.some(s => s.code === grade.subject.code)
            if (!subjectExists) {
              student.subjects.push({
                id: grade.subject.id,
                name_vietnamese: grade.subject.name_vietnamese,
                code: grade.subject.code
              })
            }
          })
        })

        setStudents(Array.from(studentMap.values()))
      } else {
        toast.error(result.error || "KhÃ´ng thá»ƒ táº£i báº£ng Ä‘iá»ƒm")
        setStudents([])
      }
    } catch {
      toast.error("CÃ³ lá»—i xáº£y ra khi táº£i báº£ng Ä‘iá»ƒm")
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadGradeReports()
  }, [loadGradeReports])

  // Handle download Excel
  const handleDownloadExcel = useCallback(async (submission: GradeSubmission) => {
    try {
      // Prepare data for Excel export
      const subjects = submission.grades.map(grade => ({
        id: grade.subject.id,
        code: grade.subject.code,
        name_vietnamese: grade.subject.name_vietnamese,
        name_english: grade.subject.name_vietnamese, // Use Vietnamese as fallback
        category: grade.subject.category
      }))

      const exportData: IndividualGradeExportData = {
        student: {
          id: submission.student.id,
          full_name: submission.student.full_name,
          student_id: submission.student.student_id,
          email: '' // Not needed for parent view
        },
        subjects,
        className: submission.class.name,
        academicYear: submission.academic_year.name,
        semester: submission.semester.name
      }

      const excelBuffer = await createIndividualGradeTemplate(exportData)
      const filename = `BangDiem_${submission.student.student_id}_${submission.student.full_name}_${submission.semester.name}.xlsx`

      downloadExcelFile(excelBuffer, filename)
      toast.success(`ÄÃ£ táº£i báº£ng Ä‘iá»ƒm cá»§a ${submission.student.full_name}`)
    } catch {
      toast.error("CÃ³ lá»—i xáº£y ra khi táº£i file Excel")
    }
  }, [])

  // Handle view submission
  const handleViewSubmission = useCallback((submission: GradeSubmission) => {
    router.push(`/dashboard/parent/grades/${submission.id}`)
  }, [router])

  // Render content based on loading and data state
  const renderContent = () => {
    if (loading) {
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
          title="KhÃ´ng cÃ³ báº£ng Ä‘iá»ƒm"
          description="ChÆ°a cÃ³ báº£ng Ä‘iá»ƒm nÃ o Ä‘Æ°á»£c gá»­i tá»« giÃ¡o viÃªn chá»§ nhiá»‡m"
        />
      )
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Há»c sinh</TableHead>
            <TableHead>Lá»›p</TableHead>
            <TableHead>Sá»‘ báº£ng Ä‘iá»ƒm</TableHead>
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
                <Badge variant="secondary">{student.submissions.length} báº£ng Ä‘iá»ƒm</Badge>
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
                <div className="flex items-center gap-2 justify-end">
                  {student.submissions.map((submission) => (
                    <div key={submission.id} className="flex items-center gap-2">
                      <Button
                        onClick={() => handleViewSubmission(submission)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        {submission.semester.name}
                      </Button>
                      <Button
                        onClick={() => handleDownloadExcel(submission)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Excel
                      </Button>
                    </div>
                  ))}
                </div>
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
          <h1 className="text-2xl font-bold">Báº£ng Ä‘iá»ƒm con em</h1>
          <p className="text-gray-600">Xem báº£ng Ä‘iá»ƒm cÃ¡c con Ä‘Æ°á»£c gá»­i tá»« giÃ¡o viÃªn chá»§ nhiá»‡m</p>
        </div>
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
                <p className="text-sm font-medium text-muted-foreground">Báº£ng Ä‘iá»ƒm</p>
                <p className="text-2xl font-bold">{submissions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-purple-600" />
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

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sÃ¡ch há»c sinh</CardTitle>
          <CardDescription>
            Hiá»ƒn thá»‹ {students.length} há»c sinh
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  )
}
