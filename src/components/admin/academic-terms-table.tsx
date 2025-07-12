'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, Search, Edit2, Trash2, Calendar } from 'lucide-react'
import { AcademicTermForm, AcademicTermFormValues } from './academic-term-form'
import { EduConnectAnimatedModal } from '../ui/animated-components'

interface AcademicTerm {
  id: string
  academic_year_id: string
  name: string
  type: string
  start_date: string
  end_date: string
  is_current: boolean
  created_at: string
  updated_at: string
}

interface AcademicYear {
  id: string
  name: string
}

interface ApiResponse {
  success: boolean
  data: AcademicTerm[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
  error?: string
}

export function AcademicTermsTable() {
  const [terms, setTerms] = useState<AcademicTerm[]>([])
  const [years, setYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<AcademicTerm | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Fetch academic years for filter and form
  const fetchYears = async () => {
    const res = await fetch('/api/academic-years')
    const result = await res.json()
    if (result.success) setYears(result.data)
  }

  // Fetch academic terms
  const fetchTerms = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        search: search,
        ...(yearFilter ? { academic_year_id: yearFilter } : {})
      })
      const response = await fetch(`/api/academic-terms?${params}`)
      const result: ApiResponse = await response.json()
      if (result.success) {
        setTerms(result.data)
        setTotalPages(result.pagination.total_pages)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch academic terms')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching academic terms:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete academic term
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    try {
      const response = await fetch(`/api/academic-terms/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) fetchTerms()
      else alert(result.error || 'Failed to delete academic term')
    } catch (err) {
      alert('Network error occurred')
      console.error('Error deleting academic term:', err)
    }
  }

  // Handle add
  const handleAdd = () => {
    setEditData(null)
    setModalOpen(true)
  }

  // Handle edit
  const handleEdit = (term: AcademicTerm) => {
    setEditData(term)
    setModalOpen(true)
  }

  // Handle form submit
  const handleFormSubmit = async (values: AcademicTermFormValues) => {
    setFormLoading(true)
    try {
      let response
      if (editData) {
        response = await fetch(`/api/academic-terms/${editData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
      } else {
        response = await fetch('/api/academic-terms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
      }
      const result = await response.json()
      if (result.success) {
        setModalOpen(false)
        fetchTerms()
      } else {
        alert(result.error || 'Failed to save academic term')
      }
    } catch (err) {
      alert('Network error occurred')
      console.error('Error saving academic term:', err)
    } finally {
      setFormLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchTerms()
  }

  useEffect(() => { fetchYears() }, [])
  useEffect(() => { fetchTerms() }, [page, yearFilter])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Academic Terms
            </CardTitle>
            <CardDescription>Manage academic terms/semesters</CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Academic Term
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter & Search */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <select
            value={yearFilter}
            onChange={e => { setYearFilter(e.target.value); setPage(1) }}
            className="border rounded px-3 py-2"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year.id} value={year.id}>{year.name}</option>
            ))}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search academic terms..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="outline">Search</Button>
        </form>
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        {/* Academic Terms Table */}
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">End</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Current</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {terms.map((term) => {
                const year = years.find(y => y.id === term.academic_year_id)
                return (
                  <tr key={term.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{term.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">{term.type.replace('_', ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{year ? year.name : term.academic_year_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(term.start_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(term.end_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{term.is_current ? <span className="text-green-600 font-semibold">Yes</span> : 'No'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(term)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(term.id, term.name)} disabled={term.is_current} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Empty State */}
        {!loading && terms.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No academic terms found</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{search ? 'Try adjusting your search terms.' : 'Get started by creating your first academic term.'}</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Academic Term
            </Button>
          </div>
        )}
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-600 dark:text-gray-300">Page {page} of {totalPages}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</Button>
            </div>
          </div>
        )}
        {/* Loading overlay for subsequent requests */}
        {loading && terms.length > 0 && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        )}
        {/* Modal for create/edit academic term */}
        <EduConnectAnimatedModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editData ? 'Edit Academic Term' : 'Add Academic Term'}
        >
          <AcademicTermForm
            initialData={editData ? {
              academic_year_id: editData.academic_year_id,
              name: editData.name,
              type: editData.type,
              start_date: editData.start_date,
              end_date: editData.end_date,
              is_current: editData.is_current
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setModalOpen(false)}
            loading={formLoading}
            academicYears={years}
          />
        </EduConnectAnimatedModal>
      </CardContent>
    </Card>
  )
} 