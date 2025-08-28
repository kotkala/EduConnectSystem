'use client'

import { Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/shared/components/ui/button"
import { TeacherPageTemplate } from "@/shared/components/dashboard/teacher-page-template"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import {
  Users,
  RefreshCw,
  Search,
  GraduationCap,
  UserCheck,
  User
} from "lucide-react"
import { toast } from "sonner"
import { SharedPaginationControls } from "@/shared/components/shared/shared-pagination-controls"

import {
  getHomeroomClassInfoAction,
  getHomeroomStudentsAction
} from "@/lib/actions/homeroom-student-actions"
import {
  type HomeroomClass,
  type HomeroomStudent,
  type HomeroomFilters
} from "@/lib/validations/homeroom-validations"
import { HomeroomStudentCard } from "@/features/grade-management/components/homeroom/homeroom-student-card"
import { HomeroomStudentDetail } from "@/features/grade-management/components/homeroom/homeroom-student-detail"


export default function HomeroomStudentsPage() {
  const [classInfo, setClassInfo] = useState<HomeroomClass | null>(null)
  const [students, setStudents] = useState<HomeroomStudent[]>([])
  const [filteredStudents, setFilteredStudents] = useState<HomeroomStudent[]>([])
  const [selectedStudent, setSelectedStudent] = useState<HomeroomStudent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<HomeroomFilters>({
    search: '',
    gender: 'all',
    has_parents: undefined,
    sort_by: 'name',
    sort_order: 'asc'
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [paginatedStudents, setPaginatedStudents] = useState<HomeroomStudent[]>([])
  const pageSize = 10

  // Load homeroom class information and students
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Get class information
      const classResult = await getHomeroomClassInfoAction()
      if (!classResult.success) {
        setError(classResult.error || "Không thể tải thông tin lớp học")
        return
      }

      setClassInfo(classResult.data!)

      // Get students
      const studentsResult = await getHomeroomStudentsAction()
      if (!studentsResult.success) {
        setError(studentsResult.error || "Không thể tải danh sách học sinh")
        return
      }

      setStudents(studentsResult.data || [])
      setFilteredStudents(studentsResult.data || [])

    } catch (err) {
      console.error("Load data error:", err)
      setError("Đã xảy ra lỗi không mong muốn")
      toast.error("Không thể tải dữ liệu lớp chủ nhiệm")
    } finally {
      setLoading(false)
    }
  }, [])

  // Filter and sort students
  const applyFilters = useCallback(() => {
    let filtered = [...students]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(student => 
        student.full_name.toLowerCase().includes(searchLower) ||
        student.student_id.toLowerCase().includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower)
      )
    }

    // Gender filter
    if (filters.gender && filters.gender !== 'all') {
      const genderFilter = filters.gender as 'male' | 'female' | 'other'
      filtered = filtered.filter(student => student.gender === genderFilter)
    }

    // Has parents filter
    if (filters.has_parents !== undefined) {
      filtered = filtered.filter(student => 
        filters.has_parents ? student.parents.length > 0 : student.parents.length === 0
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string
      let bValue: string

      switch (filters.sort_by) {
        case 'student_id':
          aValue = a.student_id
          bValue = b.student_id
          break
        case 'email':
          aValue = a.email
          bValue = b.email
          break
        default:
          aValue = a.full_name
          bValue = b.full_name
      }

      const comparison = aValue.localeCompare(bValue)
      return filters.sort_order === 'asc' ? comparison : -comparison
    })

    setFilteredStudents(filtered)

    // Update pagination
    setTotalCount(filtered.length)
    setTotalPages(Math.ceil(filtered.length / pageSize))

    // Get current page students
    const startIndex = (currentPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    setPaginatedStudents(filtered.slice(startIndex, endIndex))
  }, [students, filters, currentPage, pageSize])

  // Apply filters when students or filters change
  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [loadData]) // âœ… Include loadData dependency

  // Handle filter changes
  const handleFilterChange = (key: keyof HomeroomFilters, value: string | boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  // Handle refresh
  const handleRefresh = () => {
    loadData()
    toast.success("Đã làm mới dữ liệu")
  }

  if (loading && !classInfo) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    )
  }

  if (error && !classInfo) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <TeacherPageTemplate
      title="Học sinh lớp chủ nhiệm"
      description={classInfo ? `${classInfo.name} • ${classInfo.academic_year_name} • ${classInfo.semester_name}` : "Quản lý danh sách học sinh lớp chủ nhiệm"}
      actions={
        <Button onClick={handleRefresh} variant="outline" className="w-full sm:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      }
      showCard={true}
    >
      <div className="space-y-6">

      {/* Class Overview */}
      {classInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Tổng quan lớp học
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 md:h-9 lg:h-10 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{classInfo.student_count}</p>
                  <p className="text-sm text-muted-foreground">Tổng số học sinh</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 md:h-9 lg:h-10 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {students.filter(s => s.parents.length > 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Có phụ huynh</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-8 md:h-9 lg:h-10 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {students.filter(s => s.parents.length === 0).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Chưa có phụ huynh</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Tìm kiếm</Label>
              <Input
                id="search"
                placeholder="Tên, Mã học sinh hoặc Email"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Giới tính</Label>
              <Select
                value={filters.gender || 'all'}
                onValueChange={(value) => handleFilterChange('gender', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_by">Sort By</Label>
              <Select
                value={filters.sort_by}
                onValueChange={(value) => handleFilterChange('sort_by', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="student_id">Student ID</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sort Order</Label>
              <Select
                value={filters.sort_order}
                onValueChange={(value) => handleFilterChange('sort_order', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending</SelectItem>
                  <SelectItem value="desc">Descending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Students List - Horizontal Layout */}
      <div className="space-y-4">
        {paginatedStudents.map((student) => (
          <HomeroomStudentCard
            key={student.id}
            student={student}
            onClick={() => setSelectedStudent(student)}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      <SharedPaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        itemName="học sinh"
      />

      {/* No Students Message */}
      {filteredStudents.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 md:h-14 lg:h-16 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Students Found</h3>
            <p className="text-muted-foreground">
              {students.length === 0
                ? "No students are assigned to your homeroom class yet."
                : "No students match your current filters."
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <HomeroomStudentDetail
          student={selectedStudent}
          classInfo={classInfo}
          open={!!selectedStudent}
          onOpenChange={(open) => !open && setSelectedStudent(null)}
        />
      )}
      </div>
    </TeacherPageTemplate>
  )
}
