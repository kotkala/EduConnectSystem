'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Edit, Trash2, Search, Eye, EyeOff } from 'lucide-react'

const SEVERITY_COLORS = {
  minor: 'bg-blue-100 text-blue-800',
  moderate: 'bg-yellow-100 text-yellow-800', 
  major: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const SEVERITY_LABELS = {
  minor: 'Nhẹ',
  moderate: 'Trung bình', 
  major: 'Nặng',
  critical: 'Nghiêm trọng'
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
  created_at: string
  updated_at: string
}

interface ViolationRulesTableProps {
  rules: ViolationRule[]
  loading: boolean
  onEdit: (rule: ViolationRule) => void
  onDelete: (id: string) => void
}

export function ViolationRulesTable({ rules, loading, onEdit, onDelete }: ViolationRulesTableProps) {
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  // Filter rules based on search and active status
  const filteredRules = rules.filter(rule => {
    const matchesSearch = search === '' || 
      rule.code.toLowerCase().includes(search.toLowerCase()) ||
      rule.name.toLowerCase().includes(search.toLowerCase()) ||
      rule.category.toLowerCase().includes(search.toLowerCase())
    
    const matchesStatus = showInactive || rule.is_active
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-9 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Tìm kiếm theo mã, tên hoặc danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowInactive(!showInactive)}
          className="flex items-center gap-2"
        >
          {showInactive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showInactive ? 'Ẩn quy tắc vô hiệu' : 'Hiện quy tắc vô hiệu'}
        </Button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        Hiển thị {filteredRules.length} / {rules.length} quy tắc
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã / Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Danh mục
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mức độ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động mặc định
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy quy tắc vi phạm nào
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {rule.code}
                        </div>
                        <div className="text-sm text-gray-500">
                          {rule.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {rule.category}
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={SEVERITY_COLORS[rule.severity]}>
                        {SEVERITY_LABELS[rule.severity]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {rule.default_action || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge 
                        variant={rule.is_active ? "default" : "secondary"}
                        className={rule.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                      >
                        {rule.is_active ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(rule)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(rule.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredRules.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Không tìm thấy quy tắc vi phạm nào
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div key={rule.id} className="bg-white border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium text-gray-900">{rule.code}</div>
                  <div className="text-sm text-gray-600">{rule.name}</div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(rule)}
                    className="text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(rule.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-sm text-gray-600">
                <strong>Danh mục:</strong> {rule.category}
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Badge className={SEVERITY_COLORS[rule.severity]}>
                  {SEVERITY_LABELS[rule.severity]}
                </Badge>
                <Badge 
                  variant={rule.is_active ? "default" : "secondary"}
                  className={rule.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {rule.is_active ? 'Hoạt động' : 'Tạm dừng'}
                </Badge>
              </div>
              
              {rule.default_action && (
                <div className="text-sm text-gray-600">
                  <strong>Hành động:</strong> {rule.default_action}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
} 