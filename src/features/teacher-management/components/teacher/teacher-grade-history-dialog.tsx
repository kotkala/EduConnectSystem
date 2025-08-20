"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Badge } from "@/shared/components/ui/badge"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { Clock, User, FileText } from "lucide-react"
import { type GradePeriodSubmission } from "@/lib/validations/enhanced-grade-validations"

interface TeacherGradeHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission?: GradePeriodSubmission
}

export function TeacherGradeHistoryDialog({
  open,
  onOpenChange,
  submission
}: TeacherGradeHistoryDialogProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Nháp</Badge>
      case 'submitted':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Đã gửi</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Đã duyệt</Badge>
      case 'rejected':
        return <Badge variant="destructive">Bị từ chối</Badge>
      default:
        return <Badge variant="outline">Không xác định</Badge>
    }
  }

  if (!submission) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Lịch sử bài nộp điểm</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Submission Info */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">
                {submission.subject?.name_vietnamese} - {submission.class?.name}
              </h4>
              {getStatusBadge(submission.status)}
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Kỳ báo cáo: {submission.period?.name}</p>
              <p>Số lần gửi: {submission.submission_count}</p>
            </div>
          </div>

          {/* History Timeline */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {/* Created */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">Tạo bài nộp</h5>
                    <span className="text-sm text-muted-foreground">
                      {new Date(submission.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bài nộp điểm được tạo bởi {submission.teacher?.full_name}
                  </p>
                </div>
              </div>

              {/* Submitted */}
              {submission.submitted_at && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">Gửi bài nộp</h5>
                      <span className="text-sm text-muted-foreground">
                        {new Date(submission.submitted_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Bài nộp được gửi để admin duyệt
                    </p>
                  </div>
                </div>
              )}

              {/* Approved */}
              {submission.approved_at && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">Duyệt bài nộp</h5>
                      <span className="text-sm text-muted-foreground">
                        {new Date(submission.approved_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Bài nộp được duyệt bởi {submission.approved_by_profile?.full_name}
                    </p>
                  </div>
                </div>
              )}

              {/* Resubmission reason */}
              {submission.reason_for_resubmission && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <FileText className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h5 className="font-medium">Gửi lại</h5>
                      <span className="text-sm text-muted-foreground">
                        {new Date(submission.updated_at).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Lý do gửi lại:
                    </p>
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                      <p className="text-sm text-orange-700">
                        {submission.reason_for_resubmission}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Last updated */}
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-gray-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">Cập nhật cuối</h5>
                    <span className="text-sm text-muted-foreground">
                      {new Date(submission.updated_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Lần cập nhật gần nhất
                  </p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
