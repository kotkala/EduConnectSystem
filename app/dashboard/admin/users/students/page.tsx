"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Users, UserPlus, RefreshCw, GraduationCap } from "lucide-react"
import { UserTable } from "@/components/admin/user-table"
import { StudentParentForm } from "@/components/admin/student-parent-form"
import { getStudentsWithParentsAction } from "@/lib/actions/user-actions"
import { type StudentWithParent, type UserFilters } from "@/lib/validations/user-validations"

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithParent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 10 })
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getStudentsWithParentsAction(filters)

      if (result.success) {
        setStudents(result.data)
        setTotal(result.total)
        setCurrentPage(result.page || 1)
      } else {
        setError(result.error || "Failed to fetch students")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch students")
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleFiltersChange = (newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleEdit = () => {
    // For now, we'll just show an alert. Edit functionality can be implemented later
    alert("Edit functionality will be implemented in the next phase")
  }

  const handleCreateSuccess = () => {
    setShowCreateDialog(false)
    fetchStudents()
  }

  const handleRefresh = () => {
    fetchStudents()
  }

  // Calculate stats
  const studentsWithParents = students.filter(s => s.parent_relationship)
  const studentsWithoutParents = students.filter(s => !s.parent_relationship)
  const newThisMonth = students.filter(s => {
    const created = new Date(s.created_at)
    const now = new Date()
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
  })

  if (loading && students.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Student & Parent Management</h1>
          <p className="text-muted-foreground">
            Manage student accounts with mandatory parent relationships
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student & Parent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              Active student accounts
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {studentsWithParents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Students with parent links
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missing Parents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {studentsWithoutParents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Students without parent links
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {newThisMonth.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Students added this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warning for students without parents */}
      {studentsWithoutParents.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Warning: {studentsWithoutParents.length} student(s) do not have parent relationships. 
            This should not happen with the new system. Please contact support.
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Students Table */}
      <UserTable
        users={students}
        userType="student"
        total={total}
        currentPage={currentPage}
        limit={filters.limit}
        onPageChange={handlePageChange}
        onFiltersChange={handleFiltersChange}
        onEdit={handleEdit}
        onRefresh={handleRefresh}
      />

      {/* Create Student & Parent Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Student & Parent</DialogTitle>
          </DialogHeader>
          <StudentParentForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
