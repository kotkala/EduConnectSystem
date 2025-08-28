'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Input } from '@/shared/components/ui/input'
import { Calendar } from '@/shared/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover'
import { Search, Users, AlertTriangle, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  bulkStudentViolationSchema,
  getSeverityLabel,
  getSeverityColor,
  violationSeverityLevels,
  type BulkStudentViolationFormData,
  type ViolationCategory,
  type ViolationTypeWithCategory
} from '@/lib/validations/violation-validations'
import {
  getViolationCategoriesAction,
  getViolationTypesAction,
  createBulkStudentViolationsAction,
  getClassBlocksAction,
  getClassesByBlockAction,
  getStudentsByClassAction
} from '@/features/violations/actions'

interface Student {
  id: string
  full_name: string
  student_id: string
  email: string
}

interface Class {
  id: string
  name: string
  academic_year: { name: string }
  semester: { name: string }
}

interface ClassBlock {
  id: string
  name: string
  display_name: string
}

interface ViolationRecordFormProps {
  readonly onSuccess?: () => void
}

export default function ViolationRecordForm({ onSuccess }: Readonly<ViolationRecordFormProps>) {
  const [categories, setCategories] = useState<ViolationCategory[]>([])
  const [violationTypes, setViolationTypes] = useState<ViolationTypeWithCategory[]>([])
  const [classBlocks, setClassBlocks] = useState<ClassBlock[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [studentSearch, setStudentSearch] = useState('')
  const [loading, setLoading] = useState(false)

  const form = useForm<BulkStudentViolationFormData>({
    resolver: zodResolver(bulkStudentViolationSchema),
    defaultValues: {
      student_ids: [],
      class_id: undefined,
      violation_type_id: undefined,
      severity: 'minor' as const,
      description: '',
      violation_date: format(new Date(), 'yyyy-MM-dd'),
      academic_year_id: undefined,
      semester_id: undefined
    }
  })

  const watchedClassId = form.watch('class_id')
  const watchedCategoryId = form.watch('violation_type_id')

  // Define loadStudents function first
  const loadStudents = useCallback(async () => {
    if (!watchedClassId) return

    try {
      const result = await getStudentsByClassAction(watchedClassId)
      if (result.success && result.data) {
        setStudents(result.data)
      } else {
        toast.error(result.error || 'Failed to load students')
      }
    } catch {
      toast.error('Failed to load students')
    }
  }, [watchedClassId])

  // Load initial data
  useEffect(() => {
    loadCategories()
    loadClassBlocks()
  }, [])

  // Load violation types when category changes
  useEffect(() => {
    if (watchedCategoryId) {
      const selectedType = violationTypes.find(t => t.id === watchedCategoryId)
      if (selectedType) {
        form.setValue('severity', selectedType.default_severity)
      }
    }
  }, [watchedCategoryId, violationTypes, form])

  // Load students when class changes and set academic year/semester
  useEffect(() => {
    if (watchedClassId) {
      loadStudents()

      // Set academic year and semester from selected class
      const selectedClass = classes.find(c => c.id === watchedClassId)
      if (selectedClass) {
        // Use actual current academic year and semester IDs
        form.setValue('academic_year_id', 'f378e4a3-d0ea-4401-829b-7c841610ce8d') // 2024-2025
        form.setValue('semester_id', '62f2a9ae-8aeb-43c6-ba14-17f7b82ce609') // Học kỳ 1
      }
    } else {
      setStudents([])
      setSelectedStudents([])
    }
  }, [watchedClassId, classes, form, loadStudents])

  const loadCategories = async () => {
    try {
      const result = await getViolationCategoriesAction()
      if (result.success && result.data) {
        setCategories(result.data)
      }
    } catch {
      toast.error('Failed to load violation categories')
    }
  }

  const loadViolationTypes = async (categoryId?: string) => {
    try {
      const result = await getViolationTypesAction(categoryId)
      if (result.success && result.data) {
        setViolationTypes(result.data)
      }
    } catch {
      toast.error('Failed to load violation types')
    }
  }

  const loadClassBlocks = async () => {
    try {
      const result = await getClassBlocksAction()
      if (result.success && result.data) {
        setClassBlocks(result.data)
      } else {
        toast.error(result.error || 'Failed to load class blocks')
      }
    } catch {
      toast.error('Failed to load class blocks')
    }
  }

  const loadClasses = async (classBlockId: string) => {
    try {
      const result = await getClassesByBlockAction(classBlockId)
      if (result.success && result.data) {
        setClasses(result.data)
      } else {
        toast.error(result.error || 'Failed to load classes')
      }
    } catch {
      toast.error('Failed to load classes')
    }
  }



  const filteredStudents = students?.filter(student => {
    if (!student?.full_name) return false

    const searchTerm = studentSearch.toLowerCase()
    const fullName = student.full_name?.toLowerCase() || ''
    const studentId = student.student_id?.toLowerCase() || ''
    const email = student.email?.toLowerCase() || ''

    return (
      fullName.includes(searchTerm) ||
      studentId.includes(searchTerm) ||
      email.includes(searchTerm)
    )
  }) || []

  const handleStudentToggle = (studentId: string) => {
    if (!studentId || typeof studentId !== 'string') return

    // Ensure selectedStudents is always an array
    const currentSelection = Array.isArray(selectedStudents) ? selectedStudents : []

    const newSelection = currentSelection.includes(studentId)
      ? currentSelection.filter(id => id !== studentId)
      : [...currentSelection, studentId]

    // Use setTimeout to avoid state updates during render
    setTimeout(() => {
      setSelectedStudents(newSelection)
      form.setValue('student_ids', newSelection)
    }, 0)
  }

  const handleSelectAllStudents = () => {
    const safeFilteredStudents = Array.isArray(filteredStudents) ? filteredStudents : []
    if (safeFilteredStudents.length === 0) return

    const allStudentIds = safeFilteredStudents
      .filter(s => s?.id && typeof s.id === 'string' && s.id.trim() !== '')
      .map(s => s.id)

    // Use setTimeout to avoid state updates during render
    setTimeout(() => {
      setSelectedStudents(allStudentIds)
      form.setValue('student_ids', allStudentIds)
    }, 0)
  }

  const handleClearSelection = () => {
    // Use setTimeout to avoid state updates during render
    setTimeout(() => {
      setSelectedStudents([])
      form.setValue('student_ids', [])
    }, 0)
  }

  const onSubmit = async (data: BulkStudentViolationFormData) => {
    try {
      setLoading(true)
      
      const result = await createBulkStudentViolationsAction(data)
      
      if (result.success) {
        toast.success(`Ghi nhận vi phạm thành công cho ${data.student_ids.length} học sinh`)
        // Reset form with safe default values
        form.reset({
          student_ids: [],
          class_id: undefined,
          violation_type_id: undefined,
          severity: 'minor' as const,
          description: '',
          violation_date: format(new Date(), 'yyyy-MM-dd'),
          academic_year_id: undefined,
          semester_id: undefined
        })
        setSelectedStudents([])
        onSuccess?.()
      } else {
        toast.error(result.error || 'Ghi nhận vi phạm thất bại')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi ghi nhận vi phạm')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Ghi nhận vi phạm học sinh
        </CardTitle>
        <CardDescription>
          Select students and record their violations with appropriate severity levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Class Block Selection */}
            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade Block</FormLabel>
                  <Select onValueChange={(value) => {
                    loadClasses(value)
                    field.onChange('')
                  }}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khối lớp" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classBlocks?.filter(block => block?.id?.trim() && block?.display_name?.trim()).map((block) => (
                        <SelectItem key={block.id} value={block.id}>
                          {block.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Class Selection */}
            <FormField
              control={form.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn lớp học" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes?.filter(cls => cls?.id?.trim() && cls?.name?.trim() && cls?.academic_year && cls?.semester).map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.academic_year?.name || 'Unknown Year'} - {cls.semester?.name || 'Unknown Semester'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Student Selection */}
            {watchedClassId && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Chọn học sinh</FormLabel>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllStudents}
                      disabled={(filteredStudents || []).length === 0}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      Chọn tất cả ({(filteredStudents || []).length})
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearSelection}
                      disabled={(selectedStudents || []).length === 0}
                    >
                      Bỏ chọn ({(selectedStudents || []).length})
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Tìm kiếm học sinh theo tên hoặc mã số..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                  {(filteredStudents || []).filter(student => student?.id && student?.full_name).map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                    >
                      <Checkbox
                        checked={selectedStudents?.includes(student.id) || false}
                        onCheckedChange={() => handleStudentToggle(student.id)}
                      />
                      <button
                        type="button"
                        className="flex-1 cursor-pointer text-left p-0 border-0 bg-transparent hover:bg-transparent focus:bg-transparent"
                        onClick={() => handleStudentToggle(student.id)}
                        aria-label={`Toggle selection for ${student.full_name}`}
                      >
                        <div className="font-medium">{student.full_name}</div>
                        <div className="text-sm text-muted-foreground">
                          ID: {student.student_id || 'N/A'} • {student.email || 'N/A'}
                        </div>
                      </button>
                    </div>
                  ))}
                  {(filteredStudents || []).length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      Không tìm thấy học sinh
                    </div>
                  )}
                </div>

                {selectedStudents?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(selectedStudents || []).map((studentId) => {
                      if (!studentId) return null

                      const student = (students || []).find(s => s?.id === studentId)
                      if (!student?.full_name) return null

                      return (
                        <Badge key={studentId} variant="secondary">
                          {student.full_name} ({student.student_id || 'N/A'})
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Violation Category */}
            <FormField
              control={form.control}
              name="violation_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Violation Category</FormLabel>
                  <Select onValueChange={(value) => {
                    loadViolationTypes(value)
                    field.onChange('')
                  }}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn danh mục vi phạm" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.filter(category => category?.id?.trim() && category?.name?.trim()).map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Violation Type */}
            <FormField
              control={form.control}
              name="violation_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Violation Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại vi phạm" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {violationTypes?.filter(type => type?.id?.trim() && type?.name?.trim() && type?.default_severity?.trim()).map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <span>{type.name}</span>
                            <Badge className={getSeverityColor(type.default_severity)}>
                              {getSeverityLabel(type.default_severity)}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Severity Level */}
            <FormField
              control={form.control}
              name="severity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severity Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn mức độ nghiêm trọng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {violationSeverityLevels?.filter(severity => severity && severity.trim() !== '').map((severity) => (
                        <SelectItem key={severity} value={severity}>
                          <Badge className={getSeverityColor(severity)}>
                            {getSeverityLabel(severity)}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Chi tiết bổ sung về vi phạm..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Violation Date */}
            <FormField
              control={form.control}
              name="violation_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ngày vi phạm</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(new Date(field.value), "PPP")
                          ) : (
                            <span>Chọn ngày</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) => {
                          field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                        }}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // Reset form with safe default values
                  form.reset({
                    student_ids: [],
                    class_id: undefined,
                    violation_type_id: undefined,
                    severity: 'minor' as const,
                    description: '',
                    violation_date: format(new Date(), 'yyyy-MM-dd'),
                    academic_year_id: undefined,
                    semester_id: undefined
                  })
                  setSelectedStudents([])
                }}
                disabled={loading}
              >
                Đặt lại
              </Button>
              <Button
                type="submit"
                disabled={loading || (selectedStudents || []).length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Đang ghi nhận...' : `Ghi nhận ${(selectedStudents || []).length} vi phạm`}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
