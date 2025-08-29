"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"


import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Separator } from "@/shared/components/ui/separator"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Skeleton } from "@/shared/components/ui/skeleton"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form"
import { Save, X, User, Users, RefreshCw } from "lucide-react"
import { studentParentSchema, type StudentParentFormData, type StudentWithParent, type UpdateStudentParentFormData } from "@/lib/validations/user-validations"
import { createStudentWithParentAction, updateStudentParentAction, generateNextStudentIdAction } from "@/features/admin-management/actions/user-actions"
import { EmailSuggestionInput } from "@/features/admin-management/components/admin/email-suggestion-input"

interface StudentParentFormProps {
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
        gender: "male",
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 bg-gradient-to-r from-blue-50/30 to-blue-50/10 p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border border-blue-100">
      <div className="flex items-center gap-3 sm:gap-4 pb-4 sm:pb-6 border-b-2 border-blue-200">
        <div className="p-3 sm:p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
          <User className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-blue-800">Thông tin học sinh</h3>
          <p className="text-sm sm:text-base text-blue-600 mt-1">Nhập thông tin cá nhân của học sinh</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Student ID */}
        <FormField
          control={form.control}
          name="student.student_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-800">
                Mã học sinh *
              </FormLabel>
              <div className="flex gap-3">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="VD: SU001"
                    readOnly={editMode}
                    className={`h-12 flex-1 text-base ${editMode ? "bg-gray-50" : ""}`}
                  />
                </FormControl>
                {!editMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={generateStudentId}
                    disabled={generatingId}
                    className="h-12 px-4 text-base"
                  >
                    {generatingId ? (
                      <Skeleton className="h-4 w-4 rounded" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              <FormMessage />
              {!editMode && (
                <FormDescription className="text-xs text-gray-500">
                  Mã học sinh sẽ được tự động tạo (SU001, SU002, ...)
                </FormDescription>
              )}
            </FormItem>
          )}
        />

        {/* Student Full Name */}
        <FormField
          control={form.control}
          name="student.full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-800">
                Họ và tên *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Nhập họ và tên học sinh"
                  className="h-12 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Student Email */}
        <FormField
          control={form.control}
          name="student.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-800">
                Email *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="student@school.com"
                  className="h-12 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Student Phone */}
        <FormField
          control={form.control}
          name="student.phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-800">
                Số điện thoại *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Nhập số điện thoại"
                  className="h-12 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Student Gender */}
        <FormField
          control={form.control}
          name="student.gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-800">
                Giới tính *
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 text-base">
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

        {/* Student Date of Birth */}
        <FormField
          control={form.control}
          name="student.date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-800">
                Ngày sinh *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  className="h-12 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Student Address */}
      <FormField
        control={form.control}
        name="student.address"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold text-gray-800">
              Địa chỉ *
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Nhập địa chỉ đầy đủ"
                className="min-h-[100px] text-base resize-none"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 bg-gradient-to-r from-green-50/30 to-green-50/10 p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl border border-green-100">
      <div className="flex items-center gap-3 sm:gap-4 pb-4 sm:pb-6 border-b-2 border-green-200">
        <div className="p-3 sm:p-4 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
          <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-green-800">Thông tin phụ huynh</h3>
          <p className="text-sm sm:text-base text-green-600 mt-1">Nhập thông tin liên hệ của phụ huynh</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Parent Email with Suggestion */}
        <FormField
          control={form.control}
          name="parent.email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-800">
                Email phụ huynh *
              </FormLabel>
              <FormControl>
                <EmailSuggestionInput
                  id="parent-email"
                  label=""
                  value={field.value}
                  onChange={field.onChange}
                  onUserSelect={handleParentEmailSelect}
                  placeholder="parent@email.com"
                  className="h-12 text-base"
                />
              </FormControl>
              <FormMessage />
              <FormDescription className="text-xs text-gray-500">
                Nhập email để tìm kiếm phụ huynh có sẵn
              </FormDescription>
            </FormItem>
          )}
        />

        {/* Parent Full Name */}
        <FormField
          control={form.control}
          name="parent.full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-800">
                Họ và tên phụ huynh *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Nhập họ và tên phụ huynh"
                  className="h-12 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Parent Phone */}
        <FormField
          control={form.control}
          name="parent.phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-800">
                Số điện thoại *
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Nhập số điện thoại"
                  className="h-12 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Parent Gender */}
        <FormField
          control={form.control}
          name="parent.gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-800">
                Giới tính *
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 text-base">
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

        {/* Relationship Type */}
        <FormField
          control={form.control}
          name="parent.relationship_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-800">
                Mối quan hệ *
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Chọn mối quan hệ" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="father">Bố</SelectItem>
                  <SelectItem value="mother">Mẹ</SelectItem>
                  <SelectItem value="guardian">Người giám hộ</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Parent Date of Birth */}
        <FormField
          control={form.control}
          name="parent.date_of_birth"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold text-gray-800">
                Ngày sinh
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="date"
                  className="h-12 text-base"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Parent Address */}
      <FormField
        control={form.control}
        name="parent.address"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-base font-semibold text-gray-800">
              Địa chỉ
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                placeholder="Nhập địa chỉ đầy đủ"
                className="min-h-[100px] text-base resize-none"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Primary Contact Checkbox */}
      <FormField
        control={form.control}
        name="parent.is_primary_contact"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel className="text-base font-semibold text-gray-800">
                Liên hệ chính
              </FormLabel>
              <FormDescription className="text-sm text-gray-600">
                Đánh dấu nếu đây là người liên hệ chính của học sinh
              </FormDescription>
            </div>
          </FormItem>
        )}
      />
    </div>
  )
}

// Main Form Component
export function StudentParentForm({ editMode = false, initialData, onSuccess, onCancel }: Readonly<StudentParentFormProps>) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)
  const [generatingId, setGeneratingId] = useState(false)

  const form = useForm<StudentParentFormData>({
    resolver: zodResolver(studentParentSchema),
    defaultValues: getInitialFormValues(editMode, initialData)
  })

  // Generate student ID
  const generateStudentId = useCallback(async () => {
    if (editMode) return

    setGeneratingId(true)
    try {
      const result = await generateNextStudentIdAction()
      if (result.success && result.data) {
        form.setValue("student.student_id", result.data)
      } else {
        setSubmitError(result.error || "Không thể tạo mã học sinh")
      }
    } catch {
      setSubmitError("Lỗi khi tạo mã học sinh")
    } finally {
      setGeneratingId(false)
    }
  }, [editMode, form])

  // Handle parent email selection
  const handleParentEmailSelect = useCallback((user: { full_name?: string; phone_number?: string; address?: string; gender?: string; date_of_birth?: string }) => {
    handleParentEmailSelection(user, form)
  }, [form])

  // Submit handler
  const onSubmit = async (data: StudentParentFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      let result
      if (editMode && initialData) {
        const updateData: UpdateStudentParentFormData = {
          student_id: initialData.id,
          student: data.student,
          parent: data.parent
        }
        result = await updateStudentParentAction(updateData)
      } else {
        result = await createStudentWithParentAction(data)
      }

      if (result.success) {
        setSubmitSuccess(editMode ? "Cập nhật thành công!" : "Tạo tài khoản thành công!")
        form.reset()
        setTimeout(() => {
          onSuccess?.()
        }, 1500)
      } else {
        setSubmitError(result.error || "Có lỗi xảy ra")
      }
    } catch {
      setSubmitError("Có lỗi xảy ra khi xử lý")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Auto-generate student ID on mount for new forms
  useEffect(() => {
    if (!editMode && !form.getValues("student.student_id")) {
      generateStudentId()
    }
  }, [editMode, generateStudentId, form])

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
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

            {/* Success/Error Messages */}
            {submitSuccess && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800 font-medium">
                  {submitSuccess}
                </AlertDescription>
              </Alert>
            )}

            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isSubmitting ? (
                  <>
                    <Skeleton className="h-4 w-4 rounded mr-2" />
                    {editMode ? "Đang cập nhật..." : "Đang tạo tài khoản..."}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editMode ? "Cập nhật thông tin" : "Tạo tài khoản"}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none h-12 text-base font-semibold px-8"
              >
                <X className="h-4 w-4 mr-2" />
                Hủy
              </Button>
            </div>
          </form>
        </Form>
    </div>
  )
}
