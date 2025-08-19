"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Badge } from "@/shared/components/ui/badge"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import {
  RefreshCw,
  ArrowLeft,
  BookOpen,
  AlertTriangle
} from "lucide-react"
import {
  getGradePeriodsAction,
  getStudentDetailedGradesAction,
  type GradePeriod,
  type StudentDetailedGrades
} from "@/features/grade-management/actions/admin-grade-tracking-actions"
import { AdminStudentGradeTable } from "@/features/admin-management/components/admin/admin-student-grade-table"

export default function StudentGradeDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const studentId = params.studentId as string
  const initialPeriodId = searchParams.get('period')

  const [periods, setPeriods] = useState<GradePeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>(initialPeriodId || '')
  const [studentData, setStudentData] = useState<StudentDetailedGrades | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load grade periods
  const loadPeriods = useCallback(async () => {
    try {
      const result = await getGradePeriodsAction()
      if (result.success && result.data) {
        setPeriods(result.data)
        if (!selectedPeriod && result.data.length > 0) {
          setSelectedPeriod(result.data[0].id)
        }
      } else {
        setError(result.error || 'Không thể tải danh sách kỳ báo cáo')
      }
    } catch (error) {
      console.error('Error loading periods:', error)
      setError('Không thể tải danh sách kỳ báo cáo')
    }
  }, [selectedPeriod])

  // Load student detailed grades
  const loadStudentGrades = useCallback(async () => {
    if (!selectedPeriod || !studentId) return

    setLoading(true)
    setError(null)

    try {
      const result = await getStudentDetailedGradesAction(selectedPeriod, studentId)
      if (result.success) {
        setStudentData(result.data || null)
      } else {
        setError(result.error || 'Không thể tải dữ liệu điểm số')
      }
    } catch (error) {
      console.error('Error loading student grades:', error)
      setError('Không thể tải dữ liệu điểm số')
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod, studentId])

  useEffect(() => {
    loadPeriods()
  }, [loadPeriods])

  useEffect(() => {
    loadStudentGrades()
  }, [loadStudentGrades])



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
          <Button variant="outline" onClick={loadStudentGrades} disabled={loading}>
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
                    <div className="flex items-center gap-2">
                      <span>{period.name}</span>
                      {period.is_active && (
                        <Badge variant="outline" className="text-xs">Đang hoạt động</Badge>
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

      {/* Student Grade Table */}
      {!loading && studentData && (
        <AdminStudentGradeTable studentData={studentData} />
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
            <Button variant="outline" onClick={loadStudentGrades}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Thử lại
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
