"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { UserCheck, UserPlus, Trash2, Loader2, Mail, Phone, MapPin } from "lucide-react"
import { type ClassWithDetails } from "@/lib/validations/class-validations"
import { getHomeroomEnabledTeachersAction } from "@/lib/actions/class-actions"

// Simple teacher interface for dropdown
interface SimpleTeacher {
  id: string
  full_name: string
  employee_id: string
}

interface ClassHomeroomTabProps {
  readonly classId: string
  readonly classData: ClassWithDetails
}

export default function ClassHomeroomTab({ classId, classData }: ClassHomeroomTabProps) {
  const [availableTeachers, setAvailableTeachers] = useState<SimpleTeacher[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("")
  const [assigning, setAssigning] = useState(false)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    fetchAvailableTeachers()
  }, [])

  const fetchAvailableTeachers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getHomeroomEnabledTeachersAction()
      
      if (result.success) {
        setAvailableTeachers(result.data)
      } else {
        setError(result.error || "Failed to load available teachers")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load available teachers")
    } finally {
      setLoading(false)
    }
  }

  const handleAssignHomeroom = () => {
    setShowAssignDialog(true)
  }

  const handleConfirmAssign = async () => {
    if (!selectedTeacherId) return

    try {
      setAssigning(true)
      
      // TODO: Replace with actual API call
      // const result = await updateHomeroomTeacherAction(classId, selectedTeacherId)
      
      // Mock success for now
      console.log("Assigning homeroom teacher:", selectedTeacherId, "to class:", classId)
      
      setShowAssignDialog(false)
      setSelectedTeacherId("")
      
      // TODO: Refresh class data to show new homeroom teacher
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign homeroom teacher")
    } finally {
      setAssigning(false)
    }
  }

  const handleRemoveHomeroom = async () => {
    try {
      setRemoving(true)
      
      // TODO: Replace with actual API call
      // const result = await removeHomeroomTeacherAction(classId)
      
      // Mock success for now
      console.log("Removing homeroom teacher from class:", classId)
      
      // TODO: Refresh class data to remove homeroom teacher
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove homeroom teacher")
    } finally {
      setRemoving(false)
    }
  }

  const currentHomeroomTeacher = classData.homeroom_teacher?.full_name

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
              <UserCheck className="h-5 w-5" />
              <CardTitle>Homeroom Teacher for {classData.name}</CardTitle>
            </div>
            {currentHomeroomTeacher ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleAssignHomeroom}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Change Teacher
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove Homeroom Teacher</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove <strong>{currentHomeroomTeacher}</strong> as the homeroom teacher for this class? 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRemoveHomeroom}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={removing}
                      >
                        {removing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Removing...
                          </>
                        ) : (
                          "Remove Teacher"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <Button onClick={handleAssignHomeroom}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Teacher
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentHomeroomTeacher ? (
            <div className="space-y-6">
              {/* Current Homeroom Teacher Info */}
              <div className="flex items-start gap-4 p-4 border rounded-lg bg-green-50">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="" alt={currentHomeroomTeacher} />
                  <AvatarFallback className="text-lg font-bold bg-green-100 text-green-700">
                    {currentHomeroomTeacher.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{currentHomeroomTeacher}</h3>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      Homeroom Teacher
                    </Badge>
                  </div>
                  
                  {/* Teacher Details - Mock data for now */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>teacher@example.com</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>+84 123 456 789</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>Employee ID: EMP001</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <strong>Responsibilities:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Monitor student attendance and behavior</li>
                      <li>Communicate with parents about student progress</li>
                      <li>Coordinate with subject teachers</li>
                      <li>Organize class activities and meetings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No Homeroom Teacher Assigned
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This class doesn&apos;t have a homeroom teacher yet. Assign one to help manage the class.
              </p>
              <Button onClick={handleAssignHomeroom}>
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Homeroom Teacher
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Homeroom Teacher Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentHomeroomTeacher ? "Change" : "Assign"} Homeroom Teacher
            </DialogTitle>
            <DialogDescription>
              Select a teacher to {currentHomeroomTeacher ? "replace the current" : "assign as"} homeroom teacher for {classData.name}.
              {currentHomeroomTeacher && (
                <span className="block mt-2 text-sm">
                  Current: <strong>{currentHomeroomTeacher}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="homeroom-teacher-select" className="text-sm font-medium">Available Teachers</label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger id="homeroom-teacher-select">
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name} ({teacher.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading teachers...
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAssign}
              disabled={!selectedTeacherId || assigning}
            >
              {assigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentHomeroomTeacher ? "Changing..." : "Assigning..."}
                </>
              ) : (
                currentHomeroomTeacher ? "Change Teacher" : "Assign Teacher"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
