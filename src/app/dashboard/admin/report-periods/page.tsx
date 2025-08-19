"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { usePageTransition } from '@/shared/components/ui/global-loading-provider'
import { useCoordinatedLoading } from '@/shared/hooks/use-coordinated-loading'
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
import { ReportPeriodForm } from "@/features/admin-management/components/admin/report-periods/report-period-form"
import { ClassProgressTable } from "@/features/admin-management/components/admin/report-periods/class-progress-table"
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

import { getAcademicYearsLightAction } from "@/features/admin-management/actions/academic-actions"
import { getActiveClassBlocksAction } from "@/lib/actions/class-block-actions"

export default function ReportPeriodsPage() {
  const [reportPeriods, setReportPeriods] = useState<ReportPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [classProgress, setClassProgress] = useState<ClassProgress[]>([])
  const [academicYears, setAcademicYears] = useState<Array<{ id: string; name: string }>>([])
  const [classBlocks, setClassBlocks] = useState<Array<{ id: string; name: string }>>([])
  const [selectedClassBlock, setSelectedClassBlock] = useState<string>("all-blocks")
  const [selectedCompletionStatus, setSelectedCompletionStatus] = useState<string>("all")
  // ðŸš€ MIGRATION: Replace scattered loading with coordinated system  
  const { startPageTransition, stopLoading } = usePageTransition()
  const coordinatedLoading = useCoordinatedLoading()
  
  const [error, setError] = useState<string | null>(null)
  // ðŸ“Š Section loading for non-blocking components
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
    // ðŸŽ¯ UX IMPROVEMENT: Use global loading with meaningful message
    startPageTransition("Äang táº£i thÃ´ng tin ká»³ bÃ¡o cÃ¡o...")
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
      // ðŸ“Š Use section loading for non-blocking progress loading
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
      toast.info('KhÃ´ng cÃ³ lá»›p nÃ o chÆ°a hoÃ n thÃ nh bÃ¡o cÃ¡o')
      return
    }

    if (!selectedPeriod) {
      toast.error('Vui lÃ²ng chá»n ká»³ bÃ¡o cÃ¡o')
      return
    }

    setSendingNotifications(true)
    try {
      const result = await sendTeacherRemindersAction(selectedPeriod, incompleteClasses)

      if (result.success) {
        toast.success(result.data?.message || 'ÄÃ£ gá»­i thÃ´ng bÃ¡o thÃ nh cÃ´ng')
      } else {
        toast.error(result.error || 'KhÃ´ng thá»ƒ gá»­i thÃ´ng bÃ¡o')
      }
    } catch (error) {
      console.error('Error sending notifications:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi gá»­i thÃ´ng bÃ¡o')
    } finally {
      setSendingNotifications(false)
    }
  }, [incompleteClasses, selectedPeriod])

  const handleBulkSendReports = useCallback(async () => {
    if (!selectedPeriod) {
      toast.error('Vui lÃ²ng chá»n ká»³ bÃ¡o cÃ¡o')
      return
    }

    // In test mode, allow sending even if not 100% complete
    if (!testModeEnabled) {
      const allComplete = stats.incomplete === 0 && stats.total > 0
      if (!allComplete) {
        toast.error('Táº¥t cáº£ cÃ¡c lá»›p pháº£i hoÃ n thÃ nh 100% bÃ¡o cÃ¡o trÆ°á»›c khi gá»­i cho phá»¥ huynh')
        return
      }
    }

    setBulkSending(true)
    try {
      const result = await adminBulkSendReportsAction(selectedPeriod)

      if (result.success) {
        toast.success(result.data?.message || 'ÄÃ£ gá»­i táº¥t cáº£ bÃ¡o cÃ¡o cho phá»¥ huynh thÃ nh cÃ´ng')
        loadClassProgress() // Reload to get updated data
      } else {
        toast.error(result.error || 'KhÃ´ng thá»ƒ gá»­i bÃ¡o cÃ¡o')
      }
    } catch (error) {
      console.error('Error bulk sending reports:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi gá»­i bÃ¡o cÃ¡o')
    } finally {
      setBulkSending(false)
    }
  }, [selectedPeriod, stats, testModeEnabled, loadClassProgress])

  // Generate student reports handler
  const handleGenerateReports = useCallback(async () => {
    if (!selectedPeriod) {
      toast.error('Vui lÃ²ng chá»n ká»³ bÃ¡o cÃ¡o')
      return
    }

    setGeneratingReports(true)
    try {
      const result = await generateStudentReportsAction(selectedPeriod)

      if (result.success) {
        toast.success(result.data?.message || 'ÄÃ£ táº¡o bÃ¡o cÃ¡o há»c sinh thÃ nh cÃ´ng')
        loadClassProgress() // Reload to get updated data
      } else {
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº¡o bÃ¡o cÃ¡o há»c sinh')
      }
    } catch (error) {
      console.error('Error generating reports:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi táº¡o bÃ¡o cÃ¡o há»c sinh')
    } finally {
      setGeneratingReports(false)
    }
  }, [selectedPeriod, loadClassProgress])

  // Reset reports to draft handler (for testing)
  const handleResetReports = useCallback(async () => {
    if (!selectedPeriod) {
      toast.error('Vui lÃ²ng chá»n ká»³ bÃ¡o cÃ¡o')
      return
    }

    setResettingReports(true)
    try {
      const result = await resetReportsToDraftAction(selectedPeriod)

      if (result.success) {
        toast.success(result.data?.message || 'ÄÃ£ reset bÃ¡o cÃ¡o vá» tráº¡ng thÃ¡i draft')
        loadClassProgress() // Reload to get updated data
      } else {
        toast.error(result.error || 'KhÃ´ng thá»ƒ reset bÃ¡o cÃ¡o')
      }
    } catch (error) {
      console.error('Error resetting reports:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi reset bÃ¡o cÃ¡o')
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
            <h1 className="text-3xl font-bold">Ká»³ bÃ¡o cÃ¡o</h1>
            <p className="text-muted-foreground">
              Quáº£n lÃ½ ká»³ bÃ¡o cÃ¡o hÃ ng thÃ¡ng vÃ  theo dÃµi tiáº¿n Ä‘á»™ hoÃ n thÃ nh theo lá»›p
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              LÃ m má»›i
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Táº¡o ká»³ bÃ¡o cÃ¡o
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
              Chá»n ká»³ bÃ¡o cÃ¡o
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">Ká»³ bÃ¡o cÃ¡o</div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chá»n ká»³ bÃ¡o cÃ¡o" />
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
                    <div className="text-sm font-medium mb-2">Lá»c theo khá»‘i lá»›p</div>
                    <Select value={selectedClassBlock} onValueChange={setSelectedClassBlock}>
                      <SelectTrigger>
                        <SelectValue placeholder="Táº¥t cáº£ khá»‘i lá»›p" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-blocks">Táº¥t cáº£ khá»‘i lá»›p</SelectItem>
                        {classBlocks.map((block) => (
                          <SelectItem key={block.id} value={block.id}>
                            {block.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-2">TÃ¬nh tráº¡ng hoÃ n thÃ nh</div>
                    <Select value={selectedCompletionStatus} onValueChange={setSelectedCompletionStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Táº¥t cáº£" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Táº¥t cáº£</SelectItem>
                        <SelectItem value="complete">ÄÃ£ hoÃ n thÃ nh</SelectItem>
                        <SelectItem value="incomplete">ChÆ°a hoÃ n thÃ nh</SelectItem>
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
                    Test Mode: Cho phÃ©p gá»­i bÃ¡o cÃ¡o khi chÆ°a hoÃ n thÃ nh 100%
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
                      {testModeEnabled ? 'Báº­t' : 'Táº¯t'}
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
                        return 'Táº¥t cáº£ lá»›p Ä‘Ã£ hoÃ n thÃ nh bÃ¡o cÃ¡o - cÃ³ thá»ƒ gá»­i cho phá»¥ huynh'
                      }
                      const testModeText = testModeEnabled ? '(Test mode: cÃ³ thá»ƒ gá»­i)' : '(Cáº§n hoÃ n thÃ nh 100%)'
                      return `${stats.incomplete} lá»›p chÆ°a hoÃ n thÃ nh bÃ¡o cÃ¡o ${testModeText}`
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
                        Äang gá»­i...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4 mr-2" />
                        Gá»­i táº¥t cáº£ bÃ¡o cÃ¡o cho phá»¥ huynh
                      </>
                    )}
                  </Button>
                </div>

                {/* Generate Reports Button */}
                {selectedPeriod && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      Táº¡o bÃ¡o cÃ¡o há»c sinh cho táº¥t cáº£ lá»›p chÃ­nh
                    </div>
                    <Button
                      onClick={handleGenerateReports}
                      disabled={generatingReports}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {generatingReports ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Äang táº¡o...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Táº¡o bÃ¡o cÃ¡o há»c sinh
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Reset Reports Button (for testing) */}
                {selectedPeriod && (
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-muted-foreground">
                      Reset bÃ¡o cÃ¡o Ä‘Ã£ gá»­i vá» tráº¡ng thÃ¡i draft (Ä‘á»ƒ test gá»­i láº¡i)
                    </div>
                    <Button
                      onClick={handleResetReports}
                      disabled={resettingReports}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      {resettingReports ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Äang reset...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset Ä‘á»ƒ test láº¡i
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Send Notifications Button */}
                {incompleteClasses.length > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Nháº¯c nhá»Ÿ {incompleteClasses.length} giÃ¡o viÃªn chÆ°a hoÃ n thÃ nh
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
                          Äang gá»­i...
                        </>
                      ) : (
                        <>
                          <Bell className="h-4 w-4 mr-2" />
                          Gá»­i thÃ´ng bÃ¡o nháº¯c nhá»Ÿ
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
                    <p className="text-sm font-medium text-muted-foreground">Tá»•ng sá»‘ lá»›p</p>
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
                    <p className="text-sm font-medium text-muted-foreground">HoÃ n thÃ nh</p>
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
                    <p className="text-sm font-medium text-muted-foreground">ChÆ°a hoÃ n thÃ nh</p>
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
              <CardTitle>Tiáº¿n Ä‘á»™ theo lá»›p</CardTitle>
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
