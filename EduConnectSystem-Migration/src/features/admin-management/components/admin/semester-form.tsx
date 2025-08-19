"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Loader2 } from "lucide-react"
import { createSemesterAction, updateSemesterAction, getAcademicYearsAction } from "@/features/admin-management/actions/academic-actions"
import { 
  semesterSchema, 
  updateSemesterSchema,
  type SemesterFormData,
  type UpdateSemesterFormData,
  type Semester,
  type AcademicYear
} from "@/lib/validations/academic-validations"

interface SemesterFormProps {
  readonly semester?: Semester
  readonly preselectedAcademicYearId?: string
  readonly onSuccess?: () => void
  readonly onCancel?: () => void
}

export function SemesterForm({ semester, preselectedAcademicYearId, onSuccess, onCancel }: SemesterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loadingAcademicYears, setLoadingAcademicYears] = useState(true)

  const isEditing = !!semester

  const form = useForm({
    resolver: zodResolver(isEditing ? updateSemesterSchema : semesterSchema),
    defaultValues: isEditing ? {
      ...(semester.id && { id: semester.id }),
      academic_year_id: semester.academic_year_id,
      name: semester.name,
      semester_number: semester.semester_number,
      start_date: semester.start_date,
      end_date: semester.end_date,
      weeks_count: semester.weeks_count,
      is_current: semester.is_current
    } : {
      academic_year_id: preselectedAcademicYearId || "",
      name: "",
      semester_number: 1,
      start_date: "",
      end_date: "",
      weeks_count: 18,
      is_current: false
    }
  })

  // Load academic years
  useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        const result = await getAcademicYearsAction({ page: 1, limit: 100 })
        if (result.success) {
          setAcademicYears(result.data)
        }
      } catch (error) {
        console.error("Failed to load academic years:", error)
      } finally {
        setLoadingAcademicYears(false)
      }
    }

    loadAcademicYears()
  }, [])

  // Auto-fill semester name and weeks based on semester number
  const handleSemesterNumberChange = (value: string) => {
    const semesterNumber = parseInt(value)
    form.setValue("semester_number", semesterNumber)
    
    if (semesterNumber === 1) {
      form.setValue("name", "Há»c ká»³ 1")
      form.setValue("weeks_count", 18)
    } else if (semesterNumber === 2) {
      form.setValue("name", "Há»c ká»³ 2")
      form.setValue("weeks_count", 17)
    }
  }

  const onSubmit = async (data: SemesterFormData | UpdateSemesterFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const result = isEditing 
        ? await updateSemesterAction(data as UpdateSemesterFormData)
        : await createSemesterAction(data as SemesterFormData)

      if (result.success) {
        setSubmitSuccess(result.message || "Semester saved successfully")
        if (!isEditing) {
          form.reset()
        }
        onSuccess?.()
      } else {
        setSubmitError(result.error || "Failed to save semester")
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      {/* Academic Year Selection */}
      <div className="space-y-2">
        <Label htmlFor="academic_year_id">Academic Year</Label>
        {loadingAcademicYears ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading academic years...</span>
          </div>
        ) : (
          <Select
            value={form.watch("academic_year_id")}
            onValueChange={(value) => form.setValue("academic_year_id", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name} {year.is_current && "(Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {form.formState.errors.academic_year_id && (
          <p className="text-sm text-red-600">{form.formState.errors.academic_year_id.message}</p>
        )}
      </div>

      {/* Semester Number */}
      <div className="space-y-2">
        <Label htmlFor="semester_number">Semester Number</Label>
        <Select
          value={form.watch("semester_number")?.toString()}
          onValueChange={handleSemesterNumberChange}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select semester number" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Semester 1</SelectItem>
            <SelectItem value="2">Semester 2</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.semester_number && (
          <p className="text-sm text-red-600">{form.formState.errors.semester_number.message}</p>
        )}
      </div>

      {/* Semester Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Semester Name</Label>
        <Input
          id="name"
          placeholder="e.g., Há»c ká»³ 1"
          {...form.register("name")}
          disabled={isSubmitting}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
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
      </div>

      {/* Weeks Count */}
      <div className="space-y-2">
        <Label htmlFor="weeks_count">Number of Weeks</Label>
        <Input
          id="weeks_count"
          type="number"
          min="1"
          max="30"
          {...form.register("weeks_count", { valueAsNumber: true })}
          disabled={isSubmitting}
        />
        {form.formState.errors.weeks_count && (
          <p className="text-sm text-red-600">{form.formState.errors.weeks_count.message}</p>
        )}
        <p className="text-sm text-muted-foreground">
          Default: Semester 1 = 18 weeks, Semester 2 = 17 weeks
        </p>
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
          Set as current semester
        </Label>
      </div>
      {form.watch("is_current") && (
        <p className="text-sm text-amber-600">
          Setting this as current will automatically unset other current semesters.
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
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || loadingAcademicYears}
          className="flex-1 h-10 sm:h-11"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <span className="text-sm sm:text-base">
            {isEditing ? "Update Semester" : "Create Semester"}
          </span>
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-10 sm:h-11 sm:w-auto"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
