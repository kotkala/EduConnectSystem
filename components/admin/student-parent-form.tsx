"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, Save, X, User, Users } from "lucide-react"
import { studentParentSchema, type StudentParentFormData } from "@/lib/validations/user-validations"
import { createStudentWithParentAction } from "@/lib/actions/user-actions"

interface StudentParentFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function StudentParentForm({ onSuccess, onCancel }: StudentParentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  const form = useForm<StudentParentFormData>({
    resolver: zodResolver(studentParentSchema),
    defaultValues: {
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
  })

  const onSubmit = async (data: StudentParentFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const result = await createStudentWithParentAction(data)

      if (result.success) {
        setSubmitSuccess(result.message || "Student and parent created successfully")
        form.reset()
        onSuccess?.()
      } else {
        setSubmitError(result.error || "Failed to create student and parent")
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50 border-b">
        <CardTitle className="flex items-center gap-3 text-2xl font-bold">
          <Users className="h-6 w-6 text-blue-600" />
          Add New Student & Parent
        </CardTitle>
        <CardDescription className="text-base mt-2">
          Create a new student account with mandatory parent information. Both accounts will be created together with secure authentication.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          {/* Student Information Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-blue-100">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-700">Student Information</h3>
                <p className="text-sm text-blue-600">Enter the student&apos;s personal details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Student ID */}
              <div className="space-y-3">
                <Label htmlFor="student_id" className="text-sm font-semibold text-gray-700">
                  Student ID *
                </Label>
                <Input
                  id="student_id"
                  {...form.register("student.student_id")}
                  placeholder="e.g., STU001"
                  className={`h-11 ${form.formState.errors.student?.student_id ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
                />
                {form.formState.errors.student?.student_id && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <span className="text-red-500">⚠</span>
                    {form.formState.errors.student.student_id.message}
                  </p>
                )}
              </div>

              {/* Student Full Name */}
              <div className="space-y-2">
                <Label htmlFor="student_name">Full Name *</Label>
                <Input
                  id="student_name"
                  {...form.register("student.full_name")}
                  placeholder="Enter student's full name"
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
                <Label htmlFor="student_phone">Phone Number *</Label>
                <Input
                  id="student_phone"
                  {...form.register("student.phone_number")}
                  placeholder="0123456789"
                  className={form.formState.errors.student?.phone_number ? "border-red-500" : ""}
                />
                {form.formState.errors.student?.phone_number && (
                  <p className="text-sm text-red-500">{form.formState.errors.student.phone_number.message}</p>
                )}
              </div>

              {/* Student Gender */}
              <div className="space-y-2">
                <Label htmlFor="student_gender">Gender *</Label>
                <Select
                  value={form.watch("student.gender")}
                  onValueChange={(value) => form.setValue("student.gender", value as "male" | "female" | "other")}
                >
                  <SelectTrigger className={form.formState.errors.student?.gender ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.student?.gender && (
                  <p className="text-sm text-red-500">{form.formState.errors.student.gender.message}</p>
                )}
              </div>

              {/* Student Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="student_dob">Date of Birth *</Label>
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
              <Label htmlFor="student_address">Address *</Label>
              <Textarea
                id="student_address"
                {...form.register("student.address")}
                placeholder="Enter student's full address"
                rows={3}
                className={form.formState.errors.student?.address ? "border-red-500" : ""}
              />
              {form.formState.errors.student?.address && (
                <p className="text-sm text-red-500">{form.formState.errors.student.address.message}</p>
              )}
            </div>
          </div>

          <Separator className="my-8" />

          {/* Parent Information Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 pb-4 border-b border-green-100">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-green-700">Parent Information</h3>
                <p className="text-sm text-green-600">Enter the parent/guardian details (Required)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Parent Full Name */}
              <div className="space-y-2">
                <Label htmlFor="parent_name">Full Name *</Label>
                <Input
                  id="parent_name"
                  {...form.register("parent.full_name")}
                  placeholder="Enter parent's full name"
                  className={form.formState.errors.parent?.full_name ? "border-red-500" : ""}
                />
                {form.formState.errors.parent?.full_name && (
                  <p className="text-sm text-red-500">{form.formState.errors.parent.full_name.message}</p>
                )}
              </div>

              {/* Parent Email */}
              <div className="space-y-2">
                <Label htmlFor="parent_email">Email *</Label>
                <Input
                  id="parent_email"
                  type="email"
                  {...form.register("parent.email")}
                  placeholder="parent@email.com"
                  className={form.formState.errors.parent?.email ? "border-red-500" : ""}
                />
                {form.formState.errors.parent?.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.parent.email.message}</p>
                )}
              </div>

              {/* Parent Phone */}
              <div className="space-y-2">
                <Label htmlFor="parent_phone">Phone Number *</Label>
                <Input
                  id="parent_phone"
                  {...form.register("parent.phone_number")}
                  placeholder="0123456789"
                  className={form.formState.errors.parent?.phone_number ? "border-red-500" : ""}
                />
                {form.formState.errors.parent?.phone_number && (
                  <p className="text-sm text-red-500">{form.formState.errors.parent.phone_number.message}</p>
                )}
              </div>

              {/* Parent Gender */}
              <div className="space-y-2">
                <Label htmlFor="parent_gender">Gender *</Label>
                <Select
                  value={form.watch("parent.gender")}
                  onValueChange={(value) => form.setValue("parent.gender", value as "male" | "female" | "other")}
                >
                  <SelectTrigger className={form.formState.errors.parent?.gender ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.parent?.gender && (
                  <p className="text-sm text-red-500">{form.formState.errors.parent.gender.message}</p>
                )}
              </div>

              {/* Parent Date of Birth */}
              <div className="space-y-2">
                <Label htmlFor="parent_dob">Date of Birth *</Label>
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
                <Label htmlFor="relationship_type">Relationship *</Label>
                <Select
                  value={form.watch("parent.relationship_type")}
                  onValueChange={(value) => form.setValue("parent.relationship_type", value as "father" | "mother" | "guardian")}
                >
                  <SelectTrigger className={form.formState.errors.parent?.relationship_type ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.parent?.relationship_type && (
                  <p className="text-sm text-red-500">{form.formState.errors.parent.relationship_type.message}</p>
                )}
              </div>
            </div>

            {/* Parent Address */}
            <div className="space-y-2">
              <Label htmlFor="parent_address">Address *</Label>
              <Textarea
                id="parent_address"
                {...form.register("parent.address")}
                placeholder="Enter parent's full address"
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
                Set as primary contact for the student
              </Label>
            </div>
          </div>

          {/* Error/Success Messages */}
          {submitError && (
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800 font-medium">
                <span className="text-red-500 mr-2">⚠</span>
                {submitError}
              </AlertDescription>
            </Alert>
          )}

          {submitSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800 font-medium">
                <span className="text-green-500 mr-2">✓</span>
                {submitSuccess}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  Creating Student & Parent...
                </>
              ) : (
                <>
                  <Save className="mr-3 h-5 w-5" />
                  Create Student & Parent
                </>
              )}
            </Button>

            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="h-12 px-8 text-base font-medium border-2 hover:bg-gray-50 transition-colors duration-200"
              >
                <X className="mr-2 h-5 w-5" />
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
