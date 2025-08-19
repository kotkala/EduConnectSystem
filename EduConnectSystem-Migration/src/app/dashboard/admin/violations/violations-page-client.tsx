'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Plus, Settings, FileText, AlertTriangle } from 'lucide-react'
import ViolationCategoriesManager from '@/shared/components/admin/violations/violation-categories-manager'
import ViolationRecordForm from '@/shared/components/admin/violations/violation-record-form'
import SimpleViolationsTable from '@/shared/components/admin/violations/simple-violations-table'
import WeeklyViolationReports from '@/shared/components/admin/violations/weekly-violation-reports'
import MonthlyViolationSummary from '@/shared/components/admin/violations/monthly-violation-summary'
import DisciplinaryProcessing from '@/shared/components/admin/violations/disciplinary-processing'
import { getViolationStatsAction } from '@/lib/actions/violation-actions'


interface ViolationStats {
  totalViolations: number
  thisWeekViolations: number
  totalCategories: number
  notificationsSent: number
}

export default function ViolationsPageClient() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState<ViolationStats>({
    totalViolations: 0,
    thisWeekViolations: 0,
    totalCategories: 0,
    notificationsSent: 0
  })
  const [isLoadingStats, setIsLoadingStats] = useState(true)

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

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="categories">Danh mục & Loại</TabsTrigger>
          <TabsTrigger value="record">Ghi nhận vi phạm</TabsTrigger>
          <TabsTrigger value="violations">Tất cả vi phạm</TabsTrigger>
          <TabsTrigger value="weekly">Báo cáo tuần</TabsTrigger>
          <TabsTrigger value="monthly">Báo cáo tháng</TabsTrigger>
          <TabsTrigger value="discipline">Xử lý kỷ luật</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng vi phạm</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
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
                <CardTitle className="text-sm font-medium">Thông báo đã gửi</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.notificationsSent}
                </div>
                <p className="text-xs text-muted-foreground">
                  Gửi phụ huynh tháng này
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
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <ViolationCategoriesManager />
        </TabsContent>

        <TabsContent value="record" className="space-y-4">
          <ViolationRecordForm onSuccess={handleRecordSuccess} />
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <SimpleViolationsTable />
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          <WeeklyViolationReports />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <MonthlyViolationSummary />
        </TabsContent>

        <TabsContent value="discipline" className="space-y-4">
          <DisciplinaryProcessing />
        </TabsContent>
      </Tabs>
    </div>
  )
}
