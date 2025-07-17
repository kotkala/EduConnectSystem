'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface ParentFormValues {
  phone: string
  full_name: string
  gender?: string
  date_of_birth?: string
  avatar_url?: string
  email: string
  password: string
  // address
  street_address: string
  district?: string
  city: string
  province: string
  postal_code?: string
  country?: string
}

interface ParentFormProps {
  onSubmit: (values: ParentFormValues) => void
  onCancel: () => void
  loading?: boolean
}

export function ParentForm({ onSubmit, onCancel, loading }: ParentFormProps) {
  const [form, setForm] = useState<ParentFormValues>({
    phone: '',
    full_name: '',
    gender: '',
    date_of_birth: '',
    avatar_url: '',
    email: '',
    password: '',
    street_address: '',
    district: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Vietnam',
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate
    if (!form.phone.trim() || !form.full_name.trim() || !form.email.trim() || !form.password || !form.street_address.trim() || !form.city.trim() || !form.province.trim()) {
      setError('All required fields must be filled.')
      return
    }
    setError(null)
    onSubmit(form)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Parent</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" value={form.phone} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <select id="gender" name="gender" value={form.gender} onChange={handleChange} disabled={loading} className="w-full border rounded px-3 py-2">
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input id="date_of_birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} disabled={loading} />
          </div>
          <div>
            <Label htmlFor="avatar_url">Avatar URL</Label>
            <Input id="avatar_url" name="avatar_url" value={form.avatar_url} onChange={handleChange} disabled={loading} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="street_address">Street Address</Label>
            <Input id="street_address" name="street_address" value={form.street_address} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="district">District</Label>
            <Input id="district" name="district" value={form.district} onChange={handleChange} disabled={loading} />
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" value={form.city} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="province">Province</Label>
            <Input id="province" name="province" value={form.province} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input id="postal_code" name="postal_code" value={form.postal_code} onChange={handleChange} disabled={loading} />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" value={form.country} onChange={handleChange} disabled={loading} />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <div className="flex gap-2 justify-end mt-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 