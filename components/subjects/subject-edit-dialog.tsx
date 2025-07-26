"use client"

import { useState } from "react"
import { toast } from "sonner"
import { SubjectFormData } from "@/lib/validations"
import { updateSubjectAction } from "@/lib/subject-actions"
import { Subject } from "@/lib/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Edit } from "lucide-react"
import { SubjectForm } from "./subject-form"

interface SubjectEditDialogProps {
  subject: Subject
  children?: React.ReactNode
}

export function SubjectEditDialog({ subject, children }: SubjectEditDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: SubjectFormData) => {
    setIsLoading(true)
    try {
      const result = await updateSubjectAction({
        id: subject.id,
        ...data,
      })
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Subject updated successfully!")
        setOpen(false)
      }
    } catch (error) {
      console.error('Error updating subject:', error)
      toast.error("Failed to update subject. Please try again.")
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
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Update the details for {subject.name_vietnamese} ({subject.code}).
            All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <SubjectForm
          subject={subject}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          submitLabel="Update Subject"
        />
      </DialogContent>
    </Dialog>
  )
}
