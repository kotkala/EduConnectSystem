'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'school_administrator', label: 'School Admin' },
  { value: 'homeroom_teacher', label: 'Homeroom Teacher' },
  { value: 'subject_teacher', label: 'Subject Teacher' },
  { value: 'parent', label: 'Parent' },
  { value: 'student', label: 'Student' },
]
const STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'locked', label: 'Locked' },
]
const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

export interface UserFormValues {
  phone: string
  full_name: string
  role: string
  status: string
  gender?: string
  date_of_birth?: string
  address?: string
  avatar_url?: string
  email: string
  password?: string
  // dynamic fields
  class_id?: string // for student
  subject?: string // for teacher
  linked_student_id?: string // for parent
}

interface UserFormProps {
  initialData?: UserFormValues
  onSubmit: (values: UserFormValues) => void
  onCancel: () => void
  loading?: boolean
  isEdit?: boolean
  classes?: { id: string; name: string }[]
  students?: { id: string; full_name: string }[]
}

export function UserForm({
  initialData,
  onSubmit,
  onCancel,
  loading,
  isEdit,
  classes = [],
  students = [],
}: UserFormProps) {
  const [form, setForm] = useState<UserFormValues>({
    phone: initialData?.phone || '',
    full_name: initialData?.full_name || '',
    role: initialData?.role || '',
    status: initialData?.status || 'active',
    gender: initialData?.gender || '',
    date_of_birth: initialData?.date_of_birth || '',
    address: initialData?.address || '',
    avatar_url: initialData?.avatar_url || '',
    email: initialData?.email || '',
    password: '',
    class_id: initialData?.class_id || '',
    subject: initialData?.subject || '',
    linked_student_id: initialData?.linked_student_id || '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate
    if (!form.phone.trim() || !form.full_name.trim() || !form.role || !form.email.trim() || (!isEdit && !form.password)) {
      setError('Phone, full name, role, email, and password are required.')
      return
    }
    if (form.role === 'student' && !form.class_id) {
      setError('Class is required for student.')
      return
    }
    if (form.role === 'parent' && !form.linked_student_id) {
      setError('Linked student is required for parent.')
      return
    }
    setError(null)
    onSubmit(form)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Edit User' : 'Add User'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              disabled={loading || isEdit}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select role</option>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={form.status}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full border rounded px-3 py-2"
            >
              {STATUS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              name="gender"
              value={form.gender}
              onChange={handleChange}
              disabled={loading}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              value={form.address}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input
              id="avatar_url"
              name="avatar_url"
              value={form.avatar_url}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          {!isEdit && (
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          )}
          {/* Dynamic fields by role */}
          {form.role === 'student' && (
            <div>
              <Label htmlFor="class_id">Class</Label>
              <select
                id="class_id"
                name="class_id"
                value={form.class_id}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          {form.role === 'parent' && (
            <div>
              <Label htmlFor="linked_student_id">Linked Student</Label>
              <select
                id="linked_student_id"
                name="linked_student_id"
                value={form.linked_student_id}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.full_name}</option>
                ))}
              </select>
            </div>
          )}
          {/* Subject/department for teacher (optional, can be extended) */}
          {form.role === 'subject_teacher' && (
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          )}
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-2 justify-end mt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 