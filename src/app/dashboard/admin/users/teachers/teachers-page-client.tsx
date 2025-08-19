"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Plus, Users, RefreshCw } from "lucide-react"
import { UserTable } from "@/features/admin-management/components/admin/user-table"
import { TeacherForm } from "@/features/admin-management/components/admin/teacher-form"
import { getTeachersAction, getTeacherStatsAction } from "@/features/admin-management/actions/user-actions"
import { type TeacherProfile, type StudentWithParent, type UserFilters } from "@/lib/validations/user-validations"

export default function TeachersPageClient() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([])
  const [loading, setLoading] = useState(true)
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

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
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
        setError(listRes.error || "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch giÃ¡o viÃªn")
      }

      if (statsRes.success) {
        setHomeroomCount(statsRes.homeroom ?? 0)
        setNewThisMonth(statsRes.newThisMonth ?? 0)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch giÃ¡o viÃªn")
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quáº£n lÃ½ giÃ¡o viÃªn</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Quáº£n lÃ½ tÃ i khoáº£n vÃ  thÃ´ng tin giÃ¡o viÃªn
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          ThÃªm giÃ¡o viÃªn
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Tá»•ng sá»‘ giÃ¡o viÃªn</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              TÃ i khoáº£n giÃ¡o viÃªn Ä‘ang hoáº¡t Ä‘á»™ng
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">GiÃ¡o viÃªn chá»§ nhiá»‡m</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {homeroomCount ?? teachers.filter(t => t.homeroom_enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              GiÃ¡o viÃªn cÃ³ quyá»n GVCN
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Má»›i trong thÃ¡ng</CardTitle>
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
              GiÃ¡o viÃªn Ä‘Æ°á»£c thÃªm trong thÃ¡ng nÃ y
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
          <TeacherForm
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

