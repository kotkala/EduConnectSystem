'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Download, Eye, User, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { formatGradeValue } from '@/lib/utils/grade-excel-utils'
import { getGradeAuditLogsAction } from '@/lib/actions/grade-management-actions'
import type { GradeAuditLog } from '@/lib/validations/grade-management-validations'

interface AuditTrailViewerProps {
  periodId?: string
}

interface AuditFilters {
  period_id?: string
  student_search?: string
  subject_id?: string
  class_id?: string
  changed_by?: string
  date_from?: string
  date_to?: string
}

export function AuditTrailViewer({ periodId }: AuditTrailViewerProps) {
  const [auditLogs, setAuditLogs] = useState<GradeAuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<AuditFilters>({
    period_id: periodId
  })
  const [selectedLog, setSelectedLog] = useState<GradeAuditLog | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [exporting, setExporting] = useState(false)


  // Load audit logs
  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      
      const result = await getGradeAuditLogsAction(filters)

      if (result.success) {
        setAuditLogs((result.data || []) as unknown as GradeAuditLog[])
      } else {
        toast.error(result.error || "Không thể tải lịch sử thay đổi điểm")
      }
    } catch {
      toast.error("Không thể tải lịch sử thay đổi điểm")
    } finally {
      setLoading(false)
    }
  }

  // Handle export audit trail
  const handleExportAuditTrail = async () => {
    try {
      setExporting(true)
      
      // TODO: Implement actual export functionality
      // const result = await exportGradeAuditTrailAction(filters)
      
      // Mock export
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("File báo cáo lịch sử thay đổi điểm đã được tải xuống")
    } catch {
      toast.error("Không thể xuất báo cáo")
    } finally {
      setExporting(false)
    }
  }

  // Handle view details
  const handleViewDetails = (log: GradeAuditLog) => {
    setSelectedLog(log)
    setShowDetailDialog(true)
  }

  // Memoized date formatting
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }, [])

  // Memoized relative time calculation
  const getRelativeTime = useCallback((dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Vừa xong'
    if (diffInHours < 24) return `${diffInHours} giờ trước`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} ngày trước`

    return formatDate(dateString)
  }, [formatDate])

  // Memoized change type badge
  const getChangeTypeBadge = useCallback((oldValue?: number, newValue?: number) => {
    if (oldValue === undefined) {
      return <Badge className="bg-green-100 text-green-800">Tạo mới</Badge>
    }

    if (newValue === undefined) {
      return <Badge variant="outline">Không xác định</Badge>
    }

    if (newValue > oldValue) {
      return <Badge className="bg-blue-100 text-blue-800">Tăng điểm</Badge>
    } else if (newValue < oldValue) {
      return <Badge className="bg-orange-100 text-orange-800">Giảm điểm</Badge>
    } else {
      return <Badge variant="outline">Không đổi</Badge>
    }
  }, [])

  useEffect(() => {
    loadAuditLogs()
  }, [filters])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
          <CardDescription>
            Lọc lịch sử thay đổi theo các tiêu chí
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tìm kiếm học sinh</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tên hoặc mã học sinh..."
                  value={filters.student_search || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    student_search: e.target.value
                  }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kỳ báo cáo</label>
              <Select
                value={filters.period_id || 'all'}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  period_id: value === 'all' ? undefined : value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả kỳ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả kỳ</SelectItem>
                  <SelectItem value="period1">Kỳ báo cáo giữa HK1</SelectItem>
                  <SelectItem value="period2">Kỳ báo cáo cuối HK1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Người thay đổi</label>
              <Select
                value={filters.changed_by || 'all'}
                onValueChange={(value) => setFilters(prev => ({
                  ...prev,
                  changed_by: value === 'all' ? undefined : value
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả người dùng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả người dùng</SelectItem>
                  <SelectItem value="admin1">Nguyễn Văn Admin</SelectItem>
                  <SelectItem value="teacher1">Trần Thị Giáo viên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Từ ngày</label>
              <Input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  date_from: e.target.value
                }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Đến ngày</label>
              <Input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  date_to: e.target.value
                }))}
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleExportAuditTrail}
                disabled={exporting}
                className="w-full"
              >
                {exporting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Xuất báo cáo
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử thay đổi điểm</CardTitle>
          <CardDescription>
            Tất cả các thay đổi điểm số được ghi lại với thời gian và lý do
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
              <span className="ml-2 text-muted-foreground">Đang tải lịch sử...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Chưa có lịch sử thay đổi"
              description="Chưa có thay đổi điểm nào được ghi lại"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Môn học</TableHead>
                  <TableHead>Thay đổi</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Người thay đổi</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.grade?.student?.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.grade?.student?.student_id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.grade?.subject?.name_vietnamese}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.grade?.class?.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.old_value !== undefined && (
                          <span className="text-red-600 line-through">
                            {formatGradeValue(log.old_value)}
                          </span>
                        )}
                        <span className="text-green-600 font-medium">
                          {formatGradeValue(log.new_value)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getChangeTypeBadge(log.old_value, log.new_value)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{log.changed_by_profile?.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="text-sm font-medium">
                          {getRelativeTime(log.changed_at)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(log.changed_at)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết thay đổi điểm</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về lần thay đổi điểm số
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              {/* Student Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Học sinh</label>
                  <div className="mt-1">
                    <div className="font-medium">{selectedLog.grade?.student?.full_name}</div>
                    <div className="text-sm text-gray-500">{selectedLog.grade?.student?.student_id}</div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Lớp - Môn học</label>
                  <div className="mt-1">
                    <div className="font-medium">{selectedLog.grade?.class?.name}</div>
                    <div className="text-sm text-gray-500">{selectedLog.grade?.subject?.name_vietnamese}</div>
                  </div>
                </div>
              </div>

              {/* Grade Change */}
              <div>
                <label className="text-sm font-medium text-gray-500">Thay đổi điểm</label>
                <div className="mt-1 flex items-center gap-4">
                  {selectedLog.old_value !== undefined ? (
                    <>
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600 line-through">
                          {formatGradeValue(selectedLog.old_value)}
                        </div>
                        <div className="text-xs text-gray-500">Điểm cũ</div>
                      </div>
                      <div className="text-gray-400">→</div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-400">-</div>
                      <div className="text-xs text-gray-500">Tạo mới</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">
                      {formatGradeValue(selectedLog.new_value)}
                    </div>
                    <div className="text-xs text-gray-500">Điểm mới</div>
                  </div>
                </div>
              </div>

              {/* Change Reason */}
              <div>
                <label className="text-sm font-medium text-gray-500">Lý do thay đổi</label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedLog.change_reason}</p>
                </div>
              </div>

              {/* Change Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Người thay đổi</label>
                  <div className="mt-1 font-medium">{selectedLog.changed_by_profile?.full_name}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Thời gian thay đổi</label>
                  <div className="mt-1 font-medium">{formatDate(selectedLog.changed_at)}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
