'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Edit2, Trash2, UserPlus, BookOpen, Users, Layers, Eye } from 'lucide-react'
import Link from 'next/link'
import { ClassForm, ClassFormValues } from './class-form'
import { EduConnectAnimatedModal } from '../ui/animated-components'
import { StudentImportModal } from './student-import-modal'
import { SubjectGroupSelectionModal } from './subject-group-selection-modal'
import { CreateCombinedClassModal } from './create-combined-class-modal'

interface AcademicYear { id: string; name: string }
interface GradeLevel { id: string; name: string; level: number }
interface Class {
  id: string
  academic_year_id: string
  grade_level_id: string
  name: string
  code: string
  capacity: number
  room_number?: string
  is_combined: boolean
  metadata?: {
    subject_group_name?: string
    subject_group_code?: string
    [key: string]: any
  }
  created_at: string
  updated_at: string
  academic_year?: AcademicYear
  grade_level?: GradeLevel
}

export function ClassesTable() {
  const [classes, setClasses] = useState<Class[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [gradeFilter, setGradeFilter] = useState('')
  const [classTypeFilter, setClassTypeFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<Class | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [studentImportOpen, setStudentImportOpen] = useState(false)
  const [subjectGroupSelectionOpen, setSubjectGroupSelectionOpen] = useState(false)
  const [createCombinedOpen, setCreateCombinedOpen] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [subjectGroups, setSubjectGroups] = useState<any[]>([])

  // Fetch academic years for filter and form
  const fetchYears = async () => {
    const res = await fetch('/api/academic-years')
    const result = await res.json()
    if (result.success) setYears(result.data)
  }

  // Fetch grade levels for filter and form
  const fetchGradeLevels = async () => {
    const res = await fetch('/api/grade-levels')
    const result = await res.json()
    if (result.success) setGradeLevels(result.data)
  }

  // Fetch subject groups for combined class creation
  const fetchSubjectGroups = async () => {
    const res = await fetch('/api/subject-groups')
    const result = await res.json()
    if (result.success) setSubjectGroups(result.data)
  }

  // Fetch classes
  const fetchClasses = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        search: search,
        ...(yearFilter ? { academic_year_id: yearFilter } : {}),
        ...(gradeFilter ? { grade_level_id: gradeFilter } : {}),
        ...(classTypeFilter ? { class_type: classTypeFilter } : {})
      })
      
      console.log('Fetching classes with params:', params.toString())
      
      const response = await fetch(`/api/classes?${params}`, {
        cache: 'no-store', // Ensure we get fresh data
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      const result = await response.json()
      
      console.log('Classes fetch result:', result)
      
      if (result.success) {
        const classesData = result.data || []
        console.log(`Fetched ${classesData.length} classes`)
        console.log('Base classes:', classesData.filter((c: any) => !c.is_combined).length)
        console.log('Combined classes:', classesData.filter((c: any) => c.is_combined).length)
        
        // Log combined classes details
        const combinedClasses = classesData.filter((c: any) => c.is_combined)
        if (combinedClasses.length > 0) {
          console.log('Combined classes details:', combinedClasses.map((c: any) => ({
            id: c.id,
            name: c.name,
            code: c.code,
            is_combined: c.is_combined,
            subject_group: c.metadata?.subject_group_code
          })))
        }
        
        setClasses(classesData)
        setTotalPages(result.pagination?.total_pages || 1)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch classes')
        console.error('Failed to fetch classes:', result)
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching classes:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete class
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp "${name}"?`)) return
    try {
      const response = await fetch(`/api/classes/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) fetchClasses()
      else alert(result.error || 'Không thể xóa lớp')
    } catch (err) {
      alert('Có lỗi mạng xảy ra')
      console.error('Error deleting class:', err)
    }
  }

  // Handle add
  const handleAdd = () => {
    setEditData(null)
    setModalOpen(true)
  }

  // Handle edit
  const handleEdit = (classData: Class) => {
    setEditData(classData)
    setModalOpen(true)
  }

  // Handle student import
  const handleStudentImport = (classData: Class) => {
    setSelectedClass(classData)
    setStudentImportOpen(true)
  }

  // Handle subject group selection
  const handleSubjectGroupSelection = (classData: Class) => {
    setSelectedClass(classData)
    setSubjectGroupSelectionOpen(true)
  }

  // Handle view students
  const handleViewStudents = (classData: Class) => {
    // Navigate to students view (implement later)
    console.log('View students for class:', classData.name)
  }

  // Handle form submit
  const handleFormSubmit = async (values: ClassFormValues) => {
    setFormLoading(true)
    setError(null)
    
    try {
      console.log('Submitting class form with values:', values)
      
      let response
      if (editData) {
        response = await fetch(`/api/classes/${editData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
      } else {
        response = await fetch('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
      }
      
      const result = await response.json()
      console.log('Class creation result:', result)
      
      if (result.success) {
        setModalOpen(false)
        setEditData(null)
        // Reset pagination to first page to see new class
        setPage(1)
        // Clear filters to ensure new class is visible
        setSearch('')
        setYearFilter('')
        setGradeFilter('')
        setClassTypeFilter('')
        // Refresh the classes list
        await fetchClasses()
        // Show success message
        const action = editData ? 'updated' : 'created'
        console.log(`Class ${action} successfully:`, result.data?.name)
      } else {
        setError(result.error || 'Failed to save class')
        console.error('Class creation failed:', result)
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error saving class:', err)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchClasses()
  }

  useEffect(() => { fetchYears(); fetchGradeLevels(); fetchSubjectGroups() }, [])
  useEffect(() => { 
    console.log('Effect triggered - fetching classes with filters:', {
      page, yearFilter, gradeFilter, classTypeFilter
    })
    fetchClasses() 
  }, [page, yearFilter, gradeFilter, classTypeFilter])

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle>Quản lý Lớp học</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            placeholder="Tìm kiếm lớp học..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
            disabled={loading}
          />
          <Button type="submit" variant="outline" disabled={loading}>
            <Search className="w-4 h-4 mr-1" /> Tìm kiếm
          </Button>
          <select
            value={yearFilter}
            onChange={e => { setYearFilter(e.target.value); setPage(1) }}
            className="border rounded px-2 py-1 ml-2"
            disabled={loading}
          >
            <option value="">Tất cả năm học</option>
            {years.map((y) => (
              <option key={y.id} value={y.id}>{y.name}</option>
            ))}
          </select>
          <select
            value={gradeFilter}
            onChange={e => { setGradeFilter(e.target.value); setPage(1) }}
            className="border rounded px-2 py-1 ml-2"
            disabled={loading}
          >
            <option value="">Tất cả khối</option>
            {gradeLevels.map((g) => (
              <option key={g.id} value={g.id}>{g.name} (Cấp {g.level})</option>
            ))}
          </select>
          <select
            value={classTypeFilter}
            onChange={e => { setClassTypeFilter(e.target.value); setPage(1) }}
            className="border rounded px-2 py-1 ml-2"
            disabled={loading}
          >
            <option value="">Tất cả loại lớp</option>
            <option value="base_class">Lớp tách</option>
            <option value="combined_class">Lớp ghép</option>
          </select>
          <Button 
            type="button" 
            onClick={() => {
              console.log('Force refresh clicked')
              setSearch('')
              setYearFilter('')
              setGradeFilter('')
              setClassTypeFilter('')
              setPage(1)
              fetchClasses()
            }} 
            variant="outline"
            disabled={loading}
          >
            🔄 Refresh
          </Button>
          <Button 
            type="button" 
            onClick={() => setCreateCombinedOpen(true)} 
            variant="outline"
            className="mr-2" 
            disabled={loading}
          >
            <Layers className="w-4 h-4 mr-1" /> Tạo lớp ghép
          </Button>
          <Button type="button" onClick={handleAdd} disabled={loading}>
            <Plus className="w-4 h-4 mr-1" /> Thêm lớp
          </Button>
          <Button 
            type="button" 
            onClick={() => window.open('/TIMETABLE_CREATION_GUIDE.md', '_blank')} 
            variant="outline"
            className="ml-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
            disabled={loading}
          >
            📚 Hướng dẫn
          </Button>
        </form>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-3 py-2 text-left">Tên lớp</th>
                <th className="px-3 py-2 text-left">Mã lớp</th>
                <th className="px-3 py-2 text-left">Năm học</th>
                <th className="px-3 py-2 text-left">Khối</th>
                <th className="px-3 py-2 text-left">Sĩ số</th>
                <th className="px-3 py-2 text-left">Phòng</th>
                <th className="px-3 py-2 text-left">Loại lớp</th>
                <th className="px-3 py-2 text-left">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-gray-500">Không tìm thấy lớp học nào.</td>
                </tr>
              )}
              {classes.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="px-3 py-2 font-medium">
                    {c.name}
                    {c.is_combined && (
                      <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Lớp ghép
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">{c.code}</td>
                  <td className="px-3 py-2">{c.academic_year?.name || '-'}</td>
                  <td className="px-3 py-2">{c.grade_level?.name || '-'}</td>
                  <td className="px-3 py-2">{c.capacity}</td>
                  <td className="px-3 py-2">{c.room_number || '-'}</td>
                  <td className="px-3 py-2">
                    {c.is_combined ? (
                      <span className="text-purple-600 font-medium">Lớp ghép</span>
                    ) : (
                      <span className="text-blue-600 font-medium">Lớp tách</span>
                    )}
                    {c.is_combined && c.metadata?.subject_group_name && (
                      <div className="text-xs text-gray-500 mt-1">
                        {c.metadata.subject_group_name}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1 flex-wrap">
                      <Link href={`/dashboard/admin/classes/${c.id}`}>
                        <Button size="sm" variant="default" title="Xem chi tiết lớp">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(c)} disabled={loading} title="Chỉnh sửa lớp">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleViewStudents(c)} 
                        disabled={loading}
                        title="Xem học sinh"
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                      {!c.is_combined && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleStudentImport(c)} 
                            disabled={loading}
                            title="Nhập học sinh"
                          >
                            <UserPlus className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleSubjectGroupSelection(c)} 
                            disabled={loading}
                            title="Chọn tổ hợp môn"
                          >
                            <BookOpen className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {c.is_combined && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled
                          title="Lớp ghép (được tạo từ lựa chọn)"
                        >
                          <Layers className="w-4 h-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id, c.name)} disabled={loading} title="Xóa lớp">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Trang {page} / {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || loading}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages || loading}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
        {/* Loading overlay for subsequent requests */}
        {loading && classes.length > 0 && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        )}
        {/* Modal for create/edit class */}
        <EduConnectAnimatedModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editData ? 'Chỉnh sửa lớp' : 'Thêm lớp'}
        >
          <ClassForm
            initialData={editData ? {
              academic_year_id: editData.academic_year_id,
              grade_level_id: editData.grade_level_id,
              name: editData.name,
              code: editData.code,
              capacity: editData.capacity,
              room_number: editData.room_number,
              // is_combined removed from form - only base classes can be edited
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setModalOpen(false)}
            loading={formLoading}
            academicYears={years}
            gradeLevels={gradeLevels}
          />
        </EduConnectAnimatedModal>

        {/* Student Import Modal */}
        <StudentImportModal
          isOpen={studentImportOpen}
          onClose={() => setStudentImportOpen(false)}
          classInfo={selectedClass ? {
            id: selectedClass.id,
            name: selectedClass.name,
            code: selectedClass.code,
            capacity: selectedClass.capacity,
            academic_year_id: selectedClass.academic_year_id
          } : null}
          onImportComplete={() => {
            fetchClasses()
            setStudentImportOpen(false)
          }}
        />

        {/* Subject Group Selection Modal */}
        <SubjectGroupSelectionModal
          isOpen={subjectGroupSelectionOpen}
          onClose={() => setSubjectGroupSelectionOpen(false)}
          classInfo={selectedClass ? {
            id: selectedClass.id,
            name: selectedClass.name,
            code: selectedClass.code,
            academic_year_id: selectedClass.academic_year_id,
            is_combined: selectedClass.is_combined
          } : null}
          onSelectionComplete={() => {
            fetchClasses()
            setSubjectGroupSelectionOpen(false)
          }}
        />

        {/* Create Combined Classes Modal */}
        <CreateCombinedClassModal
          isOpen={createCombinedOpen}
          onClose={() => setCreateCombinedOpen(false)}
          academicYears={years}
          gradeLevels={gradeLevels}
          subjectGroups={subjectGroups}
          onCreateComplete={async () => {
            console.log('Combined class creation completed, refreshing...')
            // Reset filters to ensure new combined class is visible
            setSearch('')
            setYearFilter('')
            setGradeFilter('')
            setClassTypeFilter('')
            setPage(1)
            // Wait a moment for database consistency
            await new Promise(resolve => setTimeout(resolve, 1000))
            // Force refresh the classes list
            await fetchClasses()
            setCreateCombinedOpen(false)
          }}
        />
      </CardContent>
    </Card>
  )
} 