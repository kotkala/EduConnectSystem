"use client"

import { useState, useEffect } from "react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { type EnhancedGradeReportingPeriod } from "@/lib/validations/enhanced-grade-validations"
import { createEnhancedGradeReportingPeriodAction } from "@/features/grade-management/actions/enhanced-grade-actions"
import { createClient } from "@/lib/supabase/client"


import { Skeleton } from "@/shared/components/ui/skeleton";interface AcademicYear {
  id: string
  name: string
  is_current: boolean
}

interface Semester {
  id: string
  name: string
  academic_year_id: string
  is_current: boolean
}

interface GradePeriodFormProps {
  period?: EnhancedGradeReportingPeriod
  onSuccess: () => void
  onCancel: () => void
}

export function GradePeriodForm({ period, onSuccess, onCancel }: Readonly<GradePeriodFormProps>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('')
  const [selectedSemester, setSelectedSemester] = useState<string>('')
  const [dataLoading, setDataLoading] = useState(true)

  // Load academic years and semesters
  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()

        // Load academic years
        const { data: academicYearsData, error: ayError } = await supabase
          .from('academic_years')
          .select('id, name, is_current')
          .order('name', { ascending: false })

        if (ayError) {
          console.error('Error loading academic years:', ayError)
          setError('Không thể tải danh sách năm học')
          return
        }

        // Load semesters
        const { data: semestersData, error: semError } = await supabase
          .from('semesters')
          .select('id, name, academic_year_id, is_current')
          .order('semester_number')

        if (semError) {
          console.error('Error loading semesters:', semError)
          setError('Không thể tải danh sách học kỳ')
          return
        }

        setAcademicYears(academicYearsData || [])
        setSemesters(semestersData || [])

        // Set default values to current academic year and semester
        const currentAY = academicYearsData?.find(ay => ay.is_current)
        const currentSemester = semestersData?.find(s => s.is_current)

        if (currentAY) {
          setSelectedAcademicYear(currentAY.id)
        }
        if (currentSemester) {
          setSelectedSemester(currentSemester.id)
        }

      } catch (error) {
        console.error('Error loading data:', error)
        setError('Không thể tải dữ liệu')
      } finally {
        setDataLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required selections
      if (!selectedAcademicYear) {
        setError('Vui lòng chọn năm học')
        return
      }
      if (!selectedSemester) {
        setError('Vui lòng chọn học kỳ')
        return
      }

      const formData = new FormData(e.currentTarget)
      const data = {
        name: formData.get('name') as string,
        period_type: formData.get('period_type') as 'midterm_1' | 'final_1' | 'semester_1_summary' | 'midterm_2' | 'final_2' | 'semester_2_summary' | 'yearly_summary',
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        import_deadline: formData.get('import_deadline') as string,
        edit_deadline: formData.get('edit_deadline') as string,
        description: formData.get('description') as string,
        academic_year_id: selectedAcademicYear,
        semester_id: selectedSemester,
        status: 'open' as const
      }

      const result = await createEnhancedGradeReportingPeriodAction(data)

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Có lỗi xảy ra khi lưu dữ liệu')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setError('Có lỗi xảy ra khi lưu dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const getButtonText = () => {
    if (loading) return 'Đang lưu...'
    return period ? 'Cập nhật' : 'Tạo mới'
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Skeleton className="h-32 w-full rounded-lg" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="academic_year">Năm học *</Label>
          <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn năm học" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((ay) => (
                <SelectItem key={ay.id} value={ay.id}>
                  {ay.name} {ay.is_current && '(Hiện tại)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="semester">Học kỳ *</Label>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn học kỳ" />
            </SelectTrigger>
            <SelectContent>
              {semesters
                .filter(s => s.academic_year_id === selectedAcademicYear)
                .map((semester) => (
                  <SelectItem key={semester.id} value={semester.id}>
                    {semester.name} {semester.is_current && '(Hiện tại)'}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Tên kỳ báo cáo *</Label>
          <Input
            id="name"
            name="name"
            placeholder="Nhập tên kỳ báo cáo"
            defaultValue={period?.name}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="period_type">Loại kỳ *</Label>
          <Select name="period_type" defaultValue={period?.period_type}>
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="midterm_1">Điểm giữa kỳ 1</SelectItem>
              <SelectItem value="final_1">Điểm cuối kỳ 1</SelectItem>
              <SelectItem value="semester_1_summary">Tổng kết học kỳ 1</SelectItem>
              <SelectItem value="midterm_2">Điểm giữa kỳ 2</SelectItem>
              <SelectItem value="final_2">Điểm cuối kỳ 2</SelectItem>
              <SelectItem value="semester_2_summary">Tổng kết học kỳ 2</SelectItem>
              <SelectItem value="yearly_summary">Tổng kết cả năm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Ngày bắt đầu *</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={period?.start_date}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">Ngày kết thúc *</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            defaultValue={period?.end_date}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="import_deadline">Hạn nhập điểm *</Label>
          <Input
            id="import_deadline"
            name="import_deadline"
            type="datetime-local"
            defaultValue={period?.import_deadline ? new Date(period.import_deadline).toISOString().slice(0, 16) : ''}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit_deadline">Hạn chỉnh sửa *</Label>
          <Input
            id="edit_deadline"
            name="edit_deadline"
            type="datetime-local"
            defaultValue={period?.edit_deadline ? new Date(period.edit_deadline).toISOString().slice(0, 16) : ''}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Nhập mô tả cho kỳ báo cáo"
          defaultValue={period?.description}
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Hủy
        </Button>
        <Button type="submit" disabled={loading}>
          {getButtonText()}
        </Button>
      </div>
    </form>
  )
}
