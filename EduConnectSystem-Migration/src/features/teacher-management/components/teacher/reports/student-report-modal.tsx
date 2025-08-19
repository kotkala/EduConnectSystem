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
      setError('KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u bÃ¡o cÃ¡o')
    } finally {
      setLoading(false)
    }
  }, [student.report, isViewMode])

  const handleSaveClick = useCallback(() => {
    if (!strengths.trim() || !weaknesses.trim()) {
      toast.error('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ Æ°u Ä‘iá»ƒm vÃ  khuyáº¿t Ä‘iá»ƒm')
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
        toast.success('BÃ¡o cÃ¡o Ä‘Ã£ Ä‘Æ°á»£c lÆ°u thÃ nh cÃ´ng')
        setShowVerificationDialog(false)
        // Don't call onSuccess() here to prevent page reload
        // Let user manually close the modal with "ÄÃ³ng" button
      } else {
        setError(result.error || 'KhÃ´ng thá»ƒ lÆ°u bÃ¡o cÃ¡o')
      }
    } catch (error) {
      console.error('Error saving report:', error)
      setError('KhÃ´ng thá»ƒ lÆ°u bÃ¡o cÃ¡o')
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
        toast.success('ÄÃ£ táº¡o láº¡i tÃ³m táº¯t tÃ¬nh hÃ¬nh há»c táº­p')
      } else {
        setError(result.error || 'KhÃ´ng thá»ƒ táº¡o láº¡i tÃ³m táº¯t tÃ¬nh hÃ¬nh há»c táº­p')
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº¡o láº¡i tÃ³m táº¯t tÃ¬nh hÃ¬nh há»c táº­p')
      }
    } catch (error) {
      console.error('Error regenerating academic summary:', error)
      setError('KhÃ´ng thá»ƒ táº¡o láº¡i tÃ³m táº¯t tÃ¬nh hÃ¬nh há»c táº­p')
      toast.error('KhÃ´ng thá»ƒ táº¡o láº¡i tÃ³m táº¯t tÃ¬nh hÃ¬nh há»c táº­p')
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
        toast.success('ÄÃ£ táº¡o láº¡i tÃ³m táº¯t tÃ¬nh hÃ¬nh ká»· luáº­t')
      } else {
        setError(result.error || 'KhÃ´ng thá»ƒ táº¡o láº¡i tÃ³m táº¯t tÃ¬nh hÃ¬nh ká»· luáº­t')
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº¡o láº¡i tÃ³m táº¯t tÃ¬nh hÃ¬nh ká»· luáº­t')
      }
    } catch (error) {
      console.error('Error regenerating discipline summary:', error)
      setError('KhÃ´ng thá»ƒ táº¡o láº¡i tÃ³m táº¯t tÃ¬nh hÃ¬nh ká»· luáº­t')
      toast.error('KhÃ´ng thá»ƒ táº¡o láº¡i tÃ³m táº¯t tÃ¬nh hÃ¬nh ká»· luáº­t')
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
        toast.success('ÄÃ£ táº¡o Æ°u Ä‘iá»ƒm báº±ng AI')
      } else {
        setError(result.error || 'KhÃ´ng thá»ƒ táº¡o Æ°u Ä‘iá»ƒm')
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº¡o Æ°u Ä‘iá»ƒm')
      }
    } catch (error) {
      console.error('Error generating strengths:', error)
      setError('KhÃ´ng thá»ƒ táº¡o Æ°u Ä‘iá»ƒm')
      toast.error('KhÃ´ng thá»ƒ táº¡o Æ°u Ä‘iá»ƒm')
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
        toast.success('ÄÃ£ táº¡o khuyáº¿t Ä‘iá»ƒm báº±ng AI')
      } else {
        setError(result.error || 'KhÃ´ng thá»ƒ táº¡o khuyáº¿t Ä‘iá»ƒm')
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº¡o khuyáº¿t Ä‘iá»ƒm')
      }
    } catch (error) {
      console.error('Error generating weaknesses:', error)
      setError('KhÃ´ng thá»ƒ táº¡o khuyáº¿t Ä‘iá»ƒm')
      toast.error('KhÃ´ng thá»ƒ táº¡o khuyáº¿t Ä‘iá»ƒm')
    } finally {
      setGeneratingWeaknesses(false)
    }
  }, [student.id, reportPeriodId, weaknessesStyle, weaknessesLength])

  const handleSend = useCallback(async () => {
    if (!student.report?.id) {
      toast.error('Vui lÃ²ng lÆ°u bÃ¡o cÃ¡o trÆ°á»›c khi gá»­i')
      return
    }

    try {
      setSending(true)
      setError(null)

      const result = await sendStudentReportAction(student.report.id)

      if (result.success) {
        toast.success('BÃ¡o cÃ¡o Ä‘Ã£ Ä‘Æ°á»£c gá»­i Ä‘áº¿n phá»¥ huynh')
        // Don't call onSuccess() to prevent page reload
        // Just close the modal and show success message
        onOpenChange(false)
      } else {
        setError(result.error || 'KhÃ´ng thá»ƒ gá»­i bÃ¡o cÃ¡o')
      }
    } catch (error) {
      console.error('Error sending report:', error)
      setError('KhÃ´ng thá»ƒ gá»­i bÃ¡o cÃ¡o')
    } finally {
      setSending(false)
    }
  }, [student.report?.id, onOpenChange])

  const handleResend = useCallback(async () => {
    if (!student.report?.id || !resendReason.trim()) {
      toast.error('Vui lÃ²ng nháº­p lÃ½ do gá»­i láº¡i')
      return
    }

    try {
      setSending(true)
      setError(null)

      // Import the resend action
      const { resendStudentReportAction } = await import('@/features/reports')

      const result = await resendStudentReportAction(student.report.id, resendReason.trim())

      if (result.success) {
        toast.success('BÃ¡o cÃ¡o Ä‘Ã£ Ä‘Æ°á»£c gá»­i láº¡i Ä‘áº¿n phá»¥ huynh')
        setShowResendDialog(false)
        setResendReason("")
        setIsEditMode(false)
        onOpenChange(false)
      } else {
        setError(result.error || 'KhÃ´ng thá»ƒ gá»­i láº¡i bÃ¡o cÃ¡o')
      }
    } catch (error) {
      console.error('Error resending report:', error)
      setError('KhÃ´ng thá»ƒ gá»­i láº¡i bÃ¡o cÃ¡o')
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
                Xem bÃ¡o cÃ¡o há»c sinh
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5" />
                {reportExists ? 'Chá»‰nh sá»­a bÃ¡o cÃ¡o' : 'Táº¡o bÃ¡o cÃ¡o má»›i'}
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
              <h3 className="font-medium mb-2">ThÃ´ng tin há»c sinh</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Há» tÃªn:</span> {student.full_name}
                </div>
                <div>
                  <span className="font-medium">MÃ£ há»c sinh:</span> {student.student_id}
                </div>
                <div>
                  <span className="font-medium">Lá»›p:</span> {student.class_name}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">Tráº¡ng thÃ¡i:</span>{" "}
                    {student.report?.status === 'sent' ? (
                      <Badge className="bg-green-100 text-green-800">ÄÃ£ gá»­i</Badge>
                    ) : student.report?.status === 'draft' ? (
                      <Badge variant="outline">Báº£n nhÃ¡p</Badge>
                    ) : (
                      <Badge variant="secondary">ChÆ°a táº¡o</Badge>
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
                      Chá»‰nh sá»­a
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
                <h4 className="font-medium mb-2">Ná»™i dung bÃ¡o cÃ¡o</h4>
                <p className="text-sm text-gray-700">
                  KÃ­nh gá»­i phá»¥ huynh <strong>{student.full_name}</strong> vá» tÃ¬nh hÃ¬nh há»c táº­p, 
                  thá»±c hiá»‡n ná»™i quy nhÃ  trÆ°á»ng cá»§a <strong>{student.full_name}</strong> nhÆ° sau:
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="strengths">Æ¯u Ä‘iá»ƒm *</Label>
                    {!isViewMode && (
                      <div className="flex items-center gap-2">
                        <Select value={strengthsStyle} onValueChange={setStrengthsStyle}>
                          <SelectTrigger className="w-[180px] h-8">
                            <SelectValue placeholder="Phong cÃ¡ch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="friendly">Phong cÃ¡ch gáº§n gÅ©i, thÃ¢n thiá»‡n</SelectItem>
                            <SelectItem value="serious">Phong cÃ¡ch nghiÃªm tÃºc, ká»· luáº­t</SelectItem>
                            <SelectItem value="encouraging">Phong cÃ¡ch khÃ­ch lá»‡, Ä‘á»™ng viÃªn</SelectItem>
                            <SelectItem value="understanding">Phong cÃ¡ch láº¯ng nghe, tháº¥u hiá»ƒu</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={strengthsLength} onValueChange={setStrengthsLength}>
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue placeholder="Äá»™ dÃ i" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">VÄƒn báº£n ngáº¯n gá»n (1-2 cÃ¢u)</SelectItem>
                            <SelectItem value="medium">VÄƒn báº£n trung bÃ¬nh (3-5 cÃ¢u)</SelectItem>
                            <SelectItem value="long">VÄƒn báº£n dÃ i (6 cÃ¢u trá»Ÿ lÃªn)</SelectItem>
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
                          Táº¡o AI
                        </Button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    id="strengths"
                    value={strengths}
                    onChange={(e) => setStrengths(e.target.value)}
                    placeholder="Nháº­p Æ°u Ä‘iá»ƒm cá»§a há»c sinh..."
                    className="mt-1"
                    rows={3}
                    disabled={isViewMode}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    CÃ³ thá»ƒ sá»­ dá»¥ng AI Ä‘á»ƒ táº¡o ná»™i dung dá»±a trÃªn pháº£n há»“i tÃ­ch cá»±c
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="weaknesses">Khuyáº¿t Ä‘iá»ƒm *</Label>
                    {!isViewMode && (
                      <div className="flex items-center gap-2">
                        <Select value={weaknessesStyle} onValueChange={setWeaknessesStyle}>
                          <SelectTrigger className="w-[180px] h-8">
                            <SelectValue placeholder="Phong cÃ¡ch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="friendly">Phong cÃ¡ch gáº§n gÅ©i, thÃ¢n thiá»‡n</SelectItem>
                            <SelectItem value="serious">Phong cÃ¡ch nghiÃªm tÃºc, ká»· luáº­t</SelectItem>
                            <SelectItem value="encouraging">Phong cÃ¡ch khÃ­ch lá»‡, Ä‘á»™ng viÃªn</SelectItem>
                            <SelectItem value="understanding">Phong cÃ¡ch láº¯ng nghe, tháº¥u hiá»ƒu</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={weaknessesLength} onValueChange={setWeaknessesLength}>
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue placeholder="Äá»™ dÃ i" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">VÄƒn báº£n ngáº¯n gá»n (1-2 cÃ¢u)</SelectItem>
                            <SelectItem value="medium">VÄƒn báº£n trung bÃ¬nh (3-5 cÃ¢u)</SelectItem>
                            <SelectItem value="long">VÄƒn báº£n dÃ i (6 cÃ¢u trá»Ÿ lÃªn)</SelectItem>
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
                          Táº¡o AI
                        </Button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    id="weaknesses"
                    value={weaknesses}
                    onChange={(e) => setWeaknesses(e.target.value)}
                    placeholder="Nháº­p khuyáº¿t Ä‘iá»ƒm cá»§a há»c sinh..."
                    className="mt-1"
                    rows={3}
                    disabled={isViewMode}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    CÃ³ thá»ƒ sá»­ dá»¥ng AI Ä‘á»ƒ táº¡o ná»™i dung dá»±a trÃªn pháº£n há»“i vÃ  vi pháº¡m
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="academic">TÃ¬nh hÃ¬nh há»c táº­p</Label>
                    {!isViewMode && (
                      <div className="flex items-center gap-2">
                        <Select value={academicStyle} onValueChange={setAcademicStyle}>
                          <SelectTrigger className="w-[180px] h-8">
                            <SelectValue placeholder="Phong cÃ¡ch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="friendly">Phong cÃ¡ch gáº§n gÅ©i, thÃ¢n thiá»‡n</SelectItem>
                            <SelectItem value="serious">Phong cÃ¡ch nghiÃªm tÃºc, ká»· luáº­t</SelectItem>
                            <SelectItem value="encouraging">Phong cÃ¡ch khÃ­ch lá»‡, Ä‘á»™ng viÃªn</SelectItem>
                            <SelectItem value="understanding">Phong cÃ¡ch láº¯ng nghe, tháº¥u hiá»ƒu</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={academicLength} onValueChange={setAcademicLength}>
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue placeholder="Äá»™ dÃ i" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">VÄƒn báº£n ngáº¯n gá»n (1-2 cÃ¢u)</SelectItem>
                            <SelectItem value="medium">VÄƒn báº£n trung bÃ¬nh (3-5 cÃ¢u)</SelectItem>
                            <SelectItem value="long">VÄƒn báº£n dÃ i (6 cÃ¢u trá»Ÿ lÃªn)</SelectItem>
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
                          Táº¡o láº¡i AI
                        </Button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    id="academic"
                    value={academicPerformance}
                    onChange={(e) => setAcademicPerformance(e.target.value)}
                    placeholder="TÃ³m táº¯t AI vá» pháº£n há»“i há»c táº­p trong 4 tuáº§n..."
                    className="mt-1"
                    rows={4}
                    disabled={isViewMode}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Ná»™i dung nÃ y Ä‘Æ°á»£c táº¡o tá»± Ä‘á»™ng tá»« pháº£n há»“i cá»§a giÃ¡o viÃªn trong ká»³ bÃ¡o cÃ¡o
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="discipline">TÃ¬nh hÃ¬nh tuÃ¢n thá»§ ná»™i quy</Label>
                    {!isViewMode && (
                      <div className="flex items-center gap-2">
                        <Select value={disciplineStyle} onValueChange={setDisciplineStyle}>
                          <SelectTrigger className="w-[180px] h-8">
                            <SelectValue placeholder="Phong cÃ¡ch" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="friendly">Phong cÃ¡ch gáº§n gÅ©i, thÃ¢n thiá»‡n</SelectItem>
                            <SelectItem value="serious">Phong cÃ¡ch nghiÃªm tÃºc, ká»· luáº­t</SelectItem>
                            <SelectItem value="encouraging">Phong cÃ¡ch khÃ­ch lá»‡, Ä‘á»™ng viÃªn</SelectItem>
                            <SelectItem value="understanding">Phong cÃ¡ch láº¯ng nghe, tháº¥u hiá»ƒu</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={disciplineLength} onValueChange={setDisciplineLength}>
                          <SelectTrigger className="w-[160px] h-8">
                            <SelectValue placeholder="Äá»™ dÃ i" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="short">VÄƒn báº£n ngáº¯n gá»n (1-2 cÃ¢u)</SelectItem>
                            <SelectItem value="medium">VÄƒn báº£n trung bÃ¬nh (3-5 cÃ¢u)</SelectItem>
                            <SelectItem value="long">VÄƒn báº£n dÃ i (6 cÃ¢u trá»Ÿ lÃªn)</SelectItem>
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
                          Táº¡o láº¡i AI
                        </Button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    id="discipline"
                    value={disciplineStatus}
                    onChange={(e) => setDisciplineStatus(e.target.value)}
                    placeholder="Danh sÃ¡ch vi pháº¡m trong ká»³ bÃ¡o cÃ¡o..."
                    className="mt-1"
                    rows={4}
                    disabled={isViewMode}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Ná»™i dung nÃ y Ä‘Æ°á»£c táº¡o tá»± Ä‘á»™ng tá»« danh sÃ¡ch vi pháº¡m trong ká»³ bÃ¡o cÃ¡o
                  </p>
                </div>
              </div>
            </div>

            {/* Parent Responses (View Mode Only) */}
            {isViewMode && parentResponses.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Pháº£n há»“i tá»« phá»¥ huynh</h4>
                {parentResponses.map((response, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{response.parent?.full_name}</span>
                      <div className="flex items-center gap-2">
                        {response.agreement_status === 'agree' ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Äá»“ng Ã½
                          </Badge>
                        ) : response.agreement_status === 'disagree' ? (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            KhÃ´ng Ä‘á»“ng Ã½
                          </Badge>
                        ) : (
                          <Badge variant="secondary">ChÆ°a pháº£n há»“i</Badge>
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
                        Pháº£n há»“i lÃºc: {new Date(response.responded_at).toLocaleString('vi-VN')}
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
                ÄÃ³ng
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
                    LÆ°u
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
                      Ná»™p cho Admin
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
                      Gá»­i láº¡i
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
                      Há»§y
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
            <DialogTitle>Gá»­i láº¡i bÃ¡o cÃ¡o</DialogTitle>
            <DialogDescription>
              Vui lÃ²ng nháº­p lÃ½ do gá»­i láº¡i bÃ¡o cÃ¡o cho phá»¥ huynh
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="resend-reason">LÃ½ do gá»­i láº¡i *</Label>
              <Textarea
                id="resend-reason"
                value={resendReason}
                onChange={(e) => setResendReason(e.target.value)}
                placeholder="VÃ­ dá»¥: Cáº­p nháº­t thÃ´ng tin há»c táº­p, sá»­a lá»—i chÃ­nh táº£..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setShowResendDialog(false)}>
              Há»§y
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
              Gá»­i láº¡i
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <AlertDialog open={showVerificationDialog} onOpenChange={setShowVerificationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>XÃ¡c nháº­n lÆ°u bÃ¡o cÃ¡o</AlertDialogTitle>
            <AlertDialogDescription>
              Vui lÃ²ng xem láº¡i ná»™i dung bÃ¡o cÃ¡o trÆ°á»›c khi lÆ°u.
              <br /><br />
              <strong>LÆ°u Ã½:</strong> Ná»™i dung Ä‘Æ°á»£c táº¡o bá»Ÿi AI chá»‰ mang tÃ­nh cháº¥t tham kháº£o.
              GiÃ¡o viÃªn cáº§n kiá»ƒm tra vÃ  chá»‰nh sá»­a cho phÃ¹ há»£p vá»›i tÃ¬nh hÃ¬nh thá»±c táº¿ cá»§a há»c sinh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Há»§y</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              XÃ¡c nháº­n lÆ°u
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
