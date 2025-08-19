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
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { deleteClassroomAction, type Classroom } from "@/lib/actions/classroom-actions"

interface ClassroomDeleteDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly classroom: Classroom | null
  readonly onSuccess: () => void
}

export function ClassroomDeleteDialog({
  open,
  onOpenChange,
  classroom,
  onSuccess
}: ClassroomDeleteDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!classroom) return

    setIsLoading(true)
    try {
      const result = await deleteClassroomAction(classroom.id)

      if (result.success) {
        toast.success("Đã xóa phòng học thành công")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Xóa thất bại")
      }
    } catch (error) {
      console.error('Lỗi xóa:', error)
      toast.error("Có lỗi xảy ra khi xóa")
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
            Xác nhận xóa
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa phòng học &quot;{classroom?.name}&quot;?
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan đến phòng học này sẽ bị xóa vĩnh viễn.
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
            {isLoading ? "Đang xóa..." : "Xóa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
