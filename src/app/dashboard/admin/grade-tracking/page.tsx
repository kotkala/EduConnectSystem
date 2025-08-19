"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Badge } from "@/shared/components/ui/badge"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Progress } from "@/shared/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog"
import { Checkbox } from "@/shared/components/ui/checkbox"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"
import {
  RefreshCw,
  Users,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Download,
  Eye,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import {
  getGradePeriodsAction,
  getStudentGradeTrackingDataAction,
  submitStudentGradesToHomeroomAction,
  type GradePeriod as AdminGradePeriod,
  type StudentGradeData,
  type AdminGradeStats
} from "@/features/grade-management/actions/admin-grade-tracking-actions"

export default function AdminGradeTrackingPage() {
  const [periods, setPeriods] = useState<AdminGradePeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [gradeData, setGradeData] = useState<StudentGradeData[]>([])
  const [stats, setStats] = useState<AdminGradeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false)
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

  // Load grade data for selected period
  const loadGradeData = useCallback(async () => {
    if (!selectedPeriod) return

    setLoading(true)
    setError(null)

    try {
      const result = await getStudentGradeTrackingDataAction(selectedPeriod)
      if (result.success) {
        setGradeData(result.data || [])
        setStats(result.stats || null)
      } else {
        setError(result.error || 'KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u Ä‘iá»ƒm sá»‘')
      }
    } catch (error) {
      console.error('Error loading grade data:', error)
      setError('KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u Ä‘iá»ƒm sá»‘')
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  useEffect(() => {
    loadGradeData()
  }, [loadGradeData])

  const getCompletionColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getGradeColor = (grade: number | null) => {
    if (grade === null) return 'text-gray-500'
    if (grade >= 8) return 'text-green-600'
    if (grade >= 6.5) return 'text-blue-600'
    if (grade >= 5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const exportData = () => {
    // TODO: Implement export functionality
    toast.info('Chá»©c nÄƒng xuáº¥t dá»¯ liá»‡u Ä‘ang Ä‘Æ°á»£c phÃ¡t triá»ƒn')
  }

  const handleSubmitGrades = async () => {
    if (selectedItems.size === 0) {
      toast.error('Vui lÃ²ng chá»n Ã­t nháº¥t má»™t há»c sinh Ä‘á»ƒ gá»­i')
      return
    }

    setSubmitting(true)
    try {
      const studentIds = Array.from(selectedItems)

      const result = await submitStudentGradesToHomeroomAction(
        selectedPeriod,
        studentIds,
        submissionReason || undefined
      )

      if (result.success) {
        toast.success(result.message)
        setSelectedItems(new Set())
        setSubmissionReason('')
        setSubmissionDialogOpen(false)
        loadGradeData() // Reload data to show updated submission status
      } else {
        toast.error(result.error || 'Lá»—i gá»­i báº£ng Ä‘iá»ƒm')
      }
    } catch (error) {
      console.error('Error submitting grades:', error)
      toast.error('Lá»—i gá»­i báº£ng Ä‘iá»ƒm')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleItemSelection = (studentId: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId)
    } else {
      newSelection.add(studentId)
    }
    setSelectedItems(newSelection)
  }

  const selectAllItems = () => {
    const allKeys = gradeData.map(item => item.student_id)
    setSelectedItems(new Set(allKeys))
  }

  const clearSelection = () => {
    setSelectedItems(new Set())
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Theo dÃµi Ä‘iá»ƒm sá»‘ toÃ n trÆ°á»ng</h1>
          <p className="text-muted-foreground">
            Quáº£n lÃ½ vÃ  theo dÃµi tiáº¿n Ä‘á»™ nháº­p Ä‘iá»ƒm cá»§a táº¥t cáº£ cÃ¡c lá»›p vÃ  mÃ´n há»c
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadGradeData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            LÃ m má»›i
          </Button>
          <Button variant="outline" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Xuáº¥t Excel
          </Button>
          <Button
            onClick={() => setSubmissionDialogOpen(true)}
            disabled={selectedItems.size === 0}
          >
            Gá»­i báº£ng Ä‘iá»ƒm ({selectedItems.size})
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chá»n ká»³ bÃ¡o cÃ¡o</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
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
            {selectedPeriod && (
              <div className="text-sm text-muted-foreground">
                Ká»³: {periods.find(p => p.id === selectedPeriod)?.name}
              </div>
            )}
          </div>
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

      {/* Statistics Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tá»•ng sá»‘ lá»›p</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_classes}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tá»•ng há»c sinh</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_students}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tá»•ng mÃ´n há»c</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_subjects}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tá»· lá»‡ hoÃ n thÃ nh</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getCompletionColor(stats.overall_completion_rate)}`}>
                {stats.overall_completion_rate}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Äiá»ƒm TB chung</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getGradeColor(stats.overall_average_grade)}`}>
                {stats.overall_average_grade ?? 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Grade Data Table */}
      {!loading && gradeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chi tiáº¿t Ä‘iá»ƒm sá»‘ theo há»c sinh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedItems.size === gradeData.length && gradeData.length > 0}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              selectAllItems()
                            } else {
                              clearSelection()
                            }
                          }}
                        />
                        <span>Chá»n</span>
                      </div>
                    </th>
                    <th className="text-left p-3 font-medium">Há»c sinh</th>
                    <th className="text-left p-3 font-medium">Sá»‘ bÃ¡o danh</th>
                    <th className="text-left p-3 font-medium">Lá»›p</th>
                    <th className="text-left p-3 font-medium">Tá»•ng mÃ´n</th>
                    <th className="text-left p-3 font-medium">ÄÃ£ cÃ³ Ä‘iá»ƒm</th>
                    <th className="text-left p-3 font-medium">Tá»· lá»‡ (%)</th>
                    <th className="text-left p-3 font-medium">Äiá»ƒm TB chung</th>
                    <th className="text-left p-3 font-medium">PhÃ¢n bá»‘ Ä‘iá»ƒm</th>
                    <th className="text-left p-3 font-medium">Tráº¡ng thÃ¡i gá»­i</th>
                    <th className="text-left p-3 font-medium">Cáº­p nháº­t cuá»‘i</th>
                    <th className="text-left p-3 font-medium">Thao tÃ¡c</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeData.map((row) => {
                    const isSelected = selectedItems.has(row.student_id)

                    return (
                      <tr key={row.student_id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleItemSelection(row.student_id)}
                          />
                        </td>
                        <td className="p-3 font-medium">{row.student_name}</td>
                        <td className="p-3">{row.student_number}</td>
                        <td className="p-3">{row.class_name}</td>
                        <td className="p-3 text-center">{row.total_subjects}</td>
                        <td className="p-3 text-center">{row.subjects_with_grades}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center gap-2">
                            <Progress value={row.completion_rate} className="w-16 h-2" />
                            <span className={`text-sm font-medium ${getCompletionColor(row.completion_rate)}`}>
                              {row.completion_rate}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`font-medium ${getGradeColor(row.overall_average)}`}>
                            {row.overall_average ?? 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                              â‰¥8: {row.grade_distribution.excellent}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              6.5-7.9: {row.grade_distribution.good}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                              5-6.4: {row.grade_distribution.average}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                              &lt;5: {row.grade_distribution.poor}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <Badge
                              variant={row.submission_status === 'submitted' ? 'default' :
                                      row.submission_status === 'resubmitted' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {row.submission_status === 'submitted' ? 'ÄÃ£ gá»­i' :
                               row.submission_status === 'resubmitted' ? 'Gá»­i láº¡i' : 'ChÆ°a gá»­i'}
                            </Badge>
                            {row.submission_count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                Láº§n {row.submission_count}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {new Date(row.last_updated).toLocaleString('vi-VN')}
                        </td>
                        <td className="p-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/dashboard/admin/grade-tracking/student/${row.student_id}?period=${selectedPeriod}`, '_blank')}
                          >
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

      {/* Submission Dialog */}
      <Dialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Gá»­i báº£ng Ä‘iá»ƒm cho giÃ¡o viÃªn chá»§ nhiá»‡m</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Báº¡n Ä‘ang gá»­i báº£ng Ä‘iá»ƒm cho {selectedItems.size} há»c sinh
              </p>
              <div className="max-h-32 overflow-y-auto border rounded p-2 text-sm">
                {Array.from(selectedItems).map(studentId => {
                  const student = gradeData.find(d => d.student_id === studentId)
                  return (
                    <div key={studentId} className="flex justify-between py-1">
                      <span>{student?.student_name}</span>
                      <span>{student?.class_name}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Check if any selected students have been submitted before */}
            {Array.from(selectedItems).some(studentId => {
              const student = gradeData.find(d => d.student_id === studentId)
              return student && student.submission_count > 0
            }) && (
              <div className="space-y-2">
                <Label htmlFor="submission-reason">
                  LÃ½ do gá»­i láº¡i <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="submission-reason"
                  placeholder="Nháº­p lÃ½ do gá»­i láº¡i báº£ng Ä‘iá»ƒm (vÃ­ dá»¥: Cáº­p nháº­t Ä‘iá»ƒm, Sá»­a lá»—i, Bá»• sung thÃ´ng tin...)"
                  value={submissionReason}
                  onChange={(e) => setSubmissionReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubmissionDialogOpen(false)}
              disabled={submitting}
            >
              Há»§y
            </Button>
            <Button
              onClick={handleSubmitGrades}
              disabled={submitting || (
                Array.from(selectedItems).some(studentId => {
                  const student = gradeData.find(d => d.student_id === studentId)
                  return student && student.submission_count > 0
                }) && !submissionReason.trim()
              )}
            >
              {submitting ? 'Äang gá»­i...' : 'Gá»­i báº£ng Ä‘iá»ƒm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
