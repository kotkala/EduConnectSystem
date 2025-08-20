"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Progress } from "@/shared/components/ui/progress"
import { Badge } from "@/shared/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  TrendingUp,
  Eye,
  AlertCircle
} from "lucide-react"
import { type GradePeriodType } from "@/lib/utils/teacher-excel-utils"
import {
  validateExcelImport,
  type ExcelImportValidationResult,
  type ValidatedGradeData
} from "@/lib/utils/teacher-excel-import-validation"
import {
  importValidatedGradesAction,
  getClassStudentsAction,
  // type GradeImportResult // Unused type
} from "@/lib/actions/teacher-grade-import-actions"
import {
  detectGradeOverridesAction,
  // processGradeOverridesAction, // Unused import
  type GradeOverrideData
} from "@/lib/actions/grade-override-actions"
import { GradeOverrideReasonDialog } from "./grade-override-reason-dialog"

interface TeacherGradeImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  periodId: string
  classId?: string
  subjectId?: string
  subjectName?: string
  periodType?: GradePeriodType
  onSuccess: () => void
}

export function TeacherGradeImportDialog({
  open,
  onOpenChange,
  periodId,
  classId,
  subjectId,
  subjectName,
  periodType,
  onSuccess
}: TeacherGradeImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validationResult, setValidationResult] = useState<ExcelImportValidationResult | null>(null)
  // const [importResult, setImportResult] = useState<GradeImportResult | null>(null) // Unused state
  const [activeTab, setActiveTab] = useState("upload")

  // Override detection state
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false)
  const [detectedOverrides, setDetectedOverrides] = useState<GradeOverrideData[]>([])
  const [pendingImportData, setPendingImportData] = useState<ExcelImportValidationResult | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setSuccess(false)
      setValidationResult(null)

      // Auto-validate file when selected
      await handleValidateFile(selectedFile)
    }
  }

  const handleValidateFile = async (fileToValidate?: File) => {
    const targetFile = fileToValidate || file
    if (!targetFile || !subjectName || !classId) {
      setError('Thiáº¿u thông tin cáº§n thiáº¿t Ä‘á»ƒ xác thực file')
      return
    }

    setValidating(true)
    setError(null)

    try {
      // Get expected students from API
      const studentsResponse = await getClassStudentsAction(classId)
      const expectedStudents = studentsResponse.success ? studentsResponse.data : undefined

      const result = await validateExcelImport(
        targetFile,
        subjectName,
        periodType || 'regular_1',
        expectedStudents
      )

      setValidationResult(result)

      if (result.success) {
        setActiveTab("preview")
      } else {
        setActiveTab("errors")
      }
    } catch (error) {
      console.error('Error validating file:', error)
      setError('Có lỗi xảy ra khi xác thực file Excel')
    } finally {
      setValidating(false)
    }
  }

  const handleImport = async () => {
    if (!file || !periodId || !classId || !subjectId || !validationResult?.success || !validationResult.data) {
      setError('Thiáº¿u thông tin cáº§n thiáº¿t hoặc file chưa Ä‘Æ°á»£c xác thực')
      return
    }

    setLoading(true)
    setProgress(0)
    setError(null)

    try {
      // Check for grade overrides (midterm/final grades)
      setProgress(10)

      // Get student UUIDs from student numbers for override detection
      const studentsResponse = await getClassStudentsAction(classId)
      if (!studentsResponse.success || !studentsResponse.data) {
        throw new Error('Không thể láº¥y danh sách hồc sinh')
      }

      // Create mapping from student number to student UUID
      const studentIdMap = new Map()
      studentsResponse.data.forEach(student => {
        studentIdMap.set(student.studentId, student.id)
      })

      // Convert ValidatedGradeData to StudentGradeData format for override detection
      const studentGradeData = validationResult.data
        .map(student => {
          const studentUuid = studentIdMap.get(student.studentId)
          if (!studentUuid) return null

          return {
            student_id: studentUuid,
            studentName: student.studentName,
            midtermGrade: student.midtermGrade,
            finalGrade: student.finalGrade
          }
        })
        .filter(student => student !== null)

      const overrideResult = await detectGradeOverridesAction(
        periodId,
        classId,
        subjectId,
        studentGradeData
      )

      if (overrideResult.success && overrideResult.overrides && overrideResult.overrides.length > 0) {
        // There are overrides that need reasons
        setDetectedOverrides(overrideResult.overrides)
        setPendingImportData(validationResult)
        setOverrideDialogOpen(true)
        setLoading(false)
        return
      }

      // No overrides, proceed with normal import
      await proceedWithImport(validationResult.data)
    } catch (error) {
      console.error('Error importing file:', error)
      setError('Có lỗi xảy ra khi nháº­p file Excel')
      setLoading(false)
    }
  }

  const proceedWithImport = async (data: ValidatedGradeData[], overrideReasons?: Record<string, string>) => {
    if (!classId || !subjectId) {
      setError('Thiáº¿u thông tin lớp hồc hoặc mÃ´n hồc')
      return
    }

    try {
      // Simulate progress for UI feedback
      setProgress(20)
      await new Promise(resolve => setTimeout(resolve, 200))

      // Import validated grades to database
      const result = await importValidatedGradesAction(
        periodId,
        classId,
        subjectId,
        data,
        overrideReasons
      )

      setProgress(80)
      await new Promise(resolve => setTimeout(resolve, 200))

      // setImportResult(result) // Commented out since state is unused
      setProgress(100)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onSuccess()
        }, 1000)
      } else {
        setError(result.message)
        if (result.errors.length > 0) {
          console.error('Import errors:', result.errors)
        }
      }
    } catch (error) {
      console.error('Error importing file:', error)
      setError('Có lỗi xảy ra khi nháº­p file Excel')
    } finally {
      setLoading(false)
    }
  }

  const handleOverrideConfirm = async (reasons: Record<string, string>) => {
    setOverrideDialogOpen(false)
    if (pendingImportData?.data) {
      setLoading(true)
      await proceedWithImport(pendingImportData.data, reasons)
    }
  }

  const handleOverrideCancel = () => {
    setOverrideDialogOpen(false)
    setPendingImportData(null)
    setDetectedOverrides([])
    setError('Nhập Ä‘iá»ƒm bị hồ§y do có Ä‘iá»ƒm ghi Ä‘Ã¨ cáº§n lý do')
  }

  const handleClose = () => {
    if (!loading && !validating) {
      setFile(null)
      setError(null)
      setSuccess(false)
      setProgress(0)
      setValidationResult(null)
      setActiveTab("upload")
      onOpenChange(false)
    }
  }

  const getStatisticsBadge = (label: string, value: number, variant: "default" | "destructive" | "secondary" = "default") => (
    <div className="flex justify-between items-center">
      <span className="text-sm">{label}</span>
      <Badge variant={variant}>{value}</Badge>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Nhập Ä‘iá»ƒm từ Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!success ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upload">Táº£i file</TabsTrigger>
                <TabsTrigger value="preview" disabled={!validationResult?.success}>Xem trước</TabsTrigger>
                <TabsTrigger value="errors" disabled={!validationResult || validationResult.success}>Lỗi</TabsTrigger>
                <TabsTrigger value="statistics" disabled={!validationResult}>Thồ‘ng kÃª</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="excel-file">Chồn file Excel *</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="excel-file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      disabled={loading || validating}
                    />
                    <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                  </div>
                  {file && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        ÄÃ£ chồn: {file.name} ({Math.round(file.size / 1024)} KB)
                      </p>
                      {validating && (
                        <div className="flex items-center gap-2 text-sm text-blue-600">
                          <AlertCircle className="h-4 w-4 animate-pulse" />
                          Äang xác thực file...
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {validationResult && (
                  <Alert variant={validationResult.success ? "default" : "destructive"}>
                    {validationResult.success ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {validationResult.success ? (
                        <>
                          <strong>Xác thực thÃ nh công!</strong> Tìm thấy {validationResult.statistics.validRows} dÃ²ng hợp lá»‡
                          về›i {validationResult.statistics.validGrades} Ä‘iá»ƒm sá»‘.
                        </>
                      ) : (
                        <>
                          <strong>Xác thực tháº¥t báº¡i!</strong> Tìm thấy {validationResult.errors.filter(e => e.severity === 'error').length} lỗi
                          cáº§n kháº¯c phục.
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <FileSpreadsheet className="h-4 w-4" />
                  <AlertDescription>
                    <strong>LÆ°u Ã½:</strong> File Excel pháº£i Ä‘Ãºng Ä‘á»‹nh dáº¡ng template Ä‘Ã£ tải về.
                    Hồ‡ thồ‘ng sẽ kiá»ƒm tra vÃ  xác thực dữ liệu trước khi nháº­p.
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4">
                {validationResult?.success && validationResult.data && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Xem trước dữ liệu ({validationResult.data.length} hồc sinh)</h3>
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {validationResult.statistics.validGrades} Ä‘iá»ƒm hợp lá»‡
                      </Badge>
                    </div>

                    <div className="border rounded-lg max-h-96 overflow-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-muted/50 sticky top-0">
                          <tr>
                            <th className="text-left p-2">STT</th>
                            <th className="text-left p-2">MÃ£ HS</th>
                            <th className="text-left p-2">Hồ tên</th>
                            <th className="text-left p-2">Äiá»ƒm TX</th>
                            <th className="text-left p-2">Giá»¯a kì</th>
                            <th className="text-left p-2">Cuá»‘i kì</th>
                            <th className="text-left p-2">Ghi chÃº</th>
                          </tr>
                        </thead>
                        <tbody>
                          {validationResult.data.slice(0, 10).map((student, index) => (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-2">{student.rowNumber}</td>
                              <td className="p-2 font-mono">{student.studentId}</td>
                              <td className="p-2">{student.studentName}</td>
                              <td className="p-2">
                                {student.regularGrades.map((grade, i) => (
                                  <span key={i} className="mr-1">
                                    {grade !== null ? grade : '-'}
                                    {i < student.regularGrades.length - 1 ? ',' : ''}
                                  </span>
                                ))}
                              </td>
                              <td className="p-2">{student.midtermGrade ?? '-'}</td>
                              <td className="p-2">{student.finalGrade ?? '-'}</td>
                              <td className="p-2 max-w-32 truncate">{student.notes || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {validationResult.data.length > 10 && (
                        <div className="p-2 text-center text-sm text-muted-foreground border-t">
                          VÃ  {validationResult.data.length - 10} hồc sinh khÃ¡c...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="errors" className="space-y-4">
                {validationResult && validationResult.errors.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-red-600">
                      Danh sách lỗi ({validationResult.errors.filter(e => e.severity === 'error').length})
                    </h3>

                    <ScrollArea className="h-96 border rounded-lg p-4">
                      <div className="space-y-3">
                        {validationResult.errors.map((error, index) => (
                          <Alert key={index} variant={error.severity === 'error' ? 'destructive' : 'default'}>
                            {error.severity === 'error' ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              <AlertTriangle className="h-4 w-4" />
                            )}
                            <AlertDescription>
                              <div className="space-y-1">
                                <div className="font-medium">
                                  DÃ²ng {error.rowNumber}: {error.message}
                                </div>
                                {error.studentId && (
                                  <div className="text-sm text-muted-foreground">
                                    Hồc sinh: {error.studentId} - {error.studentName}
                                  </div>
                                )}
                                <div className="text-sm text-muted-foreground">
                                  TrÆ°á»ng: {error.field} | GiÃ¡ trị: &quot;{String(error.value)}&quot;
                                </div>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {validationResult && validationResult.warnings.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-yellow-600">Cáº£nh báo</h4>
                    {validationResult.warnings.map((warning, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{warning}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="statistics" className="space-y-4">
                {validationResult && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Thồ‘ng kÃª hồc sinh
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {getStatisticsBadge("Tổng sá»‘ dÃ²ng", validationResult.statistics.totalRows)}
                        {getStatisticsBadge("DÃ²ng hợp lá»‡", validationResult.statistics.validRows, "default")}
                        {getStatisticsBadge("DÃ²ng lỗi", validationResult.statistics.invalidRows, "destructive")}
                        {getStatisticsBadge("DÃ²ng trá»‘ng", validationResult.statistics.emptyRows, "secondary")}
                        {getStatisticsBadge("Hồc sinh trÃ¹ng", validationResult.statistics.duplicateStudents, "destructive")}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Thồ‘ng kÃª Ä‘iá»ƒm sá»‘
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {getStatisticsBadge("Tổng Ä‘iá»ƒm", validationResult.statistics.validGrades + validationResult.statistics.invalidGrades)}
                        {getStatisticsBadge("Äiá»ƒm hợp lá»‡", validationResult.statistics.validGrades, "default")}
                        {getStatisticsBadge("Äiá»ƒm lỗi", validationResult.statistics.invalidGrades, "destructive")}
                        {getStatisticsBadge("Äiá»ƒm thiáº¿u", validationResult.statistics.missingGrades, "secondary")}
                        <div className="pt-2 border-t">
                          <div className="text-sm text-muted-foreground">
                            Tá»· lá»‡ hoÃ n thÃ nh: {Math.round((validationResult.statistics.validGrades / (validationResult.statistics.validGrades + validationResult.statistics.missingGrades)) * 100)}%
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-medium mb-2">Nhập Ä‘iá»ƒm thÃ nh công!</h3>
              <p className="text-muted-foreground">
                Dá»¯ liệu Ä‘iá»ƒm Ä‘Ã£ Ä‘Æ°á»£c nháº­p vÃ o hồ‡ thồ‘ng.
              </p>
            </div>
          )}

          {/* Progress Bar */}
          {loading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Äang nháº­p Ä‘iá»ƒm...</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose} disabled={loading || validating}>
              {success ? 'ÄÃ³ng' : 'Hủy'}
            </Button>
            {!success && (
              <>
                {file && !validationResult && (
                  <Button onClick={() => handleValidateFile()} disabled={validating || loading}>
                    <Eye className="mr-2 h-4 w-4" />
                    {validating ? 'Äang xác thực...' : 'Xác thực file'}
                  </Button>
                )}
                <Button
                  onClick={handleImport}
                  disabled={!file || loading || !validationResult?.success}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {loading ? 'Äang nháº­p...' : 'Nhập Ä‘iá»ƒm'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Grade Override Reason Dialog */}
      <GradeOverrideReasonDialog
        open={overrideDialogOpen}
        onOpenChange={setOverrideDialogOpen}
        overrides={detectedOverrides.map(override => ({
          studentName: override.studentName,
          componentType: override.componentType,
          oldValue: override.oldValue,
          newValue: override.newValue,
          studentId: override.studentId
        }))}
        onConfirm={handleOverrideConfirm}
        onCancel={handleOverrideCancel}
      />
    </Dialog>
  )
}
