"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserPlus, Trash2, Loader2, GraduationCap, BookOpen } from "lucide-react"
import { type ClassWithDetails } from "@/lib/validations/class-validations"
import {
  getClassTeacherAssignmentsAction,
  removeTeacherAssignmentAction,
  assignTeacherToClassSubjectAction,
  getAvailableSubjectsForClassAction,
  getAvailableTeachersForSubjectAction,
  type TeacherAssignment,
  type AvailableSubject,
  type AvailableTeacher
} from "@/lib/actions/teacher-assignment-actions"

interface ClassTeachersTabProps {
  readonly classId: string
  readonly classData: ClassWithDetails
}

export default function ClassTeachersTab({ classId, classData }: ClassTeachersTabProps) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [removingAssignmentId, setRemovingAssignmentId] = useState<string | null>(null)
  
  // Add teacher form state
  const [availableSubjects, setAvailableSubjects] = useState<AvailableSubject[]>([])
  const [availableTeachers, setAvailableTeachers] = useState<AvailableTeacher[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("")
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
  const [assigning, setAssigning] = useState(false)

  const fetchTeacherAssignments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getClassTeacherAssignmentsAction(classId)
      
      if (result.success) {
        setAssignments(result.data)
      } else {
        setError(result.error || "Failed to load teacher assignments")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teacher assignments")
    } finally {
      setLoading(false)
    }
  }, [classId])

  useEffect(() => {
    fetchTeacherAssignments()
  }, [fetchTeacherAssignments])

  const fetchAvailableSubjects = async () => {
    try {
      const result = await getAvailableSubjectsForClassAction(classId)
      if (result.success) {
        setAvailableSubjects(result.data)
      }
    } catch (err) {
      console.error("Failed to fetch available subjects:", err)
    }
  }

  const fetchAvailableTeachers = async (subjectId: string) => {
    try {
      const result = await getAvailableTeachersForSubjectAction(subjectId)
      if (result.success) {
        setAvailableTeachers(result.data)
      }
    } catch (err) {
      console.error("Failed to fetch available teachers:", err)
    }
  }

  const handleAddTeacher = async () => {
    setShowAddDialog(true)
    await fetchAvailableSubjects()
  }

  const handleSubjectChange = async (subjectId: string) => {
    setSelectedSubjectId(subjectId)
    setSelectedTeacherId("")
    setAvailableTeachers([])
    
    if (subjectId) {
      await fetchAvailableTeachers(subjectId)
    }
  }

  const handleAssignTeacher = async () => {
    if (!selectedSubjectId || !selectedTeacherId) {
      setError("Please select both a subject and a teacher")
      return
    }

    try {
      setAssigning(true)
      setError(null)

      // Get current user from Supabase
      const { createClient } = await import("@/utils/supabase/client")
      const supabase = createClient()
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError) {
        console.error("Authentication error:", authError)
        setError("Authentication failed. Please refresh the page and try again.")
        return
      }

      if (!user) {
        setError("User not authenticated. Please log in again.")
        return
      }

      console.log("Assigning teacher:", {
        teacherId: selectedTeacherId,
        classId,
        subjectId: selectedSubjectId,
        assignedBy: user.id
      })

      const result = await assignTeacherToClassSubjectAction(
        selectedTeacherId,
        classId,
        selectedSubjectId,
        user.id
      )

      if (result.success) {
        setShowAddDialog(false)
        setSelectedSubjectId("")
        setSelectedTeacherId("")
        setAvailableSubjects([])
        setAvailableTeachers([])
        await fetchTeacherAssignments()
      } else {
        console.error("Assignment failed:", result.error)
        setError(result.error || "Failed to assign teacher to class subject")
      }
    } catch (err) {
      console.error("Exception in handleAssignTeacher:", err)
      setError(err instanceof Error ? err.message : "Failed to assign teacher to class subject")
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      setRemovingAssignmentId(assignmentId)
      
      const result = await removeTeacherAssignmentAction(assignmentId)
      
      if (result.success) {
        await fetchTeacherAssignments()
      } else {
        setError(result.error || "Failed to remove teacher assignment")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove teacher assignment")
    } finally {
      setRemovingAssignmentId(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading teacher assignments...</span>
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
              <GraduationCap className="h-5 w-5" />
              <CardTitle>Subject Teachers for {classData.name}</CardTitle>
              <Badge variant="outline">
                {assignments.length} assignments
              </Badge>
            </div>
            <Button onClick={handleAddTeacher}>
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Teacher
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No teachers assigned to subjects yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{assignment.subject_name_vietnamese}</div>
                            <div className="text-sm text-muted-foreground">{assignment.subject_code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{assignment.teacher_name}</TableCell>
                      <TableCell className="text-muted-foreground">{assignment.teacher_email}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={removingAssignmentId === assignment.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              {removingAssignmentId === assignment.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Teacher Assignment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove <strong>{assignment.teacher_name}</strong> from teaching{" "}
                                <strong>{assignment.subject_name_vietnamese}</strong> in this class? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove Assignment
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

      {/* Assign Teacher Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Teacher to Subject</DialogTitle>
            <DialogDescription>
              Select a subject and teacher to assign to {classData.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="subject-select" className="text-sm font-medium">Subject</label>
              <Select value={selectedSubjectId} onValueChange={handleSubjectChange}>
                <SelectTrigger id="subject-select">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name_vietnamese} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="teacher-select" className="text-sm font-medium">Teacher</label>
              <Select
                value={selectedTeacherId}
                onValueChange={setSelectedTeacherId}
                disabled={!selectedSubjectId}
              >
                <SelectTrigger id="teacher-select">
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.map((teacher) => (
                    <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                      {teacher.teacher_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignTeacher}
              disabled={!selectedSubjectId || !selectedTeacherId || assigning}
            >
              {assigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                "Assign Teacher"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
