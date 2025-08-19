"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Settings } from "lucide-react"
import { type EnhancedGradeReportingPeriod } from "@/lib/validations/enhanced-grade-validations"

interface GradePeriodTableProps {
  readonly data: EnhancedGradeReportingPeriod[]
  readonly total: number
  readonly currentPage: number
  readonly limit: number
  readonly onPageChange: (page: number) => void
  readonly onEdit: (period: EnhancedGradeReportingPeriod) => void
  readonly onStatusChange: (period: EnhancedGradeReportingPeriod) => void
  readonly getStatusIcon: (status: string) => React.ReactNode
  readonly getStatusBadge: (status: string) => React.ReactNode
}

export function GradePeriodTable({
  data,
  total,
  currentPage,
  limit,
  onPageChange,
  onEdit,
  onStatusChange,
  getStatusIcon,
  getStatusBadge
}: GradePeriodTableProps) {
  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên kỳ báo cáo</TableHead>
              <TableHead>Loại kỳ</TableHead>
              <TableHead>Học kỳ</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Không có dữ liệu
                </TableCell>
              </TableRow>
            ) : (
              data.map((period) => (
                <TableRow key={period.id}>
                  <TableCell className="font-medium">
                    {period.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {period.period_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {period.academic_year?.name} - {period.semester?.name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(period.start_date).toLocaleDateString('vi-VN')} - {new Date(period.end_date).toLocaleDateString('vi-VN')}</div>
                      <div className="text-muted-foreground">
                        Hạn: {new Date(period.import_deadline).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(period.status)}
                      {getStatusBadge(period.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(period)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onStatusChange(period)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Hiển thị {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, total)} của {total} kết quả
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
