import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface AcademicYearFormValues {
  name: string
  start_date: string
  end_date: string
  description?: string
  is_current: boolean
}

interface AcademicYearFormProps {
  initialData?: AcademicYearFormValues
  onSubmit: (values: AcademicYearFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function AcademicYearForm({
  initialData,
  onSubmit,
  onCancel,
  loading
}: AcademicYearFormProps) {
  const [form, setForm] = useState<AcademicYearFormValues>({
    name: initialData?.name || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    description: initialData?.description || '',
    is_current: initialData?.is_current || false,
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      setForm((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }))
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleCheckbox = (checked: boolean) => {
    setForm((prev) => ({ ...prev, is_current: checked }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate
    if (!form.name.trim() || !form.start_date || !form.end_date) {
      setError('Name, start date, and end date are required.')
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
        <CardTitle>{initialData ? 'Edit Academic Year' : 'Add Academic Year'}</CardTitle>
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
          <div className="flex items-center gap-2">
            <Checkbox
              id="is_current"
              checked={form.is_current}
              onCheckedChange={handleCheckbox}
              disabled={loading}
            />
            <Label htmlFor="is_current">Set as current academic year</Label>
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