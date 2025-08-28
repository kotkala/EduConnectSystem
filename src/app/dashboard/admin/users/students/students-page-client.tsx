"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Plus, Users, GraduationCap, Edit, Calendar } from "lucide-react"
import { UserTable } from "@/features/admin-management/components/admin/user-table"
import { StudentParentForm } from "@/features/admin-management/components/admin/student-parent-form"
import { getStudentsWithParentsAction } from "@/features/admin-management/actions/user-actions"
import { type StudentWithParent, type UserFilters, type TeacherProfile } from "@/lib/validations/user-validations"

import { Skeleton } from "@/shared/components/ui/skeleton"


export default function StudentsPageClient() {
  const [students, setStudents] = useState<StudentWithParent[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 10 })
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingStudent, setEditingStudent] = useState<StudentWithParent | null>(null)

  const fetchStudents = useCallback(async () => {
    // Chỉ start loading nếu chưa có data
    if (students.length === 0) {
      setLoading(true)
    }
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
  }, [filters, students.length])

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
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-end">
          <Skeleton className="h-10 w-48" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-4" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Thanh công cụ */}
      <div className="flex items-center justify-end">
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
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
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
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

      {/* Create Student & Parent Dialog - OPTIMIZED RESPONSIVE LAYOUT */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95vw] max-w-[1400px] max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 sm:p-6 pb-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold">Thêm Học sinh & Phụ huynh mới</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            <StudentParentForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateDialog(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Student & Parent Dialog - OPTIMIZED RESPONSIVE LAYOUT */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[95vw] max-w-[1400px] max-h-[95vh] overflow-y-auto p-0">
          <DialogHeader className="p-4 sm:p-6 pb-0">
            <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-3">
              <Edit className="h-5 w-5 sm:h-6 sm:w-6" />
              Chỉnh sửa thông tin Học sinh & Phụ huynh
            </DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <div className="w-full">
              <StudentParentForm
                editMode={true}
                initialData={editingStudent}
                onSuccess={handleEditSuccess}
                onCancel={() => {
                  setShowEditDialog(false)
                  setEditingStudent(null)
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
