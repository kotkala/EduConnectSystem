'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

export interface TeacherFormValues {
  phone: string
  full_name: string
  gender: string
  date_of_birth: string
  avatar_url: string
  email: string
  password: string
  street_address: string
  district: string
  city: string
  province: string
  postal_code: string
  country: string
  subject: string
}

interface TeacherFormProps {
  onSubmit: (data: TeacherFormValues) => void
  onCancel: () => void
  loading: boolean
}

export function TeacherForm({ onSubmit, onCancel, loading }: TeacherFormProps) {
  const [form, setForm] = useState<TeacherFormValues>({
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
    subject: '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate
    if (!form.phone.trim() || !form.full_name.trim() || !form.email.trim() || !form.password || !form.street_address.trim() || !form.city.trim() || !form.province.trim() || !form.subject.trim()) {
      setError('All required fields must be filled.')
      return
    }
    setError(null)
    onSubmit(form)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Teacher</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input id="phone" name="phone" value={form.phone} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input id="full_name" name="full_name" value={form.full_name} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="password">Password *</Label>
            <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={form.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDERS.map((gender) => (
                  <SelectItem key={gender.value} value={gender.value}>
                    {gender.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input id="date_of_birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} disabled={loading} />
          </div>
          <div>
            <Label htmlFor="subject">Subject Specialization *</Label>
            <Input id="subject" name="subject" value={form.subject} onChange={handleChange} required disabled={loading} placeholder="e.g. Mathematics, English, Physics" />
          </div>
          <div>
            <Label htmlFor="street_address">Street Address *</Label>
            <Input id="street_address" name="street_address" value={form.street_address} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="district">District</Label>
            <Input id="district" name="district" value={form.district} onChange={handleChange} disabled={loading} />
          </div>
          <div>
            <Label htmlFor="city">City *</Label>
            <Input id="city" name="city" value={form.city} onChange={handleChange} required disabled={loading} />
          </div>
          <div>
            <Label htmlFor="province">Province *</Label>
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
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Teacher'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Simple Teacher Assignment Form Component (NEW - simplified version)
export interface SimpleTeacherAssignmentFormData {
  academic_term_id: string
  teacher_id: string
  class_id: string
  subject_id: string
}

interface SimpleTeacherAssignmentFormProps {
  academicTerms: Array<{id: string, name: string}>
  teachers: Array<{id: string, full_name: string}>
  classes: Array<{id: string, name: string, grade_level: {name: string}}>
  subjects: Array<{id: string, name: string, code: string}>
  onSubmit: (data: SimpleTeacherAssignmentFormData) => void
  onCancel: () => void
  loading: boolean
}

export function SimpleTeacherAssignmentForm({
  academicTerms,
  teachers,
  classes,
  subjects,
  onSubmit,
  onCancel,
  loading
}: SimpleTeacherAssignmentFormProps) {
  const [formData, setFormData] = useState<SimpleTeacherAssignmentFormData>({
    academic_term_id: '',
    teacher_id: '',
    class_id: '',
    subject_id: ''
  })
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.academic_term_id || !formData.teacher_id || !formData.class_id || !formData.subject_id) {
      setError('Vui lòng chọn đầy đủ học kỳ, giáo viên, lớp học và môn học')
      return
    }
    
    setError(null)
    onSubmit(formData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Phân công giáo viên dạy môn học</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="academic_term_id">Học kỳ *</Label>
              <select
                id="academic_term_id"
                value={formData.academic_term_id}
                onChange={(e) => setFormData(prev => ({ ...prev, academic_term_id: e.target.value }))}
                className="w-full mt-1 p-2 border rounded-md"
                required
              >
                <option value="">Chọn học kỳ</option>
                {academicTerms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="teacher_id">Giáo viên *</Label>
              <select
                id="teacher_id"
                value={formData.teacher_id}
                onChange={(e) => setFormData(prev => ({ ...prev, teacher_id: e.target.value }))}
                className="w-full mt-1 p-2 border rounded-md"
                required
              >
                <option value="">Chọn giáo viên</option>
                {teachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="class_id">Lớp học *</Label>
              <select
                id="class_id"
                value={formData.class_id}
                onChange={(e) => setFormData(prev => ({ ...prev, class_id: e.target.value }))}
                className="w-full mt-1 p-2 border rounded-md"
                required
              >
                <option value="">Chọn lớp học</option>
                {classes.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade_level.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="subject_id">Môn học *</Label>
              <select
                id="subject_id"
                value={formData.subject_id}
                onChange={(e) => setFormData(prev => ({ ...prev, subject_id: e.target.value }))}
                className="w-full mt-1 p-2 border rounded-md"
                required
              >
                <option value="">Chọn môn học</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-blue-700 text-sm">
            <p className="font-medium mb-1">📋 Lưu ý:</p>
            <p>• Chỉ cần phân công giáo viên dạy môn học nào cho lớp nào</p>
            <p>• Thời khóa biểu cụ thể (ngày, tiết) sẽ được tạo tự động khi chạy tính năng "Tự động tạo TKB"</p>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Phân công'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// Original complex form (keep for backward compatibility if needed)
export interface TeacherAssignmentFormData {
  academic_term_id: string
  teacher_id: string
  class_id: string
  subject_id: string
  schedules: Array<{
    day_of_week: string
    time_slot_id: string
    room_number?: string
  }>
}

interface TeacherAssignmentFormProps {
  academicTerms: Array<{id: string, name: string}>
  teachers: Array<{id: string, full_name: string}>
  classes: Array<{id: string, name: string, grade_level: {name: string}}>
  subjects: Array<{id: string, name: string, code: string}>
  timeSlots: Array<{id: string, name: string, start_time: string, end_time: string}>
  onSubmit: (data: TeacherAssignmentFormData) => void
  onCancel: () => void
  loading: boolean
}

export function TeacherAssignmentForm({
  academicTerms,
  teachers,
  classes,
  subjects,
  timeSlots,
  onSubmit,
  onCancel,
  loading
}: TeacherAssignmentFormProps) {
  const [formData, setFormData] = useState<TeacherAssignmentFormData>({
    academic_term_id: '',
    teacher_id: '',
    class_id: '',
    subject_id: '',
    schedules: []
  })
  const [error, setError] = useState<string | null>(null)

  const addScheduleSlot = () => {
    setFormData(prev => ({
      ...prev,
      schedules: [...prev.schedules, { day_of_week: 'monday', time_slot_id: '', room_number: '' }]
    }))
  }

  const removeScheduleSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index)
    }))
  }

  const updateScheduleSlot = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.map((schedule, i) => 
        i === index ? { ...schedule, [field]: value } : schedule
      )
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.academic_term_id || !formData.teacher_id || !formData.class_id || !formData.subject_id) {
      setError('Vui lòng chọn đầy đủ học kỳ, giáo viên, lớp học và môn học')
      return
    }
    
    if (formData.schedules.length === 0) {
      setError('Vui lòng thêm ít nhất một lịch dạy')
      return
    }
    
    for (const schedule of formData.schedules) {
      if (!schedule.time_slot_id) {
        setError('Vui lòng chọn tiết học cho tất cả lịch dạy')
        return
      }
    }
    
    setError(null)
    onSubmit(formData)
  }

  const dayNames = [
    { value: 'monday', label: 'Thứ 2' },
    { value: 'tuesday', label: 'Thứ 3' },
    { value: 'wednesday', label: 'Thứ 4' },
    { value: 'thursday', label: 'Thứ 5' },
    { value: 'friday', label: 'Thứ 6' },
    { value: 'saturday', label: 'Thứ 7' },
    { value: 'sunday', label: 'Chủ nhật' }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân công giáo viên dạy môn học</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="text-red-500 mb-4 p-3 bg-red-50 rounded">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="academic_term_id">Học kỳ *</Label>
              <Select value={formData.academic_term_id} onValueChange={(value) => setFormData({...formData, academic_term_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn học kỳ" />
                </SelectTrigger>
                <SelectContent>
                  {academicTerms.map(term => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="teacher_id">Giáo viên *</Label>
              <Select value={formData.teacher_id} onValueChange={(value) => setFormData({...formData, teacher_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn giáo viên" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="class_id">Lớp học *</Label>
              <Select value={formData.class_id} onValueChange={(value) => setFormData({...formData, class_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn lớp học" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} - {cls.grade_level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="subject_id">Môn học *</Label>
              <Select value={formData.subject_id} onValueChange={(value) => setFormData({...formData, subject_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn môn học" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name} ({subject.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Lịch dạy *</Label>
              <Button type="button" onClick={addScheduleSlot} variant="outline" size="sm">
                + Thêm tiết dạy
              </Button>
            </div>
            
            {formData.schedules.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded">
                <p className="text-gray-500">Chưa có lịch dạy nào. Nhấn "Thêm tiết dạy" để bắt đầu.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.schedules.map((schedule, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded">
                    <div className="flex-1">
                      <Label className="text-xs">Thứ</Label>
                      <Select 
                        value={schedule.day_of_week} 
                        onValueChange={(value) => updateScheduleSlot(index, 'day_of_week', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {dayNames.map((day, dayIndex) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-2">
                      <Label className="text-xs">Tiết học</Label>
                      <Select 
                        value={schedule.time_slot_id} 
                        onValueChange={(value) => updateScheduleSlot(index, 'time_slot_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn tiết" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map(slot => (
                            <SelectItem key={slot.id} value={slot.id}>
                              {slot.name} ({slot.start_time} - {slot.end_time})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1">
                      <Label className="text-xs">Phòng học</Label>
                      <Input
                        value={schedule.room_number || ''}
                        onChange={(e) => updateScheduleSlot(index, 'room_number', e.target.value)}
                        placeholder="VD: A101"
                      />
                    </div>
                    
                    <Button 
                      type="button" 
                      onClick={() => removeScheduleSlot(index)}
                      variant="outline" 
                      size="sm"
                      className="text-red-600"
                    >
                      Xóa
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang phân công...' : 'Phân công giáo viên'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Hủy
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 