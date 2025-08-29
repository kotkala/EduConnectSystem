'use client'

import { Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form"
import { Save, X } from "lucide-react"
import { teacherSchema, type TeacherFormData, type TeacherProfile } from "@/lib/validations/user-validations"
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
                        placeholder="VD: TC001"
                        readOnly={isEditing}
                        className={`h-10 sm:h-11 md:h-12 text-sm sm:text-base flex-1 ${isEditing ? "bg-gray-50" : ""}`}
                      />
                    </FormControl>
                    {!isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateEmployeeId}
                        disabled={generatingId}
                        className="h-10 sm:h-11 md:h-12 px-3"
                      >
                        {generatingId ? "..." : "Tạo"}
                      </Button>
                    )}
                  </div>
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
                      placeholder="teacher@school.com"
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
                  <FormLabel>Số điện thoại *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="0123456789"
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
                  <FormLabel>Giới tính *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 sm:h-11 md:h-12 text-sm sm:text-base">
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
                  <FormLabel>Ngày sinh *</FormLabel>
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
                  <FormLabel>Địa chỉ *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Nhập địa chỉ đầy đủ"
                      rows={3}
                      className="text-sm sm:text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



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
        </Form>
      </CardContent>
    </Card>
  )
}
