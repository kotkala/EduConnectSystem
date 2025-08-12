'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, FileSpreadsheet, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { 
  getGradeReportingPeriodsAction,
  deleteGradeReportingPeriodAction 
} from '@/lib/actions/grade-management-actions'
import { GradeReportingPeriodForm } from '@/components/admin/grade-management/grade-reporting-period-form'
import { ExcelImportDialog } from '@/components/admin/grade-management/excel-import-dialog'
import { GradeEditor } from '@/components/admin/grade-management/grade-editor'
import { AuditTrailViewer } from '@/components/admin/grade-management/audit-trail-viewer'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { GradeReportingPeriod } from '@/lib/validations/grade-management-validations'

export function GradeManagementClient() {
  const [periods, setPeriods] = useState<GradeReportingPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState<GradeReportingPeriod | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('periods')


  // Load grade reporting periods
  const loadPeriods = async () => {
    try {
      setLoading(true)
      const result = await getGradeReportingPeriodsAction()
      
      if (result.success) {
        setPeriods((result.data || []) as unknown as GradeReportingPeriod[])
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Không thể tải danh sách kỳ báo cáo")
    } finally {
      setLoading(false)
    }
  }

  // Handle delete period
  const handleDeletePeriod = async () => {
    if (!selectedPeriod) return

    try {
      const result = await deleteGradeReportingPeriodAction(selectedPeriod.id)
      
      if (result.success) {
        toast.success(result.message)
        await loadPeriods()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Không thể xóa kỳ báo cáo")
    } finally {
      setShowDeleteDialog(false)
      setSelectedPeriod(null)
    }
  }

  // Check if period allows operations
  const canImportGrades = useCallback((period: GradeReportingPeriod) => {
    const now = new Date()
    const startDate = new Date(period.start_date)
    const importDeadline = new Date(period.import_deadline)
    return now >= startDate && now <= importDeadline && period.is_active
  }, [])

  const canEditGrades = useCallback((period: GradeReportingPeriod) => {
    const now = new Date()
    const editDeadline = new Date(period.edit_deadline)
    return now <= editDeadline && period.is_active
  }, [])

  // Get period status
  const getPeriodStatus = useCallback((period: GradeReportingPeriod) => {
    const now = new Date()
    const startDate = new Date(period.start_date)
    const importDeadline = new Date(period.import_deadline)
    const editDeadline = new Date(period.edit_deadline)

    if (!period.is_active) {
      return { label: 'Đã vô hiệu hóa', variant: 'secondary' as const }
    }

    if (now < startDate) {
      return { label: 'Chưa bắt đầu', variant: 'outline' as const }
    }

    if (now > editDeadline) {
      return { label: 'Đã khóa', variant: 'destructive' as const }
    }

    if (now > importDeadline) {
      return { label: 'Hết hạn nhập', variant: 'secondary' as const }
    }

    if (now <= importDeadline) {
      return { label: 'Đang mở', variant: 'default' as const }
    }

    return { label: 'Đang hoạt động', variant: 'default' as const }
  }, [])

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }, [])

  // Memoize periods with status calculations to prevent re-computation
  const periodsWithStatus = useMemo(() => {
    return periods.map(period => ({
      ...period,
      status: getPeriodStatus(period),
      canImport: canImportGrades(period),
      canEdit: canEditGrades(period)
    }))
  }, [periods, getPeriodStatus, canImportGrades, canEditGrades])

  useEffect(() => {
    loadPeriods()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-muted-foreground">Đang tải dữ liệu...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Tạo kỳ báo cáo</span>
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="periods">Kỳ báo cáo</TabsTrigger>
          <TabsTrigger value="import">Nhập điểm</TabsTrigger>
          <TabsTrigger value="edit">Sửa điểm</TabsTrigger>
          <TabsTrigger value="audit">Lịch sử thay đổi</TabsTrigger>
        </TabsList>

        {/* Grade Reporting Periods Tab */}
        <TabsContent value="periods" className="space-y-4">
          {periodsWithStatus.length === 0 ? (
            <EmptyState
              icon={FileSpreadsheet}
              title="Chưa có kỳ báo cáo nào"
              description="Tạo kỳ báo cáo đầu tiên để bắt đầu quản lý điểm số"
              action={
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo kỳ báo cáo
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {periodsWithStatus.map((period) => (
                <Card key={period.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{period.name}</CardTitle>
                        <CardDescription>
                          {period.academic_year?.name} - {period.semester?.name}
                        </CardDescription>
                      </div>
                      <Badge variant={period.status.variant}>
                        {period.status.label}
                      </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Period Dates */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Thời gian:</span>
                          <span>{formatDate(period.start_date)} - {formatDate(period.end_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hạn nhập:</span>
                          <span className={period.canImport ? 'text-green-600' : 'text-red-600'}>
                            {formatDate(period.import_deadline)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Hạn sửa:</span>
                          <span className={period.canEdit ? 'text-green-600' : 'text-red-600'}>
                            {formatDate(period.edit_deadline)}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPeriod(period)
                            setShowEditForm(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPeriod(period)
                            setShowImportDialog(true)
                          }}
                          disabled={!period.canImport}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPeriod(period)
                            setActiveTab('edit')
                          }}
                          disabled={!period.canEdit}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPeriod(period)
                            setShowDeleteDialog(true)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </TabsContent>

        {/* Excel Import Tab */}
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Nhập điểm từ Excel</CardTitle>
              <CardDescription>
                Chọn kỳ báo cáo và tải lên file Excel theo định dạng VNedu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Import interface will be implemented here */}
              <div className="text-center py-8 text-muted-foreground">
                Chọn kỳ báo cáo từ tab &ldquo;Kỳ báo cáo&rdquo; để bắt đầu nhập điểm
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grade Editor Tab */}
        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Sửa điểm số</CardTitle>
              <CardDescription>
                Chỉnh sửa điểm số với ghi chú lý do thay đổi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPeriod ? (
                <GradeEditor period={selectedPeriod} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Chọn kỳ báo cáo từ tab &ldquo;Kỳ báo cáo&rdquo; để bắt đầu sửa điểm
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Lịch sử thay đổi điểm</CardTitle>
              <CardDescription>
                Theo dõi tất cả các thay đổi điểm số với lý do và thời gian
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuditTrailViewer />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showCreateForm && (
        <GradeReportingPeriodForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSuccess={() => {
            setShowCreateForm(false)
            loadPeriods()
          }}
        />
      )}

      {showEditForm && selectedPeriod && (
        <GradeReportingPeriodForm
          open={showEditForm}
          onOpenChange={setShowEditForm}
          period={selectedPeriod}
          onSuccess={() => {
            setShowEditForm(false)
            setSelectedPeriod(null)
            loadPeriods()
          }}
        />
      )}

      {showImportDialog && selectedPeriod && (
        <ExcelImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          period={selectedPeriod}
          onSuccess={() => {
            setShowImportDialog(false)
            setSelectedPeriod(null)
          }}
        />
      )}

      {showDeleteDialog && selectedPeriod && (
        <ConfirmDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          title="Xóa kỳ báo cáo"
          description={`Bạn có chắc chắn muốn xóa kỳ báo cáo &ldquo;${selectedPeriod.name}&rdquo;? Hành động này không thể hoàn tác.`}
          onConfirm={handleDeletePeriod}
          confirmText="Xóa"
          variant="destructive"
        />
      )}
    </div>
  )
}
