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
        return <Badge variant="outline">KhÃ´ng xÃ¡c Ä‘á»‹nh</Badge>
    }
  }

  if (!period) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thay Ä‘á»•i tráº¡ng thÃ¡i ká»³ bÃ¡o cÃ¡o</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">{period.name}</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tráº¡ng thÃ¡i hiá»‡n táº¡i:</span>
              {getStatusBadge(period.status)}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Tráº¡ng thÃ¡i má»›i *</Label>
              <Select value={selectedStatus} onValueChange={(value: 'open' | 'closed' | 'reopened') => setSelectedStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Chá»n tráº¡ng thÃ¡i" />
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
                  LÃ½ do {selectedStatus === 'reopened' ? 'má»Ÿ láº¡i' : 'Ä‘Ã³ng'} 
                  {selectedStatus === 'reopened' && ' *'}
                </Label>
                <Textarea
                  id="reason"
                  placeholder={`Nháº­p lÃ½ do ${selectedStatus === 'reopened' ? 'má»Ÿ láº¡i' : 'Ä‘Ã³ng'} ká»³ bÃ¡o cÃ¡o`}
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
                  <strong>LÆ°u Ã½:</strong> Khi má»Ÿ láº¡i ká»³ bÃ¡o cÃ¡o, giÃ¡o viÃªn sáº½ cÃ³ thá»ƒ chá»‰nh sá»­a Ä‘iá»ƒm sá»‘. 
                  Há»‡ thá»‘ng sáº½ ghi láº¡i táº¥t cáº£ cÃ¡c thay Ä‘á»•i.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                Há»§y
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Äang cáº­p nháº­t...' : 'Cáº­p nháº­t tráº¡ng thÃ¡i'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
