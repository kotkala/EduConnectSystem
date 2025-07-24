"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, GraduationCap, Users, BookOpen, RefreshCw } from "lucide-react"
import { ClassTable } from "@/components/admin/class-table"
import { ClassForm } from "@/components/admin/class-form"
import { getClassesAction, getHomeroomEnabledTeachersAction } from "@/lib/actions/class-actions"
import { getAcademicYearsAction, getSemestersAction } from "@/lib/actions/academic-actions"
import {
  type ClassWithDetails,
  type Class,
  type ClassFilters
} from "@/lib/validations/class-validations"
import { type AcademicYear, type Semester } from "@/lib/validations/academic-validations"

// Simple teacher interface for dropdown
interface SimpleTeacher {
  id: string
  full_name: string
  employee_id: string
}

export default function ClassManagementPage() {
  // Classes State
  const [classes, setClasses] = useState<ClassWithDetails[]>([])
  const [classesLoading, setClassesLoading] = useState(true)
  const [classesError, setClassesError] = useState<string | null>(null)
  const [classesTotal, setClassesTotal] = useState(0)
  const [classesPage, setClassesPage] = useState(1)
  const [classesFilters, setClassesFilters] = useState<ClassFilters>({ page: 1, limit: 10 })

  // Form Data State
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [teachers, setTeachers] = useState<SimpleTeacher[]>([])

  // Dialog States
  const [showCreateClassDialog, setShowCreateClassDialog] = useState(false)
  const [showEditClassDialog, setShowEditClassDialog] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)

  // Fetch Classes
  const fetchClasses = useCallback(async () => {
    setClassesLoading(true)
    setClassesError(null)

    try {
      const result = await getClassesAction(classesFilters)

      if (result.success) {
        setClasses(result.data)
        setClassesTotal(result.total)
        setClassesPage(result.page || 1)
      } else {
        const errorMessage = result.error || "Failed to fetch classes"
        setClassesError(errorMessage)
        console.error("Classes fetch error:", errorMessage)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch classes"
      setClassesError(errorMessage)
      console.error("Classes fetch exception:", err)
    } finally {
      setClassesLoading(false)
    }
  }, [classesFilters])

  // Fetch Form Data
  const fetchFormData = useCallback(async () => {
    try {
      const [academicYearsResult, semestersResult, teachersResult] = await Promise.all([
        getAcademicYearsAction({ page: 1, limit: 100 }),
        getSemestersAction({ page: 1, limit: 100 }),
        getHomeroomEnabledTeachersAction()
      ])

      if (academicYearsResult.success) {
        setAcademicYears(academicYearsResult.data)
      }

      if (semestersResult.success) {
        setSemesters(semestersResult.data)
      }

      if (teachersResult.success) {
        setTeachers(teachersResult.data)
      }
    } catch (error) {
      console.error("Failed to fetch form data:", error)
    }
  }, [])

  useEffect(() => {
    fetchClasses()
  }, [fetchClasses])

  useEffect(() => {
    fetchFormData()
  }, [fetchFormData])

  // Event Handlers
  const handleClassPageChange = (page: number) => {
    setClassesFilters(prev => ({ ...prev, page }))
  }

  const handleClassFiltersChange = (newFilters: Partial<ClassFilters>) => {
    setClassesFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleEditClass = (classData: ClassWithDetails) => {
    setEditingClass(classData as Class)
    setShowEditClassDialog(true)
  }

  const handleCreateClassSuccess = () => {
    setShowCreateClassDialog(false)
    fetchClasses()
  }

  const handleEditClassSuccess = () => {
    setShowEditClassDialog(false)
    setEditingClass(null)
    fetchClasses()
  }

  const handleRefresh = () => {
    fetchClasses()
    fetchFormData()
  }

  // Calculate stats
  const mainClasses = classes.filter(c => !c.is_subject_combination)
  const combinedClasses = classes.filter(c => c.is_subject_combination)
  const totalStudents = classes.reduce((sum, c) => sum + c.current_students, 0)
  const totalCapacity = classes.reduce((sum, c) => sum + c.max_students, 0)

  if (classesLoading && classes.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Class Management</h1>
          <p className="text-muted-foreground">
            Manage main classes and subject combination classes
          </p>
        </div>
        <Button onClick={() => setShowCreateClassDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classesTotal}</div>
            <p className="text-xs text-muted-foreground">
              All classes in system
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Main Classes</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mainClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              Regular homeroom classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Combined Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{combinedClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              Subject combination classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {totalCapacity > 0 ? `${Math.round((totalStudents / totalCapacity) * 100)}% capacity` : "No capacity"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {classesError && (
        <Alert variant="destructive">
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Error loading classes:</p>
              <p>{classesError}</p>
              {classesError.includes("does not exist") && (
                <div className="mt-2 p-2 bg-red-50 rounded border">
                  <p className="text-sm">
                    <strong>Database Setup Required:</strong> The classes table has not been created yet.
                    Please contact your system administrator to run the database setup.
                  </p>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Classes Table */}
      <ClassTable
        data={classes}
        total={classesTotal}
        currentPage={classesPage}
        limit={classesFilters.limit}
        onPageChange={handleClassPageChange}
        onFiltersChange={handleClassFiltersChange}
        onEdit={handleEditClass}
        onRefresh={handleRefresh}
        academicYears={academicYears}
        semesters={semesters}
        teachers={teachers}
      />

      {/* Create Class Dialog */}
      <Dialog open={showCreateClassDialog} onOpenChange={setShowCreateClassDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Class</DialogTitle>
          </DialogHeader>
          <ClassForm
            onSuccess={handleCreateClassSuccess}
            onCancel={() => setShowCreateClassDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={showEditClassDialog} onOpenChange={setShowEditClassDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
          </DialogHeader>
          {editingClass && (
            <ClassForm
              class={editingClass}
              onSuccess={handleEditClassSuccess}
              onCancel={() => {
                setShowEditClassDialog(false)
                setEditingClass(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
