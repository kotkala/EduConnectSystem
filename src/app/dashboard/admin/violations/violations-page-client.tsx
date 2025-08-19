'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Plus, Settings, FileText, AlertTriangle } from 'lucide-react'
import ViolationCategoriesManager from '@/features/admin-management/components/admin/violations/violation-categories-manager'
import ViolationRecordForm from '@/features/admin-management/components/admin/violations/violation-record-form'
import SimpleViolationsTable from '@/features/admin-management/components/admin/violations/simple-violations-table'
import WeeklyViolationReports from '@/features/admin-management/components/admin/violations/weekly-violation-reports'
import MonthlyViolationSummary from '@/features/admin-management/components/admin/violations/monthly-violation-summary'
import DisciplinaryProcessing from '@/features/admin-management/components/admin/violations/disciplinary-processing'
import { getViolationStatsAction } from '@/features/violations/actions/violation-actions'


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
          <TabsTrigger value="overview">Tá»•ng quan</TabsTrigger>
          <TabsTrigger value="categories">Danh má»¥c & Loáº¡i</TabsTrigger>
          <TabsTrigger value="record">Ghi nháº­n vi pháº¡m</TabsTrigger>
          <TabsTrigger value="violations">Táº¥t cáº£ vi pháº¡m</TabsTrigger>
          <TabsTrigger value="weekly">BÃ¡o cÃ¡o tuáº§n</TabsTrigger>
          <TabsTrigger value="monthly">BÃ¡o cÃ¡o thÃ¡ng</TabsTrigger>
          <TabsTrigger value="discipline">Xá»­ lÃ½ ká»· luáº­t</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tá»•ng vi pháº¡m</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.totalViolations}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tá»•ng Ä‘Ã£ ghi nháº­n
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tuáº§n nÃ y</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.thisWeekViolations}
                </div>
                <p className="text-xs text-muted-foreground">
                  Tuáº§n hiá»‡n táº¡i
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Danh má»¥c</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.totalCategories}
                </div>
                <p className="text-xs text-muted-foreground">
                  Danh má»¥c hoáº¡t Ä‘á»™ng
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ThÃ´ng bÃ¡o Ä‘Ã£ gá»­i</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.notificationsSent}
                </div>
                <p className="text-xs text-muted-foreground">
                  Gá»­i phá»¥ huynh thÃ¡ng nÃ y
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Thao tÃ¡c nhanh</CardTitle>
                <CardDescription>
                  CÃ¡c tÃ¡c vá»¥ quáº£n lÃ½ vi pháº¡m thÆ°á»ng dÃ¹ng
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" onClick={() => setActiveTab('record')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ghi nháº­n vi pháº¡m má»›i
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('categories')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Quáº£n lÃ½ danh má»¥c
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('violations')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Xem táº¥t cáº£ vi pháº¡m
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vi pháº¡m gáº§n Ä‘Ã¢y</CardTitle>
                <CardDescription>
                  Vi pháº¡m Ä‘Æ°á»£c ghi nháº­n má»›i nháº¥t
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  ChÆ°a cÃ³ vi pháº¡m nÃ o Ä‘Æ°á»£c ghi nháº­n
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
