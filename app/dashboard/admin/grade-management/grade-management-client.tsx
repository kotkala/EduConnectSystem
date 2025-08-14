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
    <div className="space-y-8">
      {/* VNedu Disclaimer */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-amber-900 flex items-center">
            ⚠️ Miễn trừ trách nhiệm về quản lý
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-amber-800 space-y-2">
            <p>
              <strong>Lưu ý quan trọng:</strong> Hệ thống này chỉ đang lấy file upload Excel làm tham khảo từ phần mềm VNedu của bên thứ 3.
            </p>
            <p>
              Chúng tôi không chịu trách nhiệm về tính chính xác hoặc đầy đủ của dữ liệu được nhập từ các template Excel này.
              Vui lòng kiểm tra kỹ thông tin trước khi sử dụng trong môi trường sản xuất.
            </p>
            <p className="text-sm">
              Template Excel được thiết kế tương thích với định dạng VNedu để thuận tiện cho việc nhập liệu,
              nhưng không thay thế cho việc xác minh dữ liệu chính thức.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">🚀 Hướng dẫn sử dụng nhanh</CardTitle>
          <CardDescription className="text-blue-700">
            Quy trình quản lý điểm số theo thứ tự:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">1</div>
              <div>
                <div className="font-medium text-gray-900">Tạo kỳ báo cáo</div>
                <div className="text-sm text-gray-600">Thiết lập thời gian và hạn chót</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">2</div>
              <div>
                <div className="font-medium text-gray-900">Tải template Excel</div>
                <div className="text-sm text-gray-600">Lấy file mẫu cho từng lớp</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">3</div>
              <div>
                <div className="font-medium text-gray-900">Nhập điểm từ Excel</div>
                <div className="text-sm text-gray-600">Upload file đã điền điểm</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">4</div>
              <div>
                <div className="font-medium text-gray-900">Kiểm tra & sửa điểm</div>
                <div className="text-sm text-gray-600">Xem lại và chỉnh sửa nếu cần</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Action Button */}
      <div className="flex justify-center">
        <Button
          onClick={() => setShowCreateForm(true)}
          size="lg"
          className="flex items-center space-x-3 px-8 py-4 text-lg"
        >
          <Plus className="h-6 w-6" />
          <span>Tạo kỳ báo cáo mới</span>
        </Button>
      </div>

      {/* Simplified Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="periods" className="flex items-center space-x-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span>Quản lý kỳ báo cáo</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Nhập điểm Excel</span>
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center space-x-2">
            <Edit className="h-4 w-4" />
            <span>Chỉnh sửa điểm</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Lịch sử thay đổi</span>
          </TabsTrigger>
        </TabsList>

        {/* Grade Reporting Periods Tab */}
        <TabsContent value="periods" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách kỳ báo cáo điểm số</CardTitle>
              <CardDescription>
                Quản lý các kỳ báo cáo điểm số trong năm học. Mỗi kỳ có thời gian nhập và chỉnh sửa điểm riêng biệt.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {periodsWithStatus.length === 0 ? (
                <EmptyState
                  icon={FileSpreadsheet}
                  title="Chưa có kỳ báo cáo nào"
                  description="Tạo kỳ báo cáo đầu tiên để bắt đầu quản lý điểm số"
                  action={
                    <Button onClick={() => setShowCreateForm(true)} size="lg">
                      <Plus className="h-5 w-5 mr-2" />
                      Tạo kỳ báo cáo đầu tiên
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-4">
                  {periodsWithStatus.map((period) => (
                    <Card key={period.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          {/* Period Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-4">
                              <h3 className="text-xl font-semibold text-gray-900">{period.name}</h3>
                              <Badge variant={period.status.variant} className="text-sm px-3 py-1">
                                {period.status.label}
                              </Badge>
                            </div>

                            <div className="text-sm text-gray-600">
                              <span className="font-medium">{period.academic_year?.name}</span> - <span className="font-medium">{period.semester?.name}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="space-y-1">
                                <div className="text-gray-500">Thời gian kỳ báo cáo</div>
                                <div className="font-medium">{formatDate(period.start_date)} → {formatDate(period.end_date)}</div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-gray-500">Hạn chót nhập điểm</div>
                                <div className={`font-medium ${period.canImport ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatDate(period.import_deadline)}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-gray-500">Hạn chót sửa điểm</div>
                                <div className={`font-medium ${period.canEdit ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatDate(period.edit_deadline)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col space-y-2 ml-6">
                            <Button
                              variant="default"
                              onClick={() => {
                                setSelectedPeriod(period)
                                setShowImportDialog(true)
                              }}
                              disabled={!period.canImport}
                              className="w-full justify-start"
                            >
                              <FileSpreadsheet className="h-4 w-4 mr-2" />
                              Nhập điểm Excel
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedPeriod(period)
                                setActiveTab('edit')
                              }}
                              disabled={!period.canEdit}
                              className="w-full justify-start"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa điểm
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedPeriod(period)
                                setShowEditForm(true)
                              }}
                              className="w-full justify-start"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Cài đặt kỳ báo cáo
                            </Button>

                            <Button
                              variant="outline"
                              onClick={() => {
                                setSelectedPeriod(period)
                                setShowDeleteDialog(true)
                              }}
                              className="w-full justify-start text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Xóa kỳ báo cáo
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Excel Import Tab */}
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>📊 Nhập điểm từ file Excel</CardTitle>
              <CardDescription>
                Tải lên file Excel theo định dạng VNedu để nhập điểm hàng loạt cho học sinh
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPeriod ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Kỳ báo cáo đã chọn:</h4>
                    <p className="text-blue-700">{selectedPeriod.name} - {selectedPeriod.academic_year?.name}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-green-200">
                      <CardHeader className="bg-green-50">
                        <CardTitle className="text-green-800">Bước 1: Tải template Excel</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Tải file mẫu Excel có sẵn danh sách học sinh của lớp
                        </p>
                        <Button
                          onClick={() => setShowImportDialog(true)}
                          className="w-full"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Tải template Excel
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-200">
                      <CardHeader className="bg-orange-50">
                        <CardTitle className="text-orange-800">Bước 2: Upload file đã điền</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <p className="text-sm text-gray-600 mb-4">
                          Sau khi điền điểm vào file Excel, tải lên để nhập vào hệ thống
                        </p>
                        <Button
                          onClick={() => setShowImportDialog(true)}
                          variant="outline"
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Upload file Excel
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileSpreadsheet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa chọn kỳ báo cáo</h3>
                  <p className="text-gray-600 mb-6">
                    Vui lòng chọn kỳ báo cáo từ tab &ldquo;Quản lý kỳ báo cáo&rdquo; trước khi nhập điểm
                  </p>
                  <Button onClick={() => setActiveTab('periods')}>
                    Chọn kỳ báo cáo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grade Editor Tab */}
        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>✏️ Chỉnh sửa điểm số</CardTitle>
              <CardDescription>
                Tìm kiếm và chỉnh sửa điểm số của học sinh với ghi chú lý do thay đổi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedPeriod ? (
                <div className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">⚠️ Lưu ý quan trọng:</h4>
                    <ul className="text-yellow-800 text-sm space-y-1">
                      <li>• Mọi thay đổi điểm số đều được ghi lại trong lịch sử</li>
                      <li>• Bắt buộc phải ghi rõ lý do thay đổi (tối thiểu 10 ký tự)</li>
                      <li>• Chỉ có thể sửa điểm trong thời gian cho phép</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Kỳ báo cáo đang chỉnh sửa:</h4>
                    <p className="text-blue-700">{selectedPeriod.name} - {selectedPeriod.academic_year?.name}</p>
                  </div>

                  <GradeEditor period={selectedPeriod} />
                </div>
              ) : (
                <div className="text-center py-12">
                  <Edit className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa chọn kỳ báo cáo</h3>
                  <p className="text-gray-600 mb-6">
                    Vui lòng chọn kỳ báo cáo từ tab &ldquo;Quản lý kỳ báo cáo&rdquo; trước khi chỉnh sửa điểm
                  </p>
                  <Button onClick={() => setActiveTab('periods')}>
                    Chọn kỳ báo cáo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>📋 Lịch sử thay đổi điểm số</CardTitle>
              <CardDescription>
                Theo dõi tất cả các thay đổi điểm số với thông tin chi tiết về người thay đổi, thời gian và lý do
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">📊 Thông tin audit trail:</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    <li>• Ghi lại mọi thay đổi điểm số trong hệ thống</li>
                    <li>• Hiển thị điểm cũ, điểm mới và lý do thay đổi</li>
                    <li>• Theo dõi người thực hiện và thời gian chính xác</li>
                    <li>• Không thể xóa hoặc chỉnh sửa lịch sử</li>
                  </ul>
                </div>

                <AuditTrailViewer />
              </div>
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
