'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  excelImportSchema,
  type ExcelImportFormData,
  type GradeReportingPeriod
} from '@/lib/validations/grade-management-validations'
import {
  parseExcelFile,
  validateExcelFormat,
  type ExcelProcessingResult
} from '@/lib/utils/grade-excel-utils'
import { bulkImportGradesAction, getClassesAction, getSubjectsAction } from '@/lib/actions/grade-management-actions'

interface ExcelImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  period: GradeReportingPeriod
  onSuccess?: () => void
}

interface ImportStep {
  id: 'upload' | 'validate' | 'preview' | 'import'
  title: string
  description: string
}

const importSteps: ImportStep[] = [
  {
    id: 'upload',
    title: 'Tải file Excel',
    description: 'Chọn file Excel theo định dạng VNedu'
  },
  {
    id: 'validate',
    title: 'Kiểm tra dữ liệu',
    description: 'Xác thực định dạng và nội dung file'
  },
  {
    id: 'preview',
    title: 'Xem trước',
    description: 'Kiểm tra dữ liệu trước khi nhập'
  },
  {
    id: 'import',
    title: 'Nhập điểm',
    description: 'Lưu điểm vào hệ thống'
  }
]

interface ClassOption {
  id: string
  name: string
  academic_year_id: string
  semester_id: string
  current_students: number
  max_students: number
  academic_year: { name: string }[] | null
  semester: { name: string }[] | null
}

interface SubjectOption {
  id: string
  code: string
  name_vietnamese: string
  name_english: string
  category: string
  is_active: boolean
}

export function ExcelImportDialog({
  open,
  onOpenChange,
  period,
  onSuccess
}: ExcelImportDialogProps) {
  const [currentStep, setCurrentStep] = useState<ImportStep['id']>('upload')
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingResult, setProcessingResult] = useState<ExcelProcessingResult | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [subjects, setSubjects] = useState<SubjectOption[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)


  const form = useForm<ExcelImportFormData>({
    resolver: zodResolver(excelImportSchema),
    defaultValues: {
      period_id: period.id,
      class_id: '',
      subject_id: '',
      grade_type: 'midterm'
    }
  })

  // Load classes and subjects when dialog opens
  useEffect(() => {
    if (open) {
      loadClassesAndSubjects()
    }
  }, [open])

  const loadClassesAndSubjects = useCallback(async () => {
    try {
      setLoadingData(true)

      const [classesResult, subjectsResult] = await Promise.all([
        getClassesAction(),
        getSubjectsAction()
      ])

      if (classesResult.success) {
        setClasses(classesResult.data as ClassOption[])
      } else {
        toast.error(classesResult.error || "Không thể tải danh sách lớp học")
      }

      if (subjectsResult.success) {
        setSubjects(subjectsResult.data as SubjectOption[])
      } else {
        toast.error(subjectsResult.error || "Không thể tải danh sách môn học")
      }

    } catch (error) {
      toast.error("Không thể tải dữ liệu")
    } finally {
      setLoadingData(false)
    }
  }, [])

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file format
    const validation = validateExcelFormat(file)
    if (!validation.isValid) {
      toast.error(`File không hợp lệ: ${validation.errors.join(', ')}`)
      return
    }

    setSelectedFile(file)
    form.setValue('file', file)
  }

  // Handle file processing
  const handleProcessFile = useCallback(async () => {
    if (!selectedFile) return

    try {
      setLoading(true)
      setCurrentStep('validate')
      setUploadProgress(0)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Process Excel file
      const result = await parseExcelFile(selectedFile)

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!result.success) {
        throw new Error('Không thể xử lý file Excel')
      }

      setProcessingResult(result)
      setCurrentStep('preview')

      toast.success(`Xử lý file thành công: ${result.summary.processed} dòng, ${result.summary.valid} hợp lệ, ${result.summary.errors} lỗi`)

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể xử lý file Excel")
      setCurrentStep('upload')
    } finally {
      setLoading(false)
    }
  }, [selectedFile])

  // Handle import grades
  const handleImportGrades = async () => {
    if (!processingResult || !selectedFile) return

    try {
      setLoading(true)
      setCurrentStep('import')

      const formData = form.getValues()

      // Transform valid rows to the format expected by the action
      // Note: student_id should be resolved by matching student_code with database
      const grades = processingResult.validRows.map(row => ({
        student_id: '', // Will be resolved by the action using student_code
        student_code: row.ma_hoc_sinh,
        student_name: row.ho_ten,
        grade_value: row.diem_so,
        notes: row.ghi_chu
      }))

      // Call the bulk import action
      const result = await bulkImportGradesAction({
        period_id: formData.period_id,
        class_id: formData.class_id,
        subject_id: formData.subject_id,
        grade_type: formData.grade_type,
        grades
      })

      if (result.success) {
        const message = 'message' in result ? result.message : `Nhập điểm thành công: ${processingResult.summary.valid} điểm số`
        toast.success(message)
        onSuccess?.()
      } else {
        const error = 'error' in result ? result.error : "Không thể nhập điểm"
        toast.error(error)
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể nhập điểm")
    } finally {
      setLoading(false)
    }
  }

  // Download template
  const handleDownloadTemplate = () => {
    // TODO: Implement template download
    // This would generate and download an Excel template
    toast.info("Chức năng tải template sẽ được triển khai")
  }

  // Reset dialog state
  const handleClose = () => {
    setCurrentStep('upload')
    setSelectedFile(null)
    setProcessingResult(null)
    setUploadProgress(0)
    form.reset()
    onOpenChange(false)
  }

  // Get current step index - memoized to avoid recalculation
  const currentStepIndex = useMemo(() =>
    importSteps.findIndex(step => step.id === currentStep),
    [currentStep]
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nhập điểm từ Excel</DialogTitle>
          <DialogDescription>
            Nhập điểm số cho kỳ báo cáo &ldquo;{period.name}&rdquo; từ file Excel theo định dạng VNedu
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-6">
          {importSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${index <= currentStepIndex 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
                }
              `}>
                {index + 1}
              </div>
              {index < importSteps.length - 1 && (
                <div className={`
                  w-16 h-0.5 mx-2
                  ${index < currentStepIndex ? 'bg-blue-600' : 'bg-gray-200'}
                `} />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form className="space-y-6">
            {/* Step 1: Upload */}
            {currentStep === 'upload' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="class_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lớp học *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn lớp học" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingData ? (
                              <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                            ) : classes.length === 0 ? (
                              <SelectItem value="empty" disabled>Không có lớp học nào</SelectItem>
                            ) : (
                              classes.map((classItem) => (
                                <SelectItem key={classItem.id} value={classItem.id}>
                                  {classItem.name}
                                  {classItem.academic_year?.[0] && classItem.semester?.[0] && (
                                    <span className="text-muted-foreground ml-2">
                                      ({classItem.academic_year[0].name} - {classItem.semester[0].name})
                                    </span>
                                  )}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Môn học *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn môn học" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {loadingData ? (
                              <SelectItem value="loading" disabled>Đang tải...</SelectItem>
                            ) : subjects.length === 0 ? (
                              <SelectItem value="empty" disabled>Không có môn học nào</SelectItem>
                            ) : (
                              subjects.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name_vietnamese}
                                  <span className="text-muted-foreground ml-2">
                                    ({subject.code})
                                  </span>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="grade_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại điểm *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại điểm" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="midterm">Giữa kỳ</SelectItem>
                          <SelectItem value="final">Cuối kỳ</SelectItem>
                          <SelectItem value="quiz">Kiểm tra</SelectItem>
                          <SelectItem value="assignment">Bài tập</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {selectedFile ? selectedFile.name : 'Chọn file Excel'}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          Định dạng: .xlsx, .xls (tối đa 10MB)
                        </span>
                      </label>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                      />
                    </div>
                    <div className="mt-4 flex justify-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Chọn file
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDownloadTemplate}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Tải template
                      </Button>
                    </div>
                  </div>
                </div>

                {selectedFile && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      File đã chọn: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 2: Validate */}
            {currentStep === 'validate' && (
              <div className="space-y-4">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
                  <h3 className="mt-4 text-lg font-medium">Đang xử lý file Excel...</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Vui lòng đợi trong khi hệ thống kiểm tra dữ liệu
                  </p>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            {/* Step 3: Preview */}
            {currentStep === 'preview' && processingResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {processingResult.summary.processed}
                    </div>
                    <div className="text-sm text-gray-600">Tổng dòng</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {processingResult.summary.valid}
                    </div>
                    <div className="text-sm text-gray-600">Hợp lệ</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {processingResult.summary.errors}
                    </div>
                    <div className="text-sm text-gray-600">Lỗi</div>
                  </div>
                </div>

                {processingResult.errorRows.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Có {processingResult.errorRows.length} dòng lỗi. Chỉ các dòng hợp lệ sẽ được nhập.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Error Details */}
                {processingResult.errorRows.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Chi tiết lỗi:</h4>
                    {processingResult.errorRows.slice(0, 5).map((errorRow, index) => (
                      <div key={index} className="text-sm mb-2">
                        <Badge variant="destructive" className="mr-2">
                          Dòng {errorRow.rowNumber}
                        </Badge>
                        {errorRow.errors.join(', ')}
                      </div>
                    ))}
                    {processingResult.errorRows.length > 5 && (
                      <div className="text-sm text-gray-500">
                        ... và {processingResult.errorRows.length - 5} lỗi khác
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Import */}
            {currentStep === 'import' && (
              <div className="space-y-4">
                <div className="text-center">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-green-600" />
                  <h3 className="mt-4 text-lg font-medium">Đang nhập điểm...</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Vui lòng đợi trong khi hệ thống lưu điểm số
                  </p>
                </div>
              </div>
            )}
          </form>
        </Form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {currentStep === 'import' ? 'Đóng' : 'Hủy'}
          </Button>
          
          {currentStep === 'upload' && selectedFile && (
            <Button
              onClick={handleProcessFile}
              disabled={loading || !form.formState.isValid}
            >
              Xử lý file
            </Button>
          )}
          
          {currentStep === 'preview' && processingResult && (
            <Button
              onClick={handleImportGrades}
              disabled={loading || processingResult.summary.valid === 0}
            >
              Nhập {processingResult.summary.valid} điểm
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
