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
import { Plus, Calendar, Users, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
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
  const [loading, setLoading] = useState(true)
  const [progressLoading, setProgressLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  const stats = useMemo(() => {
    const total = classProgress.length
    const complete = classProgress.filter(c => c.status === 'complete').length
    const incomplete = total - complete
    return { total, complete, incomplete }
  }, [classProgress])

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
            <h1 className="text-3xl font-bold">Academic Report Periods</h1>
            <p className="text-muted-foreground">
              Manage monthly reporting periods and track class progress
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Report Period
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
              Select Report Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">Report Period</div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a report period" />
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
                <div>
                  <div className="text-sm font-medium mb-2">Class Block Filter</div>
                  <Select value={selectedClassBlock} onValueChange={setSelectedClassBlock}>
                    <SelectTrigger>
                      <SelectValue placeholder="All class blocks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-blocks">All class blocks</SelectItem>
                      {classBlocks.map((block) => (
                        <SelectItem key={block.id} value={block.id}>
                          {block.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Overview */}
        {selectedPeriod && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Classes</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Complete</p>
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
                    <p className="text-sm font-medium text-muted-foreground">Incomplete</p>
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
              <CardTitle>Class Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ClassProgressTable 
                data={classProgress}
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
