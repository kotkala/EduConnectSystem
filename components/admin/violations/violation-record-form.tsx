'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search, AlertTriangle, Plus, CalendarIcon } from 'lucide-react'
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
} from '@/lib/actions/violation-actions'

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
  onSuccess?: () => void
}

// Helper function to create a generic data loader
function createDataLoader<T>(
  setData: (data: T) => void,
  errorMessage: string
) {
  return async (apiCall: () => Promise<{ success: boolean; data?: T; error?: string }>) => {
    try {
      const result = await apiCall();
      if (result.success && result.data) {
        setData(result.data);
      } else {
        toast.error(result.error || errorMessage);
      }
    } catch {
      toast.error(errorMessage);
    }
  };
}

// Helper function to get default form values
function getDefaultFormValues(): BulkStudentViolationFormData {
  return {
    student_ids: [],
    class_id: '',
    violation_type_id: '',
    severity: 'minor' as const,
    description: '',
    violation_date: format(new Date(), 'yyyy-MM-dd'),
    academic_year_id: '',
    semester_id: ''
  };
}

// Helper function to handle class selection
function handleClassSelection(
  classId: string,
  classes: Class[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any,
  setStudents: (students: Student[]) => void,
  setSelectedStudents: (students: string[]) => void
) {
  if (classId) {
    // Set academic year and semester from selected class
    const selectedClass = classes.find(c => c.id === classId);
    if (selectedClass) {
      // Use actual current academic year and semester IDs
      form.setValue('academic_year_id', 'f378e4a3-d0ea-4401-829b-7c841610ce8d'); // 2024-2025
      form.setValue('semester_id', '62f2a9ae-8aeb-43c6-ba14-17f7b82ce609'); // Học kỳ 1
    }
  } else {
    setStudents([]);
    setSelectedStudents([]);
  }
}

export default function ViolationRecordForm({ onSuccess }: ViolationRecordFormProps) {
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
    defaultValues: getDefaultFormValues()
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

  // Create data loaders using helper function
  const loadCategories = createDataLoader(setCategories, 'Failed to load violation categories');
  const loadViolationTypes = createDataLoader(setViolationTypes, 'Failed to load violation types');
  const loadClassBlocks = createDataLoader(setClassBlocks, 'Failed to load class blocks');
  const loadClasses = createDataLoader(setClasses, 'Failed to load classes');

  // Specific loader functions wrapped in useCallback
  const loadCategoriesData = useCallback(() => loadCategories(getViolationCategoriesAction), [loadCategories]);
  const loadViolationTypesData = useCallback((categoryId?: string) => loadViolationTypes(() => getViolationTypesAction(categoryId)), [loadViolationTypes]);
  const loadClassBlocksData = useCallback(() => loadClassBlocks(getClassBlocksAction), [loadClassBlocks]);
  const loadClassesData = useCallback((classBlockId: string) => loadClasses(() => getClassesByBlockAction(classBlockId)), [loadClasses]);

  // Load initial data
  useEffect(() => {
    loadCategoriesData();
    loadClassBlocksData();
  }, [loadCategoriesData, loadClassBlocksData])

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
      loadStudents();
    }
    handleClassSelection(watchedClassId, classes, form, setStudents, setSelectedStudents);
  }, [watchedClassId, classes, form, loadStudents])

// Student Selection Component
function StudentSelectionSection({
  classBlocks,
  classes,
  students,
  selectedStudents,
  studentSearch,
  setStudentSearch,
  setSelectedStudents,
  loadClassesData,
  form
}: {
  classBlocks: ClassBlock[];
  classes: Class[];
  students: Student[];
  selectedStudents: string[];
  studentSearch: string;
  setStudentSearch: (search: string) => void;
  setSelectedStudents: (students: string[]) => void;
  loadClassesData: (classBlockId: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
}) {
  const filteredStudents = students.filter(student =>
    student?.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student?.student_id?.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(
      selectedStudents.includes(studentId)
        ? selectedStudents.filter(id => id !== studentId)
        : [...selectedStudents, studentId]
    );
  };

  const selectAllStudents = () => {
    const allStudentIds = (filteredStudents || []).map(s => s.id).filter(Boolean);
    setSelectedStudents(allStudentIds);
  };

  const clearAllStudents = () => {
    setSelectedStudents([]);
  };

  return (
    <div className="space-y-4">
      {/* Class Block Selection */}
      <FormField
        control={form.control}
        name="class_block_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Class Block</FormLabel>
            <Select onValueChange={(value) => {
              field.onChange(value);
              loadClassesData(value);
            }}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select class block" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {classBlocks?.filter(block => block && block.id && block.id.trim() !== '' && block.display_name && block.display_name.trim() !== '').map((block) => (
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
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {classes?.filter(cls => cls && cls.id && cls.id.trim() !== '' && cls.name && cls.name.trim() !== '').map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} - {cls.academic_year?.name} ({cls.semester?.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Student Selection */}
      {students.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Select Students</h4>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAllStudents}
              >
                Select All
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAllStudents}
              >
                Clear All
              </Button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search students..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="max-h-60 overflow-y-auto border rounded-md p-2 space-y-2">
            {(filteredStudents || []).map((student) => {
              if (!student || !student.id || !student.full_name) return null;

              return (
                <div key={student.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md">
                  <Checkbox
                    checked={selectedStudents.includes(student.id)}
                    onCheckedChange={() => toggleStudentSelection(student.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{student.full_name}</div>
                    <div className="text-sm text-muted-foreground">
                      ID: {student.student_id || 'N/A'} • Email: {student.email || 'N/A'}
                    </div>
                  </div>
                </div>
              );
            })}
            {(filteredStudents || []).length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                No students found
              </div>
            )}
          </div>

          {selectedStudents?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(selectedStudents || []).map((studentId) => {
                if (!studentId) return null;

                const student = (students || []).find(s => s?.id === studentId);
                if (!student || !student.full_name) return null;

                return (
                  <Badge key={studentId} variant="secondary">
                    {student.full_name} ({student.student_id || 'N/A'})
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}







  const onSubmit = async (data: BulkStudentViolationFormData) => {
    try {
      setLoading(true)
      
      const result = await createBulkStudentViolationsAction(data)
      
      if (result.success) {
        toast.success(`Successfully recorded ${data.student_ids.length} violation(s)`)
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
        toast.error(result.error || 'Failed to record violations')
      }
    } catch {
      toast.error('An error occurred while recording violations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Record Student Violations
        </CardTitle>
        <CardDescription>
          Select students and record their violations with appropriate severity levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Student Selection Section */}
            <StudentSelectionSection
              classBlocks={classBlocks}
              classes={classes}
              students={students}
              selectedStudents={selectedStudents}
              studentSearch={studentSearch}
              setStudentSearch={setStudentSearch}
              setSelectedStudents={setSelectedStudents}
              loadClassesData={loadClassesData}
              form={form}
            />



            {/* Violation Category */}
            <FormField
              control={form.control}
              name="violation_type_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Violation Category</FormLabel>
                  <Select onValueChange={(value) => {
                    loadViolationTypesData(value)
                    field.onChange('')
                  }}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select violation category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.filter(category => category && category.id && category.id.trim() !== '' && category.name && category.name.trim() !== '').map((category) => (
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
                        <SelectValue placeholder="Select violation type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {violationTypes?.filter(type => type && type.id && type.id.trim() !== '' && type.name && type.name.trim() !== '' && type.default_severity && type.default_severity.trim() !== '').map((type) => (
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
                        <SelectValue placeholder="Select severity level" />
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
                      placeholder="Additional details about the violation..."
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
                  <FormLabel>Violation Date</FormLabel>
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
                            <span>Pick a date</span>
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
                        initialFocus
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
                Reset
              </Button>
              <Button
                type="submit"
                disabled={loading || (selectedStudents || []).length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                {loading ? 'Recording...' : `Record ${(selectedStudents || []).length} Violation(s)`}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
