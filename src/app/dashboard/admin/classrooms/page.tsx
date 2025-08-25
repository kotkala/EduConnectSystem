"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Plus, Building2, Users, Monitor } from "lucide-react"
import { ClassroomTable } from "@/features/admin-management/components/admin/classroom-table"
import { ClassroomForm } from "@/features/admin-management/components/admin/classroom-form"
import { getClassroomsAction } from "@/features/admin-management/actions/classroom-actions"
import { type Classroom, type ClassroomFilters } from "@/features/admin-management/actions/classroom-actions"

import { Skeleton } from "@/shared/components/ui/skeleton"
import { useSectionLoading } from "@/shared/hooks/use-loading-coordinator"

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [total, setTotal] = useState(0)
  const { isLoading: loading, startLoading, stopLoading } = useSectionLoading("Đang tải danh sách phòng học...")
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [editingClassroom, setEditingClassroom] = useState<Classroom | undefined>()
  
  // Filter states
  const [filters, setFilters] = useState<ClassroomFilters>({
    page: 1,
    limit: 10
  })

  const loadClassrooms = useCallback(async () => {
    startLoading()
    setError(null)
    
    try {
      const result = await getClassroomsAction(filters)
      if (result.success) {
        setClassrooms(result.data)
        setTotal(result.total)
      } else {
        setError(result.error || 'Không thể tải danh sách phòng học')
      }
    } catch {
      setError('Không thể tải danh sách phòng học')
    } finally {
      stopLoading()
    }
  }, [filters, startLoading, stopLoading])

  useEffect(() => {
    loadClassrooms()
  }, [loadClassrooms])

  const handleFiltersChange = (newFilters: Partial<ClassroomFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleCreateClassroom = () => {
    setEditingClassroom(undefined)
    setFormDialogOpen(true)
  }



  const handleFormSuccess = () => {
    setFormDialogOpen(false)
    setEditingClassroom(undefined)
    loadClassrooms()
  }

  const handleFormCancel = () => {
    setFormDialogOpen(false)
    setEditingClassroom(undefined)
  }

  const handleRefresh = () => {
    loadClassrooms()
  }

  // Calculate stats
  const activeClassrooms = classrooms.filter(c => c.is_active).length
  const totalCapacity = classrooms.reduce((sum, c) => sum + c.capacity, 0)
  const roomTypes = [...new Set(classrooms.map(c => c.room_type))].length

  return (
    <div className="p-6">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quản lý phòng học</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Quản lý phòng học, sức chứa, trang thiết bị và trạng thái sử dụng
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading} className="w-full sm:w-auto">
            <Skeleton className="h-32 w-full rounded-lg" />
            <span className="hidden sm:inline">Làm mới</span>
            <span className="sm:hidden">Làm mới</span>
          </Button>
          <Button onClick={handleCreateClassroom} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Thêm phòng học
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tổng số phòng học</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              {activeClassrooms} đang hoạt động
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tổng sức chứa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{totalCapacity}</div>
            <p className="text-xs text-muted-foreground">
              học sinh trên tất cả phòng
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Loại phòng</CardTitle>
            <Monitor className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{roomTypes}</div>
            <p className="text-xs text-muted-foreground">
              số loại phòng khác nhau
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Sức chứa trung bình</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {total > 0 ? Math.round(totalCapacity / total) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              học sinh mỗi phòng
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Classrooms Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách phòng học</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassroomTable
            data={classrooms}
            total={total}
            currentPage={filters.page || 1}
            limit={filters.limit}
            onPageChange={handlePageChange}
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefresh}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClassroom ? 'Chỉnh sửa phòng học' : 'Tạo phòng học mới'}
            </DialogTitle>
          </DialogHeader>
          <ClassroomForm
            classroom={editingClassroom}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
