"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Plus, Users } from "lucide-react"
import { UserTable } from "@/features/admin-management/components/admin/user-table"
import { IntegratedTeacherForm } from "@/features/admin-management/components/admin/integrated-teacher-form"
import { getTeachersAction, getTeacherStatsAction } from "@/features/admin-management/actions/user-actions"
import { type TeacherProfile, type StudentWithParent, type UserFilters } from "@/lib/validations/user-validations"

import { Skeleton } from "@/shared/components/ui/skeleton"
import { useSectionLoading } from "@/shared/hooks/use-loading-coordinator"

export default function TeachersPageClient() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([])
  const { isLoading: loading, startLoading, stopLoading } = useSectionLoading("Đang tải danh sách giáo viên...")
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<UserFilters>({ page: 1, limit: 10 })
  const [homeroomCount, setHomeroomCount] = useState<number | null>(null)
  const [newThisMonth, setNewThisMonth] = useState<number | null>(null)
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null)

  // Debug: Check if this is triggering global loading
  console.log('🔍 TeachersPage - Loading state:', loading)

  const fetchTeachers = useCallback(async () => {
    // Chỉ start loading nếu chưa có data
    if (teachers.length === 0) {
      startLoading()
    }
    setError(null)

    try {
      const [listRes, statsRes] = await Promise.all([
        getTeachersAction(filters),
        getTeacherStatsAction()
      ])

      if (listRes.success) {
        setTeachers(listRes.data)
        setTotal(listRes.total)
        setCurrentPage(listRes.page || 1)
      } else {
        setError(listRes.error || "Không thể tải danh sách giáo viên")
      }

      if (statsRes.success) {
        setHomeroomCount(statsRes.homeroom ?? 0)
        setNewThisMonth(statsRes.newThisMonth ?? 0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách giáo viên")
    } finally {
      stopLoading()
    }
  }, [filters, startLoading, stopLoading, teachers.length])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleFiltersChange = (newFilters: Partial<UserFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
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



  if (loading && teachers.length === 0) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
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
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quản lý giáo viên</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Quản lý tài khoản và thông tin giáo viên
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Thêm giáo viên
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Tổng số giáo viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              Tài khoản giáo viên đang hoạt động
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Giáo viên chủ nhiệm</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {homeroomCount ?? teachers.filter(t => t.homeroom_enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Giáo viên có quyền GVCN
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Mới trong tháng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {newThisMonth ?? ((): number => {
                const now = new Date()
                return teachers.filter(t => {
                  const created = new Date(t.created_at)
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                }).length
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Giáo viên được thêm trong tháng này
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
      />

      {/* Create Teacher Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Add New Teacher</DialogTitle>
          </DialogHeader>
          <IntegratedTeacherForm
            onSuccess={handleCreateSuccess}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Edit Teacher</DialogTitle>
          </DialogHeader>
          {editingTeacher && (
            <IntegratedTeacherForm
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

