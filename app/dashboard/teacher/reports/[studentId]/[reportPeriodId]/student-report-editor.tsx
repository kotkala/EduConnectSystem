"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Save,
  MessageSquare,
  AlertCircle,
  Loader2,
  Sparkles,
  Edit,
  ArrowLeft
} from "lucide-react"
import { toast } from "sonner"
import {
  saveStudentReportAction,
  getStudentReportAction,
  regenerateAcademicSummaryAction,
  regenerateDisciplineSummaryAction,
  generateStrengthsSummaryAction,
  generateWeaknessesSummaryAction,
  getStudentForReportAction,
  type StudentForReport
} from "@/lib/actions/student-report-actions"

// Removed ParentResponse interface - not used in this version

interface StudentReportEditorProps {
  studentId: string
  reportPeriodId: string
}

export default function StudentReportEditor({
  studentId,
  reportPeriodId
}: StudentReportEditorProps) {
  const router = useRouter()
  const [student, setStudent] = useState<StudentForReport | null>(null)
  const [strengths, setStrengths] = useState("")
  const [weaknesses, setWeaknesses] = useState("")
  const [academicPerformance, setAcademicPerformance] = useState("")
  const [disciplineStatus, setDisciplineStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [regeneratingAcademic, setRegeneratingAcademic] = useState(false)
  const [regeneratingDiscipline, setRegeneratingDiscipline] = useState(false)
  const [generatingStrengths, setGeneratingStrengths] = useState(false)
  const [generatingWeaknesses, setGeneratingWeaknesses] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)

  // AI Generation Style and Length Settings
  const [strengthsStyle, setStrengthsStyle] = useState("friendly")
  const [strengthsLength, setStrengthsLength] = useState("medium")
  const [weaknessesStyle, setWeaknessesStyle] = useState("friendly")
  const [weaknessesLength, setWeaknessesLength] = useState("medium")
  const [academicStyle, setAcademicStyle] = useState("friendly")
  const [academicLength, setAcademicLength] = useState("medium")
  const [disciplineStyle, setDisciplineStyle] = useState("friendly")
  const [disciplineLength, setDisciplineLength] = useState("medium")
  
  // Verification dialog state
  const [showVerificationDialog, setShowVerificationDialog] = useState(false)

  const [isEditMode, setIsEditMode] = useState(false)
  const isViewMode = student?.report?.status === 'sent' && !isEditMode
  const reportExists = !!student?.report

  // Track changes for unsaved warning - only after initial load
  const [initialDataLoaded, setInitialDataLoaded] = useState(false)

  useEffect(() => {
    if (initialDataLoaded) {
      setHasUnsavedChanges(true)
    }
  }, [strengths, weaknesses, academicPerformance, disciplineStatus, initialDataLoaded])

  const loadStudentData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await getStudentForReportAction(studentId, reportPeriodId)
      
      if (result.success && result.data) {
        setStudent(result.data)
        
        if (result.data.report) {
          const reportResult = await getStudentReportAction(result.data.report.id)

          if (reportResult.success && reportResult.data) {
            const report = reportResult.data
            setStrengths(report.strengths || "")
            setWeaknesses(report.weaknesses || "")
            setAcademicPerformance(report.academic_performance || "")
            setDisciplineStatus(report.discipline_status || "")
            setHasUnsavedChanges(false) // Reset unsaved changes after loading
            setInitialDataLoaded(true) // Mark initial data as loaded
          }
        } else {
          // No existing report, mark as loaded anyway
          setInitialDataLoaded(true)
        }
      } else {
        setError(result.error || 'Không thể tải thông tin học sinh')
      }
    } catch (error) {
      console.error('Error loading student data:', error)
      setError('Không thể tải thông tin học sinh')
    } finally {
      setLoading(false)
    }
  }, [studentId, reportPeriodId])

  const handleBackClick = useCallback(() => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true)
    } else {
      router.push(`/dashboard/teacher/reports?period=${reportPeriodId}`)
    }
  }, [hasUnsavedChanges, router, reportPeriodId])

  const handleConfirmBack = useCallback(() => {
    setShowUnsavedWarning(false)
    router.push(`/dashboard/teacher/reports?period=${reportPeriodId}`)
  }, [router, reportPeriodId])

  const handleSaveClick = useCallback(() => {
    if (!strengths.trim() || !weaknesses.trim()) {
      toast.error('Vui lòng điền đầy đủ ưu điểm và khuyết điểm')
      return
    }
    setShowVerificationDialog(true)
  }, [strengths, weaknesses])

  const handleSave = useCallback(async () => {
    if (!student) return

    try {
      setSaving(true)
      setError(null)

      const result = await saveStudentReportAction({
        report_period_id: reportPeriodId,
        student_id: student.id,
        strengths: strengths.trim(),
        weaknesses: weaknesses.trim(),
        academic_performance: academicPerformance.trim() || undefined,
        discipline_status: disciplineStatus.trim() || undefined
      })

      if (result.success) {
        toast.success('Báo cáo đã được lưu thành công')
        setShowVerificationDialog(false)
        setHasUnsavedChanges(false)
        // Update student report status without full reload
        if (student && result.data) {
          setStudent({
            ...student,
            report: result.data
          })
        }
      } else {
        setError(result.error || 'Không thể lưu báo cáo')
      }
    } catch (error) {
      console.error('Error saving report:', error)
      setError('Không thể lưu báo cáo')
    } finally {
      setSaving(false)
    }
  }, [student, reportPeriodId, strengths, weaknesses, academicPerformance, disciplineStatus])

  // AI Generation Handlers
  const handleGenerateStrengths = useCallback(async () => {
    if (!student) return
    try {
      setGeneratingStrengths(true)
      setError(null)

      const result = await generateStrengthsSummaryAction(student.id, reportPeriodId, strengthsStyle, strengthsLength)
      if (result.success) {
        setStrengths(result.data || '')
        toast.success('Đã tạo ưu điểm bằng AI')
      } else {
        setError(result.error || 'Không thể tạo ưu điểm')
        toast.error(result.error || 'Không thể tạo ưu điểm')
      }
    } catch (error) {
      console.error('Error generating strengths:', error)
      setError('Không thể tạo ưu điểm')
      toast.error('Không thể tạo ưu điểm')
    } finally {
      setGeneratingStrengths(false)
    }
  }, [student, reportPeriodId, strengthsStyle, strengthsLength])

  const handleGenerateWeaknesses = useCallback(async () => {
    if (!student) return
    try {
      setGeneratingWeaknesses(true)
      setError(null)

      const result = await generateWeaknessesSummaryAction(student.id, reportPeriodId, weaknessesStyle, weaknessesLength)
      if (result.success) {
        setWeaknesses(result.data || '')
        toast.success('Đã tạo khuyết điểm bằng AI')
      } else {
        setError(result.error || 'Không thể tạo khuyết điểm')
        toast.error(result.error || 'Không thể tạo khuyết điểm')
      }
    } catch (error) {
      console.error('Error generating weaknesses:', error)
      setError('Không thể tạo khuyết điểm')
      toast.error('Không thể tạo khuyết điểm')
    } finally {
      setGeneratingWeaknesses(false)
    }
  }, [student, reportPeriodId, weaknessesStyle, weaknessesLength])

  const handleRegenerateAcademic = useCallback(async () => {
    if (!student) return
    try {
      setRegeneratingAcademic(true)
      setError(null)

      const result = await regenerateAcademicSummaryAction(student.id, reportPeriodId, academicStyle, academicLength)
      if (result.success) {
        setAcademicPerformance(result.data || '')
        toast.success('Đã tạo lại tóm tắt tình hình học tập')
      } else {
        setError(result.error || 'Không thể tạo lại tóm tắt tình hình học tập')
        toast.error(result.error || 'Không thể tạo lại tóm tắt tình hình học tập')
      }
    } catch (error) {
      console.error('Error regenerating academic summary:', error)
      setError('Không thể tạo lại tóm tắt tình hình học tập')
      toast.error('Không thể tạo lại tóm tắt tình hình học tập')
    } finally {
      setRegeneratingAcademic(false)
    }
  }, [student, reportPeriodId, academicStyle, academicLength])

  const handleRegenerateDiscipline = useCallback(async () => {
    if (!student) return
    try {
      setRegeneratingDiscipline(true)
      setError(null)

      const result = await regenerateDisciplineSummaryAction(student.id, reportPeriodId, disciplineStyle, disciplineLength)
      if (result.success) {
        setDisciplineStatus(result.data || '')
        toast.success('Đã tạo lại tóm tắt tình hình kỷ luật')
      } else {
        setError(result.error || 'Không thể tạo lại tóm tắt tình hình kỷ luật')
        toast.error(result.error || 'Không thể tạo lại tóm tắt tình hình kỷ luật')
      }
    } catch (error) {
      console.error('Error regenerating discipline summary:', error)
      setError('Không thể tạo lại tóm tắt tình hình kỷ luật')
      toast.error('Không thể tạo lại tóm tắt tình hình kỷ luật')
    } finally {
      setRegeneratingDiscipline(false)
    }
  }, [student, reportPeriodId, disciplineStyle, disciplineLength])

  useEffect(() => {
    loadStudentData()
  }, [loadStudentData])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Không tìm thấy học sinh
        </h3>
        <p className="text-gray-600 mb-4">
          Không thể tải thông tin học sinh hoặc kỳ báo cáo.
        </p>
        <Button onClick={() => router.push(`/dashboard/teacher/reports?period=${reportPeriodId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isViewMode ? 'Xem báo cáo học sinh' : (reportExists ? 'Chỉnh sửa báo cáo' : 'Tạo báo cáo mới')}
            </h1>
            <p className="text-muted-foreground">
              Quản lý báo cáo học tập và rèn luyện của học sinh
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin học sinh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Họ tên:</span> {student.full_name}
            </div>
            <div>
              <span className="font-medium">Mã học sinh:</span> {student.student_id}
            </div>
            <div>
              <span className="font-medium">Lớp:</span> {student.class_name}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">Trạng thái:</span>{" "}
                {student.report?.status === 'sent' ? (
                  <Badge className="bg-green-100 text-green-800">Đã gửi</Badge>
                ) : student.report?.status === 'draft' ? (
                  <Badge variant="outline">Bản nháp</Badge>
                ) : (
                  <Badge variant="secondary">Chưa tạo</Badge>
                )}
              </div>

              {/* Edit button for sent reports */}
              {student.report?.status === 'sent' && !isEditMode && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Chỉnh sửa
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      {!isViewMode && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-800 text-lg">📋 Hướng dẫn sử dụng</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <h5 className="font-medium mb-2">🎨 Dropdown Phong cách:</h5>
                <p>Chọn giọng văn phù hợp để thể hiện thái độ giao tiếp với phụ huynh (gần gũi, nghiêm túc, khích lệ, thấu hiểu).</p>
              </div>
              <div>
                <h5 className="font-medium mb-2">📏 Dropdown Độ dài văn bản:</h5>
                <p>Chọn độ dài mong muốn cho mỗi phần báo cáo (ngắn gọn 1-2 câu, trung bình 3-5 câu, dài 6+ câu).</p>
              </div>
              <div className="md:col-span-2">
                <h5 className="font-medium mb-2">🤖 Lưu ý về AI:</h5>
                <p className="text-blue-600">
                  <strong>Thông tin chỉ mang tính chất tham khảo.</strong> Giáo viên cần kiểm tra và chỉnh sửa nội dung cho phù hợp với tình hình thực tế của học sinh.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Nội dung báo cáo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h4 className="font-medium mb-2">Nội dung báo cáo</h4>
            <p className="text-sm text-gray-700">
              Kính gửi phụ huynh <strong>{student.full_name}</strong> về tình hình học tập,
              thực hiện nội quy nhà trường của <strong>{student.full_name}</strong> như sau:
            </p>
          </div>

          <div className="space-y-6">
            {/* Strengths Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="strengths">Ưu điểm *</Label>
                {!isViewMode && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={strengthsStyle} onValueChange={setStrengthsStyle}>
                      <SelectTrigger className="w-[250px] h-8">
                        <SelectValue placeholder="Phong cách" />
                      </SelectTrigger>
                      <SelectContent className="w-[250px] z-50" side="bottom" align="start">
                        <SelectItem value="friendly">Phong cách gần gũi, thân thiện</SelectItem>
                        <SelectItem value="serious">Phong cách nghiêm túc, kỷ luật</SelectItem>
                        <SelectItem value="encouraging">Phong cách khích lệ, động viên</SelectItem>
                        <SelectItem value="understanding">Phong cách lắng nghe, thấu hiểu</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={strengthsLength} onValueChange={setStrengthsLength}>
                      <SelectTrigger className="w-[230px] h-8">
                        <SelectValue placeholder="Độ dài" />
                      </SelectTrigger>
                      <SelectContent className="w-[230px] z-50" side="bottom" align="start">
                        <SelectItem value="short">Văn bản ngắn gọn (1-2 câu)</SelectItem>
                        <SelectItem value="medium">Văn bản trung bình (3-5 câu)</SelectItem>
                        <SelectItem value="long">Văn bản dài (6 câu trở lên)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateStrengths}
                      disabled={generatingStrengths}
                      className="h-8 px-3"
                    >
                      {generatingStrengths ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      Tạo bằng AI
                    </Button>
                  </div>
                )}
              </div>
              <Textarea
                id="strengths"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="Nhập ưu điểm của học sinh..."
                className="mt-1 min-h-[80px]"
                rows={strengths ? Math.max(3, Math.ceil(strengths.length / 80)) : 3}
                disabled={isViewMode}
              />
              <p className="text-xs text-gray-500 mt-1">
                <Sparkles className="h-3 w-3 inline mr-1" />
                Có thể sử dụng AI để tạo nội dung dựa trên phản hồi tích cực
              </p>
            </div>

            {/* Weaknesses Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="weaknesses">Khuyết điểm *</Label>
                {!isViewMode && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={weaknessesStyle} onValueChange={setWeaknessesStyle}>
                      <SelectTrigger className="w-[250px] h-8">
                        <SelectValue placeholder="Phong cách" />
                      </SelectTrigger>
                      <SelectContent className="w-[250px] z-50" side="bottom" align="start">
                        <SelectItem value="friendly">Phong cách gần gũi, thân thiện</SelectItem>
                        <SelectItem value="serious">Phong cách nghiêm túc, kỷ luật</SelectItem>
                        <SelectItem value="encouraging">Phong cách khích lệ, động viên</SelectItem>
                        <SelectItem value="understanding">Phong cách lắng nghe, thấu hiểu</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={weaknessesLength} onValueChange={setWeaknessesLength}>
                      <SelectTrigger className="w-[230px] h-8">
                        <SelectValue placeholder="Độ dài" />
                      </SelectTrigger>
                      <SelectContent className="w-[230px] z-50" side="bottom" align="start">
                        <SelectItem value="short">Văn bản ngắn gọn (1-2 câu)</SelectItem>
                        <SelectItem value="medium">Văn bản trung bình (3-5 câu)</SelectItem>
                        <SelectItem value="long">Văn bản dài (6 câu trở lên)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateWeaknesses}
                      disabled={generatingWeaknesses}
                      className="h-8 px-3"
                    >
                      {generatingWeaknesses ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      Tạo bằng AI
                    </Button>
                  </div>
                )}
              </div>
              <Textarea
                id="weaknesses"
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                placeholder="Nhập khuyết điểm của học sinh..."
                className="mt-1 min-h-[80px]"
                rows={weaknesses ? Math.max(3, Math.ceil(weaknesses.length / 80)) : 3}
                disabled={isViewMode}
              />
              <p className="text-xs text-gray-500 mt-1">
                <Sparkles className="h-3 w-3 inline mr-1" />
                Có thể sử dụng AI để tạo nội dung dựa trên phản hồi và vi phạm
              </p>
            </div>

            {/* Academic Performance Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="academic">Tình hình học tập</Label>
                {!isViewMode && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={academicStyle} onValueChange={setAcademicStyle}>
                      <SelectTrigger className="w-[250px] h-8">
                        <SelectValue placeholder="Phong cách" />
                      </SelectTrigger>
                      <SelectContent className="w-[250px] z-50" side="bottom" align="start">
                        <SelectItem value="friendly">Phong cách gần gũi, thân thiện</SelectItem>
                        <SelectItem value="serious">Phong cách nghiêm túc, kỷ luật</SelectItem>
                        <SelectItem value="encouraging">Phong cách khích lệ, động viên</SelectItem>
                        <SelectItem value="understanding">Phong cách lắng nghe, thấu hiểu</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={academicLength} onValueChange={setAcademicLength}>
                      <SelectTrigger className="w-[230px] h-8">
                        <SelectValue placeholder="Độ dài" />
                      </SelectTrigger>
                      <SelectContent className="w-[230px] z-50" side="bottom" align="start">
                        <SelectItem value="short">Văn bản ngắn gọn (1-2 câu)</SelectItem>
                        <SelectItem value="medium">Văn bản trung bình (3-5 câu)</SelectItem>
                        <SelectItem value="long">Văn bản dài (6 câu trở lên)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateAcademic}
                      disabled={regeneratingAcademic}
                      className="h-8 px-3"
                    >
                      {regeneratingAcademic ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      Tạo bằng AI
                    </Button>
                  </div>
                )}
              </div>
              <Textarea
                id="academic"
                value={academicPerformance}
                onChange={(e) => setAcademicPerformance(e.target.value)}
                placeholder="Tóm tắt AI về phản hồi học tập trong 4 tuần..."
                className="mt-1 min-h-[100px]"
                rows={academicPerformance ? Math.max(4, Math.ceil(academicPerformance.length / 80)) : 4}
                disabled={isViewMode}
              />
              <p className="text-xs text-gray-500 mt-1">
                <Sparkles className="h-3 w-3 inline mr-1" />
                Nội dung này được tạo tự động từ phản hồi của giáo viên trong kỳ báo cáo
              </p>
            </div>

            {/* Discipline Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="discipline">Tình hình tuân thủ nội quy</Label>
                {!isViewMode && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={disciplineStyle} onValueChange={setDisciplineStyle}>
                      <SelectTrigger className="w-[250px] h-8">
                        <SelectValue placeholder="Phong cách" />
                      </SelectTrigger>
                      <SelectContent className="w-[250px] z-50" side="bottom" align="start">
                        <SelectItem value="friendly">Phong cách gần gũi, thân thiện</SelectItem>
                        <SelectItem value="serious">Phong cách nghiêm túc, kỷ luật</SelectItem>
                        <SelectItem value="encouraging">Phong cách khích lệ, động viên</SelectItem>
                        <SelectItem value="understanding">Phong cách lắng nghe, thấu hiểu</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={disciplineLength} onValueChange={setDisciplineLength}>
                      <SelectTrigger className="w-[230px] h-8">
                        <SelectValue placeholder="Độ dài" />
                      </SelectTrigger>
                      <SelectContent className="w-[230px] z-50" side="bottom" align="start">
                        <SelectItem value="short">Văn bản ngắn gọn (1-2 câu)</SelectItem>
                        <SelectItem value="medium">Văn bản trung bình (3-5 câu)</SelectItem>
                        <SelectItem value="long">Văn bản dài (6 câu trở lên)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateDiscipline}
                      disabled={regeneratingDiscipline}
                      className="h-8 px-3"
                    >
                      {regeneratingDiscipline ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3 mr-1" />
                      )}
                      Tạo bằng AI
                    </Button>
                  </div>
                )}
              </div>
              <Textarea
                id="discipline"
                value={disciplineStatus}
                onChange={(e) => setDisciplineStatus(e.target.value)}
                placeholder="Danh sách vi phạm trong kỳ báo cáo..."
                className="mt-1 min-h-[100px]"
                rows={disciplineStatus ? Math.max(4, Math.ceil(disciplineStatus.length / 80)) : 4}
                disabled={isViewMode}
              />
              <p className="text-xs text-gray-500 mt-1">
                <Sparkles className="h-3 w-3 inline mr-1" />
                Nội dung này được tạo tự động từ danh sách vi phạm trong kỳ báo cáo
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {!isViewMode && (
                <>
                  <Button
                    onClick={handleSaveClick}
                    disabled={saving || !strengths.trim() || !weaknesses.trim()}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Lưu
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Có thay đổi chưa được lưu</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ở lại</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBack}>
              Rời khỏi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Verification Dialog */}
      <AlertDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận lưu báo cáo</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lòng xem lại nội dung báo cáo trước khi lưu. 
              <br /><br />
              <strong>Lưu ý:</strong> Nội dung được tạo bởi AI chỉ mang tính chất tham khảo. 
              Giáo viên cần kiểm tra và chỉnh sửa cho phù hợp với tình hình thực tế của học sinh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Xác nhận lưu
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
