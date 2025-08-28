'use client'

import { Loader2 } from 'lucide-react'
import { useState, useEffect, memo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Save, X } from "lucide-react";import {
  classSchema,
  updateClassSchema,
  SUBJECT_COMBINATIONS,
  type ClassFormData,
  type UpdateClassFormData,
  type Class
} from "@/lib/validations/class-validations"
import { type Semester, type AcademicYear } from "@/lib/validations/academic-validations"
import { type ClassBlock } from "@/lib/validations/class-block-validations"

// Type for dropdown data (Context7 pattern for specific use cases)
type ClassBlockDropdownData = Pick<ClassBlock, "id" | "name" | "display_name">

// Simple teacher interface for dropdown
interface SimpleTeacher {
  id: string
  full_name: string
  employee_id: string
}
import { createClassAction, updateClassAction, getHomeroomEnabledTeachersAction } from "@/features/admin-management/actions/class-actions"
import { getAcademicYearsAction } from "@/features/admin-management/actions/academic-actions"
import { getActiveClassBlocksAction } from "@/lib/actions/class-block-actions"
import { useSelectedAcademicYearId } from "@/providers/academic-year-context"


interface ClassFormProps {
  class?: Class
  onSuccess: () => void
  onCancel: () => void
  defaultAcademicYearId?: string // Optional prop for backward compatibility
}

// Helper function to get initial form values
function getInitialFormValues(isEditing: boolean, classData?: Class) {
  if (isEditing && classData) {
    return {
      ...(classData.id && { id: classData.id }),
      name: classData.name,
      class_block_id: classData.class_block_id || undefined,
      class_suffix: classData.class_suffix || undefined,
      auto_generated_name: classData.auto_generated_name || false,
      academic_year_id: classData.academic_year_id,
      semester_id: classData.semester_id,
      is_subject_combination: classData.is_subject_combination,
      subject_combination_type: classData.subject_combination_type || undefined,
      subject_combination_variant: classData.subject_combination_variant || undefined,
      homeroom_teacher_id: classData.homeroom_teacher_id || undefined,
      max_students: classData.max_students,
      description: classData.description || undefined
    };
  }

  return {
    name: "",
    class_block_id: "",
    class_suffix: "",
    auto_generated_name: false,
    academic_year_id: "",
    semester_id: "",
    is_subject_combination: false,
    max_students: 40,
    description: ""
  };
}



// Helper function to generate class name
function generateClassName(
  classBlocks: ClassBlockDropdownData[],
  classBlockId: string,
  classSuffix: string
): string {
  const selectedBlock = classBlocks.find(block => block.id === classBlockId);
  if (selectedBlock) {
    return `${selectedBlock.name}${classSuffix}`;
  }
  return '';
}

// Subject Combination Section Component
function SubjectCombinationSection({
  form,
  watchIsSubjectCombination,
  watchSubjectCombinationType
}: Readonly<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  watchIsSubjectCombination: boolean;
  watchSubjectCombinationType: string | undefined
}>) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_subject_combination"
          checked={watchIsSubjectCombination}
          onCheckedChange={(checked) => form.setValue("is_subject_combination", !!checked)}
        />
        <Label htmlFor="is_subject_combination">Lớp chuyên môn</Label>
      </div>

      {watchIsSubjectCombination && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
          <div className="space-y-2">
            <Label htmlFor="subject_combination_type">Loại chuyên môn *</Label>
            <Select
              value={(form.watch("subject_combination_type") as string) || ""}
              onValueChange={(value) => form.setValue("subject_combination_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn loại chuyên môn" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SUBJECT_COMBINATIONS).map(([key, combination]) => (
                  <SelectItem key={key} value={key}>
                    {combination.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.subject_combination_type && (
              <p className="text-sm text-red-500">
                {form.formState.errors.subject_combination_type.message as string}
              </p>
            )}
          </div>

          {watchSubjectCombinationType && (
            <div className="space-y-2">
              <Label htmlFor="subject_combination_variant">Biến thể *</Label>
              <Select
                value={(form.watch("subject_combination_variant") as string) || ""}
                onValueChange={(value) => form.setValue("subject_combination_variant", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn biến thể" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECT_COMBINATIONS[watchSubjectCombinationType as keyof typeof SUBJECT_COMBINATIONS]?.variants?.map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.subject_combination_variant && (
                <p className="text-sm text-red-500">
                  {form.formState.errors.subject_combination_variant.message as string}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ClassFormComponent({ class: classData, onSuccess, onCancel, defaultAcademicYearId }: Readonly<ClassFormProps>) {
  // Use global academic year context for fallback
  const selectedAcademicYearId = useSelectedAcademicYearId()

  // Use provided defaultAcademicYearId or fall back to global context
  const effectiveAcademicYearId = defaultAcademicYearId || selectedAcademicYearId

  const isEditing = !!classData
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null)

  // Form data
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [teachers, setTeachers] = useState<SimpleTeacher[]>([])
  const [classBlocks, setClassBlocks] = useState<ClassBlockDropdownData[]>([])
  const [loadingData, setLoadingData] = useState(true)

  const form = useForm({
    resolver: zodResolver(isEditing ? updateClassSchema : classSchema),
    defaultValues: getInitialFormValues(isEditing, classData)
  })

  // Watch for form changes using Context7 patterns
  const watchIsSubjectCombination = form.watch("is_subject_combination")
  const watchSubjectCombinationType = form.watch("subject_combination_type")
  const watchAutoGeneratedName = form.watch("auto_generated_name")
  const watchClassBlockId = form.watch("class_block_id")
  const watchClassSuffix = form.watch("class_suffix")

  // Auto-set academic year from global context
  useEffect(() => {
    if (effectiveAcademicYearId && !isEditing) {
      form.setValue("academic_year_id", effectiveAcademicYearId);
    }
  }, [effectiveAcademicYearId, isEditing, form])

  // Auto-generate class name when using class blocks (Context7 pattern)
  useEffect(() => {
    if (watchAutoGeneratedName && watchClassBlockId && watchClassSuffix) {
      const generatedName = generateClassName(classBlocks, watchClassBlockId, watchClassSuffix);
      if (generatedName) {
        form.setValue("name", generatedName);
      }
    }
  }, [watchAutoGeneratedName, watchClassBlockId, watchClassSuffix, classBlocks, form])

  // Load initial data (academic years, teachers, class blocks)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load academic years
        const academicYearsResult = await getAcademicYearsAction({ page: 1, limit: 100 })
        if (academicYearsResult.success) {
          setAcademicYears(academicYearsResult.data)

          // Auto-select current academic year for new classes
          if (!isEditing) {
            const currentYear = academicYearsResult.data.find(year => year.is_current)
            if (currentYear) {
              form.setValue("academic_year_id", currentYear.id)
            }
          }
        }

        // Load teachers and class blocks
        const [teachersResult, classBlocksResult] = await Promise.all([
          getHomeroomEnabledTeachersAction(),
          getActiveClassBlocksAction()
        ])

        if (teachersResult.success) {
          setTeachers(teachersResult.data)
        }
        if (classBlocksResult.success) {
          setClassBlocks(classBlocksResult.data)
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [isEditing, form])

  // Load semesters when academic year changes
  useEffect(() => {
    const selectedAcademicYearId = form.watch("academic_year_id")
    if (selectedAcademicYearId) {
      const loadSemesters = async () => {
        try {
          const { createClient } = await import('@/lib/supabase/client')
          const supabase = createClient()

          const { data, error } = await supabase
            .from('semesters')
            .select('*')
            .eq('academic_year_id', selectedAcademicYearId)
            .order('semester_number', { ascending: true })

          if (error) throw error
          setSemesters(data || [])
        } catch (error) {
          console.error("Failed to load semesters:", error);
        }
      }
      loadSemesters()
    }
  }, [form])

  // Reset subject combination fields when checkbox is unchecked
  useEffect(() => {
    if (!watchIsSubjectCombination) {
      form.setValue("subject_combination_type", undefined)
      form.setValue("subject_combination_variant", undefined)
    }
  }, [watchIsSubjectCombination, form])

  // Reset variant when type changes
  useEffect(() => {
    if (watchSubjectCombinationType) {
      form.setValue("subject_combination_variant", undefined)
    }
  }, [watchSubjectCombinationType, form])

  const onSubmit = async (data: ClassFormData | UpdateClassFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(null)

    try {
      const result = isEditing 
        ? await updateClassAction(data as UpdateClassFormData)
        : await createClassAction(data as ClassFormData)

      if (result.success) {
        setSubmitSuccess(result.message || "Operation completed successfully")
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        setSubmitError(result.error || "An error occurred")
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6">
        {/* Class Creation Method */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto_generated_name"
              checked={watchAutoGeneratedName}
              onCheckedChange={(checked) => {
                form.setValue("auto_generated_name", !!checked)
                if (!checked) {
                  form.setValue("class_block_id", "")
                  form.setValue("class_suffix", "")
                }
              }}
            />
            <Label htmlFor="auto_generated_name">Use class block system (e.g., Grade 10 + A1 = 10A1)</Label>
          </div>

          {/* Class Block Selection - Context7 conditional rendering pattern */}
          {watchAutoGeneratedName && (
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
              <div className="space-y-2">
                <Label htmlFor="class_block_id">Class Block *</Label>
                <Select
                  value={watchClassBlockId}
                  onValueChange={(value) => form.setValue("class_block_id", value)}
                >
                  <SelectTrigger className={form.formState.errors.class_block_id ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select class block" />
                  </SelectTrigger>
                  <SelectContent>
                    {classBlocks.map((block) => (
                      <SelectItem key={block.id} value={block.id}>
                        {block.display_name} ({block.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.class_block_id && (
                  <p className="text-sm text-red-500">{form.formState.errors.class_block_id.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="class_suffix">Class Suffix *</Label>
                <Input
                  id="class_suffix"
                  {...form.register("class_suffix")}
                  placeholder="e.g., A1, B2, C3"
                  className={form.formState.errors.class_suffix ? "border-red-500" : ""}
                />
                {form.formState.errors.class_suffix && (
                  <p className="text-sm text-red-500">{form.formState.errors.class_suffix.message}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Class Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Tên lớp *
            {watchAutoGeneratedName && (
              <span className="text-sm text-gray-500 ml-2">(Tự động tạo từ khối + hậu tố)</span>
            )}
          </Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder={watchAutoGeneratedName ? "Sẽ được tự động tạo" : "Nhập tên lớp (VD: 10A1, Lý-Hóa-Sinh-01)"}
            className={form.formState.errors.name ? "border-red-500" : ""}
            disabled={watchAutoGeneratedName}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
          )}
        </div>

        {/* Academic Year - Dropdown Selection */}
        <div className="space-y-2">
          <Label htmlFor="academic_year_id">Năm học *</Label>
          <Select
            value={form.watch("academic_year_id")}
            onValueChange={(value) => form.setValue("academic_year_id", value)}
          >
            <SelectTrigger className={form.formState.errors.academic_year_id ? "border-red-500" : ""}>
              <SelectValue placeholder="Chọn năm học" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name} {year.is_current && "(Hiện tại)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.academic_year_id && (
            <p className="text-sm text-red-500">{form.formState.errors.academic_year_id.message}</p>
          )}
        </div>

        {/* Semester */}
        <div className="space-y-2">
          <Label htmlFor="semester_id">Học kỳ *</Label>
          <Select
            value={form.watch("semester_id")}
            onValueChange={(value) => form.setValue("semester_id", value)}
          >
            <SelectTrigger className={form.formState.errors.semester_id ? "border-red-500" : ""}>
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((semester) => (
                <SelectItem key={semester.id} value={semester.id}>
                  {semester.name} ({semester.weeks_count} tuần) {semester.is_current && "(Hiện tại)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.semester_id && (
            <p className="text-sm text-red-500">{form.formState.errors.semester_id.message}</p>
          )}
        </div>

        {/* Subject Combination Section */}
        <SubjectCombinationSection
          form={form}
          watchIsSubjectCombination={!!watchIsSubjectCombination}
          watchSubjectCombinationType={watchSubjectCombinationType}
        />

        {/* Homeroom Teacher - Only show for non-subject combination classes */}
        {!watchIsSubjectCombination && (
          <div className="space-y-2">
            <Label htmlFor="homeroom_teacher_id">Homeroom Teacher</Label>
            <Select
              value={form.watch("homeroom_teacher_id") || "none"}
              onValueChange={(value) => form.setValue("homeroom_teacher_id", value === "none" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select homeroom teacher (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No homeroom teacher</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.full_name} ({teacher.employee_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.homeroom_teacher_id && (
              <p className="text-sm text-red-500">{form.formState.errors.homeroom_teacher_id.message}</p>
            )}
          </div>
        )}

        {/* Max Students */}
        <div className="space-y-2">
          <Label htmlFor="max_students">Maximum Students *</Label>
          <Input
            id="max_students"
            type="number"
            min="1"
            max="100"
            {...form.register("max_students", { valueAsNumber: true })}
            placeholder="Enter maximum number of students"
            className={form.formState.errors.max_students ? "border-red-500" : ""}
          />
          {form.formState.errors.max_students && (
            <p className="text-sm text-red-500">{form.formState.errors.max_students.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...form.register("description")}
            placeholder="Enter class description (optional)"
            rows={3}
            className={form.formState.errors.description ? "border-red-500" : ""}
          />
          {form.formState.errors.description && (
            <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
          )}
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
                {isEditing ? "Cập nhật lớp" : "Tạo lớp"}
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            Hủy
          </Button>
        </div>
      </div>
    </form>
  )
}

// Export memoized component to prevent unnecessary re-renders
export const ClassForm = memo(ClassFormComponent)
