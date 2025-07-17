'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface GradeLevelFormValues {
  name: string
  level: number
  description?: string
}

interface GradeLevelFormProps {
  initialData?: GradeLevelFormValues
  onSubmit: (values: GradeLevelFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function GradeLevelForm({
  initialData,
  onSubmit,
  onCancel,
  loading
}: GradeLevelFormProps) {
  const [form, setForm] = useState<GradeLevelFormValues>({
    name: initialData?.name || '',
    level: initialData?.level || 1,
    description: initialData?.description || '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate
    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }
    if (!form.level || form.level < 1 || form.level > 12) {
      setError('Level must be between 1 and 12.')
      return
    }
    setError(null)
    onSubmit(form)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData ? 'Edit Grade Level' : 'Add Grade Level'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <Label htmlFor="level">Level (1-12)</Label>
            <Input
              id="level"
              name="level"
              type="number"
              min={1}
              max={12}
              value={form.level}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={loading}
            />
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