"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
// import { Badge } from "@/shared/components/ui/badge" // Unused import
import { Button } from "@/shared/components/ui/button"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import {
  Users,
  AlertTriangle,
  RefreshCw,
  Edit
} from "lucide-react"
import { getGradeOverviewAction } from "@/lib/actions/teacher-grade-import-actions"

interface StudentGrade {
  id: string
  studentId: string
  studentName: string
  regularGrades: (number | null)[]
  midtermGrade?: number | null
  finalGrade?: number | null
  summaryGrade?: number | null
  lastModified?: string
  modifiedBy?: string
}

// Unused interface - commented out
// interface GradeOverviewStats {
//   totalStudents: number
//   studentsWithGrades: number
//   completionRate: number
//   averageGrade: number | null
//   gradeDistribution: {
//     excellent: number
//     good: number
//     average: number
//     poor: number
//   }
// }

interface TeacherGradeOverviewProps {
  periodId: string
  classId: string
  subjectId: string
  className: string
  subjectName: string
  periodName: string
  onTrackingClick: () => void
  onImportClick: () => void
  onGradeDataChange?: (grades: StudentGrade[]) => void
}

export function TeacherGradeOverview({
  periodId,
  classId,
  subjectId,
  // className, // Unused parameter
  // subjectName, // Unused parameter
  // periodName, // Unused parameter
  // onTrackingClick, // Unused parameter
  onImportClick,
  onGradeDataChange
}: TeacherGradeOverviewProps) {
  const [loading, setLoading] = useState(false)
  const [grades, setGrades] = useState<StudentGrade[]>([])
  // const [stats, setStats] = useState<GradeOverviewStats | null>(null) // Unused state
  const [error, setError] = useState<string | null>(null)

  const loadGradeData = useCallback(async () => {
    if (!periodId || !classId || !subjectId) return

    setLoading(true)
    setError(null)

    try {
      // Get grade data from API
      const result = await getGradeOverviewAction(periodId, classId, subjectId)

      if (result.success && result.data) {
        setGrades(result.data)

        // Calculate statistics
        // const calculatedStats = calculateStats(result.data) // Commented out since not used
        // setStats(calculatedStats) // Commented out since stats state is unused

        // Pass grade data to parent for PDF export
        if (onGradeDataChange) {
          onGradeDataChange(result.data)
        }
      } else {
        setError(result.error || 'KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u Ä‘iá»ƒm sá»‘')
      }

    } catch (error) {
      console.error('Error loading grade data:', error)
      setError('KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u Ä‘iá»ƒm sá»‘')
    } finally {
      setLoading(false)
    }
  }, [periodId, classId, subjectId, onGradeDataChange])

  // Vietnamese grade calculation formula
  const calculateSubjectAverage = (student: StudentGrade): number | null => {
    const regularGrades = student.regularGrades.filter(g => g !== null) as number[]
    const midtermGrade = student.midtermGrade
    const finalGrade = student.finalGrade

    // Need at least midterm and final grades for calculation
    if (midtermGrade === null || midtermGrade === undefined ||
        finalGrade === null || finalGrade === undefined) {
      return null
    }

    // Vietnamese formula: ÄTBmhk = (Tá»•ng Ä‘iá»ƒm thÆ°á»ng xuyÃªn + 2 x Äiá»ƒm giá»¯a ká»³ + 3 x Äiá»ƒm cuá»‘i ká»³) / (Sá»‘ bÃ i thÆ°á»ng xuyÃªn + 5)
    const regularSum = regularGrades.reduce((sum, grade) => sum + grade, 0)
    const regularCount = regularGrades.length
    const totalScore = regularSum + (2 * midtermGrade) + (3 * finalGrade)
    const totalWeight = regularCount + 5

    return Math.round((totalScore / totalWeight) * 10) / 10
  }

  // Unused function - commented out
  // const calculateStats = (gradeData: StudentGrade[]): GradeOverviewStats => {
  //   const totalStudents = gradeData.length
  //   let studentsWithGrades = 0
  //   const allGrades: number[] = []

  //   const gradeDistribution = {
  //     excellent: 0, // >= 8
  //     good: 0,      // 6.5-7.9
  //     average: 0,   // 5-6.4
  //     poor: 0       // < 5
  //   }

  //   gradeData.forEach(student => {
  //     let hasAnyGrade = false

  //     // Check regular grades
  //     student.regularGrades.forEach(grade => {
  //       if (grade !== null) {
  //         allGrades.push(grade)
  //         hasAnyGrade = true
  //       }
  //     })

  //     // Check other grades
  //     if (student.midtermGrade !== null && student.midtermGrade !== undefined) {
  //       allGrades.push(student.midtermGrade)
  //       hasAnyGrade = true
  //     }

  //     if (student.finalGrade !== null && student.finalGrade !== undefined) {
  //       allGrades.push(student.finalGrade)
  //       hasAnyGrade = true
  //     }

  //     if (hasAnyGrade) {
  //       studentsWithGrades++
  //     }

  //     // Calculate grade distribution based on Vietnamese formula or summary grade
  //     const representativeGrade = student.summaryGrade || calculateSubjectAverage(student)

  //     if (representativeGrade !== null) {
  //       if (representativeGrade >= 8) gradeDistribution.excellent++
  //       else if (representativeGrade >= 6.5) gradeDistribution.good++
  //       else if (representativeGrade >= 5) gradeDistribution.average++
  //       else gradeDistribution.poor++
  //     }
  //   })

  //   const completionRate = totalStudents > 0 ? (studentsWithGrades / totalStudents) * 100 : 0
  //   const averageGrade = allGrades.length > 0
  //     ? Math.round((allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length) * 10) / 10
  //     : null

  //   return {
  //     totalStudents,
  //     studentsWithGrades,
  //     completionRate,
  //     averageGrade,
  //     gradeDistribution
  //   }
  // }

  // Unused function - commented out
  // const getGradeStatusBadge = (grade: number | null | undefined) => {
  //   if (grade === null || grade === undefined) {
  //     return <Badge variant="outline" className="text-gray-500">-</Badge>
  //   }
  //
  //   if (grade >= 8) {
  //     return <Badge variant="default" className="bg-green-100 text-green-800">{grade}</Badge>
  //   } else if (grade >= 6.5) {
  //     return <Badge variant="default" className="bg-blue-100 text-blue-800">{grade}</Badge>
  //   } else if (grade >= 5) {
  //     return <Badge variant="default" className="bg-yellow-100 text-yellow-800">{grade}</Badge>
  //   } else {
  //     return <Badge variant="destructive">{grade}</Badge>
  //   }
  // }

  // Unused function - commented out
  // const exportGrades = () => {
  //   // TODO: Implement export functionality
  //   console.log('Exporting grades...')
  // }

  useEffect(() => {
    if (periodId && classId && subjectId) {
      loadGradeData()
    }
  }, [periodId, classId, subjectId, loadGradeData])

  if (!periodId || !classId || !subjectId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Vui lÃ²ng chá»n ká»³ bÃ¡o cÃ¡o, lá»›p há»c vÃ  mÃ´n há»c Ä‘á»ƒ xem Ä‘iá»ƒm sá»‘</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Grade Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Báº£ng Ä‘iá»ƒm chi tiáº¿t</span>
            <Button variant="outline" size="sm" onClick={onImportClick}>
              <Edit className="mr-2 h-4 w-4" />
              Nháº­p Ä‘iá»ƒm
            </Button>
          </CardTitle>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-1">CÃ¡ch tÃ­nh Ä‘iá»ƒm trung bÃ¬nh mÃ´n há»c ká»³:</p>
            <p className="text-xs text-blue-700">
              ÄTBmhk = (Tá»•ng Ä‘iá»ƒm thÆ°á»ng xuyÃªn + 2 Ã— Äiá»ƒm giá»¯a ká»³ + 3 Ã— Äiá»ƒm cuá»‘i ká»³) / (Sá»‘ bÃ i thÆ°á»ng xuyÃªn + 5)
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Äiá»ƒm thÆ°á»ng xuyÃªn (há»‡ sá»‘ 1) â€¢ Äiá»ƒm giá»¯a ká»³ (há»‡ sá»‘ 2) â€¢ Äiá»ƒm cuá»‘i ká»³ (há»‡ sá»‘ 3)
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Äang táº£i dá»¯ liá»‡u Ä‘iá»ƒm sá»‘...</p>
              </div>
            </div>
          ) : grades.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-blue-600 text-white">
                  <tr>
                    <th className="text-center p-3 font-medium border-r border-blue-500">STT</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">MÃ£ há»c sinh</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Há» vÃ  tÃªn</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Äiá»ƒm thÆ°á»ng xuyÃªn 1</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Äiá»ƒm thÆ°á»ng xuyÃªn 2</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Äiá»ƒm thÆ°á»ng xuyÃªn 3</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Äiá»ƒm thÆ°á»ng xuyÃªn 4</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Äiá»ƒm giá»¯a kÃ¬</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Äiá»ƒm cuá»‘i kÃ¬</th>
                    <th className="text-center p-3 font-medium border-r border-blue-500">Äiá»ƒm tá»•ng káº¿t há»c kÃ¬</th>
                    <th className="text-center p-3 font-medium">Ghi chÃº</th>
                  </tr>
                </thead>
                <tbody>
                  {grades.map((student, index) => {
                    const calculatedAverage = student.summaryGrade || calculateSubjectAverage(student)

                    return (
                      <tr key={student.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 text-center font-medium border-r border-gray-200">{index + 1}</td>
                        <td className="p-3 text-center font-medium border-r border-gray-200">{student.studentId}</td>
                        <td className="p-3 font-medium border-r border-gray-200">{student.studentName}</td>
                        {student.regularGrades.map((grade, gradeIndex) => (
                          <td key={gradeIndex} className="p-3 text-center border-r border-gray-200">
                            <span className={`text-lg font-medium ${
                              grade !== null ? (
                                grade >= 8 ? 'text-green-600' :
                                grade >= 6.5 ? 'text-blue-600' :
                                grade >= 5 ? 'text-yellow-600' :
                                'text-red-600'
                              ) : 'text-gray-400'
                            }`}>
                              {grade !== null ? grade : '-'}
                            </span>
                          </td>
                        ))}
                        <td className="p-3 text-center border-r border-gray-200">
                          <span className={`text-lg font-medium ${
                            student.midtermGrade !== null && student.midtermGrade !== undefined ? (
                              student.midtermGrade >= 8 ? 'text-green-600' :
                              student.midtermGrade >= 6.5 ? 'text-blue-600' :
                              student.midtermGrade >= 5 ? 'text-yellow-600' :
                              'text-red-600'
                            ) : 'text-gray-400'
                          }`}>
                            {student.midtermGrade !== null && student.midtermGrade !== undefined ? student.midtermGrade : '-'}
                          </span>
                        </td>
                        <td className="p-3 text-center border-r border-gray-200">
                          <span className={`text-lg font-medium ${
                            student.finalGrade !== null && student.finalGrade !== undefined ? (
                              student.finalGrade >= 8 ? 'text-green-600' :
                              student.finalGrade >= 6.5 ? 'text-blue-600' :
                              student.finalGrade >= 5 ? 'text-yellow-600' :
                              'text-red-600'
                            ) : 'text-gray-400'
                          }`}>
                            {student.finalGrade !== null && student.finalGrade !== undefined ? student.finalGrade : '-'}
                          </span>
                        </td>
                        <td className="p-3 text-center border-r border-gray-200">
                          <span className={`text-lg font-bold ${
                            calculatedAverage !== null ? (
                              calculatedAverage >= 8 ? 'text-green-600' :
                              calculatedAverage >= 6.5 ? 'text-blue-600' :
                              calculatedAverage >= 5 ? 'text-yellow-600' :
                              'text-red-600'
                            ) : 'text-gray-400'
                          }`}>
                            {calculatedAverage !== null ? calculatedAverage : '-'}
                          </span>
                        </td>
                        <td className="p-3 text-center text-sm text-gray-600">
                          {student.lastModified ? (
                            <div className="space-y-1">
                              <div>{new Date(student.lastModified).toLocaleDateString('vi-VN')}</div>
                              <div className="text-xs">{student.modifiedBy || 'Há»‡ thá»‘ng'}</div>
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>ChÆ°a cÃ³ dá»¯ liá»‡u Ä‘iá»ƒm sá»‘</p>
              <Button variant="outline" className="mt-4" onClick={onImportClick}>
                <Edit className="mr-2 h-4 w-4" />
                Nháº­p Ä‘iá»ƒm Ä‘áº§u tiÃªn
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
