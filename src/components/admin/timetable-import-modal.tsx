'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { EduConnectAnimatedModal } from '../ui/animated-components'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react'

interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
}

interface AcademicTerm {
  id: string
  name: string
  type: 'semester_1' | 'semester_2' | 'summer' | 'full_year'
  start_date: string
  end_date: string
  is_current: boolean
}

interface Class {
  id: string
  name: string
  is_combined: boolean
  grade_level: { name: string }
}

interface ImportResult {
  success: boolean
  class_name: string
  schedules_created: number
  errors: string[]
  warnings: string[]
}

interface ImportSummary {
  total_classes: number
  successful_classes: number
  total_schedules: number
  total_errors: number
  total_warnings: number
}

interface TimetableImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

export function TimetableImportModal({ isOpen, onClose, onImportComplete }: TimetableImportModalProps) {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedYear, setSelectedYear] = useState<string>('')
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [selectedWeek, setSelectedWeek] = useState<string>('1')
  const [classType, setClassType] = useState<'all' | 'base' | 'combined'>('all')
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [replaceExisting, setReplaceExisting] = useState(false)
  
  const [step, setStep] = useState<'configure' | 'download' | 'upload' | 'results'>('configure')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [importResults, setImportResults] = useState<ImportResult[]>([])
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchInitialData()
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedYear) {
      fetchAcademicTerms()
      fetchClasses()
    }
  }, [selectedYear])

  const fetchInitialData = async () => {
    try {
      const [yearsRes, classesRes] = await Promise.all([
        fetch('/api/academic-years'),
        fetch('/api/classes')
      ])

      const [years, classesData] = await Promise.all([
        yearsRes.json(),
        classesRes.json()
      ])

      setAcademicYears(years.data || years)
      setClasses(classesData.data || classesData)

      // Auto-select current year
      const currentYear = years.find((y: AcademicYear) => y.is_current)
      if (currentYear) {
        setSelectedYear(currentYear.id)
      }
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu')
    }
  }

  const fetchAcademicTerms = async () => {
    try {
      const response = await fetch(`/api/academic-terms?academic_year_id=${selectedYear}`)
      const terms = await response.json()
      setAcademicTerms(terms.data || terms)

      // Auto-select current term
      const currentTerm = terms.find((t: AcademicTerm) => t.is_current)
      if (currentTerm) {
        setSelectedTerm(currentTerm.id)
      }
    } catch (error) {
      toast.error('Lỗi khi tải học kỳ')
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch(`/api/classes?academic_year_id=${selectedYear}`)
      const classesData = await response.json()
      setClasses(classesData.data || classesData)
    } catch (error) {
      toast.error('Lỗi khi tải danh sách lớp')
    }
  }

  const getMaxWeeks = () => {
    const term = academicTerms.find(t => t.id === selectedTerm)
    if (!term) return 18
    
    // Default weeks based on semester type
    switch (term.type) {
      case 'semester_1':
        return 18
      case 'semester_2':
        return 17
      case 'summer':
        return 8
      case 'full_year':
        return 35
      default:
        return 18
    }
  }

  const getFilteredClasses = () => {
    let filtered = classes.filter(c => {
      if (classType === 'base') return !c.is_combined
      if (classType === 'combined') return c.is_combined
      return true
    })

    if (selectedClass && selectedClass !== 'all') {
      filtered = filtered.filter(c => c.id === selectedClass)
    }

    return filtered
  }

  const handleDownloadTemplate = async () => {
    if (!selectedYear || !selectedTerm) {
      toast.error('Vui lòng chọn năm học và học kỳ')
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        academic_year_id: selectedYear,
        academic_term_id: selectedTerm,
        week_number: selectedWeek,
        class_type: classType,
        ...(selectedClass && selectedClass !== 'all' && { class_id: selectedClass })
      })

      const response = await fetch(`/api/teaching-schedules/excel-template?${params}`)
      
      if (!response.ok) {
        throw new Error('Không thể tải file mẫu')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      
      // Get filename from response headers
      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || 'timetable_template.xlsx'
      
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      
      toast.success('Đã tải xuống file mẫu thành công')
      setStep('upload')
    } catch (error) {
      toast.error('Lỗi khi tải file mẫu')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        toast.error('Vui lòng chọn file Excel (.xlsx hoặc .xls)')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedTerm) {
      toast.error('Vui lòng chọn file và học kỳ')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('academic_term_id', selectedTerm)
      formData.append('week_number', selectedWeek)
      formData.append('replace_existing', replaceExisting.toString())

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const response = await fetch('/api/teaching-schedules/import-excel', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const result = await response.json()

      if (result.success) {
        toast.success('Import thành công!')
        setImportResults(result.results)
        setImportSummary(result.summary)
        setStep('results')
        onImportComplete()
      } else {
        toast.error(result.message || 'Import thất bại')
        setImportResults(result.results || [])
        setImportSummary(result.summary || null)
        setStep('results')
      }
    } catch (error) {
      toast.error('Lỗi khi upload file')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleClose = () => {
    setStep('configure')
    setSelectedFile(null)
    setImportResults([])
    setImportSummary(null)
    setUploadProgress(0)
    setSelectedClass('all')
    onClose()
  }

  const renderConfigureStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="year">Năm học</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn năm học" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map(year => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name} {year.is_current && <Badge variant="secondary" className="ml-2">Hiện tại</Badge>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="term">Học kỳ</Label>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              {academicTerms.map(term => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name} {term.is_current && <Badge variant="secondary" className="ml-2">Hiện tại</Badge>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="week">Tuần học</Label>
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn tuần" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: getMaxWeeks() }, (_, i) => (
                <SelectItem key={i + 1} value={(i + 1).toString()}>
                  Tuần {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="classType">Loại lớp</Label>
          <Select value={classType} onValueChange={(value: 'all' | 'base' | 'combined') => setClassType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại lớp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả lớp</SelectItem>
              <SelectItem value="base">Lớp tách</SelectItem>
              <SelectItem value="combined">Lớp ghép</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="class">Lớp cụ thể (tùy chọn)</Label>
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger>
            <SelectValue placeholder="Chọn lớp cụ thể hoặc để trống cho tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả lớp</SelectItem>
            {getFilteredClasses().map(cls => (
              <SelectItem key={cls.id} value={cls.id}>
                {cls.name} - {cls.grade_level.name} {cls.is_combined && <Badge variant="outline" className="ml-2">Lớp ghép</Badge>}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="replace" 
          checked={replaceExisting}
          onCheckedChange={(checked) => setReplaceExisting(checked === true)}
        />
        <Label htmlFor="replace">Thay thế thời khóa biểu hiện có</Label>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Info className="h-5 w-5" />
            Thông tin cấu hình
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <div className="space-y-2">
            <div>• <strong>Năm học:</strong> {academicYears.find(y => y.id === selectedYear)?.name || 'Chưa chọn'}</div>
            <div>• <strong>Học kỳ:</strong> {academicTerms.find(t => t.id === selectedTerm)?.name || 'Chưa chọn'}</div>
            <div>• <strong>Tuần:</strong> {selectedWeek} / {getMaxWeeks()}</div>
            <div>• <strong>Loại lớp:</strong> {classType === 'all' ? 'Tất cả' : classType === 'base' ? 'Lớp tách' : 'Lớp ghép'}</div>
            <div>• <strong>Số lớp:</strong> {getFilteredClasses().length} lớp</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderDownloadStep = () => (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <FileSpreadsheet className="h-16 w-16 text-green-500" />
      </div>
      <div>
        <h3 className="text-lg font-semibold">Tải xuống file mẫu</h3>
        <p className="text-gray-600 mt-2">
          File Excel sẽ chứa các sheet cho từng lớp với dropdown để chọn giáo viên
        </p>
      </div>
      <Button 
        onClick={handleDownloadTemplate}
        disabled={loading || !selectedYear || !selectedTerm}
        className="w-full"
      >
        {loading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Đang tạo file...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Tải xuống file mẫu
          </>
        )}
      </Button>
    </div>
  )

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="h-16 w-16 text-blue-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Upload file đã hoàn thành</h3>
        <p className="text-gray-600 mt-2">
          Chọn file Excel đã điền đầy đủ thông tin giáo viên
        </p>
      </div>

      <div>
        <Label htmlFor="file">Chọn file Excel</Label>
        <Input
          id="file"
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileSelect}
          className="mt-1"
        />
      </div>

      {selectedFile && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{selectedFile.name}</div>
                <div className="text-sm text-gray-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </div>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>
      )}

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Đang xử lý...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      <Button 
        onClick={handleUpload}
        disabled={!selectedFile || uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            Đang import...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Import thời khóa biểu
          </>
        )}
      </Button>
    </div>
  )

  const renderResultsStep = () => (
    <div className="space-y-6">
      {importSummary && (
        <Card className={importSummary.total_errors > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${importSummary.total_errors > 0 ? 'text-red-800' : 'text-green-800'}`}>
              {importSummary.total_errors > 0 ? <XCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
              Kết quả import
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Tổng lớp: {importSummary.total_classes}</div>
                <div className="text-green-600">Thành công: {importSummary.successful_classes}</div>
                <div className="text-red-600">Thất bại: {importSummary.total_classes - importSummary.successful_classes}</div>
              </div>
              <div>
                <div className="font-medium">Tổng tiết học: {importSummary.total_schedules}</div>
                <div className="text-red-600">Lỗi: {importSummary.total_errors}</div>
                <div className="text-orange-600">Cảnh báo: {importSummary.total_warnings}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {importResults.map((result, index) => (
          <Card key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                <span>{result.class_name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? 'Thành công' : 'Thất bại'}
                  </Badge>
                  {result.success && (
                    <Badge variant="outline">{result.schedules_created} tiết</Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    Lỗi:
                  </div>
                  {result.errors.map((error, i) => (
                    <div key={i} className="text-sm text-red-600 pl-5">• {error}</div>
                  ))}
                </div>
              )}
              {result.warnings.length > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="text-sm font-medium text-orange-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Cảnh báo:
                  </div>
                  {result.warnings.map((warning, i) => (
                    <div key={i} className="text-sm text-orange-600 pl-5">• {warning}</div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <EduConnectAnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import thời khóa biểu từ Excel"
      size="xl"
    >
      <div className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center justify-between">
          {[
            { key: 'configure', label: 'Cấu hình', icon: Calendar },
            { key: 'download', label: 'Tải mẫu', icon: Download },
            { key: 'upload', label: 'Upload', icon: Upload },
            { key: 'results', label: 'Kết quả', icon: CheckCircle }
          ].map(({ key, label, icon: Icon }, index) => (
            <div key={key} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                step === key ? 'bg-blue-500 border-blue-500 text-white' : 
                ['configure', 'download', 'upload', 'results'].indexOf(step) > index ? 'bg-green-500 border-green-500 text-white' : 
                'border-gray-300 text-gray-400'
              }`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={`ml-2 text-sm ${
                step === key ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                {label}
              </span>
              {index < 3 && <div className="w-8 h-px bg-gray-300 mx-4" />}
            </div>
          ))}
        </div>

        {/* Step content */}
        {step === 'configure' && renderConfigureStep()}
        {step === 'download' && renderDownloadStep()}
        {step === 'upload' && renderUploadStep()}
        {step === 'results' && renderResultsStep()}
      </div>

      {/* Footer buttons */}
      <div className="flex justify-end space-x-2 mt-6">
        <Button variant="outline" onClick={handleClose}>
          {step === 'results' ? 'Đóng' : 'Hủy'}
        </Button>
        {step === 'configure' && (
          <Button 
            onClick={() => setStep('download')}
            disabled={!selectedYear || !selectedTerm}
          >
            Tiếp tục
          </Button>
        )}
        {step === 'download' && (
          <Button 
            onClick={() => setStep('upload')}
            disabled={loading}
          >
            Đã tải xong
          </Button>
        )}
        {step === 'results' && importSummary && importSummary.total_errors === 0 && (
          <Button onClick={handleClose}>
            Hoàn thành
          </Button>
        )}
      </div>
    </EduConnectAnimatedModal>
  )
} 