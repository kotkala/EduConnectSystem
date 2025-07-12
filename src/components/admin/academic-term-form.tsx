'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

export interface AcademicTermFormValues {
  academic_year_id: string
  name: string
  type: string
  start_date: string
  end_date: string
  is_current: boolean
}

interface AcademicTermFormProps {
  initialData?: AcademicTermFormValues
  onSubmit: (values: AcademicTermFormValues) => void
  onCancel: () => void
  loading?: boolean
  academicYears: { id: string; name: string }[]
}

const TERM_TYPES = [
  { value: 'semester_1', label: 'Semester 1' },
  { value: 'semester_2', label: 'Semester 2' },
  { value: 'summer', label: 'Summer' },
  { value: 'full_year', label: 'Full Year' },
]

export function AcademicTermForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  academicYears
}: AcademicTermFormProps) {
  const [form, setForm] = useState<AcademicTermFormValues>({
    academic_year_id: initialData?.academic_year_id || '',
    name: initialData?.name || '',
    type: initialData?.type || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    is_current: initialData?.is_current || false,
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCheckbox = (checked: boolean) => {
    setForm((prev) => ({ ...prev, is_current: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate
    if (!form.academic_year_id || !form.name.trim() || !form.type || !form.start_date || !form.end_date) {
      setError('All fields are required.')
      return
    }
    if (new Date(form.start_date) >= new Date(form.end_date)) {
      setError('Start date must be before end date.')
      return
    }
    setError(null)
    onSubmit(form)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Academic Term' : 'Add Academic Term'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="academic_year_id">Academic Year</Label>
            <select
              id="academic_year_id"
              name="academic_year_id"
              value={form.academic_year_id}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select academic year</option>
              {academicYears.map((year) => (
                <option key={year.id} value={year.id}>{year.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="type">Term Type</Label>
            <select
              id="type"
              name="type"
              value={form.type}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select term type</option>
              {TERM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_current"
              checked={form.is_current}
              onCheckedChange={handleCheckbox}
              disabled={loading}
            />
            <Label htmlFor="is_current">Set as current term</Label>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-2 justify-end mt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (initialData ? 'Save Changes' : 'Create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 