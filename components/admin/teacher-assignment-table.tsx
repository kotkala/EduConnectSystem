'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Trash2, Users, BookOpen, User, Calendar } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  removeTeacherAssignmentAction,
  type TeacherAssignment
} from '@/lib/actions/teacher-assignment-actions'

interface TeacherAssignmentTableProps {
  readonly assignments: TeacherAssignment[]
  readonly onUpdate?: () => void
  readonly showClassColumn?: boolean
  readonly title?: string
  readonly description?: string
}

export default function TeacherAssignmentTable({ 
  assignments, 
  onUpdate, 
  showClassColumn = true,
  title = "Teacher Assignments",
  description = "Current teacher assignments for classes and subjects"
}: TeacherAssignmentTableProps) {
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRemoveAssignment = async (assignmentId: string) => {
    setRemovingId(assignmentId)
    setError(null)

    try {
      const result = await removeTeacherAssignmentAction(assignmentId)
      
      if (result.success) {
        onUpdate?.()
      } else {
        setError(result.error || 'Failed to remove assignment')
      }
    } catch {
      setError('Failed to remove assignment')
    } finally {
      setRemovingId(null)
    }
  }

  const getCategoryBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
      case 'core':
        return 'default'
      case 'elective':
        return 'secondary'
      case 'language':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No Teacher Assignments
            </h3>
            <p className="text-sm text-muted-foreground">
              No teachers have been assigned to teach subjects yet.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher</TableHead>
                {showClassColumn && <TableHead>Class</TableHead>}
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{assignment.teacher_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {assignment.teacher_email}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  {showClassColumn && (
                    <TableCell>
                      <div className="font-medium">{assignment.class_name}</div>
                    </TableCell>
                  )}
                  <TableCell>
                    <div>
                      <div className="font-medium">{assignment.subject_code}</div>
                      <div className="text-sm text-muted-foreground">
                        {assignment.subject_name_vietnamese}
                      </div>
                      {assignment.subject_name_english && (
                        <div className="text-xs text-muted-foreground">
                          {assignment.subject_name_english}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getCategoryBadgeVariant(assignment.subject_category)}>
                      {assignment.subject_category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {assignment.academic_year_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{assignment.assigned_by_name}</div>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={removingId === assignment.id}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Remove Teacher Assignment</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to remove <strong>{assignment.teacher_name}</strong> from
                            teaching <strong>{assignment.subject_code}</strong> in <strong>{assignment.class_name}</strong>?
                            <br /><br />
                            This action cannot be undone, but you can reassign the teacher later.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-2">
                          <Button variant="outline">Cancel</Button>
                          <Button
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            variant="destructive"
                          >
                            Remove Assignment
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Showing {assignments.length} teacher assignment{assignments.length !== 1 ? 's' : ''}
        </div>
      </CardContent>
    </Card>
  )
}
