"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Plus, Calendar, Clock, RefreshCw, BookOpen, AlertCircle } from "lucide-react"
import { AcademicTable } from "@/features/admin-management/components/admin/academic-table"
import { AcademicYearForm } from "@/features/admin-management/components/admin/academic-year-form"
import { SemesterForm } from "@/features/admin-management/components/admin/semester-form"

import { useAuth } from "@/features/authentication/hooks/use-auth"
import { getAcademicYearsAction, getSemestersAction } from "@/features/admin-management/actions/academic-actions"
import {
  type AcademicYearWithSemesters,
  type SemesterWithAcademicYear,
  type AcademicYear,
  type Semester,
  type AcademicFilters
} from "@/lib/validations/academic-validations"

export default function AcademicManagementPage() {
  const router = useRouter()
  const { profile, loading } = useAuth()
  const isAdmin = profile?.role === 'admin'

  // Academic Years State
  const [academicYears, setAcademicYears] = useState<AcademicYearWithSemesters[]>([])
  const [academicYearsLoading, setAcademicYearsLoading] = useState(true)
  const [academicYearsError, setAcademicYearsError] = useState<string | null>(null)
  const [academicYearsTotal, setAcademicYearsTotal] = useState(0)
  const [academicYearsPage, setAcademicYearsPage] = useState(1)
  const [academicYearsFilters, setAcademicYearsFilters] = useState<AcademicFilters>({ page: 1, limit: 10 })

  // Semesters State
  const [semesters, setSemesters] = useState<SemesterWithAcademicYear[]>([])
  const [semestersError, setSemestersError] = useState<string | null>(null)
  const [semestersTotal, setSemestersTotal] = useState(0)
  const [semestersPage, setSemestersPage] = useState(1)
  const [semestersFilters, setSemestersFilters] = useState<AcademicFilters>({ page: 1, limit: 10 })

  // Dialog States
  const [showCreateAcademicYearDialog, setShowCreateAcademicYearDialog] = useState(false)
  const [showEditAcademicYearDialog, setShowEditAcademicYearDialog] = useState(false)
  const [editingAcademicYear, setEditingAcademicYear] = useState<AcademicYear | null>(null)
  
  const [showCreateSemesterDialog, setShowCreateSemesterDialog] = useState(false)
  const [showEditSemesterDialog, setShowEditSemesterDialog] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)



  // Fetch Academic Years
  const fetchAcademicYears = useCallback(async () => {
    setAcademicYearsLoading(true)
    setAcademicYearsError(null)

    try {
      const result = await getAcademicYearsAction(academicYearsFilters)
      
      if (result.success) {
        setAcademicYears(result.data)
        setAcademicYearsTotal(result.total)
        setAcademicYearsPage(result.page || 1)
      } else {
        setAcademicYearsError(result.error || "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch niÃªn khÃ³a")
      }
    } catch (err) {
      setAcademicYearsError(err instanceof Error ? err.message : "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch niÃªn khÃ³a")
    } finally {
      setAcademicYearsLoading(false)
    }
  }, [academicYearsFilters])

  // Fetch Semesters
  const fetchSemesters = useCallback(async () => {
    setSemestersError(null)

    try {
      const result = await getSemestersAction(semestersFilters)
      
      if (result.success) {
        setSemesters(result.data)
        setSemestersTotal(result.total)
        setSemestersPage(result.page || 1)
      } else {
        setSemestersError(result.error || "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch há»c ká»³")
      }
    } catch (err) {
      setSemestersError(err instanceof Error ? err.message : "KhÃ´ng thá»ƒ táº£i danh sÃ¡ch há»c ká»³")
    }
  }, [semestersFilters])

  useEffect(() => {
    fetchAcademicYears()
  }, [fetchAcademicYears])

  useEffect(() => {
    fetchSemesters()
  }, [fetchSemesters])

  // Event Handlers
  const handleAcademicYearPageChange = (page: number) => {
    setAcademicYearsFilters(prev => ({ ...prev, page }))
  }

  const handleAcademicYearFiltersChange = (newFilters: Partial<AcademicFilters>) => {
    setAcademicYearsFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleSemesterPageChange = (page: number) => {
    setSemestersFilters(prev => ({ ...prev, page }))
  }

  const handleSemesterFiltersChange = (newFilters: Partial<AcademicFilters>) => {
    setSemestersFilters(prev => ({ ...prev, ...newFilters }))
  }



  const handleCreateAcademicYearSuccess = () => {
    setShowCreateAcademicYearDialog(false)
    fetchAcademicYears()
    fetchSemesters() // Refresh semesters as well since new ones are auto-created
  }

  const handleEditAcademicYearSuccess = () => {
    setShowEditAcademicYearDialog(false)
    setEditingAcademicYear(null)
    fetchAcademicYears()
  }

  const handleCreateSemesterSuccess = () => {
    setShowCreateSemesterDialog(false)
    fetchSemesters()
  }

  const handleEditSemesterSuccess = () => {
    setShowEditSemesterDialog(false)
    setEditingSemester(null)
    fetchSemesters()
  }

  const handleRefresh = () => {
    fetchAcademicYears()
    fetchSemesters()
  }

  // Calculate stats
  const currentAcademicYear = academicYears.find(year => year.is_current)
  const currentSemester = semesters.find(semester => semester.is_current)
  const totalSemesters = semesters.length

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard/admin')
    }
  }, [loading, isAdmin, router])

  // Show loading state
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  // Show access denied if no permission
  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Tá»« chá»‘i truy cáº­p</h2>
          <p className="text-gray-600">Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p khu vá»±c NiÃªn khÃ³a.</p>
          <Button onClick={() => router.push('/dashboard/admin')}>
            Quay láº¡i trang tá»•ng quan
          </Button>
        </div>
      </div>
    )
  }

  if (academicYearsLoading && academicYears.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quáº£n lÃ½ niÃªn khÃ³a</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Quáº£n lÃ½ nÄƒm há»c vÃ  há»c ká»³
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
          <Button
            onClick={() => setShowCreateSemesterDialog(true)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">ThÃªm há»c ká»³</span>
            <span className="sm:hidden">Há»c ká»³</span>
          </Button>
          <Button
            onClick={() => setShowCreateAcademicYearDialog(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">ThÃªm nÄƒm há»c</span>
            <span className="sm:hidden">NÄƒm há»c</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">NÄƒm há»c hiá»‡n táº¡i</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {currentAcademicYear?.name || "KhÃ´ng cÃ³"}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentAcademicYear ? "Äang Ã¡p dá»¥ng" : "ChÆ°a cÃ³ nÄƒm há»c hoáº¡t Ä‘á»™ng"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Há»c ká»³ hiá»‡n táº¡i</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">
              {currentSemester?.name || "KhÃ´ng cÃ³"}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentSemester ? `${currentSemester.weeks_count} tuáº§n` : "ChÆ°a cÃ³ há»c ká»³ hoáº¡t Ä‘á»™ng"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tá»•ng sá»‘ nÄƒm há»c</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{academicYearsTotal}</div>
            <p className="text-xs text-muted-foreground">
              Táº¥t cáº£ nÄƒm há»c
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Tá»•ng sá»‘ há»c ká»³</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{totalSemesters}</div>
            <p className="text-xs text-muted-foreground">
              Táº¥t cáº£ há»c ká»³
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Academic Years and Semesters */}
      <Tabs defaultValue="academic-years" className="space-y-4">
        <TabsList>
          <TabsTrigger value="academic-years">NÄƒm há»c</TabsTrigger>
          <TabsTrigger value="semesters">Há»c ká»³</TabsTrigger>
        </TabsList>

        <TabsContent value="academic-years" className="space-y-4">
          {academicYearsError && (
            <Alert variant="destructive">
              <AlertDescription>{academicYearsError}</AlertDescription>
            </Alert>
          )}

          <AcademicTable
            data={academicYears}
            type="academic-years"
            total={academicYearsTotal}
            currentPage={academicYearsPage}
            limit={academicYearsFilters.limit}
            onPageChange={handleAcademicYearPageChange}
            onFiltersChange={handleAcademicYearFiltersChange}
            onRefresh={handleRefresh}
          />
        </TabsContent>

        <TabsContent value="semesters" className="space-y-4">
          {semestersError && (
            <Alert variant="destructive">
              <AlertDescription>{semestersError}</AlertDescription>
            </Alert>
          )}

          <AcademicTable
            data={semesters}
            type="semesters"
            total={semestersTotal}
            currentPage={semestersPage}
            limit={semestersFilters.limit}
            onPageChange={handleSemesterPageChange}
            onFiltersChange={handleSemesterFiltersChange}
            onRefresh={handleRefresh}
          />
        </TabsContent>
      </Tabs>

      {/* Create Academic Year Dialog */}
      <Dialog open={showCreateAcademicYearDialog} onOpenChange={setShowCreateAcademicYearDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">ThÃªm nÄƒm há»c má»›i</DialogTitle>
          </DialogHeader>
          <AcademicYearForm
            onSuccess={handleCreateAcademicYearSuccess}
            onCancel={() => setShowCreateAcademicYearDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Academic Year Dialog */}
      <Dialog open={showEditAcademicYearDialog} onOpenChange={setShowEditAcademicYearDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Chá»‰nh sá»­a nÄƒm há»c</DialogTitle>
          </DialogHeader>
          {editingAcademicYear && (
            <AcademicYearForm
              academicYear={editingAcademicYear}
              onSuccess={handleEditAcademicYearSuccess}
              onCancel={() => {
                setShowEditAcademicYearDialog(false)
                setEditingAcademicYear(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Semester Dialog */}
      <Dialog open={showCreateSemesterDialog} onOpenChange={setShowCreateSemesterDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">ThÃªm há»c ká»³ má»›i</DialogTitle>
          </DialogHeader>
          <SemesterForm
            onSuccess={handleCreateSemesterSuccess}
            onCancel={() => setShowCreateSemesterDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Semester Dialog */}
      <Dialog open={showEditSemesterDialog} onOpenChange={setShowEditSemesterDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Chá»‰nh sá»­a há»c ká»³</DialogTitle>
          </DialogHeader>
          {editingSemester && (
            <SemesterForm
              semester={editingSemester}
              onSuccess={handleEditSemesterSuccess}
              onCancel={() => {
                setShowEditSemesterDialog(false)
                setEditingSemester(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
