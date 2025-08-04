"use client"

import { useState } from "react"
import { toast } from "sonner"
import { deleteSubjectAction } from "@/lib/subject-actions"
import { Subject } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"

interface SubjectDeleteDialogProps {
  readonly subject: Subject
  readonly children?: React.ReactNode
}

export function SubjectDeleteDialog({ subject, children }: SubjectDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const result = await deleteSubjectAction(subject.id)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Subject deleted successfully!")
        setOpen(false)
      }
    } catch (error) {
      console.error('Error deleting subject:', error)
      toast.error("Failed to delete subject. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete Subject
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the subject{" "}
            <span className="font-semibold">
              {subject.name_vietnamese} ({subject.code})
            </span>{" "}
            ?
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-destructive mb-1">Warning</p>
              <p className="text-muted-foreground">
                This action will deactivate the subject. It will no longer be visible 
                to users but can be restored by an administrator if needed.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Subject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
