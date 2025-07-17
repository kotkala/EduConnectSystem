'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'

export interface ClassFormValues {
  academic_year_id: string
  grade_level_id: string
  name: string
  code: string
  capacity: number
  room_number?: string
  // is_combined removed - only base classes can be created through this form
}

interface ClassFormProps {
  initialData?: ClassFormValues
  onSubmit: (values: ClassFormValues) => void
  onCancel: () => void
  loading?: boolean
  academicYears: { id: string; name: string }[]
  gradeLevels: { id: string; name: string; level: number }[]
}

export function ClassForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  academicYears,
  gradeLevels
}: ClassFormProps) {
  const [form, setForm] = useState<ClassFormValues>({
    academic_year_id: initialData?.academic_year_id || '',
    grade_level_id: initialData?.grade_level_id || '',
    name: initialData?.name || '',
    code: initialData?.code || '',
    capacity: initialData?.capacity || 30,
    room_number: initialData?.room_number || '',
    // is_combined removed - this form only creates base classes
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  // handleCheckbox removed - this form only creates base classes

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setError(null)
    
    // Validate required fields
    if (!form.academic_year_id) {
      setError('Please select an academic year.')
      return
    }
    if (!form.grade_level_id) {
      setError('Please select a grade level.')
      return
    }
    if (!form.name.trim()) {
      setError('Class name is required.')
      return
    }
    if (!form.code.trim()) {
      setError('Class code is required.')
      return
    }
    
    // Validate capacity
    if (!form.capacity || form.capacity < 1 || form.capacity > 100) {
      setError('Capacity must be between 1 and 100.')
      return
    }
    
    // Validate name and code format
    if (form.name.length < 2 || form.name.length > 50) {
      setError('Class name must be between 2 and 50 characters.')
      return
    }
    if (form.code.length < 2 || form.code.length > 20) {
      setError('Class code must be between 2 and 20 characters.')
      return
    }
    
    // Always create base class (is_combined = false)
    const submitData = {
      ...form,
      is_combined: false,
      class_type: 'base_class'
    }
    
    console.log('Submitting class form:', submitData)
    onSubmit(submitData as any)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Class' : 'Add Class'}</CardTitle>
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
            <Label htmlFor="grade_level_id">Grade Level</Label>
            <select
              id="grade_level_id"
              name="grade_level_id"
              value={form.grade_level_id}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select grade level</option>
              {gradeLevels.map((g) => (
                <option key={g.id} value={g.id}>{g.name} (Level {g.level})</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="name">Class Name</Label>
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
            <Label htmlFor="code">Class Code</Label>
            <Input
              id="code"
              name="code"
              value={form.code}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="capacity">Capacity (1-100)</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              max={100}
              value={form.capacity}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="room_number">Room Number</Label>
            <Input
              id="room_number"
              name="room_number"
              value={form.room_number}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          {/* Combined class checkbox removed - use "Create Combined Classes" button instead */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-700 text-sm">
            <p className="font-medium mb-1">📋 Lưu ý:</p>
            <p>• Form này chỉ tạo lớp tách (lớp cơ bản) để học môn bắt buộc</p>
            <p>• Để tạo lớp ghép (môn tự chọn), sử dụng nút "Create Combined Classes"</p>
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