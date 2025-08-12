"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Calendar, Users, CheckCircle, AlertCircle, RefreshCw, Bell } from "lucide-react"
import { toast } from "sonner"
import { ReportPeriodForm } from "@/components/admin/report-periods/report-period-form"
import { ClassProgressTable } from "@/components/admin/report-periods/class-progress-table"
import {
  getReportPeriodsAction,
  getClassProgressAction,
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
  const [loading, setLoading] = useState(true)
  const [progressLoading, setProgressLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendingNotifications, setSendingNotifications] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true)
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
      setLoading(false)
    }
  }, [])

  const loadClassProgress = useCallback(async () => {
    if (!selectedPeriod) return

    try {
      setProgressLoading(true)
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
      setProgressLoading(false)
    }
  }, [selectedPeriod, selectedClassBlock])

  const handleCreateSuccess = useCallback(() => {
    setShowCreateForm(false)
    loadInitialData()
    toast.success('Report period created successfully')
  }, [loadInitialData])

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

    setSendingNotifications(true)
    try {
      // Create notification for incomplete classes
      const teacherIds = incompleteClasses.map(c => c.homeroom_teacher_id).filter(Boolean)
      const uniqueTeacherIds = [...new Set(teacherIds)]

      if (uniqueTeacherIds.length === 0) {
        toast.error('Không tìm thấy giáo viên chủ nhiệm')
        return
      }

      // Here you would call your notification action with the data
      // const selectedPeriodData = reportPeriods.find(p => p.id === selectedPeriod)
      // const notificationData = {
      //   title: `Nhắc nhở nộp báo cáo ${selectedPeriodData?.name}`,
      //   content: `Kính gửi thầy/cô, lớp của thầy/cô chưa hoàn thành báo cáo cho kỳ ${selectedPeriodData?.name}. Vui lòng hoàn thành báo cáo trước thời hạn.`,
      //   target_roles: ['teacher'],
      //   target_user_ids: uniqueTeacherIds,
      //   priority: 'high'
      // }
      // const result = await sendNotificationAction(notificationData)

      toast.success(`Đã gửi thông báo tới ${uniqueTeacherIds.length} giáo viên chủ nhiệm`)
    } catch (error) {
      console.error('Error sending notifications:', error)
      toast.error('Có lỗi xảy ra khi gửi thông báo')
    } finally {
      setSendingNotifications(false)
    }
  }, [incompleteClasses])

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

  if (loading) {
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

            {/* Send Notifications Button */}
            {selectedPeriod && incompleteClasses.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {incompleteClasses.length} lớp chưa hoàn thành báo cáo
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
                loading={progressLoading}
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
