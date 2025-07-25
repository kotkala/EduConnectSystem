"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Users, UserPlus } from "lucide-react"
import {
  bulkStudentAssignmentSchema,
  type BulkStudentAssignmentFormData,
  type AvailableStudent
} from "@/lib/validations/class-block-validations"
import {
  getAvailableStudentsAction,
  bulkAssignStudentsToClassAction
} from "@/lib/actions/student-assignment-actions"

interface StudentAssignmentFormProps {
  classId: string
  className: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function StudentAssignmentForm({
  classId,
  className,
  isOpen,
  onClose,
  onSuccess
}: StudentAssignmentFormProps) {
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Context7 pattern: useForm with validation
  const form = useForm<BulkStudentAssignmentFormData>({
    resolver: zodResolver(bulkStudentAssignmentSchema),
    defaultValues: {
      class_id: classId,
      assignment_type: "main",
      student_ids: []
    }
  })

  // Context7 pattern: watch for conditional rendering
  const watchAssignmentType = form.watch("assignment_type")
  const watchSelectedStudents = form.watch("student_ids")

  const loadAvailableStudents = useCallback(async () => {
    setLoadingStudents(true)
    setError(null)

    try {
      const result = await getAvailableStudentsAction(classId, watchAssignmentType)

      if (result.success) {
        setAvailableStudents(result.data)
        // Clear any previous errors when successful
        setError(null)
      } else {
        // Only set error for actual failures, not empty results
        console.error("Failed to fetch available students:", result.error)
        setError(result.error || "Failed to load available students")
      }
    } catch (err) {
      console.error("Exception in loadAvailableStudents:", err)
      setError("Failed to load available students")
    } finally {
      setLoadingStudents(false)
    }
  }, [classId, watchAssignmentType])

  // Load available students when assignment type changes
  useEffect(() => {
    if (isOpen && watchAssignmentType) {
      loadAvailableStudents()
    }
  }, [isOpen, watchAssignmentType, loadAvailableStudents])

  const onSubmit = async (data: BulkStudentAssignmentFormData) => {
    if (data.student_ids.length === 0) {
      setError("Please select at least one student")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const result = await bulkAssignStudentsToClassAction(data)
      
      if (result.success) {
        onSuccess()
        onClose()
        form.reset()
      } else {
        setError(result.error || "Failed to assign students")
      }
    } catch {
      setError("Failed to assign students")
    } finally {
      setSubmitting(false)
    }
  }

  // Context7 pattern: checkbox group handling
  const handleStudentSelection = (studentId: string, checked: boolean) => {
    const currentSelection = form.getValues("student_ids")
    
    if (checked) {
      form.setValue("student_ids", [...currentSelection, studentId])
    } else {
      form.setValue("student_ids", currentSelection.filter(id => id !== studentId))
    }
  }

  const handleSelectAll = () => {
    const allStudentIds = availableStudents.map(student => student.id)
    form.setValue("student_ids", allStudentIds)
  }

  const handleDeselectAll = () => {
    form.setValue("student_ids", [])
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Assign Students to {className}
          </DialogTitle>
          <DialogDescription>
            Select students to assign to this class. Each student can only be in 1 Main class and 1 Combined class per academic year.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Assignment Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="assignment_type">Assignment Type *</Label>
            <Controller
              name="assignment_type"
              control={form.control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Class</SelectItem>
                    <SelectItem value="combined">Combined Class (Subject Combination)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.assignment_type && (
              <p className="text-sm text-red-500">{form.formState.errors.assignment_type.message}</p>
            )}
          </div>

          {/* Error Alert - Only show for actual errors, not empty results */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Student Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                Available Students ({availableStudents.length})
              </Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={loadingStudents || availableStudents.length === 0}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={loadingStudents || watchSelectedStudents.length === 0}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            {loadingStudents ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading available students...</span>
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No available students for {watchAssignmentType} class assignment</p>
                <p className="text-sm">All students may already be assigned to a {watchAssignmentType} class this academic year</p>
              </div>
            ) : (
              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                <div className="space-y-3">
                  {availableStudents.map((student) => (
                    <div key={student.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={student.id}
                        checked={watchSelectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => 
                          handleStudentSelection(student.id, !!checked)
                        }
                      />
                      <Label 
                        htmlFor={student.id} 
                        className="flex-1 cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{student.full_name}</span>
                          <span className="text-sm text-muted-foreground">
                            {student.student_id} • {student.email}
                          </span>
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Count */}
            {watchSelectedStudents.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {watchSelectedStudents.length} student{watchSelectedStudents.length !== 1 ? 's' : ''} selected
              </p>
            )}

            {form.formState.errors.student_ids && (
              <p className="text-sm text-red-500">{form.formState.errors.student_ids.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || watchSelectedStudents.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Assigning...
                </>
              ) : (
                `Assign ${watchSelectedStudents.length} Student${watchSelectedStudents.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
