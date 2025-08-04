'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Settings, FileText, AlertTriangle } from 'lucide-react'
import ViolationCategoriesManager from '@/components/admin/violations/violation-categories-manager'
import ViolationRecordForm from '@/components/admin/violations/violation-record-form'
import SimpleViolationsTable from '@/components/admin/violations/simple-violations-table'
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="categories">Categories & Types</TabsTrigger>
          <TabsTrigger value="record">Record Violations</TabsTrigger>
          <TabsTrigger value="violations">All Violations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.totalViolations}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total recorded
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.thisWeekViolations}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current week
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.totalCategories}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active categories
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifications Sent</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.notificationsSent}
                </div>
                <p className="text-xs text-muted-foreground">
                  To parents this month
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common violation management tasks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" onClick={() => setActiveTab('record')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Record New Violation
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('categories')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Categories
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('violations')}>
                  <FileText className="mr-2 h-4 w-4" />
                  View All Violations
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Violations</CardTitle>
                <CardDescription>
                  Latest recorded violations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-muted-foreground py-8">
                  No violations recorded yet
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
      </Tabs>
    </div>
  )
}
