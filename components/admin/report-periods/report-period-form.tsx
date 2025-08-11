"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  createReportPeriodAction,
  type ReportPeriodFormData
} from "@/lib/actions/report-period-actions"
import { createClient } from "@/utils/supabase/client"

interface ReportPeriodFormProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly onSuccess: () => void
  readonly academicYears: Array<{ id: string; name: string }>
}

export function ReportPeriodForm({
  open,
  onOpenChange,
  onSuccess,
  academicYears
}: ReportPeriodFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [semestersLoading, setSemestersLoading] = useState(false)
  const [semesters, setSemesters] = useState<Array<{ id: string; name: string; start_date: string; end_date: string }>>([])
  const [selectedSemester, setSelectedSemester] = useState<{ id: string; name: string; start_date: string; end_date: string } | null>(null)
  const [formData, setFormData] = useState<ReportPeriodFormData>({
    name: '',
    start_date: '',
    end_date: '',
    academic_year_id: '',
    semester_id: ''
  })
  const [selectedReportPeriod, setSelectedReportPeriod] = useState<string>('')
  const [existingReportPeriods, setExistingReportPeriods] = useState<Array<{ name: string; start_date: string; end_date: string }>>([])
  const [loadingReportPeriods, setLoadingReportPeriods] = useState(false)

  useEffect(() => {
    if (formData.academic_year_id) {
      loadSemesters(formData.academic_year_id)
    } else {
      // Reset semesters when no academic year is selected
      setSemesters([])
      setSelectedSemester(null)
      setFormData(prev => ({ ...prev, semester_id: '' }))
    }
  }, [formData.academic_year_id])

  const loadSemesters = async (academicYearId: string) => {
    try {
      console.log('Loading semesters for academic year:', academicYearId)
      setSemestersLoading(true)
      setSemesters([]) // Clear previous semesters
      setSelectedSemester(null) // Clear selected semester

      const supabase = createClient()
      const { data, error } = await supabase
        .from('semesters')
        .select('id, name, start_date, end_date')
        .eq('academic_year_id', academicYearId)
        .order('start_date')

      if (error) {
        console.error('Error loading semesters:', error)
        toast.error('Failed to load semesters: ' + error.message)
        return
      }

      console.log('Loaded semesters:', data)
      setSemesters(data || [])

      if (!data || data.length === 0) {
        console.log('No semesters found for academic year:', academicYearId)
        toast.error('No active semesters found for this academic year. Please create semesters first.')
      } else {
        toast.success(`Loaded ${data.length} semesters`)
      }
    } catch (error) {
      console.error('Error loading semesters:', error)
      toast.error('Failed to load semesters')
    } finally {
      setSemestersLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !formData.start_date || !formData.end_date || 
        !formData.academic_year_id || !formData.semester_id) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const result = await createReportPeriodAction(formData)
      
      if (result.success) {
        toast.success('Report period created successfully')
        onSuccess()
        resetForm()
      } else {
        toast.error(result.error || 'Failed to create report period')
      }
    } catch (error) {
      console.error('Error creating report period:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const loadExistingReportPeriods = async (semesterId: string) => {
    try {
      setLoadingReportPeriods(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('report_periods')
        .select('name, start_date, end_date')
        .eq('semester_id', semesterId)
        .eq('is_active', true)

      if (error) {
        console.error('Error loading existing report periods:', error)
        return
      }

      setExistingReportPeriods(data || [])
    } catch (error) {
      console.error('Error loading existing report periods:', error)
    } finally {
      setLoadingReportPeriods(false)
    }
  }

  const handleSemesterChange = (semesterId: string) => {
    const semester = semesters.find(s => s.id === semesterId)
    setSelectedSemester(semester || null)
    setFormData(prev => ({ ...prev, semester_id: semesterId }))
    setSelectedReportPeriod('') // Reset report period when semester changes

    if (semester) {
      loadExistingReportPeriods(semesterId)
    }
  }

  const handleReportPeriodChange = (periodValue: string) => {
    if (!selectedSemester) return

    setSelectedReportPeriod(periodValue)

    const periods = calculateWeekPeriods(selectedSemester.start_date)
    const selectedPeriod = periods.find(p => p.value === periodValue)

    if (selectedPeriod) {
      setFormData(prev => ({
        ...prev,
        name: selectedPeriod.name,
        start_date: selectedPeriod.start_date,
        end_date: selectedPeriod.end_date
      }))
    }
  }



  const createSampleSemesters = async () => {
    if (!formData.academic_year_id) {
      toast.error('Please select an academic year first')
      return
    }

    try {
      const supabase = createClient()
      const currentYear = new Date().getFullYear()

      const sampleSemesters = [
        {
          academic_year_id: formData.academic_year_id,
          name: 'Học kỳ 1',
          start_date: `${currentYear}-09-01`,
          end_date: `${currentYear}-12-31`
        },
        {
          academic_year_id: formData.academic_year_id,
          name: 'Học kỳ 2',
          start_date: `${currentYear + 1}-01-01`,
          end_date: `${currentYear + 1}-05-31`
        }
      ]

      const { error } = await supabase
        .from('semesters')
        .insert(sampleSemesters)

      if (error) {
        console.error('Error creating sample semesters:', error)
        toast.error('Failed to create sample semesters: ' + error.message)
        return
      }

      toast.success('Sample semesters created successfully')
      loadSemesters(formData.academic_year_id)
    } catch (error) {
      console.error('Error creating sample semesters:', error)
      toast.error('Failed to create sample semesters')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      academic_year_id: '',
      semester_id: ''
    })
    setSemesters([])
    setSelectedSemester(null)
    setSemestersLoading(false)
    setSelectedReportPeriod('')
    setExistingReportPeriods([])
    setLoadingReportPeriods(false)
  }

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false)
      resetForm()
    }
  }



  const calculateWeekPeriods = (semesterStartDate: string) => {
    const startDate = new Date(semesterStartDate)
    const periods = []

    // Generate 3 periods of 4 weeks each
    for (let i = 0; i < 3; i++) {
      const periodNumber = i + 1
      const periodStart = new Date(startDate)
      periodStart.setDate(startDate.getDate() + (i * 4 * 7)) // Add 4 weeks for each period

      const periodEnd = new Date(periodStart)
      periodEnd.setDate(periodStart.getDate() + (4 * 7) - 1) // 4 weeks minus 1 day

      const startDateFormatted = periodStart.toLocaleDateString('vi-VN')
      const endDateFormatted = periodEnd.toLocaleDateString('vi-VN')

      const periodName = `Báo cáo đợt ${periodNumber}`
      const displayName = `${periodName} (${startDateFormatted} - ${endDateFormatted})`

      periods.push({
        name: periodName,
        displayName: displayName,
        start_date: periodStart.toISOString().split('T')[0],
        end_date: periodEnd.toISOString().split('T')[0],
        periodNumber: periodNumber,
        value: `period-${periodNumber}`
      })
    }

    return periods
  }

  const getAvailablePeriods = () => {
    if (!selectedSemester) return []

    const allPeriods = calculateWeekPeriods(selectedSemester.start_date)

    // Filter out periods that already exist
    const availablePeriods = allPeriods.filter(period => {
      return !existingReportPeriods.some(existing =>
        existing.name === period.name
      )
    })

    return availablePeriods
  }



  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Report Period</DialogTitle>
          <DialogDescription>
            Create a new monthly reporting period for academic progress reports
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="academic_year">Academic Year</Label>
            <Select
              value={formData.academic_year_id}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                academic_year_id: value,
                semester_id: '' // Reset semester when academic year changes
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.academic_year_id && (() => {
            const getPlaceholder = () => {
              if (semestersLoading) return "Loading semesters..."
              if (semesters.length === 0) return "No semesters available"
              return "Select semester"
            }

            return (
              <div>
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester_id}
                  onValueChange={handleSemesterChange}
                  disabled={semestersLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={getPlaceholder()} />
                  </SelectTrigger>
                <SelectContent>
                  {semesters.length > 0 ? (
                    semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-semesters" disabled>
                      {semestersLoading ? "Loading..." : "No semesters found"}
                    </SelectItem>
                  )}
                </SelectContent>
                </Select>
                {formData.academic_year_id && semesters.length === 0 && !semestersLoading && (
                  <div className="mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={createSampleSemesters}
                      className="text-xs"
                    >
                      Create Sample Semesters
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      Create sample semesters for testing
                    </p>
                  </div>
                )}
              </div>
            )
          })()}

          {selectedSemester && (() => {
            const availablePeriods = getAvailablePeriods()

            const getPlaceholderText = () => {
              if (loadingReportPeriods) return "Loading periods..."
              if (availablePeriods.length === 0) return "No periods available"
              return "Select report period"
            }

            return (
              <div>
                <Label htmlFor="report_period">Report Period</Label>
                <Select
                  value={selectedReportPeriod}
                  onValueChange={handleReportPeriodChange}
                  disabled={loadingReportPeriods}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={getPlaceholderText()} />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePeriods.length > 0 ? (
                      availablePeriods.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.displayName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-periods" disabled>
                        {loadingReportPeriods ? "Loading..." : "All periods have been created"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Each period covers 4 weeks of academic activities
                </p>
                {existingReportPeriods.length > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-md">
                    <p className="text-xs font-medium text-blue-800 mb-1">Existing periods:</p>
                    <div className="text-xs text-blue-600">
                      {existingReportPeriods.map((period, index) => (
                        <span key={`${period.name}-${period.start_date}`}>
                          {period.name}
                          {index < existingReportPeriods.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {formData.name && formData.start_date && formData.end_date && (
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-medium text-sm mb-2">Report Period Summary</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Start Date:</strong> {new Date(formData.start_date).toLocaleDateString('vi-VN')}</p>
                <p><strong>End Date:</strong> {new Date(formData.end_date).toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Period'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
