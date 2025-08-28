'use client'

import { Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Save, X } from "lucide-react";import { teacherSchema, type TeacherFormData, type TeacherProfile } from "@/lib/validations/user-validations"
import { createTeacherAction, updateTeacherAction, generateNextEmployeeIdAction } from "@/features/admin-management/actions/user-actions"
import TeacherSpecializationForm from "@/features/teacher-management/components/teacher-specialization-form"
import { toast } from "sonner"


interface TeacherFormProps {
  readonly teacher?: TeacherProfile
  readonly onSuccess?: () => void
  readonly onCancel?: () => void
}

export function TeacherForm({ teacher, onSuccess, onCancel }: TeacherFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [createdTeacherId, setCreatedTeacherId] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState(false)

  const isEditing = !!teacher

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

  const generateEmployeeId = useCallback(async () => {
    setGeneratingId(true)
    try {
      const result = await generateNextEmployeeIdAction()
      if (result.success && result.data) {
        form.setValue("employee_id", result.data)
      }
    } catch (error) {
      console.error("Failed to generate employee ID:", error)
    } finally {
      setGeneratingId(false)
    }
  }, [form])

  // Auto-generate employee ID for new teachers
  useEffect(() => {
    if (!isEditing && !form.getValues("employee_id")) {
      generateEmployeeId()
    }
  }, [isEditing, form, generateEmployeeId])

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
        toast.success(result.message || (isEditing ? "Cập nhật giáo viên thành công!" : "Tạo giáo viên thành công!"))
        if (!isEditing) {
          form.reset()
          // Set the created teacher ID to show specialization form
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
        <CardTitle className="text-lg sm:text-xl md:text-2xl">{isEditing ? "Chỉnh sửa giáo viên" : "Thêm giáo viên mới"}</CardTitle>
        <CardDescription className="text-sm sm:text-base">
          {isEditing ? "Cập nhật thông tin giáo viên" : "Tạo tài khoản giáo viên mới"}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {/* Employee ID */}
          <div className="space-y-2 sm:space-y-3">
            <Label htmlFor="employee_id" className="text-sm sm:text-base">Mã nhân viên *</Label>
            <div className="flex gap-2">
              <Input
                id="employee_id"
                {...form.register("employee_id")}
                placeholder="VD: TC001"
                readOnly={isEditing}
                className={`h-10 sm:h-11 md:h-12 md:h-14 lg:h-16 text-sm sm:text-base flex-1 ${form.formState.errors.employee_id ? "border-red-500" : ""} ${isEditing ? "bg-gray-50" : ""}`}
              />
              {!isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateEmployeeId}
                  disabled={generatingId}
                  className="h-10 sm:h-11 md:h-12 md:h-14 lg:h-16 px-3"
                >
                  {generatingId ? "..." : "Tạo"}
                </Button>
              )}
            </div>
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
              className={`h-10 sm:h-11 md:h-12 md:h-14 lg:h-16 text-sm sm:text-base ${form.formState.errors.full_name ? "border-red-500" : ""}`}
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
            <Label htmlFor="phone_number">Số điện thoại *</Label>
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
            <Label htmlFor="gender">Giới tính *</Label>
            <Select
              value={form.watch("gender")}
              onValueChange={(value) => form.setValue("gender", value as "male" | "female")}
            >
              <SelectTrigger className={form.formState.errors.gender ? "border-red-500" : ""}>
                <SelectValue placeholder="Chọn giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Nam</SelectItem>
                <SelectItem value="female">Nữ</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.gender && (
              <p className="text-sm text-red-500">{form.formState.errors.gender.message}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Ngày sinh *</Label>
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
            <Label htmlFor="address">Địa chỉ *</Label>
            <Textarea
              id="address"
              {...form.register("address")}
              placeholder="Nhập địa chỉ đầy đủ"
              rows={3}
              className={form.formState.errors.address ? "border-red-500" : ""}
            />
            {form.formState.errors.address && (
              <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
            )}
          </div>



          {/* Teacher Specializations - Show for editing existing teachers or after creating new teacher */}
          {((isEditing && teacher?.id) || (!isEditing && createdTeacherId)) && (
            <div className="space-y-4 border-t pt-6">
              <TeacherSpecializationForm
                teacherId={isEditing ? (teacher?.id || '') : (createdTeacherId || '')}
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Teacher Specializations for new teacher creation - Show during creation */}
          {!isEditing && !createdTeacherId && (
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Chuyên ngành giảng dạy</h3>
                <p className="text-sm text-muted-foreground">
                  Chuyên ngành giảng dạy sẽ được thiết lập sau khi tạo tài khoản giáo viên thành công. Các chuyên ngành có sẵn:
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900">Chuyên ngành Tự nhiên - Kỹ thuật</h4>
                    <p className="text-sm text-blue-700">Toán, Lý, Hóa, Sinh, Tin học, Công nghệ</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-900">Chuyên ngành Xã hội - Nhân văn</h4>
                    <p className="text-sm text-green-700">Văn, Sử, Địa, GDCD, Ngoại ngữ</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-purple-900">Chuyên ngành Nghệ thuật - Thể chất</h4>
                    <p className="text-sm text-purple-700">Âm nhạc, Mỹ thuật, Thể dục, Quốc phòng</p>
                  </div>
                </div>
              </div>
            </div>
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
                  <Loader2 className="h-4 w-4 animate-spin" />
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
