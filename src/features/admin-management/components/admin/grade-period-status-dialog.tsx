"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Badge } from "@/shared/components/ui/badge"
import { type EnhancedGradeReportingPeriod } from "@/lib/validations/enhanced-grade-validations"

interface GradePeriodStatusDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  period?: EnhancedGradeReportingPeriod
  onStatusUpdate: (periodId: string, status: 'open' | 'closed' | 'reopened', reason?: string) => void
}

export function GradePeriodStatusDialog({
  open,
  onOpenChange,
  period,
  onStatusUpdate
}: GradePeriodStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<'open' | 'closed' | 'reopened'>('open')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!period) return

    setLoading(true)
    try {
      await onStatusUpdate(period.id, selectedStatus, reason || undefined)
    } finally {
      setLoading(false)
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
        return <Badge variant="outline">Không xác Ä‘á»‹nh</Badge>
    }
  }

  if (!period) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thay Ä‘á»•i trạng thái kỳ báo cáo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">{period.name}</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Trạng thái hiá»‡n táº¡i:</span>
              {getStatusBadge(period.status)}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái mới *</Label>
              <Select value={selectedStatus} onValueChange={(value: 'open' | 'closed' | 'reopened') => setSelectedStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chồn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Má»Ÿ</SelectItem>
                  <SelectItem value="closed">ÄÃ³ng</SelectItem>
                  <SelectItem value="reopened">Má»Ÿ láº¡i</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(selectedStatus === 'reopened' || selectedStatus === 'closed') && (
              <div className="space-y-2">
                <Label htmlFor="reason">
                  Lý do {selectedStatus === 'reopened' ? 'má»Ÿ láº¡i' : 'Ä‘Ã³ng'} 
                  {selectedStatus === 'reopened' && ' *'}
                </Label>
                <Textarea
                  id="reason"
                  placeholder={`Nhập lý do ${selectedStatus === 'reopened' ? 'má»Ÿ láº¡i' : 'Ä‘Ã³ng'} kỳ báo cáo`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required={selectedStatus === 'reopened'}
                />
              </div>
            )}

            {selectedStatus === 'reopened' && (
              <Alert>
                <AlertDescription>
                  <strong>LÆ°u Ã½:</strong> Khi má»Ÿ láº¡i kỳ báo cáo, giáo viên sẽ có thể chồ‰nh sửa Ä‘iá»ƒm sá»‘. 
                  Hồ‡ thồ‘ng sẽ ghi láº¡i táº¥t cả các thay Ä‘á»•i.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Äang cập nhật...' : 'Cập nhật trạng thái'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
