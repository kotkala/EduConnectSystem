"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Badge } from "@/shared/components/ui/badge"
import { ArrowLeft, GraduationCap, Users, UserCheck, Edit, Trash2 } from "lucide-react"
import { type ClassWithDetails } from "@/lib/validations/class-validations"
import { getClassByIdAction, deleteClassAction } from "@/features/admin-management/actions/class-actions"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
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
import { ClassForm } from "@/features/admin-management/components/admin/class-form"
import ClassStudentsTab from "@/features/admin-management/components/admin/class-detail/class-students-tab"
import ClassTeachersTab from "@/features/admin-management/components/admin/class-detail/class-teachers-tab"
import ClassHomeroomTab from "@/features/admin-management/components/admin/class-detail/class-homeroom-tab"


import { Skeleton } from "@/shared/components/ui/skeleton"

export default function ClassDetailPage() {
  const params = useParams()
  const router = useRouter()
  const classId = params.id as string

  const [classData, setClassData] = useState<ClassWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get class data by ID
        const result = await getClassByIdAction(classId)

        if (result.success && result.data) {
          setClassData(result.data)
        } else {
          setError(result.error || "Class not found")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load class data")
      } finally {
        setLoading(false)
      }
    }

    if (classId) {
      fetchClassData()
    }
  }, [classId])

  const handleBack = () => {
    router.push("/dashboard/admin/classes")
  }

  const handleEdit = () => {
    setShowEditDialog(true)
  }

  const handleDelete = async () => {
    if (!classData) return

    try {
      setDeleting(true)
      const result = await deleteClassAction(classData.id)

      if (result.success) {
        router.push("/dashboard/admin/classes")
      } else {
        setError(result.error || "Failed to delete class")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete class")
    } finally {
      setDeleting(false)
    }
  }

  const handleEditSuccess = () => {
    setShowEditDialog(false)
    // Refresh class data
    window.location.reload()
  }

  const getClassTypeBadge = (classData: ClassWithDetails) => {
    if (classData.is_subject_combination) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          Combined Class
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800">
        Main Class
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-32 w-full rounded-lg" />
            <span>Loading class details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !classData) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Classes
          </Button>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            {error || "Class not found"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Classes
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Class
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-red-600 hover:text-red-700">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Class
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Class</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{classData?.name}</strong>?
                  This action cannot be undone and will remove all student assignments and teacher assignments.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <Skeleton className="h-32 w-full rounded-lg" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Class"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Class Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <GraduationCap className="h-8 md:h-9 lg:h-10 w-8 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl">{classData.name}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  {getClassTypeBadge(classData)}
                  <Badge variant="outline">
                    {classData.academic_year?.name || "No Academic Year"}
                  </Badge>
                  <Badge variant="outline">
                    {classData.semester?.name || "No Semester"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{classData.current_students}/{classData.max_students} Students</span>
              </div>
              {classData.homeroom_teacher && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <UserCheck className="h-4 w-4" />
                  <span>Homeroom: {classData.homeroom_teacher.full_name}</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {classData.description && (
            <p className="text-muted-foreground">{classData.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Subject Teachers
          </TabsTrigger>
          <TabsTrigger value="homeroom" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Homeroom Teacher
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <ClassStudentsTab classId={classId} classData={classData} />
        </TabsContent>

        <TabsContent value="teachers" className="space-y-4">
          <ClassTeachersTab classId={classId} classData={classData} />
        </TabsContent>

        <TabsContent value="homeroom" className="space-y-4">
          <ClassHomeroomTab classId={classId} classData={classData} />
        </TabsContent>
      </Tabs>

      {/* Edit Class Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          <ClassForm
            class={classData}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
