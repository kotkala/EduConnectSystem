'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, BookOpen, Clock, Filter, RefreshCw, Layers } from 'lucide-react'
import { toast } from 'sonner'

interface Subject {
  id: string
  name: string
  code: string
  description?: string
  credits: number
  metadata: {
    category?: string
    type?: 'mandatory' | 'elective'
    periods_per_year?: number
    name_en?: string
  }
  created_at: string
}

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
}

const SUBJECT_TYPE_LABELS = {
  mandatory: 'Bắt buộc',
  elective: 'Tự chọn'
}

const SUBJECT_TYPE_COLORS = {
  mandatory: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  elective: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
}

const CATEGORY_LABELS = {
  language_arts: 'Ngôn ngữ',
  mathematics: 'Toán học',
  natural_sciences: 'Khoa học tự nhiên',
  social_sciences: 'Khoa học xã hội',
  physical_education: 'Thể dục',
  arts: 'Nghệ thuật',
  technology: 'Công nghệ',
  civic_education: 'Giáo dục công dân',
  experiential_activities: 'Hoạt động trải nghiệm'
}

const GROUP_TYPE_LABELS = {
  natural_sciences: 'Khoa học tự nhiên',
  social_sciences: 'Khoa học xã hội'
}

const GROUP_TYPE_COLORS = {
  natural_sciences: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  social_sciences: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [groupsLoading, setGroupsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [initializing, setInitializing] = useState(false)
  const [groupsInitializing, setGroupsInitializing] = useState(false)

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter) params.append('type', typeFilter)
      if (categoryFilter) params.append('category', categoryFilter)
      params.append('limit', '100')

      const response = await fetch(`/api/subjects?${params}`)
      const result = await response.json()

      if (result.success) {
        setSubjects(result.data)
      } else {
        toast.error('Không thể tải danh sách môn học')
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
      toast.error('Lỗi khi tải danh sách môn học')
    } finally {
      setLoading(false)
    }
  }

  // Fetch subject groups
  const fetchSubjectGroups = async () => {
    try {
      setGroupsLoading(true)
      const response = await fetch('/api/subject-groups?include_subjects=true')
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
      setGroupsLoading(false)
    }
  }

  // Initialize predefined subjects
  const handleInitializeSubjects = async () => {
    try {
      setInitializing(true)
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'initialize' })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        fetchSubjects()
      } else {
        toast.error(result.error || 'Không thể khởi tạo môn học')
      }
    } catch (error) {
      console.error('Error initializing subjects:', error)
      toast.error('Lỗi khi khởi tạo môn học')
    } finally {
      setInitializing(false)
    }
  }

  // Initialize predefined subject groups
  const handleInitializeSubjectGroups = async () => {
    try {
      setGroupsInitializing(true)
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
      }
    } catch (error) {
      console.error('Error initializing subject groups:', error)
      toast.error('Lỗi khi khởi tạo cụm môn học')
    } finally {
      setGroupsInitializing(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
    fetchSubjectGroups()
  }, [searchTerm, typeFilter, categoryFilter])

  // Filter subjects by type for display
  const mandatorySubjects = subjects.filter(s => s.metadata?.type === 'mandatory')
  const electiveSubjects = subjects.filter(s => s.metadata?.type === 'elective')

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý môn học</h1>
          <p className="text-muted-foreground">
            Quản lý môn học bắt buộc, tự chọn và cụm môn học theo chương trình THPT 2018
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleInitializeSubjects}
            disabled={initializing}
            variant="outline"
          >
            {initializing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <BookOpen className="h-4 w-4 mr-2" />}
            Khởi tạo môn học
          </Button>
          <Button 
            onClick={handleInitializeSubjectGroups}
            disabled={groupsInitializing}
            variant="outline"
          >
            {groupsInitializing ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Layers className="h-4 w-4 mr-2" />}
            Khởi tạo cụm môn
          </Button>
        </div>
      </div>

      <Tabs defaultValue="mandatory" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mandatory">Môn bắt buộc ({mandatorySubjects.length})</TabsTrigger>
          <TabsTrigger value="elective">Môn tự chọn ({electiveSubjects.length})</TabsTrigger>
          <TabsTrigger value="groups">Cụm môn học ({subjectGroups.length})</TabsTrigger>
        </TabsList>

        {/* Search and Filter Controls */}
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm môn học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {/* Add more filters if needed */}
        </div>

        {/* Mandatory Subjects Tab */}
        <TabsContent value="mandatory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mandatorySubjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{subject.code}</p>
                    </div>
                    <Badge className={SUBJECT_TYPE_COLORS.mandatory}>
                      {SUBJECT_TYPE_LABELS.mandatory}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {subject.description && (
                    <p className="text-sm text-muted-foreground">{subject.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{subject.credits} tín chỉ</span>
                    </div>
                    {subject.metadata?.periods_per_year && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{subject.metadata.periods_per_year} tiết/năm</span>
                      </div>
                    )}
                  </div>
                  {subject.metadata?.category && (
                    <Badge variant="outline">
                      {CATEGORY_LABELS[subject.metadata.category as keyof typeof CATEGORY_LABELS] || subject.metadata.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {loading && <p className="text-center py-8">Đang tải...</p>}
          {!loading && mandatorySubjects.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chưa có môn học bắt buộc nào.</p>
              <Button onClick={handleInitializeSubjects} className="mt-2">
                Khởi tạo môn học chuẩn
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Elective Subjects Tab */}
        <TabsContent value="elective" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {electiveSubjects.map((subject) => (
              <Card key={subject.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{subject.code}</p>
                    </div>
                    <Badge className={SUBJECT_TYPE_COLORS.elective}>
                      {SUBJECT_TYPE_LABELS.elective}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {subject.description && (
                    <p className="text-sm text-muted-foreground">{subject.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{subject.credits} tín chỉ</span>
                    </div>
                    {subject.metadata?.periods_per_year && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{subject.metadata.periods_per_year} tiết/năm</span>
                      </div>
                    )}
                  </div>
                  {subject.metadata?.category && (
                    <Badge variant="outline">
                      {CATEGORY_LABELS[subject.metadata.category as keyof typeof CATEGORY_LABELS] || subject.metadata.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          {loading && <p className="text-center py-8">Đang tải...</p>}
          {!loading && electiveSubjects.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chưa có môn học tự chọn nào.</p>
              <Button onClick={handleInitializeSubjects} className="mt-2">
                Khởi tạo môn học chuẩn
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Subject Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="grid gap-6">
            {subjectGroups.map((group) => (
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
                    <span>Tối đa: {group.max_students} học sinh</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {groupsLoading && <p className="text-center py-8">Đang tải cụm môn học...</p>}
          {!groupsLoading && subjectGroups.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chưa có cụm môn học nào.</p>
              <Button onClick={handleInitializeSubjectGroups} className="mt-2">
                Khởi tạo cụm môn học chuẩn
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 