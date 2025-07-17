'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Plus, Settings, Trash2, Edit } from 'lucide-react'
import { ViolationRuleForm } from '@/components/admin/violation-rule-form'
import { ViolationRulesTable } from '@/components/admin/violation-rules-table'

// Categories from API
const VIOLATION_CATEGORIES = {
  'ATTENDANCE_CHECK': '15 phút truy bài đầu giờ',
  'CIVILIZED_LIFESTYLE': 'Nếp sống văn minh', 
  'ROLL_CALL': 'Kiểm tra sĩ số',
  'DOCUMENTS_RECORDS': 'Văn bản sổ sách',
  'ENVIRONMENTAL_HYGIENE': 'Vệ sinh môi trường',
  'DORMITORY': 'Ký túc xá'
}

const SEVERITY_COLORS = {
  minor: 'bg-blue-100 text-blue-800',
  moderate: 'bg-yellow-100 text-yellow-800', 
  major: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
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

interface CategoryStats {
  category: string
  count: number
  active: number
  inactive: number
}

export default function ViolationRulesPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showForm, setShowForm] = useState(false)
  const [editingRule, setEditingRule] = useState<ViolationRule | null>(null)
  const [violationRules, setViolationRules] = useState<ViolationRule[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchViolationRules()
  }, [])

  useEffect(() => {
    // Calculate category stats when rules change
    const stats = Object.entries(VIOLATION_CATEGORIES).map(([key, label]) => {
      const categoryRules = violationRules.filter(rule => rule.category === label)
      return {
        category: label,
        count: categoryRules.length,
        active: categoryRules.filter(r => r.is_active).length,
        inactive: categoryRules.filter(r => !r.is_active).length
      }
    })
    setCategoryStats(stats)
  }, [violationRules])

  const fetchViolationRules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/violation-rules')
      const result = await response.json()
      
      if (response.ok) {
        setViolationRules(result.data || [])
      } else {
        console.error('Error fetching violation rules:', result.error)
      }
    } catch (error) {
      console.error('Error fetching violation rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveRule = async (ruleData: any) => {
    try {
      const url = editingRule 
        ? `/api/violation-rules/${editingRule.id}`
        : '/api/violation-rules'
      
      const method = editingRule ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      })

      const result = await response.json()
      
      if (response.ok) {
        await fetchViolationRules() // Refresh data
        setShowForm(false)
        setEditingRule(null)
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error saving violation rule:', error)
      alert('Error saving violation rule')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa quy tắc vi phạm này?')) return

    try {
      const response = await fetch(`/api/violation-rules/${ruleId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchViolationRules() // Refresh data
      } else {
        const result = await response.json()
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting violation rule:', error)
      alert('Error deleting violation rule')
    }
  }

  const handleEditRule = (rule: ViolationRule) => {
    setEditingRule(rule)
    setShowForm(true)
  }

  const handleInitialize = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/violation-rules/initialize', {
        method: 'POST'
      })
      
      const result = await response.json()
      
      if (response.ok) {
        await fetchViolationRules() // Refresh data
        alert(`Khởi tạo thành công ${result.count} luật vi phạm mẫu`)
      } else {
        alert('Error: ' + result.error)
      }
    } catch (error) {
      console.error('Error initializing violation rules:', error)
      alert('Error initializing violation rules')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Quản lý Luật Vi phạm</h1>
        <p className="text-gray-600">
          Quản lý các quy tắc vi phạm trong trường học theo từng danh mục
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          {Object.entries(VIOLATION_CATEGORIES).map(([key, label]) => (
            <TabsTrigger key={key} value={key} className="text-xs">
              {label.split(' ')[0]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tổng quan luật vi phạm</h2>
            <div className="flex gap-2">
              {violationRules.length === 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleInitialize}
                  disabled={loading}
                >
                  Khởi tạo Mẫu
                </Button>
              )}
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm Luật Vi phạm
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryStats.map((stat) => (
              <Card key={stat.category}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">
                    {stat.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{stat.count}</div>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Hoạt động: {stat.active}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700">
                      Tạm dừng: {stat.inactive}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tất cả Luật Vi phạm</CardTitle>
              <CardDescription>
                Danh sách tất cả các luật vi phạm trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ViolationRulesTable
                rules={violationRules}
                loading={loading}
                onEdit={handleEditRule}
                onDelete={handleDeleteRule}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {Object.entries(VIOLATION_CATEGORIES).map(([key, label]) => (
          <TabsContent key={key} value={key} className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold">{label}</h2>
                <p className="text-gray-600">
                  Quản lý các luật vi phạm thuộc danh mục {label}
                </p>
              </div>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Thêm Luật Vi phạm
              </Button>
            </div>

            <Card>
              <CardContent className="pt-6">
                <ViolationRulesTable
                  rules={violationRules.filter(rule => rule.category === label)}
                  loading={loading}
                  onEdit={handleEditRule}
                  onDelete={handleDeleteRule}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {showForm && (
        <ViolationRuleForm
          rule={editingRule}
          onSave={handleSaveRule}
          onCancel={() => {
            setShowForm(false)
            setEditingRule(null)
          }}
        />
      )}
    </div>
  )
} 