'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Edit2, Trash2, Download, FileSpreadsheet, Users, UserPlus } from 'lucide-react'
import { StudentForm } from './student-form'
import { TeacherForm } from './teacher-form'
import { SchoolAdminForm } from './school-admin-form'
import { ParentForm } from './parent-form'
import { EduConnectAnimatedModal } from '../ui/animated-components'
import { toast } from 'sonner'

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'school_administrator', label: 'School Admin' },
  { value: 'homeroom_teacher', label: 'Homeroom Teacher' },
  { value: 'subject_teacher', label: 'Subject Teacher' },
  { value: 'parent', label: 'Parent' },
  { value: 'student', label: 'Student' },
]
const STATUS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'locked', label: 'Locked' },
]

interface User {
  id: string
  phone: string
  full_name: string
  role: string
  status: string
  gender?: string
  date_of_birth?: string
  avatar_url?: string
  created_at: string
  address?: string
  parent_full_name?: string
}

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<User | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([])
  const [excelRole, setExcelRole] = useState('')
  const [excelLoading, setExcelLoading] = useState(false)
  const [importResult, setImportResult] = useState<any | null>(null)
  const [activeTab, setActiveTab] = useState('student')
  const [importModalOpen, setImportModalOpen] = useState(false)

  // Role tabs configuration
  const ROLE_TABS = [
    { id: 'student', label: 'Học sinh', icon: Users, description: 'Import học sinh với thông tin phụ huynh' },
    { id: 'parent', label: 'Phụ huynh', icon: UserPlus, description: 'Import phụ huynh và liên kết học sinh' },
    { id: 'homeroom_teacher', label: 'GVCN', icon: Users, description: 'Import giáo viên chủ nhiệm' },
    { id: 'subject_teacher', label: 'GVBM', icon: Users, description: 'Import giáo viên bộ môn' },
    { id: 'school_administrator', label: 'QTNT', icon: Users, description: 'Import quản trị viên trường' },
    { id: 'all', label: 'Tất cả', icon: FileSpreadsheet, description: 'Template với tất cả roles' }
  ]

  // Fetch classes for student form
  const fetchClasses = async () => {
    const res = await fetch('/api/classes')
    const result = await res.json()
    if (result.success) setClasses(result.data.map((c: any) => ({ id: c.id, name: c.name })))
  }

  // Fetch students for parent form
  const fetchStudents = async () => {
    const res = await fetch('/api/users?role=student')
    const result = await res.json()
    if (result.success) setStudents(result.data.map((s: any) => ({ id: s.id, full_name: s.full_name })))
  }

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        search: search,
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(statusFilter ? { status: statusFilter } : {})
      })
      const response = await fetch(`/api/users?${params}`)
      const result = await response.json()
      if (result.success) {
        setUsers(result.data)
        setTotalPages(result.pagination.total_pages)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch users')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching users:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete user
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    try {
      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) fetchUsers()
      else alert(result.error || 'Failed to delete user')
    } catch (err) {
      alert('Network error occurred')
      console.error('Error deleting user:', err)
    }
  }

  // Handle add
  const handleAdd = () => {
    setEditData(null)
    setModalOpen(true)
  }

  // Handle edit
  const handleEdit = (user: User) => {
    setEditData(user)
    setModalOpen(true)
  }

  // Helper to get role from editData or modal context
  const getRole = () => editData?.role || roleFilter || '';

  // Handle form submit
  const handleFormSubmit = async (values: any) => {
    setFormLoading(true)
    try {
      let response
      if (editData) {
        response = await fetch(`/api/users/${editData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
      } else {
        response = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
      }
      const result = await response.json()
      if (result.success) {
        setModalOpen(false)
        fetchUsers()
      } else {
        alert(result.error || 'Failed to save user')
      }
    } catch (err) {
      alert('Network error occurred')
      console.error('Error saving user:', err)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  // Download Excel template
  const handleDownloadTemplate = async () => {
    setExcelLoading(true)
    try {
      const res = await fetch(`/api/users/excel-template?role=${activeTab}`)
      if (!res.ok) throw new Error('Không thể tải file mẫu')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `educonnect_${activeTab}_template.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      toast.success(`Đã tải xuống template ${ROLE_TABS.find(t => t.id === activeTab)?.label}`)
    } catch (err) {
      toast.error('Tải file mẫu thất bại')
    } finally {
      setExcelLoading(false)
    }
  }

  // Upload Excel file
  const handleUploadExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setExcelLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/users/import-excel', {
        method: 'POST',
        body: formData
      })
      const result = await res.json()
      setImportResult(result)
      setImportModalOpen(true)
      if (result.success) {
        toast.success(`Import thành công! ${result.summary.success}/${result.summary.total} records`)
        fetchUsers()
      } else {
        toast.error(result.message || result.error || 'Import thất bại')
      }
    } catch (err) {
      toast.error('Import thất bại')
    } finally {
      setExcelLoading(false)
      e.target.value = ''
    }
  }

  // Download error report as CSV
  const handleDownloadErrorReport = () => {
    if (!importResult?.results) return
    const rows = importResult.results.filter((r: any) => !r.success)
    if (rows.length === 0) return
    
    const csvRows = [
      ['Sheet', 'Row', 'Errors', 'Data'].join(','),
      ...rows.map((r: any) => [
        r.sheet || 'Unknown',
        r.row || 'Unknown',
        (r.errors?.join('; ') || '').replace(/,/g, ';'),
        JSON.stringify(r.data).replace(/,/g, ';')
      ].join(','))
    ]
    
    const csv = csvRows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import_errors.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  useEffect(() => { fetchClasses(); fetchStudents() }, [])
  useEffect(() => { fetchUsers() }, [page, roleFilter, statusFilter])

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle>Quản lý người dùng</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Role-based Excel Import/Export Tabs */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Import/Export Excel theo vai trò</h3>
          
          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 mb-4">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-medium">{ROLE_TABS.find(t => t.id === activeTab)?.label}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {ROLE_TABS.find(t => t.id === activeTab)?.description}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  disabled={excelLoading}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {excelLoading ? 'Đang tải...' : 'Tải template'}
                </Button>
                <label htmlFor="excel-upload" className="inline-block">
                  <Button
                    variant="default"
                    size="sm"
                    asChild
                    disabled={excelLoading}
                  >
                    <span>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      {excelLoading ? 'Đang xử lý...' : 'Upload Excel'}
                    </span>
                  </Button>
                  <input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleUploadExcel}
                  />
                </label>
              </div>
            </div>
            
            {/* Tab-specific Instructions */}
            {activeTab === 'student' && (
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                <strong>Lưu ý:</strong> Template học sinh bao gồm cả thông tin phụ huynh. Khi import, hệ thống sẽ tự động tạo tài khoản phụ huynh và liên kết với học sinh.
              </div>
            )}
            {activeTab === 'parent' && (
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-green-50 dark:bg-green-900/20 p-3 rounded">
                <strong>Lưu ý:</strong> Có thể liên kết phụ huynh với học sinh đã có trong hệ thống bằng email hoặc số điện thoại học sinh.
              </div>
            )}
            {activeTab === 'all' && (
              <div className="text-sm text-gray-600 dark:text-gray-400 bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
                <strong>Lưu ý:</strong> File Excel sẽ có nhiều sheet cho từng vai trò. Điền thông tin vào sheet tương ứng.
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
            disabled={loading}
          />
          <Button type="submit" variant="outline" disabled={loading}>
            <Search className="w-4 h-4 mr-1" /> Search
          </Button>
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
            className="border rounded px-2 py-1 ml-2"
            disabled={loading}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="border rounded px-2 py-1 ml-2"
            disabled={loading}
          >
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <Button type="button" onClick={handleAdd} className="ml-auto" disabled={loading}>
            <Plus className="w-4 h-4 mr-1" /> Add User
          </Button>
        </form>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-3 py-2 text-left">Full Name</th>
                <th className="px-3 py-2 text-left">Phone</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Gender</th>
                <th className="px-3 py-2 text-left">Date of Birth</th>
                <th className="px-3 py-2 text-left">Address</th>
                <th className="px-3 py-2 text-left">Parent</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="text-center py-6 text-gray-500">No users found.</td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="px-3 py-2 font-medium">{u.full_name}</td>
                  <td className="px-3 py-2">{u.phone}</td>
                  <td className="px-3 py-2">{u.role.replace(/_/g, ' ')}</td>
                  <td className="px-3 py-2">{u.status}</td>
                  <td className="px-3 py-2">{u.gender || '-'}</td>
                  <td className="px-3 py-2">{u.date_of_birth || '-'}</td>
                  <td className="px-3 py-2">{u.address || '-'}</td>
                  <td className="px-3 py-2">{u.role === 'student' && u.parent_full_name ? u.parent_full_name : '-'}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(u)} disabled={loading}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(u.id, u.full_name)} disabled={loading}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          </div>
        )}
        {/* Loading overlay for subsequent requests */}
        {loading && users.length > 0 && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        )}
        {/* Modal for create/edit user */}
        <EduConnectAnimatedModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editData ? 'Edit User' : 'Add User'}
        >
          {/* Dynamically render the correct form by role */}
          {getRole() === 'student' && (
            <StudentForm
              onSubmit={handleFormSubmit}
              onCancel={() => setModalOpen(false)}
              loading={formLoading}
              parents={users.filter(u => u.role === 'parent')}
            />
          )}
          {getRole() === 'teacher' && (
            <TeacherForm
              onSubmit={handleFormSubmit}
              onCancel={() => setModalOpen(false)}
              loading={formLoading}
            />
          )}
          {getRole() === 'school_administrator' && (
            <SchoolAdminForm
              onSubmit={handleFormSubmit}
              onCancel={() => setModalOpen(false)}
              loading={formLoading}
            />
          )}
          {getRole() === 'parent' && (
            <ParentForm
              onSubmit={handleFormSubmit}
              onCancel={() => setModalOpen(false)}
              loading={formLoading}
            />
          )}
          {/* Fallback: ask to select a role if none */}
          {getRole() === '' && (
            <div className="p-4 text-center text-gray-500">Please select a role to add a user.</div>
          )}
        </EduConnectAnimatedModal>
        {/* Enhanced Import Result Modal */}
        <EduConnectAnimatedModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          title="Kết quả import Excel"
          size="xl"
        >
          {importResult && (
            <div>
              {/* Summary */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{importResult.summary?.total || 0}</div>
                    <div className="text-sm text-gray-600">Tổng cộng</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{importResult.summary?.success || 0}</div>
                    <div className="text-sm text-gray-600">Thành công</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{importResult.summary?.error || 0}</div>
                    <div className="text-sm text-gray-600">Lỗi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{importResult.summary?.sheets_processed || 0}</div>
                    <div className="text-sm text-gray-600">Sheets</div>
                  </div>
                </div>
                
                {importResult.summary?.error > 0 && (
                  <div className="flex justify-center">
                    <Button variant="outline" size="sm" onClick={handleDownloadErrorReport}>
                      <Download className="w-4 h-4 mr-2" />
                      Tải báo cáo lỗi
                    </Button>
                  </div>
                )}
              </div>

              {/* Detailed Results */}
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full border text-xs">
                  <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="px-2 py-2 text-left">Sheet</th>
                      <th className="px-2 py-2 text-left">Row</th>
                      <th className="px-2 py-2 text-left">Trạng thái</th>
                      <th className="px-2 py-2 text-left">Chi tiết</th>
                      <th className="px-2 py-2 text-left">Lỗi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.results?.map((r: any, idx: number) => (
                      <tr key={idx} className={r.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}>
                        <td className="px-2 py-2 font-medium">{r.sheet || 'Unknown'}</td>
                        <td className="px-2 py-2">{r.row}</td>
                        <td className="px-2 py-2">
                          {r.success ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                              Thành công
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600">
                              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                              Thất bại
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-green-600 dark:text-green-400">
                          {r.success && r.created && (
                            <div className="text-xs">
                              {r.created.student && <div>✓ Học sinh: {r.created.student.full_name}</div>}
                              {r.created.parent && <div>✓ Phụ huynh: {r.created.parent.full_name}</div>}
                              {r.created.user && <div>✓ User: {r.created.user.full_name}</div>}
                              {r.created.relationship && <div>✓ Liên kết phụ huynh-học sinh</div>}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2 text-red-600 dark:text-red-400">
                          {r.errors?.map((error: string, errorIdx: number) => (
                            <div key={errorIdx} className="text-xs">{error}</div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="default" onClick={() => setImportModalOpen(false)}>
                  Đóng
                </Button>
              </div>
            </div>
          )}
        </EduConnectAnimatedModal>
      </CardContent>
    </Card>
  )
} 