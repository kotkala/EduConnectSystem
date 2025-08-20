"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { BookOpen } from "lucide-react"
import type { StudentDetailedGrades } from "@/features/grade-management/actions/admin-grade-tracking-actions"

interface AdminStudentGradeTableProps {
  studentData: StudentDetailedGrades
}

export function AdminStudentGradeTable({ studentData }: AdminStudentGradeTableProps) {
  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-500'
    if (grade >= 8) return 'text-green-600'
    if (grade >= 6.5) return 'text-blue-600'
    if (grade >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeLabel = (grade: number | null) => {
    if (grade === null) return 'ChÆ°a cÃ³ Ä‘iá»ƒm'
    if (grade >= 8) return 'Giá»i'
    if (grade >= 6.5) return 'KhÃ¡'
    if (grade >= 5) return 'Trung bÃ¬nh'
    return 'Yáº¿u'
  }

  const formatGrade = (grade: number | null) => {
    if (grade === null) return '-'
    return grade.toString()
  }

  // Calculate overall average
  const calculateOverallAverage = () => {
    const validGrades = studentData.subjects
      .map(s => s.average_grade)
      .filter(g => g !== null) as number[]
    
    if (validGrades.length === 0) return null
    return Math.round((validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length) * 10) / 10
  }

  const overallAverage = calculateOverallAverage()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Báº£ng Ä‘iá»ƒm chi tiáº¿t theo mÃ´n há»c
        </CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Há»c sinh: <strong>{studentData.student_name}</strong></span>
          <span>MÃ£ sá»‘: <strong>{studentData.student_number}</strong></span>
          <span>Lá»›p: <strong>{studentData.class_name}</strong></span>
          {overallAverage && (
            <div className="flex items-center gap-2">
              <span>Äiá»ƒm TB chung:</span>
              <span className={`font-bold ${getGradeColor(overallAverage)}`}>
                {overallAverage}
              </span>
              <Badge variant="outline" className={getGradeColor(overallAverage)}>
                {getGradeLabel(overallAverage)}
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="border-b bg-blue-600 text-white">
              <tr>
                <th className="text-left p-3 font-medium border-r border-blue-500">MÃ´n há»c</th>
                <th className="text-center p-3 font-medium border-r border-blue-500">Äiá»ƒm ÄG thÆ°á»ng xuyÃªn</th>
                <th className="text-center p-3 font-medium border-r border-blue-500">Giá»¯a ká»³</th>
                <th className="text-center p-3 font-medium border-r border-blue-500">Cuá»‘i ká»³</th>
                <th className="text-center p-3 font-medium">TBM</th>
              </tr>
            </thead>
            <tbody>
              {studentData.subjects.map((subject) => (
                <tr key={subject.subject_id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium border-r border-gray-200">
                    <div>
                      <div className="font-medium">{subject.subject_name}</div>
                      <div className="text-xs text-muted-foreground">
                        GV: {subject.teacher_name}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-center border-r border-gray-200">
                    <div className="flex justify-center gap-2 flex-wrap">
                      {subject.grade_components.regular_grades.length > 0 ? (
                        subject.grade_components.regular_grades.map((grade, gradeIndex) => (
                          <span 
                            key={gradeIndex} 
                            className={`inline-block px-2 py-1 rounded text-sm font-medium ${getGradeColor(grade)}`}
                          >
                            {formatGrade(grade)}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-center border-r border-gray-200">
                    <span className={`text-lg font-medium ${getGradeColor(subject.grade_components.midterm_grade)}`}>
                      {formatGrade(subject.grade_components.midterm_grade)}
                    </span>
                  </td>
                  <td className="p-3 text-center border-r border-gray-200">
                    <span className={`text-lg font-medium ${getGradeColor(subject.grade_components.final_grade)}`}>
                      {formatGrade(subject.grade_components.final_grade)}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-lg font-bold ${getGradeColor(subject.average_grade)}`}>
                        {formatGrade(subject.average_grade)}
                      </span>
                      {subject.average_grade && (
                        <Badge variant="outline" className={`text-xs ${getGradeColor(subject.average_grade)}`}>
                          {getGradeLabel(subject.average_grade)}
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {studentData.subjects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>ChÆ°a cÃ³ dá»¯ liá»‡u Ä‘iá»ƒm sá»‘ cho há»c sinh nÃ y</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
