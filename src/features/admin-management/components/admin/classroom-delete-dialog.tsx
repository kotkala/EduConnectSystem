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
import { deleteClassroomAction, type Classroom } from "@/features/admin-management/actions/classroom-actions"

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
        toast.success("ÄÃ£ xÃ³a phÃ²ng há»c thÃ nh cÃ´ng")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "XÃ³a tháº¥t báº¡i")
      }
    } catch (error) {
      console.error('Lá»—i xÃ³a:', error)
      toast.error("CÃ³ lá»—i xáº£y ra khi xÃ³a")
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
            XÃ¡c nháº­n xÃ³a
          </DialogTitle>
          <DialogDescription>
            Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xÃ³a phÃ²ng há»c &quot;{classroom?.name}&quot;?
          </DialogDescription>
        </DialogHeader>
        
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c. Táº¥t cáº£ dá»¯ liá»‡u liÃªn quan Ä‘áº¿n phÃ²ng há»c nÃ y sáº½ bá»‹ xÃ³a vÄ©nh viá»…n.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Há»§y
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
