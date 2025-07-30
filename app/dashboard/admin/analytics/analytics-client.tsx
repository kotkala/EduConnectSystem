'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, TrendingUp, Users, BookOpen, GraduationCap, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  Line,
  ComposedChart,
  Area
} from 'recharts'
import {
  getOverallGradeStatsAction,
  getGradeDistributionAction,
  getClassPerformanceAction,
  getSubjectAnalysisAction,
  getTrendAnalysisAction
} from '@/lib/actions/analytics-actions'

interface OverallStats {
  totalSubmissions: number
  totalStudents: number
  totalClasses: number
  totalSubjects: number
}

interface GradeDistribution {
  name: string
  count: number
  percentage: number
}

interface ClassPerformance {
  className: string
  averageGrade: number
  studentCount: number
  totalGrades: number
}

interface SubjectAnalysis {
  subjectName: string
  category: string
  averageGrade: number
  highestGrade: number
  lowestGrade: number
  totalGrades: number
}

interface TrendData {
  period: string
  averageGrade: number
  totalGrades: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function AnalyticsClient() {
  const [loading, setLoading] = useState(false)
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null)
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution[]>([])
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([])
  const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [loadingStates, setLoadingStates] = useState({
    overall: false,
    distribution: false,
    classes: false,
    subjects: false,
    trends: false
  })

  useEffect(() => {
    loadAllAnalytics()
  }, [])

  const loadAllAnalytics = async () => {
    setLoading(true)
    await Promise.all([
      loadOverallStats(),
      loadGradeDistribution(),
      loadClassPerformance(),
      loadSubjectAnalysis(),
      loadTrendAnalysis()
    ])
    setLoading(false)
  }

  const loadOverallStats = async () => {
    setLoadingStates(prev => ({ ...prev, overall: true }))
    try {
      const result = await getOverallGradeStatsAction()
      if (result.success) {
        setOverallStats(result.data as OverallStats)
      } else {
        toast.error(result.error || "Không thể tải thống kê tổng quan")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải thống kê tổng quan")
    } finally {
      setLoadingStates(prev => ({ ...prev, overall: false }))
    }
  }

  const loadGradeDistribution = async () => {
    setLoadingStates(prev => ({ ...prev, distribution: true }))
    try {
      const result = await getGradeDistributionAction()
      if (result.success) {
        setGradeDistribution(result.data as GradeDistribution[])
      } else {
        toast.error(result.error || "Không thể tải phân bố điểm")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải phân bố điểm")
    } finally {
      setLoadingStates(prev => ({ ...prev, distribution: false }))
    }
  }

  const loadClassPerformance = async () => {
    setLoadingStates(prev => ({ ...prev, classes: true }))
    try {
      const result = await getClassPerformanceAction()
      if (result.success) {
        setClassPerformance(result.data as ClassPerformance[])
      } else {
        toast.error(result.error || "Không thể tải hiệu suất lớp")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải hiệu suất lớp")
    } finally {
      setLoadingStates(prev => ({ ...prev, classes: false }))
    }
  }

  const loadSubjectAnalysis = async () => {
    setLoadingStates(prev => ({ ...prev, subjects: true }))
    try {
      const result = await getSubjectAnalysisAction()
      if (result.success) {
        setSubjectAnalysis(result.data as SubjectAnalysis[])
      } else {
        toast.error(result.error || "Không thể tải phân tích môn học")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải phân tích môn học")
    } finally {
      setLoadingStates(prev => ({ ...prev, subjects: false }))
    }
  }

  const loadTrendAnalysis = async () => {
    setLoadingStates(prev => ({ ...prev, trends: true }))
    try {
      const result = await getTrendAnalysisAction()
      if (result.success) {
        setTrendData(result.data as TrendData[])
      } else {
        toast.error(result.error || "Không thể tải xu hướng điểm")
      }
    } catch {
      toast.error("Có lỗi xảy ra khi tải xu hướng điểm")
    } finally {
      setLoadingStates(prev => ({ ...prev, trends: false }))
    }
  }

  const handleExportReport = async () => {
    toast.info("Chức năng xuất báo cáo đang được phát triển")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Phân Tích Điểm Số</h1>
          <p className="text-gray-500">Dashboard thống kê và phân tích điểm số toàn trường</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadAllAnalytics}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Làm mới
          </Button>
          <Button
            onClick={handleExportReport}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Overall Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng bảng điểm</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.totalSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">Bảng điểm đã hoàn thành</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Học sinh</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Học sinh có điểm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lớp học</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.totalClasses || 0}</div>
            <p className="text-xs text-muted-foreground">Lớp có bảng điểm</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Môn học</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats?.totalSubjects || 0}</div>
            <p className="text-xs text-muted-foreground">Môn học có điểm</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Phân Bố Điểm Số</CardTitle>
            <CardDescription>Tỷ lệ học sinh theo từng mức điểm</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStates.distribution ? (
              <div className="h-80 flex items-center justify-center">Đang tải...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tỷ Lệ Phân Bố</CardTitle>
            <CardDescription>Phần trăm học sinh theo mức điểm</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStates.distribution ? (
              <div className="h-80 flex items-center justify-center">Đang tải...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={gradeDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="percentage"
                    nameKey="name"
                  >
                    {gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Hiệu Suất Lớp Học</CardTitle>
            <CardDescription>Điểm trung bình của các lớp</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStates.classes ? (
              <div className="h-80 flex items-center justify-center">Đang tải...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classPerformance.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="className" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Bar dataKey="averageGrade" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Xu Hướng Điểm Số</CardTitle>
            <CardDescription>Điểm trung bình qua các kỳ học</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStates.trends ? (
              <div className="h-80 flex items-center justify-center">Đang tải...</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis domain={[0, 10]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="averageGrade" fill="#8884d8" stroke="#8884d8" />
                  <Line type="monotone" dataKey="averageGrade" stroke="#ff7300" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Phân Tích Môn Học</CardTitle>
          <CardDescription>Hiệu suất chi tiết theo từng môn học</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStates.subjects ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : (
            <div className="space-y-3">
              {subjectAnalysis.slice(0, 10).map((subject) => (
                <div
                  key={subject.subjectName}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{subject.subjectName}</h4>
                    <p className="text-sm text-gray-500">
                      Danh mục: {subject.category} • {subject.totalGrades} điểm
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-sm text-gray-500">Trung bình</div>
                      <Badge variant={subject.averageGrade >= 8.5 ? 'default' : subject.averageGrade >= 7.0 ? 'secondary' : 'outline'}>
                        {subject.averageGrade.toFixed(1)}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Cao nhất</div>
                      <div className="font-medium text-green-600">{subject.highestGrade.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Thấp nhất</div>
                      <div className="font-medium text-red-600">{subject.lowestGrade.toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
