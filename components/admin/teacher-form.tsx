"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, X } from "lucide-react"
import { teacherSchema, type TeacherFormData, type TeacherProfile } from "@/lib/validations/user-validations"
import { createTeacherAction, updateTeacherAction } from "@/lib/actions/user-actions"

interface TeacherFormProps {
  readonly teacher?: TeacherProfile
  readonly onSuccess?: () => void
  readonly onCancel?: () => void
}

export function TeacherForm({ teacher, onSuccess, onCancel }: TeacherFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const isEditing = !!teacher

  const form = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      employee_id: teacher?.employee_id || "",
      homeroom_enabled: teacher?.homeroom_enabled ?? false,
      full_name: teacher?.full_name || "",
      email: teacher?.email || "",
      phone_number: teacher?.phone_number || "",
      gender: teacher?.gender || "male",
      date_of_birth: teacher?.date_of_birth || "",
      address: teacher?.address || ""
    }
  })

  const onSubmit = async (data: TeacherFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      let result

      if (isEditing) {
        result = await updateTeacherAction({
          id: teacher.id,
          ...data
        })
      } else {
        result = await createTeacherAction(data)
      }

      if (result.success) {
        setSubmitSuccess(result.message || "Teacher saved successfully")
        if (!isEditing) {
          form.reset()
        }
        onSuccess?.()
      } else {
        setSubmitError(result.error || "Failed to save teacher")
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto p-3 sm:p-4 md:p-6">
      <CardHeader className="space-y-2 sm:space-y-3">
        <CardTitle className="text-lg sm:text-xl md:text-2xl">{isEditing ? "Edit Teacher" : "Add New Teacher"}</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          {isEditing ? "Update teacher information" : "Create a new teacher account"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Employee ID */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="employee_id" className="text-sm sm:text-base">Employee ID *</Label>
            <Input
              id="employee_id"
              {...form.register("employee_id")}
              placeholder="e.g., EMP001"
              className={`h-10 sm:h-11 md:h-12 text-sm sm:text-base ${form.formState.errors.employee_id ? "border-red-500" : ""}`}
            />
            {form.formState.errors.employee_id && (
              <p className="text-xs sm:text-sm text-red-500">{form.formState.errors.employee_id.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="full_name" className="text-sm sm:text-base">Full Name *</Label>
            <Input
              id="full_name"
              {...form.register("full_name")}
              placeholder="Enter full name"
              className={`h-10 sm:h-11 md:h-12 text-sm sm:text-base ${form.formState.errors.full_name ? "border-red-500" : ""}`}
            />
            {form.formState.errors.full_name && (
              <p className="text-xs sm:text-sm text-red-500">{form.formState.errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="email" className="text-sm sm:text-base">Email *</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="teacher@school.com"
              className={form.formState.errors.email ? "border-red-500" : ""}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone_number">Phone Number *</Label>
            <Input
              id="phone_number"
              {...form.register("phone_number")}
              placeholder="0123456789"
              className={form.formState.errors.phone_number ? "border-red-500" : ""}
            />
            {form.formState.errors.phone_number && (
              <p className="text-sm text-red-500">{form.formState.errors.phone_number.message}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select
              value={form.watch("gender")}
              onValueChange={(value) => form.setValue("gender", value as "male" | "female" | "other")}
            >
              <SelectTrigger className={form.formState.errors.gender ? "border-red-500" : ""}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.gender && (
              <p className="text-sm text-red-500">{form.formState.errors.gender.message}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <Input
              id="date_of_birth"
              type="date"
              {...form.register("date_of_birth")}
              className={form.formState.errors.date_of_birth ? "border-red-500" : ""}
            />
            {form.formState.errors.date_of_birth && (
              <p className="text-sm text-red-500">{form.formState.errors.date_of_birth.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Textarea
              id="address"
              {...form.register("address")}
              placeholder="Enter full address"
              rows={3}
              className={form.formState.errors.address ? "border-red-500" : ""}
            />
            {form.formState.errors.address && (
              <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
            )}
          </div>

          {/* Homeroom Enabled */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="homeroom_enabled"
              checked={form.watch("homeroom_enabled")}
              onCheckedChange={(checked) => form.setValue("homeroom_enabled", !!checked)}
              disabled={isSubmitting}
            />
            <Label htmlFor="homeroom_enabled" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Enable as homeroom teacher
            </Label>
          </div>
          {form.watch("homeroom_enabled") && (
            <p className="text-sm text-blue-600">
              This teacher will be available for homeroom class assignments.
            </p>
          )}

          {/* Error/Success Messages */}
          {submitError && (
            <Alert variant="destructive">
              <AlertDescription>{submitError}</AlertDescription>
            </Alert>
          )}

          {submitSuccess && (
            <Alert>
              <AlertDescription className="text-green-600">{submitSuccess}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Đang cập nhật..." : "Đang tạo..."}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? "Cập nhật giáo viên" : "Tạo giáo viên"}
                </>
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Hủy
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
