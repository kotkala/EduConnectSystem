"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { usePageTransition } from '@/shared/components/ui/global-loading-provider'
import { useCoordinatedLoading } from '@/hooks/use-coordinated-loading'
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"

import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Plus, Calendar, Users, CheckCircle, AlertCircle, RefreshCw, Bell } from "lucide-react"
import { toast } from "sonner"
import { ReportPeriodForm } from "@/shared/components/admin/report-periods/report-period-form"
import { ClassProgressTable } from "@/shared/components/admin/report-periods/class-progress-table"
import {
  getReportPeriodsAction,
  getClassProgressAction,
  adminBulkSendReportsAction,
  sendTeacherRemindersAction,
  generateStudentReportsAction,
  resetReportsToDraftAction,
  type ReportPeriod,
  type ClassProgress
} from "@/lib/actions/report-period-actions"

import { getAcademicYearsLightAction } from "@/lib/actions/academic-actions"
import { getActiveClassBlocksAction } from "@/lib/actions/class-block-actions"

export default function ReportPeriodsPage() {
  const [reportPeriods, setReportPeriods] = useState<ReportPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [classProgress, setClassProgress] = useState<ClassProgress[]>([])
  const [academicYears, setAcademicYears] = useState<Array<{ id: string; name: string }>>([])
  const [classBlocks, setClassBlocks] = useState<Array<{ id: string; name: string }>>([])
  const [selectedClassBlock, setSelectedClassBlock] = useState<string>("all-blocks")
  const [selectedCompletionStatus, setSelectedCompletionStatus] = useState<string>("all")
  // 🚀 MIGRATION: Replace scattered loading with coordinated system  
  const { startPageTransition, stopLoading } = usePageTransition()
  const coordinatedLoading = useCoordinatedLoading()
  
  const [error, setError] = useState<string | null>(null)
  // 📊 Section loading for non-blocking components
  const [sectionLoading, setSectionLoading] = useState({
    progress: false, // For class progress loading (non-blocking)
  })
  const [sendingNotifications, setSendingNotifications] = useState(false)
  const [bulkSending, setBulkSending] = useState(false)
  const [generatingReports, setGeneratingReports] = useState(false)
  const [resettingReports, setResettingReports] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [testModeEnabled, setTestModeEnabled] = useState(true) // Toggle for testing
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadInitialData = useCallback(async () => {
    // 🎯 UX IMPROVEMENT: Use global loading with meaningful message
    startPageTransition("Đang tải thông tin kỳ báo cáo...")
    try {
      setError(null)

      const [periodsResult, academicResult, blocksResult] = await Promise.all([
        getReportPeriodsAction(),
        getAcademicYearsLightAction(),
        getActiveClassBlocksAction()
      ])

      // Batch state updates to prevent multiple re-renders
      if (periodsResult.success) {
        setReportPeriods(periodsResult.data || [])
      } else {
        setError(periodsResult.error || 'Failed to load report periods')
        return // Early return on error
      }

      if (academicResult.success) {
        // Academic years already in lightweight { id, name } format
        setAcademicYears(academicResult.data || [])
      }

      if (blocksResult.success) {
        setClassBlocks(blocksResult.data || [])
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      setError('Failed to load data')
    } finally {
      stopLoading()
    }
  }, [startPageTransition, stopLoading])

  const loadClassProgress = useCallback(async () => {
    if (!selectedPeriod) return

    try {
      // 📊 Use section loading for non-blocking progress loading
      setSectionLoading(prev => ({ ...prev, progress: true }))
      const classBlockFilter = selectedClassBlock === "all-blocks" ? undefined : selectedClassBlock
      const result = await getClassProgressAction(
        selectedPeriod,
        classBlockFilter
      )

      if (result.success) {
        setClassProgress(result.data || [])
      } else {
        toast.error(result.error || 'Failed to load class progress')
      }
    } catch (error) {
      console.error('Error loading class progress:', error)
      toast.error('Failed to load class progress')
    } finally {
      setSectionLoading(prev => ({ ...prev, progress: false }))
    }
  }, [selectedPeriod, selectedClassBlock])

  const handleCreateSuccess = useCallback(async () => {
    setShowCreateForm(false)

    // Only reload report periods data, not the entire page
    try {
      const result = await getReportPeriodsAction()
      if (result.success) {
        setReportPeriods(result.data || [])
        toast.success('Report period created successfully')
      } else {
        toast.error(result.error || 'Failed to refresh report periods')
      }
    } catch (error) {
      console.error('Error refreshing report periods:', error)
      toast.error('Failed to refresh report periods')
    }
  }, [])

  const handleRefresh = useCallback(() => {
    loadInitialData()
    if (selectedPeriod) {
      loadClassProgress()
    }
  }, [loadInitialData, selectedPeriod, loadClassProgress])

  const filteredClassProgress = useMemo(() => {
    if (selectedCompletionStatus === "all") return classProgress
    return classProgress.filter(c => c.status === selectedCompletionStatus)
  }, [classProgress, selectedCompletionStatus])

  const stats = useMemo(() => {
    const total = classProgress.length
    const complete = classProgress.filter(c => c.status === 'complete').length
    const incomplete = total - complete
    return { total, complete, incomplete }
  }, [classProgress])

  const incompleteClasses = useMemo(() => {
    return classProgress.filter(c => c.status === 'incomplete')
  }, [classProgress])

  const handleSendNotifications = useCallback(async () => {
    if (incompleteClasses.length === 0) {
      toast.info('Không có lớp nào chưa hoàn thành báo cáo')
      return
    }

    if (!selectedPeriod) {
      toast.error('Vui lòng chọn kỳ báo cáo')
      return
    }

    setSendingNotifications(true)
    try {
      const result = await sendTeacherRemindersAction(selectedPeriod, incompleteClasses)

      if (result.success) {
        toast.success(result.data?.message || 'Đã gửi thông báo thành công')
      } else {
        toast.error(result.error || 'Không thể gửi thông báo')
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
      toast.error('Có lỗi xảy ra khi gửi thông báo')
    } finally {
      setSendingNotifications(false)
    }
  }, [incompleteClasses, selectedPeriod])

  const handleBulkSendReports = useCallback(async () => {
    if (!selectedPeriod) {
      toast.error('Vui lòng chọn kỳ báo cáo')
      return
    }

    // In test mode, allow sending even if not 100% complete
    if (!testModeEnabled) {
      const allComplete = stats.incomplete === 0 && stats.total > 0
      if (!allComplete) {
        toast.error('Tất cả các lớp phải hoàn thành 100% báo cáo trước khi gửi cho phụ huynh')
        return
      }
    }

    setBulkSending(true)
    try {
      const result = await adminBulkSendReportsAction(selectedPeriod)

      if (result.success) {
        toast.success(result.data?.message || 'Đã gửi tất cả báo cáo cho phụ huynh thành công')
        loadClassProgress() // Reload to get updated data
      } else {
        toast.error(result.error || 'Không thể gửi báo cáo')
      }
    } catch (error) {
      console.error('Error bulk sending reports:', error)
      toast.error('Có lỗi xảy ra khi gửi báo cáo')
    } finally {
      setBulkSending(false)
    }
  }, [selectedPeriod, stats, testModeEnabled, loadClassProgress])

  // Generate student reports handler
  const handleGenerateReports = useCallback(async () => {
    if (!selectedPeriod) {
      toast.error('Vui lòng chọn kỳ báo cáo')
      return
    }

    setGeneratingReports(true)
    try {
      const result = await generateStudentReportsAction(selectedPeriod)

      if (result.success) {
        toast.success(result.data?.message || 'Đã tạo báo cáo học sinh thành công')
        loadClassProgress() // Reload to get updated data
      } else {
        toast.error(result.error || 'Không thể tạo báo cáo học sinh')
      }
    } catch (error) {
      console.error('Error generating reports:', error)
      toast.error('Có lỗi xảy ra khi tạo báo cáo học sinh')
    } finally {
      setGeneratingReports(false)
    }
  }, [selectedPeriod, loadClassProgress])

  // Reset reports to draft handler (for testing)
  const handleResetReports = useCallback(async () => {
    if (!selectedPeriod) {
      toast.error('Vui lòng chọn kỳ báo cáo')
      return
    }

    setResettingReports(true)
    try {
      const result = await resetReportsToDraftAction(selectedPeriod)

      if (result.success) {
        toast.success(result.data?.message || 'Đã reset báo cáo về trạng thái draft')
        loadClassProgress() // Reload to get updated data
      } else {
        toast.error(result.error || 'Không thể reset báo cáo')
      }
    } catch (error) {
      console.error('Error resetting reports:', error)
      toast.error('Có lỗi xảy ra khi reset báo cáo')
    } finally {
      setResettingReports(false)
    }
  }, [selectedPeriod, loadClassProgress])

  // Memoized toggle handler to prevent unnecessary re-renders
  const handleTestModeToggle = useCallback((checked: boolean) => {
    setTestModeEnabled(checked)
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    if (selectedPeriod) {
      // Debounce class progress loading to prevent excessive API calls
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        loadClassProgress()
      }, 300)
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [selectedPeriod, selectedClassBlock, loadClassProgress])

  if (coordinatedLoading.isLoading && reportPeriods.length === 0) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Academic Report Periods</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Kỳ báo cáo</h1>
            <p className="text-muted-foreground">
              Quản lý kỳ báo cáo hàng tháng và theo dõi tiến độ hoàn thành theo lớp
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo kỳ báo cáo
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Report Period Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Chọn kỳ báo cáo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">Kỳ báo cáo</div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn kỳ báo cáo" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name} ({period.academic_year?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPeriod && (
                <>
                  <div>
                    <div className="text-sm font-medium mb-2">Lọc theo khối lớp</div>
                    <Select value={selectedClassBlock} onValueChange={setSelectedClassBlock}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tất cả khối lớp" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-blocks">Tất cả khối lớp</SelectItem>
                        {classBlocks.map((block) => (
                          <SelectItem key={block.id} value={block.id}>
                            {block.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">Tình trạng hoàn thành</div>
                    <Select value={selectedCompletionStatus} onValueChange={setSelectedCompletionStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tất cả" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả</SelectItem>
                        <SelectItem value="complete">Đã hoàn thành</SelectItem>
                        <SelectItem value="incomplete">Chưa hoàn thành</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>

            {/* Test Mode Toggle */}
            {selectedPeriod && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-muted-foreground">
                    Test Mode: Cho phép gửi báo cáo khi chưa hoàn thành 100%
                  </div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={testModeEnabled}
                      onChange={(e) => handleTestModeToggle(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      testModeEnabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        testModeEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                    <span className="ml-2 text-sm font-medium">
                      {testModeEnabled ? 'Bật' : 'Tắt'}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {selectedPeriod && (
              <div className="space-y-3">
                {/* Bulk Send Reports Button */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {(() => {
                      if (stats.complete === stats.total && stats.total > 0) {
                        return 'Tất cả lớp đã hoàn thành báo cáo - có thể gửi cho phụ huynh'
                      }
                      const testModeText = testModeEnabled ? '(Test mode: có thể gửi)' : '(Cần hoàn thành 100%)'
                      return `${stats.incomplete} lớp chưa hoàn thành báo cáo ${testModeText}`
                    })()}
                  </div>
                  <Button
                    onClick={handleBulkSendReports}
                    disabled={bulkSending || stats.total === 0 || (!testModeEnabled && stats.incomplete > 0)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {bulkSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Gửi tất cả báo cáo cho phụ huynh
                      </>
                    )}
                  </Button>
                </div>

                {/* Generate Reports Button */}
                {selectedPeriod && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      Tạo báo cáo học sinh cho tất cả lớp chính
                    </div>
                    <Button
                      onClick={handleGenerateReports}
                      disabled={generatingReports}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {generatingReports ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Tạo báo cáo học sinh
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Reset Reports Button (for testing) */}
                {selectedPeriod && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      Reset báo cáo đã gửi về trạng thái draft (để test gửi lại)
                    </div>
                    <Button
                      onClick={handleResetReports}
                      disabled={resettingReports}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {resettingReports ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Đang reset...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset để test lại
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Send Notifications Button */}
                {incompleteClasses.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Nhắc nhở {incompleteClasses.length} giáo viên chưa hoàn thành
                    </div>
                    <Button
                      onClick={handleSendNotifications}
                      disabled={sendingNotifications}
                      variant="outline"
                      className="text-orange-600 border-orange-600 hover:bg-orange-50"
                    >
                      {sendingNotifications ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600 mr-2"></div>
                          Đang gửi...
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4 mr-2" />
                          Gửi thông báo nhắc nhở
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Overview */}
        {selectedPeriod && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tổng số lớp</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Hoàn thành</p>
                    <p className="text-2xl font-bold text-green-600">{stats.complete}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Chưa hoàn thành</p>
                    <p className="text-2xl font-bold text-red-600">{stats.incomplete}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Class Progress Table */}
        {selectedPeriod && (
          <Card>
            <CardHeader>
              <CardTitle>Tiến độ theo lớp</CardTitle>
            </CardHeader>
            <CardContent>
              <ClassProgressTable
                data={filteredClassProgress}
                loading={sectionLoading.progress}
              />
            </CardContent>
          </Card>
        )}

        {/* Create Form Modal */}
        <ReportPeriodForm
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSuccess={handleCreateSuccess}
          academicYears={academicYears}
        />
      </div>
    </div>
  )
}
