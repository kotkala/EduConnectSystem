"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Plus, Users, UserPlus, RefreshCw, GraduationCap, Edit } from "lucide-react"
import { UserTable } from "@/shared/components/admin/user-table"
import { StudentParentForm } from "@/shared/components/admin/student-parent-form"
import { getStudentsWithParentsAction } from "@/lib/actions/user-actions"
import { type StudentWithParent, type UserFilters, type TeacherProfile } from "@/lib/validations/user-validations"

export default function StudentsPageClient() {
  const [students, setStudents] = useState<StudentWithParent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 10 })

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentWithParent | null>(null)

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
        setError(result.error || "Không thể tải danh sách học sinh")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách học sinh")
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

  const handleEdit = (user: StudentWithParent | TeacherProfile) => {
    const s = user as StudentWithParent
    if (!s.student_id) {
      setError("Bản ghi học sinh thiếu Mã học sinh. Vui lòng chọn lại hoặc tải lại danh sách.")
      return
    }
    setEditingStudent(s)
    setShowEditDialog(true)
  }

  const handleCreateSuccess = () => {
    setShowCreateDialog(false)
    fetchStudents()
  }

  const handleEditSuccess = () => {
    setShowEditDialog(false)
    setEditingStudent(null)
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
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Thanh công cụ */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <UserPlus className="mr-2 h-4 w-4" />
          Thêm Học sinh & Phụ huynh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Tổng số học sinh</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              Tài khoản học sinh đang hoạt động
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Có phụ huynh</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-green-600">
              {studentsWithParents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Học sinh đã liên kết phụ huynh
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Thiếu phụ huynh</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold text-red-600">
              {studentsWithoutParents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Học sinh chưa liên kết phụ huynh
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Mới trong tháng</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {newThisMonth.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Học sinh được thêm trong tháng này
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Warning for students without parents */}
      {studentsWithoutParents.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            Cảnh báo: Có {studentsWithoutParents.length} học sinh chưa liên kết phụ huynh.
            Điều này không nên xảy ra với hệ thống mới. Vui lòng liên hệ hỗ trợ.
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
      />

      {/* Create Student & Parent Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add New Student & Parent</DialogTitle>
          </DialogHeader>
          <StudentParentForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Student & Parent Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Student & Parent Information
            </DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <StudentParentForm
              editMode={true}
              initialData={editingStudent}
              onSuccess={handleEditSuccess}
              onCancel={() => {
                setShowEditDialog(false)
                setEditingStudent(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
