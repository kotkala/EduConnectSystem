"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { AlertTriangle, Save, X } from "lucide-react"

interface GradeOverride {
  studentName: string
  componentType: 'midterm' | 'final' | 'semester_1' | 'semester_2' | 'yearly' | 'summary'
  oldValue: number
  newValue: number
  studentId: string
}

interface GradeOverrideReasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  overrides: GradeOverride[]
  onConfirm: (reasons: Record<string, string>) => void
  onCancel: () => void
}

export function GradeOverrideReasonDialog({
  open,
  onOpenChange,
  overrides,
  onConfirm,
  onCancel
}: GradeOverrideReasonDialogProps) {
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleReasonChange = (key: string, reason: string) => {
    setReasons(prev => ({
      ...prev,
      [key]: reason
    }))
  }

  const handleConfirm = async () => {
    // Validate that all overrides have reasons
    const missingReasons = overrides.filter(override => {
      const key = `${override.studentId}_${override.componentType}`
      return !reasons[key] || reasons[key].trim() === ''
    })

    if (missingReasons.length > 0) {
      return
    }

    setLoading(true)
    try {
      await onConfirm(reasons)
      setReasons({})
      onOpenChange(false)
    } catch (error) {
      console.error('Error confirming overrides:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setReasons({})
    onCancel()
    onOpenChange(false)
  }

  const getComponentDisplayName = (componentType: string) => {
    switch (componentType) {
      case 'midterm':
        return 'Giữa kỳ'
      case 'final':
        return 'Cuối kỳ'
      case 'semester_1':
        return 'Học kỳ 1'
      case 'semester_2':
        return 'Học kỳ 2'
      case 'yearly':
        return 'Cả năm'
      case 'summary':
        return 'Tổng kết'
      default:
        return componentType
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Xác nhận ghi đè điểm số
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Phát hiện {overrides.length} thay đổi điểm kiểm tra giữa kỳ/cuối kỳ. 
              Vui lòng nhập lý do cho mỗi thay đổi để tiếp tục.
            </AlertDescription>
          </Alert>

          <div className="space-y-6">
            {overrides.map((override) => {
              const key = `${override.studentId}_${override.componentType}`
              const reason = reasons[key] || ''
              const hasReason = reason.trim() !== ''

              return (
                <div key={key} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-lg">{override.studentName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {getComponentDisplayName(override.componentType)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-sm">
                          {override.oldValue}
                        </span>
                        <span>→</span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                          {override.newValue}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`reason-${key}`}>
                      Lý do thay đổi điểm <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id={`reason-${key}`}
                      placeholder="Nhập lý do thay đổi điểm số (ví dụ: Sửa lỗi nhập liệu, Phúc khảo, Điều chỉnh theo quy định...)"
                      value={reason}
                      onChange={(e) => handleReasonChange(key, e.target.value)}
                      className={!hasReason ? 'border-red-300 focus:border-red-500' : ''}
                      rows={3}
                    />
                    {!hasReason && (
                      <p className="text-sm text-red-600">Vui lòng nhập lý do thay đổi</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="mr-2 h-4 w-4" />
            Hủy bỏ
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || overrides.some(override => {
              const key = `${override.studentId}_${override.componentType}`
              return !reasons[key] || reasons[key].trim() === ''
            })}
          >
            <Save className="mr-2 h-4 w-4" />
            {loading ? 'Đang xử lý...' : 'Xác nhận thay đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}