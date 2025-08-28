"use client"

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
import { Separator } from "@/shared/components/ui/separator"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Save, X, User, Users, RefreshCw } from "lucide-react";import { studentParentSchema, type StudentParentFormData, type StudentWithParent, type UpdateStudentParentFormData } from "@/lib/validations/user-validations"
import { createStudentWithParentAction, updateStudentParentAction, generateNextStudentIdAction } from "@/features/admin-management/actions/user-actions"
import { EmailSuggestionInput } from "@/features/admin-management/components/admin/email-suggestion-input"


import { Skeleton } from "@/shared/components/ui/skeleton";interface StudentParentFormProps {
  editMode?: boolean
  initialData?: StudentWithParent
  onSuccess?: () => void
  onCancel?: () => void
}

// Helper function to get initial form values
function getInitialFormValues(editMode: boolean, initialData?: StudentWithParent): StudentParentFormData {
  if (editMode && initialData) {
    return {
      student: {
        student_id: initialData.student_id || "",
        full_name: initialData.full_name || "",
        email: initialData.email || "",
        phone_number: initialData.phone_number || "",
        gender: (initialData.gender as "male" | "female") || "male",
        date_of_birth: initialData.date_of_birth || "",
        address: initialData.address || ""
      },
      parent: {
        full_name: initialData.parent_relationship?.parent?.full_name || "",
        email: initialData.parent_relationship?.parent?.email || "",
        phone_number: initialData.parent_relationship?.parent?.phone_number || "",
        gender: "male", // Default since we don't have parent gender in relationship
        date_of_birth: "",
        address: "",
        relationship_type: (initialData.parent_relationship?.relationship_type as "father" | "mother" | "guardian") || "father",
        is_primary_contact: initialData.parent_relationship?.is_primary_contact ?? true
      }
    }
  }

  return {
    student: {
      student_id: "",
      full_name: "",
      email: "",
      phone_number: "",
      gender: "male",
      date_of_birth: "",
      address: ""
    },
    parent: {
      full_name: "",
      email: "",
      phone_number: "",
      gender: "male",
      date_of_birth: "",
      address: "",
      relationship_type: "father",
      is_primary_contact: true as boolean
    }
  }
}

// Helper function to handle parent email selection
function handleParentEmailSelection(
  user: { full_name?: string; phone_number?: string; address?: string; gender?: string; date_of_birth?: string },
  form: ReturnType<typeof useForm<StudentParentFormData>>
) {
  if (user) {
    form.setValue("parent.full_name", user.full_name || "")
    form.setValue("parent.phone_number", user.phone_number || "")
    form.setValue("parent.address", user.address || "")
    const validGender = user.gender === "male" || user.gender === "female" ? user.gender : "male"
    form.setValue("parent.gender", validGender)
    form.setValue("parent.date_of_birth", user.date_of_birth || "")
  }
}

// Student Information Section Component
function StudentInfoSection({
  form,
  editMode,
  generatingId,
  generateStudentId
}: Readonly<{
  form: ReturnType<typeof useForm<StudentParentFormData>>;
  editMode: boolean;
  generatingId: boolean;
  generateStudentId: () => void
}>) {
  return (
    <div className="space-y-10 bg-gradient-to-r from-blue-50/30 to-blue-50/10 p-8 rounded-2xl border border-blue-100">
      <div className="flex items-center gap-4 pb-6 border-b-2 border-blue-200">
        <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <User className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-blue-800">Thông tin học sinh</h3>
          <p className="text-base text-blue-600 mt-1">Nhập thông tin cá nhân của học sinh</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {/* Student ID */}
        <div className="space-y-4">
          <Label htmlFor="student_id" className="text-base font-semibold text-gray-800">
            Mã học sinh *
          </Label>
          <div className="flex gap-3">
            <Input
              id="student_id"
              {...form.register("student.student_id")}
              placeholder="VD: SU001"
              readOnly={editMode}
              className={`h-14 flex-1 text-base ${form.formState.errors.student?.student_id ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"} ${editMode ? "bg-gray-50" : ""}`}
            />
            {!editMode && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={generateStudentId}
                disabled={generatingId}
                className="h-14 px-4 text-base"
              >
                {generatingId ? (
                  <Skeleton className="h-32 w-full rounded-lg" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          {form.formState.errors.student?.student_id && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <span className="text-red-500">âš </span>
              {form.formState.errors.student.student_id.message}
            </p>
          )}
          {!editMode && (
            <p className="text-xs text-gray-500">
              Mã học sinh sẽ được tự động tạo (SU001, SU002, ...)
            </p>
          )}
        </div>

        {/* Student Full Name */}
        <div className="space-y-2">
          <Label htmlFor="student_name">Họ và tên *</Label>
          <Input
            id="student_name"
            {...form.register("student.full_name")}
            placeholder="Nhập họ và tên học sinh"
            className={form.formState.errors.student?.full_name ? "border-red-500" : ""}
          />
          {form.formState.errors.student?.full_name && (
            <p className="text-sm text-red-500">{form.formState.errors.student.full_name.message}</p>
          )}
        </div>

        {/* Student Email */}
        <div className="space-y-2">
          <Label htmlFor="student_email">Email *</Label>
          <Input
            id="student_email"
            type="email"
            {...form.register("student.email")}
            placeholder="student@school.com"
            className={form.formState.errors.student?.email ? "border-red-500" : ""}
          />
          {form.formState.errors.student?.email && (
            <p className="text-sm text-red-500">{form.formState.errors.student.email.message}</p>
          )}
        </div>

        {/* Student Phone */}
        <div className="space-y-2">
          <Label htmlFor="student_phone">Số điện thoại *</Label>
          <Input
            id="student_phone"
            {...form.register("student.phone_number")}
            placeholder="Nhập số điện thoại"
            className={form.formState.errors.student?.phone_number ? "border-red-500" : ""}
          />
          {form.formState.errors.student?.phone_number && (
            <p className="text-sm text-red-500">{form.formState.errors.student.phone_number.message}</p>
          )}
        </div>

        {/* Student Gender */}
        <div className="space-y-2">
          <Label htmlFor="student_gender">Giới tính *</Label>
          <Select
            value={form.watch("student.gender")}
            onValueChange={(value) => form.setValue("student.gender", value as "male" | "female")}
          >
            <SelectTrigger className={form.formState.errors.student?.gender ? "border-red-500" : ""}>
              <SelectValue placeholder="Chọn giới tính" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Nam</SelectItem>
              <SelectItem value="female">Nữ</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.student?.gender && (
            <p className="text-sm text-red-500">{form.formState.errors.student.gender.message}</p>
          )}
        </div>

        {/* Student Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="student_dob">Ngày sinh *</Label>
          <Input
            id="student_dob"
            type="date"
            {...form.register("student.date_of_birth")}
            className={form.formState.errors.student?.date_of_birth ? "border-red-500" : ""}
          />
          {form.formState.errors.student?.date_of_birth && (
            <p className="text-sm text-red-500">{form.formState.errors.student.date_of_birth.message}</p>
          )}
        </div>
      </div>

      {/* Student Address */}
      <div className="space-y-2">
        <Label htmlFor="student_address">Địa chỉ *</Label>
        <Textarea
          id="student_address"
          {...form.register("student.address")}
          placeholder="Nhập địa chỉ đầy đủ của học sinh"
          rows={3}
          className={form.formState.errors.student?.address ? "border-red-500" : ""}
        />
        {form.formState.errors.student?.address && (
          <p className="text-sm text-red-500">{form.formState.errors.student.address.message}</p>
        )}
      </div>
    </div>
  )
}

// Parent Information Section Component
function ParentInfoSection({
  form,
  handleParentEmailSelect
}: Readonly<{
  form: ReturnType<typeof useForm<StudentParentFormData>>;
  handleParentEmailSelect: (user: { full_name?: string; phone_number?: string; address?: string; gender?: string; date_of_birth?: string }) => void
}>) {
  return (
    <div className="space-y-10 bg-gradient-to-r from-green-50/30 to-green-50/10 p-8 rounded-2xl border border-green-100">
      <div className="flex items-center gap-4 pb-6 border-b-2 border-green-200">
        <div className="p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
          <Users className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-green-800">Thông tin phụ huynh</h3>
          <p className="text-base text-green-600 mt-1">Nhập thông tin liên hệ và mối quan hệ của phụ huynh</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {/* Parent Full Name */}
        <div className="space-y-4">
          <Label htmlFor="parent_name" className="text-base font-semibold text-gray-800">Họ và tên *</Label>
          <Input
            id="parent_name"
            {...form.register("parent.full_name")}
            placeholder="Nhập họ và tên phụ huynh"
            className={`h-14 text-base ${form.formState.errors.parent?.full_name ? "border-red-500" : ""}`}
          />
          {form.formState.errors.parent?.full_name && (
            <p className="text-sm text-red-500">{form.formState.errors.parent.full_name.message}</p>
          )}
        </div>

        {/* Parent Email with Suggestion */}
        <EmailSuggestionInput
          id="parent_email"
          label="Email *"
          value={form.watch("parent.email")}
          onChange={(value) => form.setValue("parent.email", value)}
          onUserSelect={handleParentEmailSelect}
          placeholder="parent@email.com"
          error={form.formState.errors.parent?.email?.message}
          className={form.formState.errors.parent?.email ? "border-red-500" : ""}
        />

        {/* Parent Phone */}
        <div className="space-y-2">
          <Label htmlFor="parent_phone">Số điện thoại *</Label>
          <Input
            id="parent_phone"
            {...form.register("parent.phone_number")}
            placeholder="Nhập số điện thoại"
            className={form.formState.errors.parent?.phone_number ? "border-red-500" : ""}
          />
          {form.formState.errors.parent?.phone_number && (
            <p className="text-sm text-red-500">{form.formState.errors.parent.phone_number.message}</p>
          )}
        </div>

        {/* Parent Gender */}
        <div className="space-y-2">
          <Label htmlFor="parent_gender">Giới tính *</Label>
          <Select
            value={form.watch("parent.gender")}
            onValueChange={(value) => form.setValue("parent.gender", value as "male" | "female")}
          >
            <SelectTrigger className={form.formState.errors.parent?.gender ? "border-red-500" : ""}>
              <SelectValue placeholder="Chọn giới tính" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Nam</SelectItem>
              <SelectItem value="female">Nữ</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.parent?.gender && (
            <p className="text-sm text-red-500">{form.formState.errors.parent.gender.message}</p>
          )}
        </div>

        {/* Parent Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="parent_dob">Ngày sinh</Label>
          <Input
            id="parent_dob"
            type="date"
            {...form.register("parent.date_of_birth")}
            className={form.formState.errors.parent?.date_of_birth ? "border-red-500" : ""}
          />
          {form.formState.errors.parent?.date_of_birth && (
            <p className="text-sm text-red-500">{form.formState.errors.parent.date_of_birth.message}</p>
          )}
        </div>

        {/* Relationship Type */}
        <div className="space-y-2">
          <Label htmlFor="relationship_type">Mối quan hệ *</Label>
          <Select
            value={form.watch("parent.relationship_type")}
            onValueChange={(value) => form.setValue("parent.relationship_type", value as "father" | "mother" | "guardian")}
          >
            <SelectTrigger className={form.formState.errors.parent?.relationship_type ? "border-red-500" : ""}>
              <SelectValue placeholder="Chọn mối quan hệ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="father">Bố</SelectItem>
              <SelectItem value="mother">Mẹ</SelectItem>
              <SelectItem value="guardian">Người giám hộ</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.parent?.relationship_type && (
            <p className="text-sm text-red-500">{form.formState.errors.parent.relationship_type.message}</p>
          )}
        </div>
      </div>

      {/* Parent Address */}
      <div className="space-y-2">
        <Label htmlFor="parent_address">Địa chỉ *</Label>
        <Textarea
          id="parent_address"
          {...form.register("parent.address")}
          placeholder="Nhập địa chỉ đầy đủ của phụ huynh"
          rows={3}
          className={form.formState.errors.parent?.address ? "border-red-500" : ""}
        />
        {form.formState.errors.parent?.address && (
          <p className="text-sm text-red-500">{form.formState.errors.parent.address.message}</p>
        )}
      </div>

      {/* Primary Contact Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_primary_contact"
          checked={form.watch("parent.is_primary_contact")}
          onCheckedChange={(checked) => form.setValue("parent.is_primary_contact", !!checked)}
        />
        <Label htmlFor="is_primary_contact" className="text-sm">
          Đặt làm liên hệ chính cho học sinh
        </Label>
      </div>
    </div>
  )
}

export function StudentParentForm({ editMode = false, initialData, onSuccess, onCancel }: Readonly<StudentParentFormProps>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState(false)

  const form = useForm<StudentParentFormData>({
    resolver: zodResolver(studentParentSchema),
    defaultValues: getInitialFormValues(editMode, initialData)
  })

  const generateStudentId = useCallback(async () => {
    setGeneratingId(true)
    try {
      const result = await generateNextStudentIdAction()
      if (result.success && result.data) {
        form.setValue("student.student_id", result.data)
      }
    } catch (error) {
      console.error("Failed to generate student ID:", error)
    } finally {
      setGeneratingId(false)
    }
  }, [form])

  // Auto-generate student ID for new students
  useEffect(() => {
    if (!editMode && !form.getValues("student.student_id")) {
      generateStudentId()
    }
  }, [editMode, form, generateStudentId])

  const onSubmit = async (data: StudentParentFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      let result
      if (editMode) {
        // Build payload for update action: needs student auth id and partials
        const payload: UpdateStudentParentFormData = {
          student_id: initialData!.id, // profiles.id (auth user id) of student
          student: data.student,
          parent: data.parent
        }
        result = await updateStudentParentAction(payload)
      } else {
        result = await createStudentWithParentAction(data)
      }

      if (result.success) {
        setSubmitSuccess(result.message || `Student and parent ${editMode ? 'updated' : 'created'} successfully`)
        if (!editMode) {
          form.reset()
        }
        onSuccess?.()
      } else {
        setSubmitError(result.error || `Failed to ${editMode ? 'update' : 'create'} student and parent`)
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle parent email suggestion selection
  const handleParentEmailSelect = (user: { full_name?: string; phone_number?: string; address?: string; gender?: string; date_of_birth?: string }) => {
    handleParentEmailSelection(user, form)
  }

  // Guard: when editMode, require initialData with id & student_id
  if (editMode && (!initialData?.id || !initialData?.student_id)) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertDescription className="text-red-800 font-medium">
          Thiếu dữ liệu học sinh để chỉnh sửa. Vui lòng đóng và chọn lại học sinh.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card className="w-full max-w-7xl mx-auto shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-green-50 border-b-2 border-gradient-to-r from-blue-200 to-green-200 p-8">
        <CardTitle className="flex items-center gap-4 text-3xl font-bold">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl">
            <Users className="h-8 w-8 text-white" />
          </div>
          {editMode ? "Chỉnh sửa thông tin Học sinh & Phụ huynh" : "Thêm Học sinh & Phụ huynh mới"}
        </CardTitle>
        <CardDescription className="text-lg mt-4 leading-relaxed text-gray-700">
          {editMode
            ? "Cập nhật thông tin học sinh và phụ huynh. Thay đổi sẽ được lưu cho cả hai tài khoản."
            : "Tạo tài khoản học sinh mới với thông tin phụ huynh bắt buộc. Cả hai tài khoản sẽ được tạo cùng nhau với xác thực an toàn."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="p-10">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
          {/* Student Information Section */}
          <StudentInfoSection
            form={form}
            editMode={editMode}
            generatingId={generatingId}
            generateStudentId={generateStudentId}
          />

          <Separator className="my-8" />

          {/* Parent Information Section */}
          <ParentInfoSection
            form={form}
            handleParentEmailSelect={handleParentEmailSelect}
          />

          {/* Error/Success Messages */}
          {submitError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800 font-medium">
                <span className="text-red-500 mr-2">âš </span>
                {submitError}
              </AlertDescription>
            </Alert>
          )}

          {submitSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800 font-medium">
                <span className="text-green-500 mr-2">âœ“</span>
                {submitSuccess}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 md:h-14 lg:h-16 text-base font-semibold bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Skeleton className="h-32 w-full rounded-lg" />
                  {editMode ? "Đang cập nhật Học sinh & Phụ huynh..." : "Đang tạo Học sinh & Phụ huynh..."}
                </>
              ) : (
                <>
                  <Save className="mr-3 h-5 w-5" />
                  {editMode ? "Cập nhật Học sinh & Phụ huynh" : "Tạo Học sinh & Phụ huynh"}
                </>
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="h-12 md:h-14 lg:h-16 px-8 text-base font-medium border-2 hover:bg-gray-50 transition-colors duration-200"
              >
                <X className="mr-2 h-5 w-5" />
                Hủy
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
