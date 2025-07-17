'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Plus, Search, Eye, Filter } from 'lucide-react'
import { ViolationRecordingForm } from '@/components/admin/violation-recording-form'

interface Violation {
  id: string
  violation_date: string
  violation_time: string
  location: string
  description: string
  status: string
  witnesses: string[]
  student: {
    id: string
    full_name: string
    phone: string
  }
  violation_rule: {
    id: string
    code: string
    name: string
    severity: string
    category: string
  }
  class: {
    id: string
    name: string
    code: string
  }
  reporter: {
    id: string
    full_name: string
  }
  created_at: string
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

const STATUS_COLORS = {
  reported: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-red-100 text-red-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-800'
}

const STATUS_LABELS = {
  reported: 'Đã báo cáo',
  under_review: 'Đang xem xét',
  confirmed: 'Đã xác nhận',
  resolved: 'Đã giải quyết',
  dismissed: 'Đã bỏ qua'
}

export default function StudentViolationsPage() {
  const [violations, setViolations] = useState<Violation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchViolations()
  }, [page, statusFilter, severityFilter])

  const fetchViolations = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '20'
      })
      
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)

      const response = await fetch(`/api/student-violations?${params}`)
      const result = await response.json()

      if (result.success) {
        setViolations(result.data)
        setTotalPages(result.pagination.total_pages)
        setError(null)
      } else {
        setError(result.error || 'Không thể tải danh sách vi phạm')
      }
    } catch (err) {
      setError('Có lỗi mạng xảy ra')
      console.error('Error fetching violations:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchViolations()
  }

  const handleRecordViolation = async (data: any) => {
    try {
      setFormLoading(true)
      
      const response = await fetch('/api/student-violations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (result.success) {
        setShowForm(false)
        setPage(1)
        fetchViolations()
        alert('Ghi nhận vi phạm thành công!')
      } else {
        alert(result.error || 'Không thể ghi nhận vi phạm')
      }
    } catch (err) {
      alert('Có lỗi mạng xảy ra')
      console.error('Error recording violation:', err)
    } finally {
      setFormLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const formatTime = (timeString: string) => {
    return timeString?.substring(0, 5) || ''
  }

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ghi nhận vi phạm học sinh</h1>
            <p className="text-muted-foreground">Tạo báo cáo vi phạm mới</p>
          </div>
        </div>

        <ViolationRecordingForm
          onSubmit={handleRecordViolation}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý vi phạm học sinh</h1>
          <p className="text-muted-foreground">Theo dõi và quản lý các vi phạm của học sinh</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Ghi nhận vi phạm
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                placeholder="Tìm kiếm theo tên học sinh, mô tả vi phạm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-2 border rounded-md"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="reported">Đã báo cáo</option>
                <option value="under_review">Đang xem xét</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="dismissed">Đã bỏ qua</option>
              </select>
            </div>

            <Button type="submit" variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Tìm kiếm
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Violations List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách vi phạm</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2">Đang tải...</p>
            </div>
          ) : violations.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Không có vi phạm nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {violations.map((violation) => (
                <div key={violation.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{violation.student.full_name}</h3>
                        <Badge variant="outline">
                          {violation.class?.name || 'Không xác định'}
                        </Badge>
                        <Badge className={STATUS_COLORS[violation.status as keyof typeof STATUS_COLORS]}>
                          {STATUS_LABELS[violation.status as keyof typeof STATUS_LABELS]}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">
                            <strong>Vi phạm:</strong> {violation.violation_rule.name}
                          </p>
                          <p className="text-gray-600">
                            <strong>Mã:</strong> {violation.violation_rule.code}
                          </p>
                          <p className="text-gray-600">
                            <strong>Danh mục:</strong> {violation.violation_rule.category}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-600">
                            <strong>Ngày:</strong> {formatDate(violation.violation_date)}
                          </p>
                          <p className="text-gray-600">
                            <strong>Giờ:</strong> {formatTime(violation.violation_time)}
                          </p>
                          <p className="text-gray-600">
                            <strong>Địa điểm:</strong> {violation.location || 'Không xác định'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <p className="text-gray-700">
                          <strong>Mô tả:</strong> {violation.description}
                        </p>
                      </div>
                      
                      {violation.witnesses && violation.witnesses.length > 0 && (
                        <div className="mt-2">
                          <p className="text-gray-600">
                            <strong>Nhân chứng:</strong> {violation.witnesses.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <Badge className={SEVERITY_COLORS[violation.violation_rule.severity as keyof typeof SEVERITY_COLORS]}>
                        {SEVERITY_LABELS[violation.violation_rule.severity as keyof typeof SEVERITY_LABELS]}
                      </Badge>
                      
                      <div className="text-xs text-gray-500">
                        Báo cáo bởi: {violation.reporter.full_name}
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        {formatDate(violation.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </Button>
              
              <span className="text-sm text-gray-600">
                Trang {page} / {totalPages}
              </span>
              
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 