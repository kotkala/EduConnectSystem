"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Badge } from "@/shared/components/ui/badge"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"
import {
  RefreshCw,
  Users,
  BookOpen,
  Send,
  Bot,
  Eye,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import {
  getGradePeriodsAction,
  type GradePeriod
} from "@/features/grade-management/actions/admin-grade-tracking-actions"
import {
  getHomeroomGradeDataAction,
  generateAIFeedbackAction,
  submitGradesToParentsAction,
  type HomeroomGradeData
} from "@/features/grade-management/actions/homeroom-grade-actions"

export default function HomeroomGradesPage() {
  const [periods, setPeriods] = useState<GradePeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [classId, setClassId] = useState<string>('') // This would be set based on homeroom teacher's class
  const [gradeData, setGradeData] = useState<HomeroomGradeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // AI Feedback state
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [feedbackStyle, setFeedbackStyle] = useState<'friendly' | 'serious' | 'encouraging' | 'understanding'>('friendly')
  const [feedbackLength, setFeedbackLength] = useState<'short' | 'medium' | 'long'>('medium')
  const [generatedFeedbacks, setGeneratedFeedbacks] = useState<Record<string, string>>({})
  const [generatingFeedback, setGeneratingFeedback] = useState(false)
  const [submissionReason, setSubmissionReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Load grade periods
  const loadPeriods = useCallback(async () => {
    try {
      const result = await getGradePeriodsAction()
      if (result.success && result.data) {
        setPeriods(result.data)
        if (result.data.length > 0) {
          setSelectedPeriod(result.data[0].id)
        }
      } else {
        setError(result.error || 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch ká»³ bÃ¡o cÃ¡o')
      }
    } catch (error) {
      console.error('Error loading periods:', error)
      setError('KhÃ´ng thá»ƒ táº£i danh sÃ¡ch ká»³ bÃ¡o cÃ¡o')
    }
  }, [])

  // Load homeroom grade data
  const loadGradeData = useCallback(async () => {
    if (!selectedPeriod || !classId) return

    setLoading(true)
    setError(null)

    try {
      const result = await getHomeroomGradeDataAction(selectedPeriod, classId)
      if (result.success) {
        setGradeData(result.data || [])
      } else {
        setError(result.error || 'KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u Ä‘iá»ƒm sá»‘')
      }
    } catch (error) {
      console.error('Error loading grade data:', error)
      setError('KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u Ä‘iá»ƒm sá»‘')
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, classId])

  useEffect(() => {
    loadPeriods()
    // TODO: Get homeroom teacher's class ID from user profile
    setClassId('sample-class-id') // This should be fetched from the user's profile
  }, [loadPeriods])

  useEffect(() => {
    loadGradeData()
  }, [loadGradeData])

  // Generate AI feedback for selected students
  const generateFeedback = async () => {
    if (selectedStudents.size === 0) {
      toast.error('Vui lÃ²ng chá»n Ã­t nháº¥t má»™t há»c sinh')
      return
    }

    setGeneratingFeedback(true)
    const newFeedbacks: Record<string, string> = {}

    try {
      for (const studentId of selectedStudents) {
        const studentData = gradeData.find(s => s.student_id === studentId)
        if (studentData) {
          const result = await generateAIFeedbackAction(studentData, {
            style: feedbackStyle,
            length: feedbackLength
          })

          if (result.success && result.feedback) {
            newFeedbacks[studentId] = result.feedback
          } else {
            toast.error(`Lá»—i táº¡o pháº£n há»“i cho ${studentData.student_name}`)
          }
        }
      }

      setGeneratedFeedbacks(prev => ({ ...prev, ...newFeedbacks }))
      toast.success(`ÄÃ£ táº¡o pháº£n há»“i cho ${Object.keys(newFeedbacks).length} há»c sinh`)
    } catch (error) {
      console.error('Error generating feedback:', error)
      toast.error('Lá»—i táº¡o pháº£n há»“i AI')
    } finally {
      setGeneratingFeedback(false)
    }
  }

  // Submit grades to parents
  const handleSubmitToParents = async () => {
    const studentsWithFeedback = Array.from(selectedStudents).filter(id => generatedFeedbacks[id])
    
    if (studentsWithFeedback.length === 0) {
      toast.error('Vui lÃ²ng táº¡o pháº£n há»“i AI cho cÃ¡c há»c sinh Ä‘Ã£ chá»n')
      return
    }

    setSubmitting(true)
    try {
      const submissions = studentsWithFeedback.map(studentId => ({
        studentId,
        aiFeedback: generatedFeedbacks[studentId],
        feedbackStyle,
        feedbackLength
      }))

      const result = await submitGradesToParentsAction(
        selectedPeriod,
        classId,
        submissions,
        submissionReason || undefined
      )

      if (result.success) {
        toast.success(result.message)
        setSelectedStudents(new Set())
        setGeneratedFeedbacks({})
        setSubmissionReason('')
        setFeedbackDialogOpen(false)
        loadGradeData() // Reload to show updated submission status
      } else {
        toast.error(result.error || 'Lá»—i gá»­i báº£ng Ä‘iá»ƒm')
      }
    } catch (error) {
      console.error('Error submitting to parents:', error)
      toast.error('Lá»—i gá»­i báº£ng Ä‘iá»ƒm cho phá»¥ huynh')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    const newSelection = new Set(selectedStudents)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedStudents(newSelection)
  }

  const selectAllStudents = () => {
    setSelectedStudents(new Set(gradeData.map(s => s.student_id)))
  }

  const clearSelection = () => {
    setSelectedStudents(new Set())
  }

  const getOverallGrade = (student: HomeroomGradeData) => {
    const validGrades = student.subjects
      .map(s => s.average_grade)
      .filter(g => g !== null) as number[]
    
    if (validGrades.length === 0) return null
    return Math.round((validGrades.reduce((sum, g) => sum + g, 0) / validGrades.length) * 10) / 10
  }

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-500'
    if (grade >= 8) return 'text-green-600'
    if (grade >= 6.5) return 'text-blue-600'
    if (grade >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFeedbackStyleLabel = (style: string) => {
    switch (style) {
      case 'friendly': return 'Phong cÃ¡ch gáº§n gÅ©i, thÃ¢n thiá»‡n'
      case 'serious': return 'Phong cÃ¡ch nghiÃªm tÃºc, ká»· luáº­t'
      case 'encouraging': return 'Phong cÃ¡ch khÃ­ch lá»‡, Ä‘á»™ng viÃªn'
      case 'understanding': return 'Phong cÃ¡ch láº¯ng nghe, tháº¥u hiá»ƒu'
      default: return style
    }
  }

  const getFeedbackLengthLabel = (length: string) => {
    switch (length) {
      case 'short': return 'VÄƒn báº£n ngáº¯n gá»n (1-2 cÃ¢u)'
      case 'medium': return 'VÄƒn báº£n trung bÃ¬nh (3-5 cÃ¢u)'
      case 'long': return 'VÄƒn báº£n dÃ i (6 cÃ¢u trá»Ÿ lÃªn)'
      default: return length
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quáº£n lÃ½ Ä‘iá»ƒm lá»›p chá»§ nhiá»‡m</h1>
          <p className="text-muted-foreground">
            Táº¡o pháº£n há»“i AI vÃ  gá»­i báº£ng Ä‘iá»ƒm cho phá»¥ huynh
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadGradeData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            LÃ m má»›i
          </Button>
          <Button 
            onClick={() => setFeedbackDialogOpen(true)}
            disabled={selectedStudents.size === 0}
          >
            <Bot className="mr-2 h-4 w-4" />
            Táº¡o pháº£n há»“i AI ({selectedStudents.size})
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chá»n ká»³ bÃ¡o cÃ¡o</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Chá»n ká»³ bÃ¡o cÃ¡o" />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={period.id}>
                  <div className="flex items-center gap-2">
                    <span>{period.name}</span>
                    {period.is_active && (
                      <Badge variant="outline" className="text-xs">Äang hoáº¡t Ä‘á»™ng</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-lg">Äang táº£i dá»¯ liá»‡u Ä‘iá»ƒm sá»‘...</p>
          </div>
        </div>
      )}

      {/* Statistics */}
      {!loading && gradeData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tá»•ng há»c sinh</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gradeData.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ÄÃ£ chá»n</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedStudents.size}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ÄÃ£ táº¡o pháº£n há»“i</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(generatedFeedbacks).length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Grade Table */}
      {!loading && gradeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Báº£ng Ä‘iá»ƒm há»c sinh</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAllStudents}>
                  Chá»n táº¥t cáº£
                </Button>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Bá» chá»n
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">
                      <Checkbox
                        checked={selectedStudents.size === gradeData.length && gradeData.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            selectAllStudents()
                          } else {
                            clearSelection()
                          }
                        }}
                      />
                    </th>
                    <th className="text-left p-3 font-medium">Há»c sinh</th>
                    <th className="text-left p-3 font-medium">Sá»‘ bÃ¡o danh</th>
                    <th className="text-left p-3 font-medium">Äiá»ƒm TB chung</th>
                    <th className="text-left p-3 font-medium">Sá»‘ mÃ´n há»c</th>
                    <th className="text-left p-3 font-medium">Pháº£n há»“i AI</th>
                    <th className="text-left p-3 font-medium">Thao tÃ¡c</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeData.map((student) => {
                    const isSelected = selectedStudents.has(student.student_id)
                    const overallGrade = getOverallGrade(student)
                    const hasFeedback = generatedFeedbacks[student.student_id]

                    return (
                      <tr key={student.student_id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleStudentSelection(student.student_id)}
                          />
                        </td>
                        <td className="p-3 font-medium">{student.student_name}</td>
                        <td className="p-3">{student.student_number}</td>
                        <td className="p-3 text-center">
                          <span className={`font-medium ${getGradeColor(overallGrade)}`}>
                            {overallGrade ?? 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 text-center">{student.subjects.length}</td>
                        <td className="p-3">
                          {hasFeedback ? (
                            <Badge variant="default" className="text-xs">
                              ÄÃ£ táº¡o
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              ChÆ°a táº¡o
                            </Badge>
                          )}
                        </td>
                        <td className="p-3">
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-4 w-4" />
                            Chi tiáº¿t
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!loading && gradeData.length === 0 && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">ChÆ°a cÃ³ dá»¯ liá»‡u Ä‘iá»ƒm</h3>
            <p className="text-muted-foreground mb-4">
              ChÆ°a cÃ³ dá»¯ liá»‡u Ä‘iá»ƒm sá»‘ cho ká»³ bÃ¡o cÃ¡o Ä‘Ã£ chá»n
            </p>
            <Button variant="outline" onClick={loadGradeData}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Thá»­ láº¡i
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI Feedback Dialog */}
      <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Táº¡o pháº£n há»“i AI cho há»c sinh</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phong cÃ¡ch pháº£n há»“i</Label>
                <Select value={feedbackStyle} onValueChange={(value: 'friendly' | 'serious' | 'encouraging' | 'understanding') => setFeedbackStyle(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Phong cÃ¡ch gáº§n gÅ©i, thÃ¢n thiá»‡n</SelectItem>
                    <SelectItem value="serious">Phong cÃ¡ch nghiÃªm tÃºc, ká»· luáº­t</SelectItem>
                    <SelectItem value="encouraging">Phong cÃ¡ch khÃ­ch lá»‡, Ä‘á»™ng viÃªn</SelectItem>
                    <SelectItem value="understanding">Phong cÃ¡ch láº¯ng nghe, tháº¥u hiá»ƒu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Äá»™ dÃ i vÄƒn báº£n</Label>
                <Select value={feedbackLength} onValueChange={(value: 'short' | 'medium' | 'long') => setFeedbackLength(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short">VÄƒn báº£n ngáº¯n gá»n (1-2 cÃ¢u)</SelectItem>
                    <SelectItem value="medium">VÄƒn báº£n trung bÃ¬nh (3-5 cÃ¢u)</SelectItem>
                    <SelectItem value="long">VÄƒn báº£n dÃ i (6 cÃ¢u trá»Ÿ lÃªn)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                ÄÃ£ chá»n {selectedStudents.size} há»c sinh
              </p>
              <Button onClick={generateFeedback} disabled={generatingFeedback || selectedStudents.size === 0}>
                <Bot className="mr-2 h-4 w-4" />
                {generatingFeedback ? 'Äang táº¡o...' : 'Táº¡o pháº£n há»“i AI'}
              </Button>
            </div>

            {/* Generated Feedbacks */}
            {Object.keys(generatedFeedbacks).length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Pháº£n há»“i Ä‘Ã£ táº¡o:</h4>
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {Object.entries(generatedFeedbacks).map(([studentId, feedback]) => {
                    const student = gradeData.find(s => s.student_id === studentId)
                    return (
                      <div key={studentId} className="border rounded p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium">{student?.student_name}</h5>
                          <div className="text-xs text-muted-foreground">
                            {getFeedbackStyleLabel(feedbackStyle)} â€¢ {getFeedbackLengthLabel(feedbackLength)}
                          </div>
                        </div>
                        <p className="text-sm">{feedback}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Submission reason for re-submissions */}
            {Object.keys(generatedFeedbacks).length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="submission-reason">
                  LÃ½ do gá»­i (náº¿u gá»­i láº¡i)
                </Label>
                <Textarea
                  id="submission-reason"
                  placeholder="Nháº­p lÃ½ do gá»­i láº¡i báº£ng Ä‘iá»ƒm (tÃ¹y chá»n)"
                  value={submissionReason}
                  onChange={(e) => setSubmissionReason(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFeedbackDialogOpen(false)}
              disabled={submitting}
            >
              ÄÃ³ng
            </Button>
            <Button
              onClick={handleSubmitToParents}
              disabled={submitting || Object.keys(generatedFeedbacks).length === 0}
            >
              <Send className="mr-2 h-4 w-4" />
              {submitting ? 'Äang gá»­i...' : `Gá»­i cho phá»¥ huynh (${Object.keys(generatedFeedbacks).length})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
