'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Save, X, Plus, Trash2 } from 'lucide-react'

interface Student {
  id: string
  full_name: string
  phone: string
  class?: {
    id: string
    name: string
    code: string
  }
}

interface ViolationRule {
  id: string
  code: string
  name: string
  description: string
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  category: string
}

interface Class {
  id: string
  name: string
  code: string
}

interface ViolationRecordingFormProps {
  onSubmit: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

const SEVERITY_COLORS = {
  minor: 'bg-yellow-100 text-yellow-800',
  moderate: 'bg-orange-100 text-orange-800', 
  major: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900'
}

const SEVERITY_LABELS = {
  minor: 'Nhẹ',
  moderate: 'Trung bình',
  major: 'Nghiêm trọng',
  critical: 'Cực kỳ nghiêm trọng'
}

export function ViolationRecordingForm({ onSubmit, onCancel, loading }: ViolationRecordingFormProps) {
  const [formData, setFormData] = useState({
    student_id: '',
    violation_rule_id: '',
    class_id: '',
    violation_date: new Date().toISOString().split('T')[0],
    violation_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
    location: '',
    description: '',
    witnesses: [''],
    evidence: []
  })

  const [students, setStudents] = useState<Student[]>([])
  const [violationRules, setViolationRules] = useState<ViolationRule[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedRule, setSelectedRule] = useState<ViolationRule | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Fetch initial data
  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      setLoadingData(true)
      
      const [studentsRes, rulesRes, classesRes] = await Promise.all([
        fetch('/api/users?role=student'),
        fetch('/api/violation-rules'),
        fetch('/api/classes')
      ])

      const [studentsData, rulesData, classesData] = await Promise.all([
        studentsRes.json(),
        rulesRes.json(),
        classesRes.json()
      ])

      if (studentsData.success) setStudents(studentsData.data)
      if (rulesData.success) setViolationRules(rulesData.data)
      if (classesData.success) setClasses(classesData.data)
    } catch (err) {
      setError('Không thể tải dữ liệu')
      console.error('Error fetching data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  // Update selected student when student_id changes
  useEffect(() => {
    if (formData.student_id) {
      const student = students.find(s => s.id === formData.student_id)
      setSelectedStudent(student || null)
      
      // Auto-select class if student has enrolled class
      if (student?.class) {
        setFormData(prev => ({ ...prev, class_id: student.class!.id }))
      }
    } else {
      setSelectedStudent(null)
    }
  }, [formData.student_id, students])

  // Update selected rule when violation_rule_id changes
  useEffect(() => {
    if (formData.violation_rule_id) {
      const rule = violationRules.find(r => r.id === formData.violation_rule_id)
      setSelectedRule(rule || null)
    } else {
      setSelectedRule(null)
    }
  }, [formData.violation_rule_id, violationRules])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleWitnessChange = (index: number, value: string) => {
    const newWitnesses = [...formData.witnesses]
    newWitnesses[index] = value
    setFormData(prev => ({ ...prev, witnesses: newWitnesses }))
  }

  const addWitness = () => {
    setFormData(prev => ({ ...prev, witnesses: [...prev.witnesses, ''] }))
  }

  const removeWitness = (index: number) => {
    const newWitnesses = formData.witnesses.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, witnesses: newWitnesses }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.student_id || !formData.violation_rule_id || !formData.description) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc')
      return
    }

    // Clean up witnesses (remove empty entries)
    const cleanedData = {
      ...formData,
      witnesses: formData.witnesses.filter(w => w.trim() !== '')
    }

    onSubmit(cleanedData)
  }

  if (loadingData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Đang tải dữ liệu...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          Ghi nhận vi phạm học sinh
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Student Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="student">Học sinh *</Label>
              <select
                id="student"
                value={formData.student_id}
                onChange={(e) => handleInputChange('student_id', e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="">Chọn học sinh</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} - {student.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="class">Lớp học</Label>
              <select
                id="class"
                value={formData.class_id}
                onChange={(e) => handleInputChange('class_id', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Chọn lớp học</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selected Student Info */}
          {selectedStudent && (
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">Thông tin học sinh</h4>
              <p className="text-blue-700">
                <strong>Tên:</strong> {selectedStudent.full_name}<br />
                <strong>SĐT:</strong> {selectedStudent.phone}<br />
                {selectedStudent.class && (
                  <>
                    <strong>Lớp:</strong> {selectedStudent.class.name} ({selectedStudent.class.code})
                  </>
                )}
              </p>
            </div>
          )}

          {/* Violation Rule Selection */}
          <div>
            <Label htmlFor="violation_rule">Quy tắc vi phạm *</Label>
            <select
              id="violation_rule"
              value={formData.violation_rule_id}
              onChange={(e) => handleInputChange('violation_rule_id', e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Chọn quy tắc vi phạm</option>
              {violationRules.map((rule) => (
                <option key={rule.id} value={rule.id}>
                  {rule.code} - {rule.name}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Rule Info */}
          {selectedRule && (
            <div className="bg-yellow-50 p-4 rounded-md">
              <h4 className="font-medium text-yellow-900 mb-2">Chi tiết vi phạm</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={SEVERITY_COLORS[selectedRule.severity]}>
                    {SEVERITY_LABELS[selectedRule.severity]}
                  </Badge>
                  <span className="text-sm text-gray-600">Danh mục: {selectedRule.category}</span>
                </div>
                <p className="text-yellow-700">
                  <strong>Mô tả:</strong> {selectedRule.description}
                </p>
              </div>
            </div>
          )}

          {/* Date, Time, Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date">Ngày vi phạm *</Label>
              <Input
                id="date"
                type="date"
                value={formData.violation_date}
                onChange={(e) => handleInputChange('violation_date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Giờ vi phạm</Label>
              <Input
                id="time"
                type="time"
                value={formData.violation_time}
                onChange={(e) => handleInputChange('violation_time', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="location">Địa điểm</Label>
              <Input
                id="location"
                placeholder="Ví dụ: Lớp học, Sân trường, Thư viện..."
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Mô tả chi tiết vi phạm *</Label>
            <textarea
              id="description"
              rows={4}
              className="w-full p-2 border rounded-md"
              placeholder="Mô tả chi tiết về hành vi vi phạm, hoàn cảnh xảy ra..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
            />
          </div>

          {/* Witnesses */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Nhân chứng</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addWitness}
              >
                <Plus className="h-4 w-4 mr-1" />
                Thêm nhân chứng
              </Button>
            </div>
            <div className="space-y-2">
              {formData.witnesses.map((witness, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder="Tên nhân chứng"
                    value={witness}
                    onChange={(e) => handleWitnessChange(index, e.target.value)}
                  />
                  {formData.witnesses.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeWitness(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                'Đang lưu...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Ghi nhận vi phạm
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 