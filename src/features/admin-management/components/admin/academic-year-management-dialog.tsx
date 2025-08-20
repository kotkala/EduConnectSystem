'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertCircle,
  BookOpen
} from 'lucide-react'

import { AcademicYearForm } from '@/features/admin-management/components/admin/academic-year-form'
import { SemesterForm } from '@/features/admin-management/components/admin/semester-form'
import { AcademicDeleteDialog } from '@/features/admin-management/components/admin/academic-delete-dialog'
import {
  getAcademicYearsAction,
  getSemestersAction
} from '@/features/admin-management/actions/academic-actions'
import {
  type AcademicYearWithSemesters,
  type SemesterWithAcademicYear,
  type AcademicYear,
  type Semester
} from '@/lib/validations/academic-validations'

interface AcademicYearManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRefresh?: () => void
}

export function AcademicYearManagementDialog({
  open,
  onOpenChange,
  onRefresh
}: AcademicYearManagementDialogProps) {
  // State
  const [academicYears, setAcademicYears] = useState<AcademicYearWithSemesters[]>([])
  const [semesters, setSemesters] = useState<SemesterWithAcademicYear[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [showCreateYearDialog, setShowCreateYearDialog] = useState(false)
  const [showEditYearDialog, setShowEditYearDialog] = useState(false)
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null)
  
  const [showCreateSemesterDialog, setShowCreateSemesterDialog] = useState(false)
  const [showEditSemesterDialog, setShowEditSemesterDialog] = useState(false)
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null)
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingItem, setDeletingItem] = useState<{ type: 'academic-years' | 'semesters'; item: AcademicYear | Semester } | null>(null)

  // Load data
  const loadData = useCallback(async () => {
    if (!open) return
    
    setLoading(true)
    setError(null)
    
    try {
      const [yearsResult, semestersResult] = await Promise.all([
        getAcademicYearsAction({ page: 1, limit: 50 }),
        getSemestersAction({ page: 1, limit: 50 })
      ])
      
      if (yearsResult.success) {
        setAcademicYears(yearsResult.data)
      } else {
        setError(yearsResult.error || 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch nÄƒm há»c')
      }
      
      if (semestersResult.success) {
        setSemesters(semestersResult.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'CÃ³ lá»—i xáº£y ra')
    } finally {
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Event handlers
  const handleRefresh = () => {
    loadData()
    onRefresh?.()
  }

  const handleCreateYearSuccess = () => {
    setShowCreateYearDialog(false)
    handleRefresh()
  }

  const handleEditYearSuccess = () => {
    setShowEditYearDialog(false)
    setEditingYear(null)
    handleRefresh()
  }

  const handleCreateSemesterSuccess = () => {
    setShowCreateSemesterDialog(false)
    handleRefresh()
  }

  const handleEditSemesterSuccess = () => {
    setShowEditSemesterDialog(false)
    setEditingSemester(null)
    handleRefresh()
  }

  const handleDeleteSuccess = () => {
    setShowDeleteDialog(false)
    setDeletingItem(null)
    handleRefresh()
  }

  const handleEditYear = (year: AcademicYear) => {
    setEditingYear(year)
    setShowEditYearDialog(true)
  }

  const handleDeleteYear = (year: AcademicYear) => {
    setDeletingItem({ type: 'academic-years', item: year })
    setShowDeleteDialog(true)
  }

  const handleEditSemester = (semester: Semester) => {
    setEditingSemester(semester)
    setShowEditSemesterDialog(true)
  }

  const handleDeleteSemester = (semester: Semester) => {
    setDeletingItem({ type: 'semesters', item: semester })
    setShowDeleteDialog(true)
  }

  // Stats
  const currentYear = academicYears.find(year => year.is_current)
  const currentSemester = semesters.find(semester => semester.is_current)

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Quáº£n lÃ½ nÄƒm há»c & há»c ká»³
            </DialogTitle>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  NÄƒm há»c hiá»‡n táº¡i
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {currentYear?.name || 'KhÃ´ng cÃ³'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Há»c ká»³ hiá»‡n táº¡i
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {currentSemester?.name || 'KhÃ´ng cÃ³'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Tá»•ng sá»‘
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold">
                  {academicYears.length} nÄƒm, {semesters.length} ká»³
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setShowCreateYearDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              ThÃªm nÄƒm há»c
            </Button>
            <Button
              onClick={() => setShowCreateSemesterDialog(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              ThÃªm há»c ká»³
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              LÃ m má»›i
            </Button>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="years" className="space-y-4">
            <TabsList>
              <TabsTrigger value="years">NÄƒm há»c ({academicYears.length})</TabsTrigger>
              <TabsTrigger value="semesters">Há»c ká»³ ({semesters.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="years" className="space-y-4">
              <div className="grid gap-4">
                {academicYears.map((year) => (
                  <Card key={year.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{year.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(year.start_date).toLocaleDateString('vi-VN')} - {new Date(year.end_date).toLocaleDateString('vi-VN')}
                            </div>
                          </div>
                          {year.is_current && (
                            <Badge variant="secondary">Hiá»‡n táº¡i</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleEditYear(year)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteYear(year)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="semesters" className="space-y-4">
              <div className="grid gap-4">
                {semesters.map((semester) => (
                  <Card key={semester.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{semester.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {semester.academic_year?.name} â€¢ {semester.weeks_count} tuáº§n
                            </div>
                          </div>
                          {semester.is_current && (
                            <Badge variant="secondary">Hiá»‡n táº¡i</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleEditSemester(semester)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteSemester(semester)}
                            variant="outline"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create Year Dialog */}
      <Dialog open={showCreateYearDialog} onOpenChange={setShowCreateYearDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ThÃªm nÄƒm há»c má»›i</DialogTitle>
          </DialogHeader>
          <AcademicYearForm
            onSuccess={handleCreateYearSuccess}
            onCancel={() => setShowCreateYearDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Year Dialog */}
      <Dialog open={showEditYearDialog} onOpenChange={setShowEditYearDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chá»‰nh sá»­a nÄƒm há»c</DialogTitle>
          </DialogHeader>
          {editingYear && (
            <AcademicYearForm
              academicYear={editingYear}
              onSuccess={handleEditYearSuccess}
              onCancel={() => {
                setShowEditYearDialog(false)
                setEditingYear(null)
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Semester Dialog */}
      <Dialog open={showCreateSemesterDialog} onOpenChange={setShowCreateSemesterDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ThÃªm há»c ká»³ má»›i</DialogTitle>
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
            <DialogTitle>Chá»‰nh sá»­a há»c ká»³</DialogTitle>
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

      {/* Delete Dialog */}
      {deletingItem && (
        <AcademicDeleteDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          type={deletingItem.type}
          item={deletingItem.item}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </>
  )
}
