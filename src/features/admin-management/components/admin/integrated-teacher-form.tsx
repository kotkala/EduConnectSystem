"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"

import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { teacherSchema, type TeacherFormData, type TeacherProfile } from "@/lib/validations/user-validations"
import { createTeacherAction, updateTeacherAction } from "@/features/admin-management/actions/user-actions"
import TeacherSpecializationInlineForm from "@/features/teacher-management/components/teacher-specialization-inline-form"

interface IntegratedTeacherFormProps {
  readonly teacher?: TeacherProfile
  readonly onSuccess?: () => void
  readonly onCancel?: () => void
}

export function IntegratedTeacherForm({ teacher, onSuccess, onCancel }: IntegratedTeacherFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [createdTeacherId, setCreatedTeacherId] = useState<string | null>(null)


  const isEditing = !!teacher?.id

  const form = useForm({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      employee_id: teacher?.employee_id || "",
      full_name: teacher?.full_name || "",
      email: teacher?.email || "",
      phone_number: teacher?.phone_number || "",
      gender: (teacher?.gender === "male" || teacher?.gender === "female") ? teacher.gender : "male",
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
          // Set the created teacher ID for specialization form
          if ('teacherId' in result && result.teacherId) {
            setCreatedTeacherId(result.teacherId as string)
          }
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
        <CardTitle className="text-lg sm:text-xl md:text-2xl">
          {isEditing ? "Chỉnh sửa giáo viên" : "Thêm giáo viên mới"}
        </CardTitle>
        <CardDescription className="text-sm sm:text-base">
          {isEditing ? "Cập nhật thông tin giáo viên" : "Tạo tài khoản giáo viên mới"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Employee ID */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="employee_id" className="text-sm sm:text-base">Mã nhân viên *</Label>
            <Input
              id="employee_id"
              {...form.register("employee_id")}
              placeholder="Nhập mã nhân viên"
              className={`h-10 sm:h-11 md:h-12 text-sm sm:text-base ${form.formState.errors.employee_id ? "border-red-500" : ""}`}
            />
            {form.formState.errors.employee_id && (
              <p className="text-xs sm:text-sm text-red-500">{form.formState.errors.employee_id.message}</p>
            )}
          </div>

          {/* Full Name */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="full_name" className="text-sm sm:text-base">Họ và tên *</Label>
            <Input
              id="full_name"
              {...form.register("full_name")}
              placeholder="Nhập họ và tên"
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
              placeholder="Nhập địa chỉ email"
              className={`h-10 sm:h-11 md:h-12 text-sm sm:text-base ${form.formState.errors.email ? "border-red-500" : ""}`}
            />
            {form.formState.errors.email && (
              <p className="text-xs sm:text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="phone_number" className="text-sm sm:text-base">Số điện thoại *</Label>
            <Input
              id="phone_number"
              {...form.register("phone_number")}
              placeholder="Nhập số điện thoại"
              className={`h-10 sm:h-11 md:h-12 text-sm sm:text-base ${form.formState.errors.phone_number ? "border-red-500" : ""}`}
            />
            {form.formState.errors.phone_number && (
              <p className="text-xs sm:text-sm text-red-500">{form.formState.errors.phone_number.message}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="gender" className="text-sm sm:text-base">Giới tính *</Label>
            <Select value={form.watch("gender")} onValueChange={(value) => form.setValue("gender", value as "male" | "female")}>
              <SelectTrigger className="h-10 sm:h-11 md:h-12">
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Nam</SelectItem>
                <SelectItem value="female">Nữ</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.gender && (
              <p className="text-xs sm:text-sm text-red-500">{form.formState.errors.gender.message}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="date_of_birth" className="text-sm sm:text-base">Ngày sinh *</Label>
            <Input
              id="date_of_birth"
              type="date"
              {...form.register("date_of_birth")}
              className={`h-10 sm:h-11 md:h-12 text-sm sm:text-base ${form.formState.errors.date_of_birth ? "border-red-500" : ""}`}
            />
            {form.formState.errors.date_of_birth && (
              <p className="text-xs sm:text-sm text-red-500">{form.formState.errors.date_of_birth.message}</p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="address" className="text-sm sm:text-base">Địa chỉ *</Label>
            <Input
              id="address"
              {...form.register("address")}
              placeholder="Nhập địa chỉ"
              className={`h-10 sm:h-11 md:h-12 text-sm sm:text-base ${form.formState.errors.address ? "border-red-500" : ""}`}
            />
            {form.formState.errors.address && (
              <p className="text-xs sm:text-sm text-red-500">{form.formState.errors.address.message}</p>
            )}
          </div>



          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 sm:h-11 md:h-12 text-sm sm:text-base"
            >
              {isSubmitting ? "Đang xử lý..." : (isEditing ? "Cập nhật giáo viên" : "Tạo giáo viên")}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 h-10 sm:h-11 md:h-12 text-sm sm:text-base"
              >
                Hủy
              </Button>
            )}
          </div>

          {/* Teacher Specializations - Always show */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-medium">Chuyên ngành giảng dạy</h3>
            <p className="text-sm text-muted-foreground">Tùy chọn</p>
            <TeacherSpecializationInlineForm
              teacherId={isEditing ? (teacher?.id || '') : (createdTeacherId || undefined)}
              disabled={isSubmitting}
            />
          </div>

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
        </form>
      </CardContent>
    </Card>
  )
}
