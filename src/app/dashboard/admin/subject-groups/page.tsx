'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Layers, RefreshCw, BookOpen, Users } from 'lucide-react'
import { toast } from 'sonner'

interface SubjectGroup {
  name: string
  code: string
  type: 'natural_sciences' | 'social_sciences'
  description: string
  subject_codes: string[]
  specialization_subjects: string[]
  max_students: number
  metadata: {
    name_en: string
    group_type: string
    is_active: boolean
  }
  subjects?: any[]
  specialization_subject_details?: any[]
}

const GROUP_TYPE_LABELS = {
  natural_sciences: 'Khoa học tự nhiên',
  social_sciences: 'Khoa học xã hội'
}

const GROUP_TYPE_COLORS = {
  natural_sciences: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  social_sciences: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
}

export default function SubjectGroupsPage() {
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [initializing, setInitializing] = useState(false)

  // Fetch subject groups
  const fetchSubjectGroups = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter) params.append('type', typeFilter)
      params.append('include_subjects', 'true')

      const response = await fetch(`/api/subject-groups?${params}`)
      const result = await response.json()

      if (result.success) {
        setSubjectGroups(result.data)
      } else {
        toast.error('Không thể tải danh sách cụm môn học')
      }
    } catch (error) {
      console.error('Error fetching subject groups:', error)
      toast.error('Lỗi khi tải danh sách cụm môn học')
    } finally {
      setLoading(false)
    }
  }

  // Initialize predefined subject groups
  const handleInitializeSubjectGroups = async () => {
    try {
      setInitializing(true)
      const response = await fetch('/api/subject-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        fetchSubjectGroups()
      } else {
        toast.error(result.error || 'Không thể khởi tạo cụm môn học')
        if (result.missing_subjects) {
          toast.error(`Thiếu các môn học: ${result.missing_subjects.join(', ')}`)
        }
      }
    } catch (error) {
      console.error('Error initializing subject groups:', error)
      toast.error('Lỗi khi khởi tạo cụm môn học')
    } finally {
      setInitializing(false)
    }
  }

  useEffect(() => {
    fetchSubjectGroups()
  }, [searchTerm, typeFilter])

  // Filter groups by type
  const naturalSciencesGroups = subjectGroups.filter(g => g.type === 'natural_sciences')
  const socialSciencesGroups = subjectGroups.filter(g => g.type === 'social_sciences')

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý cụm môn học</h1>
          <p className="text-muted-foreground">
            Quản lý các cụm môn học tự chọn theo chương trình THPT 2018
          </p>
        </div>
        <Button 
          onClick={handleInitializeSubjectGroups}
          disabled={initializing}
          variant="outline"
        >
          {initializing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Layers className="h-4 w-4 mr-2" />}
          Khởi tạo cụm môn học
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Layers className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Khoa học tự nhiên</p>
                <p className="text-2xl font-bold">{naturalSciencesGroups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Layers className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Khoa học xã hội</p>
                <p className="text-2xl font-bold">{socialSciencesGroups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Tổng cụm</p>
                <p className="text-2xl font-bold">{subjectGroups.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Sức chứa tối đa</p>
                <p className="text-2xl font-bold">
                  {subjectGroups.reduce((sum, g) => sum + g.max_students, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Tìm kiếm cụm môn học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả loại</option>
          <option value="natural_sciences">Khoa học tự nhiên</option>
          <option value="social_sciences">Khoa học xã hội</option>
        </select>
      </div>

      {/* Subject Groups List */}
      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Đang tải cụm môn học...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Natural Sciences Section */}
          {naturalSciencesGroups.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Layers className="h-6 w-6 text-purple-600" />
                Khoa học tự nhiên ({naturalSciencesGroups.length} cụm)
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {naturalSciencesGroups.map((group) => (
                  <Card key={group.code} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{group.code}</p>
                        </div>
                        <Badge className={GROUP_TYPE_COLORS[group.type]}>
                          {GROUP_TYPE_LABELS[group.type]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Môn học tự chọn:</h4>
                        <div className="flex flex-wrap gap-1">
                          {group.subject_codes.map((code) => (
                            <Badge key={code} variant="secondary">{code}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Chuyên đề:</h4>
                        <div className="flex flex-wrap gap-1">
                          {group.specialization_subjects.map((code) => (
                            <Badge key={code} variant="outline">{code}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Tối đa {group.max_students} học sinh</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Social Sciences Section */}
          {socialSciencesGroups.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Layers className="h-6 w-6 text-orange-600" />
                Khoa học xã hội ({socialSciencesGroups.length} cụm)
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {socialSciencesGroups.map((group) => (
                  <Card key={group.code} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{group.code}</p>
                        </div>
                        <Badge className={GROUP_TYPE_COLORS[group.type]}>
                          {GROUP_TYPE_LABELS[group.type]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Môn học tự chọn:</h4>
                        <div className="flex flex-wrap gap-1">
                          {group.subject_codes.map((code) => (
                            <Badge key={code} variant="secondary">{code}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Chuyên đề:</h4>
                        <div className="flex flex-wrap gap-1">
                          {group.specialization_subjects.map((code) => (
                            <Badge key={code} variant="outline">{code}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>Tối đa {group.max_students} học sinh</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && subjectGroups.length === 0 && (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Layers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">Chưa có cụm môn học</h3>
              <p className="mt-1 text-sm text-gray-500">
                Bắt đầu bằng việc khởi tạo các cụm môn học chuẩn theo chương trình THPT 2018.
              </p>
              <div className="mt-6">
                <Button onClick={handleInitializeSubjectGroups} disabled={initializing}>
                  {initializing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Layers className="h-4 w-4 mr-2" />}
                  Khởi tạo cụm môn học
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 