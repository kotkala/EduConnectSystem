"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
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
  RefreshCw
} from "lucide-react"
import { toast } from "sonner"

import { GradePeriodTable } from "@/features/admin-management/components/admin/grade-period-table"
import { GradePeriodForm } from "@/features/admin-management/components/admin/grade-period-form"
import { GradePeriodStatusDialog } from "@/features/admin-management/components/admin/grade-period-status-dialog"

import { 
  getEnhancedGradeReportingPeriodsAction,
  updateGradeReportingPeriodStatusAction
} from "@/features/grade-management/actions/enhanced-grade-actions"
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
        setError(result.error || 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch ká»³ bÃ¡o cÃ¡o Ä‘iá»ƒm')
      }
    } catch {
      setError('KhÃ´ng thá»ƒ táº£i danh sÃ¡ch ká»³ bÃ¡o cÃ¡o Ä‘iá»ƒm')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  const handleFiltersChange = (newFilters: Partial<GradePeriodFiltersFormData>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }))
  }

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
    toast.success(editingPeriod ? 'Cáº­p nháº­t ká»³ bÃ¡o cÃ¡o thÃ nh cÃ´ng!' : 'Táº¡o ká»³ bÃ¡o cÃ¡o thÃ nh cÃ´ng!')
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
        toast.success('Cáº­p nháº­t tráº¡ng thÃ¡i thÃ nh cÃ´ng!')
      } else {
        toast.error(result.error || 'KhÃ´ng thá»ƒ cáº­p nháº­t tráº¡ng thÃ¡i')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Lá»—i khi cáº­p nháº­t tráº¡ng thÃ¡i')
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
        return <Badge variant="default" className="bg-green-100 text-green-800">Äang má»Ÿ</Badge>
      case 'closed':
        return <Badge variant="destructive">ÄÃ£ Ä‘Ã³ng</Badge>
      case 'reopened':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Má»Ÿ láº¡i</Badge>
      default:
        return <Badge variant="outline">KhÃ´ng xÃ¡c Ä‘á»‹nh</Badge>
    }
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quáº£n lÃ½ ká»³ nháº­p Ä‘iá»ƒm</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Quáº£n lÃ½ 7 ká»³ nháº­p Ä‘iá»ƒm trong nÄƒm há»c vÃ  theo dÃµi tráº¡ng thÃ¡i
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              LÃ m má»›i
            </Button>
            <Button onClick={handleCreatePeriod} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Táº¡o ká»³ nháº­p Ä‘iá»ƒm
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Tá»•ng sá»‘ ká»³</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">
                {activePeriods} Ä‘ang hoáº¡t Ä‘á»™ng
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Äang má»Ÿ</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-600">{openPeriods}</div>
              <p className="text-xs text-muted-foreground">
                ká»³ Ä‘ang nháº­n Ä‘iá»ƒm
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">ÄÃ£ Ä‘Ã³ng</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-600">{closedPeriods}</div>
              <p className="text-xs text-muted-foreground">
                ká»³ Ä‘Ã£ káº¿t thÃºc
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Má»Ÿ láº¡i</CardTitle>
              <RotateCcw className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-orange-600">{reopenedPeriods}</div>
              <p className="text-xs text-muted-foreground">
                ká»³ Ä‘Æ°á»£c má»Ÿ láº¡i
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
            <CardTitle>Danh sÃ¡ch ká»³ nháº­p Ä‘iá»ƒm</CardTitle>
          </CardHeader>
          <CardContent>
            <GradePeriodTable
              data={periods}
              total={total}
              currentPage={filters.page || 1}
              limit={filters.limit || 20}
              onPageChange={handlePageChange}
              onFiltersChange={handleFiltersChange}
              onEdit={handleEditPeriod}
              onStatusChange={handleStatusChange}
              onRefresh={handleRefresh}
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
                {editingPeriod ? 'Chá»‰nh sá»­a ká»³ nháº­p Ä‘iá»ƒm' : 'Táº¡o ká»³ nháº­p Ä‘iá»ƒm má»›i'}
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
    </div>
  )
}
