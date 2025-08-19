"use client"

import { useState } from "react"
import { toast } from "sonner"
import { SubjectFormData } from "@/lib/validations"
import { createSubjectAction } from "@/lib/subject-actions"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Plus } from "lucide-react"
import { SubjectForm } from "./subject-form"

interface SubjectCreateDialogProps {
  children?: React.ReactNode
}

export function SubjectCreateDialog({ children }: SubjectCreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: SubjectFormData) => {
    setIsLoading(true)
    try {
      const result = await createSubjectAction(data)
      
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Subject created successfully!")
        setOpen(false)
      }
    } catch (error) {
      console.error('Error creating subject:', error)
      toast.error("Failed to create subject. Please try again.")
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Subject</DialogTitle>
          <DialogDescription>
            Add a new subject to the Vietnamese high school curriculum.
            All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <SubjectForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
          submitLabel="Create Subject"
        />
      </DialogContent>
    </Dialog>
  )
}
