"use client"

import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { type EnhancedGradeReportingPeriod } from "@/lib/validations/enhanced-grade-validations"
import { createEnhancedGradeReportingPeriodAction } from "@/features/grade-management/actions/enhanced-grade-actions"

interface GradePeriodFormProps {
  period?: EnhancedGradeReportingPeriod
  onSuccess: () => void
  onCancel: () => void
}

export function GradePeriodForm({ period, onSuccess, onCancel }: Readonly<GradePeriodFormProps>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formData = new FormData(e.currentTarget)
      const data = {
        name: formData.get('name') as string,
        period_type: formData.get('period_type') as 'midterm_1' | 'final_1' | 'semester_1_summary' | 'midterm_2' | 'final_2' | 'semester_2_summary' | 'yearly_summary',
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        import_deadline: formData.get('import_deadline') as string,
        edit_deadline: formData.get('edit_deadline') as string,
        description: formData.get('description') as string,
        academic_year_id: '1', // TODO: Get from context or props
        semester_id: '1', // TODO: Get from context or props
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
    if (loading) return 'Äang lưu...'
    return period ? 'Cập nhật' : 'Tạo mới'
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
          <Label htmlFor="period_type">Loáº¡i kỳ *</Label>
          <Select name="period_type" defaultValue={period?.period_type}>
            <SelectTrigger>
              <SelectValue placeholder="Chồn loại kỳ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="midterm_1">Äiá»ƒm giá»¯a kỳ 1</SelectItem>
              <SelectItem value="final_1">Äiá»ƒm cuá»‘i kỳ 1</SelectItem>
              <SelectItem value="semester_1_summary">Tổng káº¿t hồc kỳ 1</SelectItem>
              <SelectItem value="midterm_2">Äiá»ƒm giá»¯a kỳ 2</SelectItem>
              <SelectItem value="final_2">Äiá»ƒm cuá»‘i kỳ 2</SelectItem>
              <SelectItem value="semester_2_summary">Tổng káº¿t hồc kỳ 2</SelectItem>
              <SelectItem value="yearly_summary">Tổng káº¿t cả năm</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">NgÃ y bắt Ä‘áº§u *</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={period?.start_date}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">NgÃ y káº¿t thÃºc *</Label>
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
          <Label htmlFor="import_deadline">Háº¡n nháº­p Ä‘iá»ƒm *</Label>
          <Input
            id="import_deadline"
            name="import_deadline"
            type="datetime-local"
            defaultValue={period?.import_deadline ? new Date(period.import_deadline).toISOString().slice(0, 16) : ''}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit_deadline">Háº¡n chồ‰nh sửa *</Label>
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
