'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, TrendingUp, Users, BookOpen, GraduationCap, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

import dynamic from 'next/dynamic'

// Lazy load individual chart components to reduce initial bundle size
interface ChartData {
  name?: string
  count?: number
  percentage?: number
  className?: string
  averageGrade?: number
  period?: string
  submissions?: number
}

interface ChartProps {
  readonly data: ChartData[]
  readonly colors?: readonly string[]
}

import { LoadingFallback } from '@/components/ui/loading-fallback'
const BarChartComponent = dynamic(() => import('recharts').then(mod => ({
  default: ({ data }: ChartProps) => (
    <mod.ResponsiveContainer width="100%" height={300}>
      <mod.BarChart data={data}>
        <mod.CartesianGrid strokeDasharray="3 3" />
        <mod.XAxis dataKey="name" />
        <mod.YAxis />
        <mod.Tooltip />
        <mod.Bar dataKey="count" fill="#8884d8" />
      </mod.BarChart>
    </mod.ResponsiveContainer>
  )
})), {
  ssr: false,
  loading: () => <LoadingFallback size="lg" className="h-80 flex items-center justify-center" />
})

const PieChartComponent = dynamic(() => import('recharts').then(mod => ({
  default: ({ data, colors }: ChartProps) => (
    <mod.ResponsiveContainer width="100%" height={300}>
      <mod.PieChart>
        <mod.Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          dataKey="percentage"
          nameKey="name"
        >
          {data.map((entry, index) => (
            <mod.Cell key={entry.name} fill={colors?.[index % (colors?.length || 1)] || '#8884d8'} />
          ))}
        </mod.Pie>
        <mod.Tooltip />
        <mod.Legend />
      </mod.PieChart>
    </mod.ResponsiveContainer>
  )
})), {
  ssr: false,
  loading: () => <LoadingFallback size="lg" className="h-80 flex items-center justify-center" />
})

const ComposedChartComponent = dynamic(() => import('recharts').then(mod => ({
  default: ({ data }: ChartProps) => (
    <mod.ResponsiveContainer width="100%" height={300}>
      <mod.ComposedChart data={data}>
        <mod.CartesianGrid strokeDasharray="3 3" />
        <mod.XAxis dataKey="period" />
        <mod.YAxis />
        <mod.Tooltip />
        <mod.Area type="monotone" dataKey="averageGrade" fill="#8884d8" stroke="#8884d8" />
        <mod.Line type="monotone" dataKey="averageGrade" stroke="#ff7300" strokeWidth={2} />
      </mod.ComposedChart>
    </mod.ResponsiveContainer>
  )
})), {
  ssr: false,
  loading: () => <LoadingFallback size="lg" className="h-80 flex items-center justify-center" />
})
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

// Helper function to get badge variant based on average grade
function getBadgeVariant(averageGrade: number): 'default' | 'secondary' | 'outline' {
  if (averageGrade >= 8.5) return 'default'
  if (averageGrade >= 7.0) return 'secondary'
  return 'outline'
}

// Helper function to create a generic data loader
function createDataLoader<T>(
  setData: (data: T) => void,
  setLoadingState: (key: string, loading: boolean) => void,
  loadingKey: string,
  errorMessage: string
) {
  return async (apiCall: () => Promise<{ success: boolean; data?: unknown; error?: string }>) => {
    setLoadingState(loadingKey, true);
    try {
      const result = await apiCall();
      if (result.success && result.data) {
        setData(result.data as T);
      } else {
        toast.error(result.error || errorMessage);
      }
    } catch {
      toast.error(`Có lỗi xảy ra khi ${errorMessage.toLowerCase()}`);
    } finally {
      setLoadingState(loadingKey, false);
    }
  };
}

// Helper function to update loading states
function createLoadingStateUpdater(setLoadingStates: React.Dispatch<React.SetStateAction<{
  overall: boolean;
  distribution: boolean;
  classes: boolean;
  subjects: boolean;
  trends: boolean;
}>>) {
  return (key: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [key]: loading }));
  };
}

// Statistics Cards Component
function StatisticsCards({ overallStats }: { readonly overallStats: OverallStats | null }) {
  const statsData = [
    {
      title: "Tổng bảng điểm",
      value: overallStats?.totalSubmissions || 0,
      description: "Bảng điểm đã hoàn thành",
      icon: GraduationCap
    },
    {
      title: "Học sinh",
      value: overallStats?.totalStudents || 0,
      description: "Học sinh có điểm",
      icon: Users
    },
    {
      title: "Lớp học",
      value: overallStats?.totalClasses || 0,
      description: "Lớp có bảng điểm",
      icon: BookOpen
    },
    {
      title: "Môn học",
      value: overallStats?.totalSubjects || 0,
      description: "Môn học có điểm",
      icon: BarChart3
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statsData.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

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
  const [lastFetch, setLastFetch] = useState<number>(0)

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000

  // Create loading state updater
  const updateLoadingState = createLoadingStateUpdater(setLoadingStates)

  // Create data loaders
  const loadOverallStats = createDataLoader(
    setOverallStats,
    updateLoadingState,
    'overall',
    'Không thể tải thống kê tổng quan'
  )

  const loadGradeDistribution = createDataLoader(
    setGradeDistribution,
    updateLoadingState,
    'distribution',
    'Không thể tải phân bố điểm'
  )

  const loadClassPerformance = createDataLoader(
    setClassPerformance,
    updateLoadingState,
    'classes',
    'Không thể tải hiệu suất lớp'
  )

  const loadSubjectAnalysis = createDataLoader(
    setSubjectAnalysis,
    updateLoadingState,
    'subjects',
    'Không thể tải phân tích môn học'
  )

  const loadTrendAnalysis = createDataLoader(
    setTrendData,
    updateLoadingState,
    'trends',
    'Không thể tải xu hướng điểm'
  )

  const loadAllAnalytics = useCallback(async (forceRefresh = false) => {
    // Check cache validity
    const now = Date.now()
    const isCacheValid = !forceRefresh && (now - lastFetch) < CACHE_DURATION && overallStats !== null

    if (isCacheValid) {
      return // Use cached data
    }

    setLoading(true)
    try {
      // Load critical data first (overall stats and distribution)
      await Promise.all([
        loadOverallStats(getOverallGradeStatsAction),
        loadGradeDistribution(getGradeDistributionAction)
      ])

      // Load secondary data with slight delay to improve perceived performance
      setTimeout(async () => {
        await Promise.all([
          loadClassPerformance(getClassPerformanceAction),
          loadSubjectAnalysis(getSubjectAnalysisAction),
          loadTrendAnalysis(getTrendAnalysisAction)
        ])
      }, 100)

      setLastFetch(now)
    } finally {
      setLoading(false)
    }
  }, [loadOverallStats, loadGradeDistribution, loadClassPerformance, loadSubjectAnalysis, loadTrendAnalysis, lastFetch, overallStats, CACHE_DURATION])

  useEffect(() => {
    loadAllAnalytics()
  }, [loadAllAnalytics])

  const handleExportReport = async () => {
    toast.info("Chức năng xuất báo cáo đang được phát triển")
  }

  // Memoize chart data to prevent unnecessary re-renders
  const chartData = useMemo(() => ({
    gradeDistribution: gradeDistribution.slice(0, 4), // Limit data for performance
    classPerformance: classPerformance.slice(0, 10), // Top 10 classes only
    subjectAnalysis: subjectAnalysis.slice(0, 10), // Top 10 subjects only
    trendData: trendData.slice(-12) // Last 12 periods only
  }), [gradeDistribution, classPerformance, subjectAnalysis, trendData])

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
            onClick={() => loadAllAnalytics(true)}
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
      <StatisticsCards overallStats={overallStats} />

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
              <BarChartComponent data={chartData.gradeDistribution} />
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
              <PieChartComponent data={chartData.gradeDistribution} colors={COLORS} />
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
              <BarChartComponent data={chartData.classPerformance} />
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
              <ComposedChartComponent data={chartData.trendData} />
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
              {chartData.subjectAnalysis.map((subject) => (
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
                      <Badge variant={getBadgeVariant(subject.averageGrade)}>
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
