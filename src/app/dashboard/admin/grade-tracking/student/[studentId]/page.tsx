"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Badge } from "@/shared/components/ui/badge"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import {
  RefreshCw,
  ArrowLeft,
  BookOpen,
  AlertTriangle,
  History
} from "lucide-react"
import {
  getGradePeriodsAction,
  getStudentDetailedGradesAction,
  getStudentGradeHistoryAction
} from "@/lib/actions/admin-grade-tracking-actions"
import { AdminStudentGradeTable } from "@/shared/components/admin/admin-student-grade-table"

export default function StudentGradeDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const studentId = params.studentId as string
  const initialPeriodId = searchParams.get('period')

  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriodId || '')
  const [gradeHistory, setGradeHistory] = useState<Array<{
    id: string
    grade_id: string
    old_value: number | null
    new_value: number | null
    change_reason: string
    changed_at: string
    status: string
    subject_name: string
    component_type: string
    teacher_name: string
    admin_name?: string
  }>>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('grades')

  // TanStack Query: Optimized periods loading with caching
  const {
    data: periods = [],
    isLoading: periodsLoading,
    error: periodsError
  } = useQuery({
    queryKey: ['admin-grade-periods'],
    queryFn: async () => {
      const result = await getGradePeriodsAction()
      if (!result.success) {
        throw new Error(result.error || 'Không thể tải danh sách kỳ báo cáo')
      }
      return result.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // TanStack Query: Optimized student grades loading
  const {
    data: studentData,
    isLoading: gradesLoading,
    error: gradesError,
    refetch: refetchGrades
  } = useQuery({
    queryKey: ['student-detailed-grades', selectedPeriod, studentId],
    queryFn: async () => {
      if (!selectedPeriod || !studentId) return null
      const result = await getStudentDetailedGradesAction(selectedPeriod, studentId)
      if (!result.success) {
        throw new Error(result.error || 'Không thể tải dữ liệu điểm số')
      }
      return result.data || null
    },
    enabled: !!(selectedPeriod && studentId),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  // Computed values
  const loading = useMemo(() => periodsLoading || gradesLoading, [periodsLoading, gradesLoading])
  const error = useMemo(() =>
    periodsError?.message || gradesError?.message || null,
    [periodsError, gradesError]
  )

  // Auto-select first period when periods are loaded
  useMemo(() => {
    if (!selectedPeriod && periods.length > 0) {
      setSelectedPeriod(periods[0].id)
    }
  }, [periods, selectedPeriod])

  // Optimized refresh function using TanStack Query
  const handleRefreshGrades = useCallback(() => {
    refetchGrades()
  }, [refetchGrades])

  const loadGradeHistory = useCallback(async () => {
    if (!selectedPeriod) return

    setHistoryLoading(true)
    try {
      const result = await getStudentGradeHistoryAction(studentId, selectedPeriod)
      if (result.success && result.data) {
        setGradeHistory(result.data)
      }
    } catch (error) {
      console.error('Error loading grade history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }, [selectedPeriod, studentId])

  // Only load grade history when the history tab is active
  useEffect(() => {
    if (activeTab === 'history') {
      loadGradeHistory()
    }
  }, [activeTab, loadGradeHistory])



  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Chi tiết điểm số học sinh</h1>
          <p className="text-muted-foreground">
            Xem chi tiết điểm số của học sinh theo từng kỳ báo cáo
          </p>
        </div>
        <div className="ml-auto">
          <Button variant="outline" onClick={handleRefreshGrades} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn kỳ báo cáo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Chọn kỳ báo cáo" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{period.name} - {period.academic_years?.[0]?.name} - {period.semesters?.[0]?.name}</span>
                      {period.is_active && (
                        <Badge variant="outline" className="ml-2 text-xs">Đang hoạt động</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPeriod && (
              <div className="text-sm text-muted-foreground">
                Kỳ: {periods.find(p => p.id === selectedPeriod)?.name}
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
            <p className="text-lg">Đang tải dữ liệu điểm số...</p>
          </div>
        </div>
      )}

      {/* Tabs for Grades and History */}
      {!loading && studentData && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grades" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Bảng điểm
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Lịch sử thay đổi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grades" className="mt-6">
            <AdminStudentGradeTable studentData={studentData} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Lịch sử thay đổi điểm số
                </CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                    Đang tải lịch sử...
                  </div>
                ) : gradeHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Chưa có lịch sử thay đổi điểm số
                  </div>
                ) : (
                  <div className="space-y-4">
                    {gradeHistory.map((history) => (
                      <div key={history.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={
                              history.status === 'approved' ? 'default' :
                              history.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {history.status === 'approved' ? 'Đã duyệt' :
                               history.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                            </Badge>
                            <span className="font-medium">{history.subject_name}</span>
                            <span className="text-sm text-gray-500">
                              ({history.component_type === 'midterm' ? 'Giữa kì' :
                                history.component_type === 'final' ? 'Cuối kì' : 'Thường xuyên'})
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(history.changed_at).toLocaleString('vi-VN')}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Điểm cũ:</span>
                            <span className="ml-2 font-medium">
                              {history.old_value !== null ? history.old_value : 'Chưa có'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Điểm mới:</span>
                            <span className="ml-2 font-medium text-blue-600">
                              {history.new_value !== null ? history.new_value : 'Chưa có'}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-gray-600 text-sm">Lý do:</span>
                          <p className="mt-1 text-sm">{history.change_reason}</p>
                        </div>

                        <div className="text-xs text-gray-500">
                          Thay đổi bởi: {history.teacher_name}
                          {history.admin_name && (
                            <span> • Xử lý bởi: {history.admin_name}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* No Data State */}
      {!loading && !studentData && !error && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Chưa có dữ liệu điểm</h3>
            <p className="text-muted-foreground mb-4">
              Chưa có dữ liệu điểm số cho học sinh này trong kỳ báo cáo đã chọn
            </p>
            <Button variant="outline" onClick={handleRefreshGrades}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}