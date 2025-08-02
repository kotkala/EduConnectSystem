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

// Helper function to get default form values
function getDefaultFormValues(academicYear?: AcademicYear) {
  if (academicYear) {
    return {
      ...(academicYear.id && { id: academicYear.id }),
      name: academicYear.name,
      start_date: academicYear.start_date,
      end_date: academicYear.end_date,
      is_current: academicYear.is_current
    };
  }

  return {
    name: "",
    start_date: "",
    end_date: "",
    is_current: false
  };
}

// Helper function to handle form submission
async function handleFormSubmission(
  data: AcademicYearFormData | UpdateAcademicYearFormData,
  isEditing: boolean,
  setIsSubmitting: (loading: boolean) => void,
  setSubmitError: (error: string | null) => void,
  setSubmitSuccess: (success: string | null) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any,
  onSuccess?: () => void
) {
  setIsSubmitting(true);
  setSubmitError(null);
  setSubmitSuccess(null);

  try {
    const result = isEditing
      ? await updateAcademicYearAction(data as UpdateAcademicYearFormData)
      : await createAcademicYearAction(data as AcademicYearFormData);

    if (result.success) {
      setSubmitSuccess(result.message || "Academic year saved successfully");
      if (!isEditing) {
        form.reset();
      }
      onSuccess?.();
    } else {
      setSubmitError(result.error || "Failed to save academic year");
    }
  } catch (error) {
    setSubmitError(error instanceof Error ? error.message : "An unexpected error occurred");
  } finally {
    setIsSubmitting(false);
  }
}

// Form Field Component
function FormField({
  id,
  label,
  type = "text",
  placeholder,
  register,
  error,
  disabled,
  helpText
}: Readonly<{
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  error?: string;
  disabled?: boolean;
  helpText?: string;
}>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        {...register}
        disabled={disabled}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helpText && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}
    </div>
  );
}

export function AcademicYearForm({ academicYear, onSuccess, onCancel }: Readonly<AcademicYearFormProps>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const isEditing = !!academicYear

  const form = useForm({
    resolver: zodResolver(isEditing ? updateAcademicYearSchema : academicYearSchema),
    defaultValues: getDefaultFormValues(academicYear)
  })

  const onSubmit = async (data: AcademicYearFormData | UpdateAcademicYearFormData) => {
    await handleFormSubmission(
      data,
      isEditing,
      setIsSubmitting,
      setSubmitError,
      setSubmitSuccess,
      form,
      onSuccess
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
      {/* Academic Year Name */}
      <FormField
        id="name"
        label="Academic Year Name"
        placeholder="e.g., 2024-2025"
        register={form.register("name")}
        error={form.formState.errors.name?.message}
        disabled={isSubmitting}
        helpText="Format: YYYY-YYYY (e.g., 2024-2025)"
      />

      {/* Start Date */}
      <FormField
        id="start_date"
        label="Start Date"
        type="date"
        register={form.register("start_date")}
        error={form.formState.errors.start_date?.message}
        disabled={isSubmitting}
      />

      {/* End Date */}
      <FormField
        id="end_date"
        label="End Date"
        type="date"
        register={form.register("end_date")}
        error={form.formState.errors.end_date?.message}
        disabled={isSubmitting}
      />

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
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-10 sm:h-11"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <span className="text-sm sm:text-base">
            {isEditing ? "Update Academic Year" : "Create Academic Year"}
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

      {!isEditing && (
        <div className="mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Auto-Generated Semesters</h4>
          <p className="text-xs sm:text-sm text-blue-700">
            When you create an academic year, two default semesters will be automatically created:
          </p>
          <ul className="text-xs sm:text-sm text-blue-700 mt-2 space-y-1">
            <li>• <strong>Học kỳ 1:</strong> 18 weeks (first ~4 months)</li>
            <li>• <strong>Học kỳ 2:</strong> 17 weeks (remaining period)</li>
          </ul>
          <p className="text-xs sm:text-sm text-blue-700 mt-2">
            You can edit these semesters after creation if needed.
          </p>
        </div>
      )}
    </form>
  )
}
