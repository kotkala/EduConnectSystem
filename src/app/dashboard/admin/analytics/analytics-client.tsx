'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePageTransition } from '@/shared/components/ui/global-loading-provider'
import { useCoordinatedLoading } from '@/shared/hooks/use-coordinated-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
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

import { LoadingFallback } from '@/shared/components/ui/loading-fallback'
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

// ðŸ§¹ CLEANUP: Removed unused createDataLoader helper function

// Statistics Cards Component
function StatisticsCards({ overallStats }: { readonly overallStats: OverallStats | null }) {
  const statsData = [
    {
      title: "Tá»•ng báº£ng Ä‘iá»ƒm",
      value: overallStats?.totalSubmissions || 0,
      description: "Báº£ng Ä‘iá»ƒm Ä‘Ã£ hoÃ n thÃ nh",
      icon: GraduationCap
    },
    {
      title: "Há»c sinh",
      value: overallStats?.totalStudents || 0,
      description: "Há»c sinh cÃ³ Ä‘iá»ƒm",
      icon: Users
    },
    {
      title: "Lá»›p há»c",
      value: overallStats?.totalClasses || 0,
      description: "Lá»›p cÃ³ báº£ng Ä‘iá»ƒm",
      icon: BookOpen
    },
    {
      title: "MÃ´n há»c",
      value: overallStats?.totalSubjects || 0,
      description: "MÃ´n há»c cÃ³ Ä‘iá»ƒm",
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
  // ðŸš€ MIGRATION: Replace scattered loading with coordinated system
  const { startPageTransition, stopLoading } = usePageTransition()
  const coordinatedLoading = useCoordinatedLoading()
  
  const [overallStats, setOverallStats] = useState<OverallStats | null>(null)
  const [gradeDistribution, setGradeDistribution] = useState<GradeDistribution[]>([])
  const [classPerformance, setClassPerformance] = useState<ClassPerformance[]>([])
  const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>([])
  const [trendData, setTrendData] = useState<TrendData[]>([])
  
  // ðŸ§¹ CLEANUP: Removed unused sectionLoading state
  const [lastFetch, setLastFetch] = useState<number>(0)

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000

  // ðŸ§¹ CLEANUP: Removed old createDataLoader pattern - now using direct API calls

  const loadAllAnalytics = useCallback(async (forceRefresh = false) => {
    // Check cache validity
    const now = Date.now()
    const isCacheValid = !forceRefresh && (now - lastFetch) < CACHE_DURATION && overallStats !== null

    if (isCacheValid) {
      return // Use cached data
    }

    // ðŸŽ¯ UX IMPROVEMENT: Use global loading with meaningful message
    startPageTransition("Äang táº£i phÃ¢n tÃ­ch dá»¯ liá»‡u há»c táº­p...")
    
    try {
      // ðŸš€ PERFORMANCE: Load critical data first
      const [statsResult, distributionResult] = await Promise.all([
        getOverallGradeStatsAction(),
        getGradeDistributionAction()
      ])

      // Update critical data immediately
      if (statsResult.success) setOverallStats(statsResult.data)
      if (distributionResult.success) setGradeDistribution(distributionResult.data)

            // ðŸ“Š Load secondary data without blocking UI (asynchronous)
      setTimeout(async () => {
        try {
          const [classResult, subjectResult, trendResult] = await Promise.all([
            getClassPerformanceAction(),
            getSubjectAnalysisAction(), 
            getTrendAnalysisAction()
          ])

          if (classResult.success && classResult.data) setClassPerformance(classResult.data)
          if (subjectResult.success && subjectResult.data) setSubjectAnalysis(subjectResult.data)
          if (trendResult.success && trendResult.data) setTrendData(trendResult.data)
        } catch (error) {
          console.error('Secondary data loading failed:', error)
          toast.error("Má»™t sá»‘ dá»¯ liá»‡u phá»¥ khÃ´ng táº£i Ä‘Æ°á»£c")
        }
      }, 100)

      setLastFetch(now)
    } catch (error) {
      console.error('Analytics loading failed:', error)
      toast.error("KhÃ´ng thá»ƒ táº£i dá»¯ liá»‡u phÃ¢n tÃ­ch")
    } finally {
      stopLoading()
    }
  }, [startPageTransition, stopLoading, lastFetch, overallStats, CACHE_DURATION])

  useEffect(() => {
    loadAllAnalytics()
  }, [loadAllAnalytics])

  const handleExportReport = async () => {
    toast.info("Chá»©c nÄƒng xuáº¥t bÃ¡o cÃ¡o Ä‘ang Ä‘Æ°á»£c phÃ¡t triá»ƒn")
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
          <h1 className="text-2xl font-bold">PhÃ¢n TÃ­ch Äiá»ƒm Sá»‘</h1>
          <p className="text-gray-500">Dashboard thá»‘ng kÃª vÃ  phÃ¢n tÃ­ch Ä‘iá»ƒm sá»‘ toÃ n trÆ°á»ng</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => loadAllAnalytics(true)}
            disabled={coordinatedLoading.isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            LÃ m má»›i
          </Button>
          <Button
            onClick={handleExportReport}
            disabled={coordinatedLoading.isLoading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Xuáº¥t bÃ¡o cÃ¡o
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
            <CardTitle>PhÃ¢n Bá»‘ Äiá»ƒm Sá»‘</CardTitle>
            <CardDescription>Tá»· lá»‡ há»c sinh theo tá»«ng má»©c Ä‘iá»ƒm</CardDescription>
          </CardHeader>
          <CardContent>
            {!gradeDistribution.length && coordinatedLoading.isLoading ? (
              <div className="h-80 flex items-center justify-center">Äang táº£i...</div>
            ) : (
              <BarChartComponent data={chartData.gradeDistribution} />
            )}
          </CardContent>
        </Card>

        {/* Grade Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tá»· Lá»‡ PhÃ¢n Bá»‘</CardTitle>
            <CardDescription>Pháº§n trÄƒm há»c sinh theo má»©c Ä‘iá»ƒm</CardDescription>
          </CardHeader>
          <CardContent>
            {!gradeDistribution.length && coordinatedLoading.isLoading ? (
              <div className="h-80 flex items-center justify-center">Äang táº£i...</div>
            ) : (
              <PieChartComponent data={chartData.gradeDistribution} colors={COLORS} />
            )}
          </CardContent>
        </Card>

        {/* Class Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Hiá»‡u Suáº¥t Lá»›p Há»c</CardTitle>
            <CardDescription>Äiá»ƒm trung bÃ¬nh cá»§a cÃ¡c lá»›p</CardDescription>
          </CardHeader>
          <CardContent>
            {!classPerformance.length && coordinatedLoading.isLoading ? (
              <div className="h-80 flex items-center justify-center">Äang táº£i...</div>
            ) : (
              <BarChartComponent data={chartData.classPerformance} />
            )}
          </CardContent>
        </Card>

        {/* Trend Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Xu HÆ°á»›ng Äiá»ƒm Sá»‘</CardTitle>
            <CardDescription>Äiá»ƒm trung bÃ¬nh qua cÃ¡c ká»³ há»c</CardDescription>
          </CardHeader>
          <CardContent>
            {!trendData.length && coordinatedLoading.isLoading ? (
              <div className="h-80 flex items-center justify-center">Äang táº£i...</div>
            ) : (
              <ComposedChartComponent data={chartData.trendData} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>PhÃ¢n TÃ­ch MÃ´n Há»c</CardTitle>
          <CardDescription>Hiá»‡u suáº¥t chi tiáº¿t theo tá»«ng mÃ´n há»c</CardDescription>
        </CardHeader>
        <CardContent>
          {!subjectAnalysis.length && coordinatedLoading.isLoading ? (
            <div className="text-center py-8">Äang táº£i...</div>
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
                      Danh má»¥c: {subject.category} â€¢ {subject.totalGrades} Ä‘iá»ƒm
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-sm text-gray-500">Trung bÃ¬nh</div>
                      <Badge variant={getBadgeVariant(subject.averageGrade)}>
                        {subject.averageGrade.toFixed(1)}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Cao nháº¥t</div>
                      <div className="font-medium text-green-600">{subject.highestGrade.toFixed(1)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Tháº¥p nháº¥t</div>
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
