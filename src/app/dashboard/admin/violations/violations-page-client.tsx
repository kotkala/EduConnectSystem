'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Plus, Settings, FileText, AlertTriangle } from 'lucide-react'
import { useViolationsTab } from './violations-page-wrapper'
import ViolationCategoriesManager from '@/features/violations/components/violation-categories-manager'
import ViolationRecordForm from '@/features/violations/components/violation-record-form'
import SimpleViolationsTable from '@/features/violations/components/simple-violations-table'
import WeeklyViolationReports from '@/features/violations/components/weekly-violation-reports'
import MonthlyViolationSummary from '@/features/violations/components/monthly-violation-summary'
import DisciplinaryProcessing from '@/features/violations/components/disciplinary-processing'
import { getViolationStatsAction } from '@/features/violations/actions'


interface ViolationStats {
  totalViolations: number
  thisWeekViolations: number
  totalCategories: number
  totalTypes: number
  severityBreakdown: Array<{ severity: string; count: number }>
}

// Tab order for direction-aware sliding
const tabOrder = ['overview', 'categories', 'record', 'violations', 'weekly', 'monthly', 'discipline']

export default function ViolationsPageClient() {
  const { activeTab, setActiveTab } = useViolationsTab()
  const [previousTab, setPreviousTab] = useState('overview')
  const [stats, setStats] = useState<ViolationStats>({
    totalViolations: 0,
    thisWeekViolations: 0,
    totalCategories: 0,
    totalTypes: 0,
    severityBreakdown: []
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const isMobile = useIsMobile()

  const handleRecordSuccess = () => {
    // Switch to overview tab after successful recording
    setActiveTab('overview')
    // Reload stats after successful violation recording
    loadViolationStats()
  }

  const loadViolationStats = async () => {
    setIsLoadingStats(true)
    try {
      const result = await getViolationStatsAction()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Failed to load violation stats:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  useEffect(() => {
    loadViolationStats()
  }, [])

  // Handle tab change with direction detection
  const handleTabChange = (newTab: string) => {
    setPreviousTab(activeTab)
    setActiveTab(newTab)
  }

  // Get slide direction based on tab order
  const getSlideDirection = () => {
    const currentIndex = tabOrder.indexOf(activeTab)
    const previousIndex = tabOrder.indexOf(previousTab)
    return currentIndex > previousIndex ? 1 : -1 // 1 = slide left, -1 = slide right
  }



  return (
    <div className="space-y-6">
      {/* Desktop/Tablet: Traditional Tabs */}
      {!isMobile && (
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 animate-in fade-in duration-700">
          {/* Tablet: 2 columns */}
          <div className="block lg:hidden">
            <TabsList className="grid w-full grid-cols-2 h-auto gap-1 p-1">
              <TabsTrigger value="overview" className="text-xs px-3 py-2">
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-xs px-3 py-2">
                Danh mục
              </TabsTrigger>
              <TabsTrigger value="record" className="text-xs px-3 py-2">
                Ghi nhận
              </TabsTrigger>
              <TabsTrigger value="violations" className="text-xs px-3 py-2">
                Vi phạm
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs px-3 py-2">
                Tuần
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs px-3 py-2">
                Tháng
              </TabsTrigger>
              <TabsTrigger value="discipline" className="text-xs px-3 py-2">
                Kỷ luật
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Desktop: Horizontal */}
          <div className="hidden lg:block">
            <TabsList className="grid w-full grid-cols-7 h-auto gap-1">
              <TabsTrigger value="overview" className="text-sm px-4 py-2">
                Tổng quan
              </TabsTrigger>
              <TabsTrigger value="categories" className="text-sm px-4 py-2">
                Danh mục & Loại
              </TabsTrigger>
              <TabsTrigger value="record" className="text-sm px-4 py-2">
                Ghi nhận vi phạm
              </TabsTrigger>
              <TabsTrigger value="violations" className="text-sm px-4 py-2">
                Tất cả vi phạm
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-sm px-4 py-2">
                Báo cáo tuần
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-sm px-4 py-2">
                Báo cáo tháng
              </TabsTrigger>
              <TabsTrigger value="discipline" className="text-sm px-4 py-2">
                Xử lý kỷ luật
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      )}

      {/* Content with slide animations */}
      <div className="animate-in fade-in duration-700">
        {activeTab === 'overview' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="overview"
              initial={{ x: getSlideDirection() * 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: getSlideDirection() * -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs sm:text-sm font-medium">Tổng vi phạm</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg sm:text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.totalViolations}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tổng đã ghi nhận
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tuần này</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.thisWeekViolations}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tuần hiện tại
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Danh mục</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.totalCategories}
                </div>
                <p className="text-xs text-muted-foreground">
                  Danh mục hoạt động
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng loại vi phạm</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.totalTypes}
                </div>
                <p className="text-xs text-muted-foreground">
                  Đã được định nghĩa
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Thao tác nhanh</CardTitle>
                <CardDescription>
                  Các tác vụ quản lý vi phạm thường dùng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" onClick={() => setActiveTab('record')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ghi nhận vi phạm mới
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('categories')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Quản lý danh mục
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('violations')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Xem tất cả vi phạm
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vi phạm gần đây</CardTitle>
                <CardDescription>
                  Vi phạm được ghi nhận mới nhất
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  Chưa có vi phạm nào được ghi nhận
                </div>
              </CardContent>
            </Card>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {activeTab === 'categories' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="categories"
              initial={{ x: getSlideDirection() * 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: getSlideDirection() * -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ViolationCategoriesManager />
            </motion.div>
          </AnimatePresence>
        )}

        {activeTab === 'record' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="record"
              initial={{ x: getSlideDirection() * 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: getSlideDirection() * -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ViolationRecordForm onSuccess={handleRecordSuccess} />
            </motion.div>
          </AnimatePresence>
        )}

        {activeTab === 'violations' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="violations"
              initial={{ x: getSlideDirection() * 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: getSlideDirection() * -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <SimpleViolationsTable />
            </motion.div>
          </AnimatePresence>
        )}

        {activeTab === 'weekly' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="weekly"
              initial={{ x: getSlideDirection() * 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: getSlideDirection() * -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <WeeklyViolationReports />
            </motion.div>
          </AnimatePresence>
        )}

        {activeTab === 'monthly' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="monthly"
              initial={{ x: getSlideDirection() * 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: getSlideDirection() * -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <MonthlyViolationSummary />
            </motion.div>
          </AnimatePresence>
        )}

        {activeTab === 'discipline' && (
          <AnimatePresence mode="wait">
            <motion.div
              key="discipline"
              initial={{ x: getSlideDirection() * 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: getSlideDirection() * -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <DisciplinaryProcessing />
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
