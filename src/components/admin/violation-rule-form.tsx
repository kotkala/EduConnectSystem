'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

const VIOLATION_CATEGORIES = {
  '15 phút truy bài đầu giờ': '15 phút truy bài đầu giờ',
  'Nếp sống văn minh': 'Nếp sống văn minh', 
  'Kiểm tra sĩ số': 'Kiểm tra sĩ số',
  'Văn bản sổ sách': 'Văn bản sổ sách',
  'Vệ sinh môi trường': 'Vệ sinh môi trường',
  'Ký túc xá': 'Ký túc xá'
}

const VIOLATION_SEVERITIES = {
  minor: { label: 'Nhẹ', color: 'bg-blue-100 text-blue-800' },
  moderate: { label: 'Trung bình', color: 'bg-yellow-100 text-yellow-800' }, 
  major: { label: 'Nặng', color: 'bg-orange-100 text-orange-800' },
  critical: { label: 'Nghiêm trọng', color: 'bg-red-100 text-red-800' }
}

interface ViolationRule {
  id: string
  code: string
  name: string
  description?: string
  category: string
  severity: 'minor' | 'moderate' | 'major' | 'critical'
  default_action?: string
  is_active: boolean
}

interface ViolationRuleFormProps {
  rule?: ViolationRule | null
  onSave: (data: any) => void
  onCancel: () => void
}

export function ViolationRuleForm({ rule, onSave, onCancel }: ViolationRuleFormProps) {
  const [formData, setFormData] = useState<{
    code: string
    name: string
    description: string
    category: string
    severity: 'minor' | 'moderate' | 'major' | 'critical'
    default_action: string
    is_active: boolean
  }>({
    code: '',
    name: '',
    description: '',
    category: '',
    severity: 'moderate',
    default_action: '',
    is_active: true
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (rule) {
      setFormData({
        code: rule.code || '',
        name: rule.name || '',
        description: rule.description || '',
        category: rule.category || '',
        severity: rule.severity || 'moderate',
        default_action: rule.default_action || '',
        is_active: rule.is_active ?? true
      })
    }
  }, [rule])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = 'Mã quy tắc không được để trống'
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Tên quy tắc không được để trống'
    }

    if (!formData.category) {
      newErrors.category = 'Vui lòng chọn danh mục'
    }

    if (!formData.severity) {
      newErrors.severity = 'Vui lòng chọn mức độ nghiêm trọng'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSave(formData)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>
            {rule ? 'Chỉnh sửa Luật Vi phạm' : 'Thêm Luật Vi phạm Mới'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Mã quy tắc *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="VD: VP001"
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && (
                  <p className="text-sm text-red-500">{errors.code}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Tên quy tắc *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Tên quy tắc vi phạm"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Danh mục *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.category ? 'border-red-500' : ''
                }`}
              >
                <option value="">Chọn danh mục</option>
                {Object.entries(VIOLATION_CATEGORIES).map(([key, label]) => (
                  <option key={key} value={label}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Mức độ nghiêm trọng *</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(VIOLATION_SEVERITIES).map(([value, { label, color }]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleInputChange('severity', value)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border-2 transition-colors ${
                      formData.severity === value
                        ? 'border-blue-500 ' + color
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {errors.severity && (
                <p className="text-sm text-red-500">{errors.severity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Mô tả chi tiết về quy tắc vi phạm này..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default_action">Hành động mặc định</Label>
              <Input
                id="default_action"
                value={formData.default_action}
                onChange={(e) => handleInputChange('default_action', e.target.value)}
                placeholder="VD: Nhắc nhở, cảnh cáo, đình chỉ..."
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="is_active">Kích hoạt quy tắc này</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Hủy
              </Button>
              <Button type="submit">
                {rule ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 