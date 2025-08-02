'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, Users, Calendar } from 'lucide-react'
import TeacherAssignmentForm from '@/components/admin/teacher-assignment-form'
import TeacherAssignmentTable from '@/components/admin/teacher-assignment-table'
import { 
  getAllTeacherAssignmentsAction,
  type TeacherAssignment
} from '@/lib/actions/teacher-assignment-actions'
import {
  getAcademicYearsAction
} from '@/lib/actions/academic-actions'
import {
  type AcademicYear
} from '@/lib/validations/academic-validations'

interface TeacherAssignmentClientProps {
  readonly currentUserId: string
}

export default function TeacherAssignmentClient({ currentUserId }: TeacherAssignmentClientProps) {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('assign')

  // Context7 pattern: memoize function to avoid useEffect dependency issues
  const loadInitialData = useCallback(async () => {
    try {
      // Load academic years
      const academicYearsResult = await getAcademicYearsAction()
      if (academicYearsResult.success) {
        setAcademicYears(academicYearsResult.data)

        // Set current academic year as default if available
        const currentYear = academicYearsResult.data.find(year => {
          const now = new Date()
          const startDate = new Date(year.start_date)
          const endDate = new Date(year.end_date)
          return now >= startDate && now <= endDate
        })

        if (currentYear) {
          setSelectedAcademicYear(currentYear.id)
        }
      }

      // Load all assignments initially
      await loadAssignments()
    } catch {
      setError('Failed to load initial data')
    }
  }, [])

  useEffect(() => {
    loadInitialData()
  }, [loadInitialData])

  useEffect(() => {
    if (selectedAcademicYear && selectedAcademicYear !== 'all') {
      loadAssignments(selectedAcademicYear)
    } else {
      loadAssignments()
    }
  }, [selectedAcademicYear])

  // Remove duplicate function - now defined above with useCallback

  const loadAssignments = async (academicYearId?: string) => {
    setLoading(true)
    setError(null)

    try {
      const result = await getAllTeacherAssignmentsAction(academicYearId)
      if (result.success) {
        setAssignments(result.data)
      } else {
        setError(result.error || 'Failed to load teacher assignments')
      }
    } catch {
      setError('Failed to load teacher assignments')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignmentSuccess = () => {
    // Refresh assignments and switch to view tab
    loadAssignments(selectedAcademicYear)
    setActiveTab('view')
  }

  const handleAssignmentUpdate = () => {
    // Refresh assignments
    loadAssignments(selectedAcademicYear)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assign" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Assign Teacher</span>
            <span className="sm:hidden">Assign</span>
          </TabsTrigger>
          <TabsTrigger value="view" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">View Assignments</span>
            <span className="sm:hidden">View</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assign" className="space-y-6">
          <TeacherAssignmentForm 
            onSuccess={handleAssignmentSuccess}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="view" className="space-y-6">
          {/* Academic Year Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                Filter by Academic Year
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Select an academic year to filter assignments, or leave empty to view all assignments.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex-1">
                  <Select
                    value={selectedAcademicYear}
                    onValueChange={setSelectedAcademicYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All academic years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All academic years</SelectItem>
                      {academicYears.filter(year => year.id && year.id.trim() !== '').map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Assignments Table */}
          {loading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading teacher assignments...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <TeacherAssignmentTable
              assignments={assignments}
              onUpdate={handleAssignmentUpdate}
              title={(() => {
                const baseTitle = 'Teacher Assignments'
                if (selectedAcademicYear) {
                  const yearName = academicYears.find(y => y.id === selectedAcademicYear)?.name
                  return `${baseTitle} - ${yearName}`
                }
                return baseTitle
              })()}
              description={
                selectedAcademicYear 
                  ? `Teacher assignments for the selected academic year`
                  : `All teacher assignments across all academic years`
              }
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
