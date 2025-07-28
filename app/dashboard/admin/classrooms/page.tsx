"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Building, Users, Settings, RefreshCw } from "lucide-react"
import { ClassroomTable } from "@/components/admin/classroom-table"
import { ClassroomForm } from "@/components/admin/classroom-form"
import { SidebarLayout } from "@/components/dashboard/sidebar-layout"
import { getClassroomsAction, type Classroom } from "@/lib/actions/classroom-actions"
import { type ClassroomFilters } from "@/lib/validations/timetable-validations"

export default function ClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
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
    setLoading(true)
    setError(null)
    
    try {
      const result = await getClassroomsAction(filters)
      if (result.success) {
        setClassrooms(result.data)
        setTotal(result.total)
      } else {
        setError(result.error || 'Failed to load classrooms')
      }
    } catch {
      setError('Failed to load classrooms')
    } finally {
      setLoading(false)
    }
  }, [filters])

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

  const handleEditClassroom = (classroom: Classroom) => {
    setEditingClassroom(classroom)
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
    <SidebarLayout role="admin" title="Classroom Management">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Classroom Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage classrooms, their capacity, equipment, and availability
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading} className="w-full sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
          <Button onClick={handleCreateClassroom} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Classroom
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Classrooms</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground">
              {activeClassrooms} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{totalCapacity}</div>
            <p className="text-xs text-muted-foreground">
              students across all rooms
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Room Types</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{roomTypes}</div>
            <p className="text-xs text-muted-foreground">
              different room types
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Average Capacity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {total > 0 ? Math.round(totalCapacity / total) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              students per room
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
          <CardTitle>Classrooms</CardTitle>
        </CardHeader>
        <CardContent>
          <ClassroomTable
            data={classrooms}
            total={total}
            currentPage={filters.page || 1}
            limit={filters.limit}
            onPageChange={handlePageChange}
            onFiltersChange={handleFiltersChange}
            onEdit={handleEditClassroom}
            onRefresh={handleRefresh}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClassroom ? 'Edit Classroom' : 'Create New Classroom'}
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
    </SidebarLayout>
  )
}
