"use client"

import { useState, useCallback, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form"
import { teacherSchema, type TeacherFormData, type TeacherProfile } from "@/lib/validations/user-validations"
import { createTeacherAction, updateTeacherAction, generateNextEmployeeIdAction } from "@/features/admin-management/actions/user-actions"
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
  const [generatingId, setGeneratingId] = useState(false)


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
      address: teacher?.address || "",
      homeroom_enabled: teacher?.homeroom_enabled || false
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {/* Employee ID */}
            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Mã nhân viên *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={generatingId ? "Đang tạo mã tự động..." : "VD: TC00028"}
                        readOnly={isEditing || generatingId}
                        className={`h-10 sm:h-11 md:h-12 text-sm sm:text-base flex-1 ${isEditing || generatingId ? "bg-gray-50" : ""}`}
                      />
                    </FormControl>
                    {!isEditing && generatingId && (
                      <div className="h-10 sm:h-11 md:h-12 px-3 flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <FormDescription className="text-xs text-muted-foreground">
                      Mã nhân viên sẽ được tạo tự động khi mở form
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Full Name */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Họ và tên *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nhập họ và tên"
                      className="h-10 sm:h-11 md:h-12 text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Email *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Nhập địa chỉ email"
                      className="h-10 sm:h-11 md:h-12 text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone Number */}
            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Số điện thoại *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nhập số điện thoại"
                      className="h-10 sm:h-11 md:h-12 text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gender */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Giới tính *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 sm:h-11 md:h-12">
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date of Birth */}
            <FormField
              control={form.control}
              name="date_of_birth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Ngày sinh *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="date"
                      className="h-10 sm:h-11 md:h-12 text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm sm:text-base">Địa chỉ *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Nhập địa chỉ"
                      rows={3}
                      className="text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Homeroom Teacher Enabled */}
            <FormField
              control={form.control}
              name="homeroom_enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm sm:text-base">
                      Cho phép làm giáo viên chủ nhiệm
                    </FormLabel>
                    <FormDescription className="text-xs text-muted-foreground">
                      Kích hoạt để giáo viên có thể được phân công làm chủ nhiệm lớp
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />



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
        </Form>
      </CardContent>
    </Card>
  )
}
