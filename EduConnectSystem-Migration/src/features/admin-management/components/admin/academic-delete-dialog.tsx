"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { deleteAcademicYearAction, deleteSemesterAction } from "@/features/admin-management/actions/academic-actions"
import { type AcademicYear, type Semester } from "@/lib/validations/academic-validations"

interface AcademicDeleteDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly item: AcademicYear | Semester | null
  readonly type: "academic-years" | "semesters"
  readonly onSuccess: () => void
}

export function AcademicDeleteDialog({
  open,
  onOpenChange,
  item,
  type,
  onSuccess
}: AcademicDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!item) return

    setIsLoading(true)
    try {
      const result = type === "academic-years"
        ? await deleteAcademicYearAction(item.id)
        : await deleteSemesterAction(item.id)

      if (result.success) {
        toast.success(`ÄÃ£ xÃ³a ${type === "academic-years" ? "năm hồc" : "hồc kỳ"} thÃ nh công`)
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "XÃ³a tháº¥t báº¡i")
      }
    } catch (error) {
      console.error('Lỗi xÃ³a:', error)
      toast.error("Có lỗi xảy ra khi xÃ³a")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Xác nhận xÃ³a
          </DialogTitle>
          <DialogDescription>
            Báº¡n có cháº¯c cháº¯n muá»‘n xÃ³a {type === "academic-years" ? "năm hồc" : "hồc kỳ"} &quot;{item?.name}&quot;?
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            HÃ nh Ä‘á»™ng nÃ y không thể hoÃ n tác. Tất cả dữ liệu liên quan sẽ bị xÃ³a vÄ©nh viá»…n.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Äang xÃ³a..." : "XÃ³a"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
