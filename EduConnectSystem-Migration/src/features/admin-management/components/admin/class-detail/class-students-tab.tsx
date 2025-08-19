"use client"

import { useState, useEffect } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Badge } from "@/shared/components/ui/badge"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog"
import { UserPlus, Trash2, Search, Loader2, Users } from "lucide-react"
import { type ClassWithDetails } from "@/lib/validations/class-validations"
import StudentAssignmentForm from "@/features/admin-management/components/admin/student-assignment-form"

interface ClassStudentsTabProps {
  readonly classId: string
  readonly classData: ClassWithDetails
}

interface StudentInClass {
  id: string
  student_id: string
  full_name: string
  email: string
  assignment_type: string
  assigned_at: string
  combined_class_name?: string
}

export default function ClassStudentsTab({ classId, classData }: ClassStudentsTabProps) {
  const [students, setStudents] = useState<StudentInClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        setError(null)

        // Import the action dynamically to avoid circular imports
        const { getClassStudentsWithDetailsAction } = await import("@/features/admin-management/actions/class-actions")
        const result = await getClassStudentsWithDetailsAction(classId)

        if (result.success) {
          setStudents(result.data)
        } else {
          setError(result.error || "Failed to load students")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load students")
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [classId])

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddStudent = () => {
    setShowAddDialog(true)
  }

  const handleRemoveStudent = async (studentId: string) => {
    try {
      setRemovingStudentId(studentId)

      // Import the action dynamically to avoid circular imports
      const { removeStudentFromClassAction } = await import("@/features/admin-management/actions/class-actions")
      const result = await removeStudentFromClassAction(studentId)

      if (result.success) {
        // Refresh the students list
        const { getClassStudentsWithDetailsAction } = await import("@/features/admin-management/actions/class-actions")
        const refreshResult = await getClassStudentsWithDetailsAction(classId)
        if (refreshResult.success) {
          setStudents(refreshResult.data)
        }
      } else {
        setError(result.error || "Failed to remove student")
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove student")
    } finally {
      setRemovingStudentId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading students...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <CardTitle>Students in {classData.name}</CardTitle>
              <Badge variant="outline">
                {students.length} / {classData.max_students}
              </Badge>
            </div>
            <Button onClick={handleAddStudent}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Students Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assignment Type</TableHead>
                  <TableHead>
                    {classData.is_subject_combination ? "Main Class" : "Combined Class"}
                  </TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? "No students found matching your search." : "No students assigned to this class yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.student_id}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{student.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {student.assignment_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.combined_class_name ? (
                          <div className="flex flex-col">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {student.combined_class_name}
                            </Badge>
                            <span className="text-xs text-muted-foreground mt-1">
                              {classData.is_subject_combination ? "Main class" : "Combined class"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            No {classData.is_subject_combination ? "main" : "combined"} class
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(student.assigned_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={removingStudentId === student.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              {removingStudentId === student.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Student</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove <strong>{student.full_name}</strong> from this class? 
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveStudent(student.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove Student
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Student Assignment Form */}
      <StudentAssignmentForm
        classId={classId}
        className={classData.name}
        isSubjectCombination={classData.is_subject_combination}
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={async () => {
          setShowAddDialog(false)
          // Refresh the students list properly
          try {
            const { getClassStudentsWithDetailsAction } = await import("@/features/admin-management/actions/class-actions")
            const refreshResult = await getClassStudentsWithDetailsAction(classId)
            if (refreshResult.success) {
              setStudents(refreshResult.data)
            }
          } catch (err) {
            console.error("Failed to refresh students list:", err)
            // Fallback to page reload if refresh fails
            window.location.reload()
          }
        }}
      />
    </div>
  )
}
