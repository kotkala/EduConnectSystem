'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, User } from 'lucide-react'
import { getParentViolationsAction } from '@/lib/actions/violation-actions'
import { getParentStudentsAction, type StudentInfo } from '@/lib/actions/parent-actions'
import { getSeverityLabel, getSeverityColor, type StudentViolationWithDetails } from '@/lib/validations/violation-validations'
import { toast } from 'sonner'

export default function ParentViolationsPageClient() {
  const [violations, setViolations] = useState<StudentViolationWithDetails[]>([])
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Move loadStudents logic inside useEffect (Context7 pattern)
    const loadStudents = async () => {
      try {
        const result = await getParentStudentsAction()

        if (result && result.success && result.data) {
          setStudents(result.data)
          // Auto-select first student if only one
          if (result.data.length === 1) {
            setSelectedStudentId(result.data[0].id)
          }
        } else {
          toast.error(result?.error || 'Failed to load students')
        }
      } catch {
        toast.error('An error occurred while loading students')
      }
    }

    loadStudents()
  }, []) // ✅ All dependencies declared

  useEffect(() => {
    // Move loadViolations logic inside useEffect (Context7 pattern)
    const loadViolations = async (studentId?: string) => {
      try {
        setLoading(true)
        const result = await getParentViolationsAction(studentId)

        if (result && result.success && result.data) {
          setViolations(result.data)
        } else {
          toast.error(result?.error || 'Failed to load violations')
        }
      } catch {
        toast.error('An error occurred while loading violations')
      } finally {
        setLoading(false)
      }
    }

    if (selectedStudentId && selectedStudentId !== 'all') {
      loadViolations(selectedStudentId)
    } else {
      loadViolations()
    }
  }, [selectedStudentId]) // ✅ All dependencies declared

  const selectedStudent = students.find(s => s.id === selectedStudentId)

  if (loading && students.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vi Phạm Con Em</h1>
            <p className="text-muted-foreground">
              View your children&apos;s violation records
            </p>
          </div>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vi Phạm Con Em</h1>
          <p className="text-muted-foreground">
            View your children&apos;s violation records and disciplinary actions
          </p>
        </div>
      </div>

      {students.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Student
            </CardTitle>
            <CardDescription>
              Choose which child&apos;s violations you want to view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.full_name} ({student.student_id})
                    {student.current_class && ` - ${student.current_class.name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{violations.length}</div>
            <p className="text-xs text-muted-foreground">
              {selectedStudent ? `For ${selectedStudent.full_name}` : 'All children'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{violations.length}</div>
            <p className="text-xs text-muted-foreground">
              All recorded violations
            </p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <Card>
          <CardContent className="text-center py-8">
            Loading violations...
          </CardContent>
        </Card>
      ) : violations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertTriangle className="mx-auto h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No violations recorded</h3>
            <p className="text-muted-foreground">
              {selectedStudent 
                ? `${selectedStudent.full_name} has no recorded violations.`
                : 'Your children have no recorded violations.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {violations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Violations ({violations.length})
                </CardTitle>
                <CardDescription>
                  All recorded violations for your children
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {violations.map((violation) => (
                  <div key={violation.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{violation.student.full_name}</h4>
                          <Badge variant="outline">{violation.student.student_id}</Badge>
                          <Badge variant="outline">{violation.class.name}</Badge>
                          <Badge className={getSeverityColor(violation.severity)}>
                            {getSeverityLabel(violation.severity)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {violation.violation_type.category.name} • {violation.violation_type.name}
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
          )}
        </div>
      )}
    </div>
  )
}
