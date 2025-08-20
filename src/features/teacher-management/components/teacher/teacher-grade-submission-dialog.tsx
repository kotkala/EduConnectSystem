"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Badge } from "@/shared/components/ui/badge"
import { Send, AlertTriangle } from "lucide-react"
import { type GradePeriodSubmission } from "@/lib/validations/enhanced-grade-validations"

interface TeacherGradeSubmissionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  submission?: GradePeriodSubmission
  onSuccess: () => void
}

export function TeacherGradeSubmissionDialog({
  open,
  onOpenChange,
  submission,
  onSuccess
}: TeacherGradeSubmissionDialogProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isResubmission = submission && submission.submission_count > 1

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submission) return

    setLoading(true)
    setError(null)

    try {
      // TODO: Implement actual submission logic
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      onSuccess()
    } catch (error) {
      console.error('Error submitting grades:', error)
      setError('CÃ³ lá»—i xáº£y ra khi gá»­i Ä‘iá»ƒm')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setReason('')
      setError(null)
      onOpenChange(false)
    }
  }

  if (!submission) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isResubmission ? 'Gá»­i láº¡i Ä‘iá»ƒm' : 'Gá»­i Ä‘iá»ƒm'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">
              {submission.subject?.name_vietnamese} - {submission.class?.name}
            </h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Láº§n gá»­i: {submission.submission_count}
              </span>
              <Badge variant="outline">NhÃ¡p</Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isResubmission && (
              <div className="space-y-2">
                <Label htmlFor="reason">LÃ½ do gá»­i láº¡i *</Label>
                <Textarea
                  id="reason"
                  placeholder="Nháº­p lÃ½ do gá»­i láº¡i Ä‘iá»ƒm (vÃ­ dá»¥: sá»­a lá»—i nháº­p liá»‡u, cáº­p nháº­t Ä‘iá»ƒm má»›i...)"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert>
              <Send className="h-4 w-4" />
              <AlertDescription>
                <strong>XÃ¡c nháº­n gá»­i Ä‘iá»ƒm:</strong> Sau khi gá»­i, báº¡n sáº½ khÃ´ng thá»ƒ chá»‰nh sá»­a Ä‘iá»ƒm 
                cho Ä‘áº¿n khi admin duyá»‡t hoáº·c yÃªu cáº§u chá»‰nh sá»­a.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                Há»§y
              </Button>
              <Button type="submit" disabled={loading || (isResubmission && !reason.trim())}>
                <Send className="mr-2 h-4 w-4" />
                {loading ? 'Äang gá»­i...' : (isResubmission ? 'Gá»­i láº¡i' : 'Gá»­i Ä‘iá»ƒm')}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
