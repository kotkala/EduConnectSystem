"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { AdminPageTemplate } from "@/shared/components/dashboard/admin-page-template"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Badge } from "@/shared/components/ui/badge"
import {
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  
} from "lucide-react"
import { toast } from "sonner"

import { GradePeriodTable } from "@/shared/components/admin/grade-period-table"
import { GradePeriodForm } from "@/shared/components/admin/grade-period-form"
import { GradePeriodStatusDialog } from "@/shared/components/admin/grade-period-status-dialog"


import {
  getEnhancedGradeReportingPeriodsAction,
  updateGradeReportingPeriodStatusAction
} from "@/lib/actions/enhanced-grade-actions"
import {
  type EnhancedGradeReportingPeriod,
  type GradePeriodFiltersFormData
} from "@/lib/validations/enhanced-grade-validations"

export default function GradePeriodsPage() {
  const [periods, setPeriods] = useState<EnhancedGradeReportingPeriod[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<EnhancedGradeReportingPeriod | undefined>()
  const [selectedPeriod, setSelectedPeriod] = useState<EnhancedGradeReportingPeriod | undefined>()
  
  // Filter states
  const [filters, setFilters] = useState<GradePeriodFiltersFormData>({
    page: 1,
    limit: 20
  })

  const loadPeriods = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await getEnhancedGradeReportingPeriodsAction(filters)
      if (result.success) {
        setPeriods(result.data || [])
        setTotal(result.total || 0)
      } else {
        setError(result.error || 'Không thể tải danh sách kỳ báo cáo điểm')
      }
    } catch {
      setError('Không thể tải danh sách kỳ báo cáo điểm')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])



  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleCreatePeriod = () => {
    setEditingPeriod(undefined)
    setFormDialogOpen(true)
  }

  const handleEditPeriod = (period: EnhancedGradeReportingPeriod) => {
    setEditingPeriod(period)
    setFormDialogOpen(true)
  }

  const handleStatusChange = (period: EnhancedGradeReportingPeriod) => {
    setSelectedPeriod(period)
    setStatusDialogOpen(true)
  }

  const handleFormSuccess = () => {
    setFormDialogOpen(false)
    setEditingPeriod(undefined)
    loadPeriods()
    toast.success(editingPeriod ? 'Cập nhật kỳ báo cáo thành công!' : 'Tạo kỳ báo cáo thành công!')
  }

  const handleFormCancel = () => {
    setFormDialogOpen(false)
    setEditingPeriod(undefined)
  }

  const handleStatusUpdate = async (
    periodId: string, 
    status: 'open' | 'closed' | 'reopened',
    reason?: string
  ) => {
    try {
      const result = await updateGradeReportingPeriodStatusAction(periodId, status, reason)
      if (result.success) {
        setStatusDialogOpen(false)
        setSelectedPeriod(undefined)
        loadPeriods()
        toast.success('Cập nhật trạng thái thành công!')
      } else {
        toast.error(result.error || 'Không thể cập nhật trạng thái')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Lỗi khi cập nhật trạng thái')
    }
  }

  const handleRefresh = () => {
    loadPeriods()
  }

  // Calculate stats
  const openPeriods = periods.filter(p => p.status === 'open').length
  const closedPeriods = periods.filter(p => p.status === 'closed').length
  const reopenedPeriods = periods.filter(p => p.status === 'reopened').length
  const activePeriods = periods.length // All periods are considered active

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'closed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'reopened':
        return <RotateCcw className="h-4 w-4 text-orange-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="bg-green-100 text-green-800">Đang mở</Badge>
      case 'closed':
        return <Badge variant="destructive">Đã đóng</Badge>
      case 'reopened':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Mở lại</Badge>
      default:
        return <Badge variant="outline">Không xác định</Badge>
    }
  }

  return (
    <AdminPageTemplate
      title="Quản lý kỳ điểm"
      description="Quản lý các kỳ kiểm tra và đánh giá"
      actions={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading} className="w-full sm:w-auto">
            Làm mới
          </Button>
          <Button onClick={handleCreatePeriod} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Tạo kỳ nhập điểm
          </Button>
        </div>
      }
      showCard={true}
    >
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Tổng số kỳ</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">
                {activePeriods} đang hoạt động
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Đang mở</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-600">{openPeriods}</div>
              <p className="text-xs text-muted-foreground">
                kỳ đang nhận điểm
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Đã đóng</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-600">{closedPeriods}</div>
              <p className="text-xs text-muted-foreground">
                kỳ đã kết thúc
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Mở lại</CardTitle>
              <RotateCcw className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-orange-600">{reopenedPeriods}</div>
              <p className="text-xs text-muted-foreground">
                kỳ được mở lại
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

        {/* Grade Periods Table */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách kỳ nhập điểm</CardTitle>
          </CardHeader>
          <CardContent>
            <GradePeriodTable
              data={periods}
              total={total}
              currentPage={filters.page || 1}
              limit={filters.limit || 20}
              onPageChange={handlePageChange}
              onEdit={handleEditPeriod}
              onStatusChange={handleStatusChange}
              getStatusIcon={getStatusIcon}
              getStatusBadge={getStatusBadge}
            />
          </CardContent>
        </Card>

        {/* Form Dialog */}
        <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPeriod ? 'Chỉnh sửa kỳ nhập điểm' : 'Tạo kỳ nhập điểm mới'}
              </DialogTitle>
            </DialogHeader>
            <GradePeriodForm
              period={editingPeriod}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>

        {/* Status Change Dialog */}
        <GradePeriodStatusDialog
          open={statusDialogOpen}
          onOpenChange={setStatusDialogOpen}
          period={selectedPeriod}
          onStatusUpdate={handleStatusUpdate}
        />
      </div>
    </AdminPageTemplate>
  )
}