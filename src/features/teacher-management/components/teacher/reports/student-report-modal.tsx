"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Badge } from "@/shared/components/ui/badge"
import {
  Save,
  Send,
  Eye,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Edit
} from "lucide-react"
import { toast } from "sonner"
import {
  saveStudentReportAction,
  sendStudentReportAction,
  getStudentReportAction,
  getParentResponsesAction,
  regenerateAcademicSummaryAction,
  regenerateDisciplineSummaryAction,
  generateStrengthsSummaryAction,
  generateWeaknessesSummaryAction,
  type StudentForReport
} from "@/features/reports"

interface ParentResponse {
  id: string
  agreement_status?: 'agree' | 'disagree'
  comments?: string
  responded_at?: string
  parent?: {
    full_name: string
  }
}

interface StudentReportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: StudentForReport
  reportPeriodId: string
}

export function StudentReportModal({
  open,
  onOpenChange,
  student,
  reportPeriodId
}: StudentReportModalProps) {
  const [strengths, setStrengths] = useState("")
  const [weaknesses, setWeaknesses] = useState("")
  const [academicPerformance, setAcademicPerformance] = useState("")
  const [disciplineStatus, setDisciplineStatus] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [regeneratingAcademic, setRegeneratingAcademic] = useState(false)
  const [regeneratingDiscipline, setRegeneratingDiscipline] = useState(false)
  const [generatingStrengths, setGeneratingStrengths] = useState(false)
  const [generatingWeaknesses, setGeneratingWeaknesses] = useState(false)
  const [parentResponses, setParentResponses] = useState<ParentResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [resendReason, setResendReason] = useState("")
  const [showResendDialog, setShowResendDialog] = useState(false)

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
  const isViewMode = student.report?.status === 'sent' && !isEditMode
  const reportExists = !!student.report

  const loadReportData = useCallback(async () => {
    if (!student.report) return

    try {
      setLoading(true)
      setError(null)

      const [reportResult, responsesResult] = await Promise.all([
        getStudentReportAction(student.report.id),
        isViewMode ? getParentResponsesAction(student.report.id) : Promise.resolve({ success: true, data: [] })
      ])

      if (reportResult.success && reportResult.data) {
        const report = reportResult.data
        setStrengths(report.strengths || "")
        setWeaknesses(report.weaknesses || "")
        setAcademicPerformance(report.academic_performance || "")
        setDisciplineStatus(report.discipline_status || "")
      }

      if (responsesResult.success) {
        setParentResponses(responsesResult.data || [])
      }
    } catch (error) {
      console.error('Error loading report data:', error)
      setError('Không thể tải dữ liệu báo cáo')
    } finally {
      setLoading(false)
    }
  }, [student.report, isViewMode])

  const handleSaveClick = useCallback(() => {
    if (!strengths.trim() || !weaknesses.trim()) {
      toast.error('Vui lòng điền đầy đủ ưu điểm và khuyết điểm')
      return
    }
    setShowVerificationDialog(true)
  }, [strengths, weaknesses])

  const handleSave = useCallback(async () => {
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
        // Don't call onSuccess() here to prevent page reload
        // Let user manually close the modal with "Đóng" button
      } else {
        setError(result.error || 'Không thể lưu báo cáo')
      }
    } catch (error) {
      console.error('Error saving report:', error)
      setError('Không thể lưu báo cáo')
    } finally {
      setSaving(false)
    }
  }, [strengths, weaknesses, academicPerformance, disciplineStatus, reportPeriodId, student.id])

  const handleRegenerateAcademic = useCallback(async () => {
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
  }, [student.id, reportPeriodId, academicStyle, academicLength])

  const handleRegenerateDiscipline = useCallback(async () => {
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
  }, [student.id, reportPeriodId, disciplineStyle, disciplineLength])

  const handleGenerateStrengths = useCallback(async () => {
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
  }, [student.id, reportPeriodId, strengthsStyle, strengthsLength])

  const handleGenerateWeaknesses = useCallback(async () => {
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
  }, [student.id, reportPeriodId, weaknessesStyle, weaknessesLength])

  const handleSend = useCallback(async () => {
    if (!student.report?.id) {
      toast.error('Vui lòng lưu báo cáo trước khi gửi')
      return
    }

    try {
      setSending(true)
      setError(null)

      const result = await sendStudentReportAction(student.report.id)

      if (result.success) {
        toast.success('Báo cáo đã được gửi đến phụ huynh')
        // Don't call onSuccess() to prevent page reload
        // Just close the modal and show success message
        onOpenChange(false)
      } else {
        setError(result.error || 'Không thể gửi báo cáo')
      }
    } catch (error) {
      console.error('Error sending report:', error)
      setError('Không thể gửi báo cáo')
    } finally {
      setSending(false)
    }
  }, [student.report?.id, onOpenChange])

  const handleResend = useCallback(async () => {
    if (!student.report?.id || !resendReason.trim()) {
      toast.error('Vui lòng nhập lý do gửi lại')
      return
    }

    try {
      setSending(true)
      setError(null)

      // Import the resend action
      const { resendStudentReportAction } = await import('@/features/reports')

      const result = await resendStudentReportAction(student.report.id, resendReason.trim())

      if (result.success) {
        toast.success('Báo cáo đã được gửi lại đến phụ huynh')
        setShowResendDialog(false)
        setResendReason("")
        setIsEditMode(false)
        onOpenChange(false)
      } else {
        setError(result.error || 'Không thể gửi lại báo cáo')
      }
    } catch (error) {
      console.error('Error resending report:', error)
      setError('Không thể gửi lại báo cáo')
    } finally {
      setSending(false)
    }
  }, [student.report?.id, resendReason, onOpenChange])

  useEffect(() => {
    if (open) {
      if (reportExists) {
        loadReportData()
      } else {
        // Reset form for new report
        setStrengths("")
        setWeaknesses("")
        setAcademicPerformance("")
        setDisciplineStatus("")
        setParentResponses([])
        setError(null)
      }
    }
  }, [open, reportExists, loadReportData])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isViewMode ? (
              <>
                <Eye className="h-5 w-5" />
                Xem báo cáo học sinh
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5" />
                {reportExists ? 'Chỉnh sửa báo cáo' : 'Tạo báo cáo mới'}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Student Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Thông tin học sinh</h3>
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
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Report Content */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Nội dung báo cáo</h4>
                <p className="text-sm text-gray-700">
                  Kính gửi phụ huynh <strong>{student.full_name}</strong> về tình hình học tập, 
                  thực hiện nội quy nhà trường của <strong>{student.full_name}</strong> như sau:
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="strengths">Ưu điểm *</Label>
                    {!isViewMode && (
                      <div className="flex items-center gap-2">
                        <Select value={strengthsStyle} onValueChange={setStrengthsStyle}>
                          <SelectTrigger className="w-[180px] h-8">
                            <SelectValue placeholder="Phong cách" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="friendly">Phong cách gần gũi, thân thiện</SelectItem>
                            <SelectItem value="serious">Phong cách nghiêm túc, kỷ luật</SelectItem>
                            <SelectItem value="encouraging">Phong cách khích lệ, động viên</SelectItem>
                            <SelectItem value="understanding">Phong cách lắng nghe, thấu hiểu</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={strengthsLength} onValueChange={setStrengthsLength}>
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue placeholder="Độ dài" />
                          </SelectTrigger>
                          <SelectContent>
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
                          Tạo AI
                        </Button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    id="strengths"
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Nhập ưu điểm của học sinh..."
                    className="mt-1"
                    rows={3}
                    disabled={isViewMode}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Có thể sử dụng AI để tạo nội dung dựa trên phản hồi tích cực
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weaknesses">Khuyết điểm *</Label>
                    {!isViewMode && (
                      <div className="flex items-center gap-2">
                        <Select value={weaknessesStyle} onValueChange={setWeaknessesStyle}>
                          <SelectTrigger className="w-[180px] h-8">
                            <SelectValue placeholder="Phong cách" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="friendly">Phong cách gần gũi, thân thiện</SelectItem>
                            <SelectItem value="serious">Phong cách nghiêm túc, kỷ luật</SelectItem>
                            <SelectItem value="encouraging">Phong cách khích lệ, động viên</SelectItem>
                            <SelectItem value="understanding">Phong cách lắng nghe, thấu hiểu</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={weaknessesLength} onValueChange={setWeaknessesLength}>
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue placeholder="Độ dài" />
                          </SelectTrigger>
                          <SelectContent>
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
                          Tạo AI
                        </Button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    id="weaknesses"
                    value={weaknesses}
                    onChange={(e) => setWeaknesses(e.target.value)}
                    placeholder="Nhập khuyết điểm của học sinh..."
                    className="mt-1"
                    rows={3}
                    disabled={isViewMode}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Có thể sử dụng AI để tạo nội dung dựa trên phản hồi và vi phạm
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="academic">Tình hình học tập</Label>
                    {!isViewMode && (
                      <div className="flex items-center gap-2">
                        <Select value={academicStyle} onValueChange={setAcademicStyle}>
                          <SelectTrigger className="w-[180px] h-8">
                            <SelectValue placeholder="Phong cách" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="friendly">Phong cách gần gũi, thân thiện</SelectItem>
                            <SelectItem value="serious">Phong cách nghiêm túc, kỷ luật</SelectItem>
                            <SelectItem value="encouraging">Phong cách khích lệ, động viên</SelectItem>
                            <SelectItem value="understanding">Phong cách lắng nghe, thấu hiểu</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={academicLength} onValueChange={setAcademicLength}>
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue placeholder="Độ dài" />
                          </SelectTrigger>
                          <SelectContent>
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
                            <RefreshCw className="h-3 w-3 mr-1" />
                          )}
                          Tạo lại AI
                        </Button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    id="academic"
                    value={academicPerformance}
                    onChange={(e) => setAcademicPerformance(e.target.value)}
                    placeholder="Tóm tắt AI về phản hồi học tập trong 4 tuần..."
                    className="mt-1"
                    rows={4}
                    disabled={isViewMode}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Nội dung này được tạo tự động từ phản hồi của giáo viên trong kỳ báo cáo
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="discipline">Tình hình tuân thủ nội quy</Label>
                    {!isViewMode && (
                      <div className="flex items-center gap-2">
                        <Select value={disciplineStyle} onValueChange={setDisciplineStyle}>
                          <SelectTrigger className="w-[180px] h-8">
                            <SelectValue placeholder="Phong cách" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="friendly">Phong cách gần gũi, thân thiện</SelectItem>
                            <SelectItem value="serious">Phong cách nghiêm túc, kỷ luật</SelectItem>
                            <SelectItem value="encouraging">Phong cách khích lệ, động viên</SelectItem>
                            <SelectItem value="understanding">Phong cách lắng nghe, thấu hiểu</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={disciplineLength} onValueChange={setDisciplineLength}>
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue placeholder="Độ dài" />
                          </SelectTrigger>
                          <SelectContent>
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
                            <RefreshCw className="h-3 w-3 mr-1" />
                          )}
                          Tạo lại AI
                        </Button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    id="discipline"
                    value={disciplineStatus}
                    onChange={(e) => setDisciplineStatus(e.target.value)}
                    placeholder="Danh sách vi phạm trong kỳ báo cáo..."
                    className="mt-1"
                    rows={4}
                    disabled={isViewMode}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Nội dung này được tạo tự động từ danh sách vi phạm trong kỳ báo cáo
                  </p>
                </div>
              </div>
            </div>

            {/* Parent Responses (View Mode Only) */}
            {isViewMode && parentResponses.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Phản hồi từ phụ huynh</h4>
                {parentResponses.map((response, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{response.parent?.full_name}</span>
                      <div className="flex items-center gap-2">
                        {response.agreement_status === 'agree' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Đồng ý
                          </Badge>
                        ) : response.agreement_status === 'disagree' ? (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Không đồng ý
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Chưa phản hồi</Badge>
                        )}
                      </div>
                    </div>
                    {response.comments && (
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {response.comments}
                      </p>
                    )}
                    {response.responded_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Phản hồi lúc: {new Date(response.responded_at).toLocaleString('vi-VN')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                onOpenChange(false)
                // Don't call onSuccess here to prevent page reload
                // Only call onSuccess when report is sent
              }}>
                Đóng
              </Button>
              
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
                  
                  {student.report?.status === 'draft' && (
                    <Button
                      onClick={handleSend}
                      disabled={sending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {sending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Nộp cho Admin
                    </Button>
                  )}

                  {/* Resend button for edited sent reports */}
                  {isEditMode && student.report?.status === 'sent' && (
                    <Button
                      onClick={() => setShowResendDialog(true)}
                      disabled={sending || !strengths.trim() || !weaknesses.trim()}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Gửi lại
                    </Button>
                  )}

                  {/* Cancel edit mode button */}
                  {isEditMode && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditMode(false)
                        // Reset form to original values
                        if (student.report) {
                          setStrengths(student.report.strengths || "")
                          setWeaknesses(student.report.weaknesses || "")
                          setAcademicPerformance(student.report.academic_performance || "")
                          setDisciplineStatus(student.report.discipline_status || "")
                        }
                      }}
                    >
                      Hủy
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>

      {/* Resend Confirmation Dialog */}
      <Dialog open={showResendDialog} onOpenChange={setShowResendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gửi lại báo cáo</DialogTitle>
            <DialogDescription>
              Vui lòng nhập lý do gửi lại báo cáo cho phụ huynh
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="resend-reason">Lý do gửi lại *</Label>
              <Textarea
                id="resend-reason"
                value={resendReason}
                onChange={(e) => setResendReason(e.target.value)}
                placeholder="Ví dụ: Cập nhật thông tin học tập, sửa lỗi chính tả..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowResendDialog(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleResend}
              disabled={sending || !resendReason.trim()}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Gửi lại
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </Dialog>
  )
}
