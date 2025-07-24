"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Users, RefreshCw } from "lucide-react"
import { UserTable } from "@/components/admin/user-table"
import { TeacherForm } from "@/components/admin/teacher-form"
import { getTeachersAction } from "@/lib/actions/user-actions"
import { type TeacherProfile, type StudentWithParent, type UserFilters } from "@/lib/validations/user-validations"

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 10 })
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null)

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getTeachersAction(filters)

      if (result.success) {
        setTeachers(result.data)
        setTotal(result.total)
        setCurrentPage(result.page || 1)
      } else {
        setError(result.error || "Failed to fetch teachers")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch teachers")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleFiltersChange = (newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleEdit = (user: TeacherProfile | StudentWithParent) => {
    const teacher = user as TeacherProfile
    setEditingTeacher(teacher)
    setShowEditDialog(true)
  }

  const handleCreateSuccess = () => {
    setShowCreateDialog(false)
    fetchTeachers()
  }

  const handleEditSuccess = () => {
    setShowEditDialog(false)
    setEditingTeacher(null)
    fetchTeachers()
  }

  const handleRefresh = () => {
    fetchTeachers()
  }

  if (loading && teachers.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Teacher Management</h1>
          <p className="text-muted-foreground">
            Manage teacher accounts and information
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              Active teacher accounts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Homeroom Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teachers.filter(t => t.homeroom_enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Teachers with homeroom access
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teachers.filter(t => {
                const created = new Date(t.created_at)
                const now = new Date()
                return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Teachers added this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Teachers Table */}
      <UserTable
        users={teachers}
        userType="teacher"
        total={total}
        currentPage={currentPage}
        limit={filters.limit}
        onPageChange={handlePageChange}
        onFiltersChange={handleFiltersChange}
        onEdit={handleEdit}
        onRefresh={handleRefresh}
      />

      {/* Create Teacher Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
          </DialogHeader>
          <TeacherForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
          </DialogHeader>
          {editingTeacher && (
            <TeacherForm
              teacher={editingTeacher}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setShowEditDialog(false)
                setEditingTeacher(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
