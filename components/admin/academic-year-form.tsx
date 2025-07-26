"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { createAcademicYearAction, updateAcademicYearAction } from "@/lib/actions/academic-actions"
import { 
  academicYearSchema, 
  updateAcademicYearSchema,
  type AcademicYearFormData,
  type UpdateAcademicYearFormData,
  type AcademicYear
} from "@/lib/validations/academic-validations"

interface AcademicYearFormProps {
  academicYear?: AcademicYear
  onSuccess?: () => void
  onCancel?: () => void
}

export function AcademicYearForm({ academicYear, onSuccess, onCancel }: AcademicYearFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const isEditing = !!academicYear

  const form = useForm({
    resolver: zodResolver(isEditing ? updateAcademicYearSchema : academicYearSchema),
    defaultValues: isEditing ? {
      ...(academicYear.id && { id: academicYear.id }),
      name: academicYear.name,
      start_date: academicYear.start_date,
      end_date: academicYear.end_date,
      is_current: academicYear.is_current
    } : {
      name: "",
      start_date: "",
      end_date: "",
      is_current: false
    }
  })

  const onSubmit = async (data: AcademicYearFormData | UpdateAcademicYearFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const result = isEditing 
        ? await updateAcademicYearAction(data as UpdateAcademicYearFormData)
        : await createAcademicYearAction(data as AcademicYearFormData)

      if (result.success) {
        setSubmitSuccess(result.message || "Academic year saved successfully")
        if (!isEditing) {
          form.reset()
        }
        onSuccess?.()
      } else {
        setSubmitError(result.error || "Failed to save academic year")
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Academic Year Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Academic Year Name</Label>
        <Input
          id="name"
          placeholder="e.g., 2024-2025"
          {...form.register("name")}
          disabled={isSubmitting}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Format: YYYY-YYYY (e.g., 2024-2025)
        </p>
      </div>

      {/* Start Date */}
      <div className="space-y-2">
        <Label htmlFor="start_date">Start Date</Label>
        <Input
          id="start_date"
          type="date"
          {...form.register("start_date")}
          disabled={isSubmitting}
        />
        {form.formState.errors.start_date && (
          <p className="text-sm text-red-600">{form.formState.errors.start_date.message}</p>
        )}
      </div>

      {/* End Date */}
      <div className="space-y-2">
        <Label htmlFor="end_date">End Date</Label>
        <Input
          id="end_date"
          type="date"
          {...form.register("end_date")}
          disabled={isSubmitting}
        />
        {form.formState.errors.end_date && (
          <p className="text-sm text-red-600">{form.formState.errors.end_date.message}</p>
        )}
      </div>

      {/* Is Current */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_current"
          checked={form.watch("is_current")}
          onCheckedChange={(checked) => form.setValue("is_current", !!checked)}
          disabled={isSubmitting}
        />
        <Label htmlFor="is_current" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Set as current academic year
        </Label>
      </div>
      {form.watch("is_current") && (
        <p className="text-sm text-amber-600">
          Setting this as current will automatically unset other current academic years and create default semesters.
        </p>
      )}

      {/* Success Message */}
      {submitSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {submitSuccess}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Message */}
      {submitError && (
        <Alert variant="destructive">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? "Update Academic Year" : "Create Academic Year"}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
      </div>

      {!isEditing && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Auto-Generated Semesters</h4>
          <p className="text-sm text-blue-700">
            When you create an academic year, two default semesters will be automatically created:
          </p>
          <ul className="text-sm text-blue-700 mt-2 space-y-1">
            <li>• <strong>Học kỳ 1:</strong> 18 weeks (first ~4 months)</li>
            <li>• <strong>Học kỳ 2:</strong> 17 weeks (remaining period)</li>
          </ul>
          <p className="text-sm text-blue-700 mt-2">
            You can edit these semesters after creation if needed.
          </p>
        </div>
      )}
    </form>
  )
}
