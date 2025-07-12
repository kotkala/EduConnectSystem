'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Plus, Search, Edit2, Trash2, Calendar } from 'lucide-react'
import { AcademicYearForm, AcademicYearFormValues } from './academic-year-form'
import { EduConnectAnimatedModal } from '../ui/animated-components'

interface AcademicYear {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  description?: string
  created_at: string
}

interface ApiResponse {
  success: boolean
  data: AcademicYear[]
  pagination: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
  error?: string
}

export function AcademicYearsTable() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<AcademicYear | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Fetch academic years
  const fetchAcademicYears = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        search: search,
      })

      const response = await fetch(`/api/academic-years?${params}`)
      const result: ApiResponse = await response.json()

      if (result.success) {
        setAcademicYears(result.data)
        setTotalPages(result.pagination.total_pages)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch academic years')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching academic years:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete academic year
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/academic-years/${id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (result.success) {
        // Refresh the list
        fetchAcademicYears()
      } else {
        alert(result.error || 'Failed to delete academic year')
      }
    } catch (err) {
      alert('Network error occurred')
      console.error('Error deleting academic year:', err)
    }
  }

  // Handle add
  const handleAdd = () => {
    setEditData(null)
    setModalOpen(true)
  }

  // Handle edit
  const handleEdit = (year: AcademicYear) => {
    setEditData(year)
    setModalOpen(true)
  }

  // Handle form submit
  const handleFormSubmit = async (values: AcademicYearFormValues) => {
    setFormLoading(true)
    try {
      let response
      if (editData) {
        // Edit
        response = await fetch(`/api/academic-years/${editData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
      } else {
        // Create
        response = await fetch('/api/academic-years', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
      }
      const result = await response.json()
      if (result.success) {
        setModalOpen(false)
        fetchAcademicYears()
      } else {
        alert(result.error || 'Failed to save academic year')
      }
    } catch (err) {
      alert('Network error occurred')
      console.error('Error saving academic year:', err)
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
    fetchAcademicYears()
  }

  // Load data on mount and when page/search changes
  useEffect(() => {
    fetchAcademicYears()
  }, [page])

  if (loading && academicYears.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Academic Years</CardTitle>
          <CardDescription>Loading academic years...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Academic Years
            </CardTitle>
            <CardDescription>
              Manage academic years for the school system
            </CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Academic Year
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search academic years..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {/* Academic Years Table */}
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                {academicYears.map((year) => (
                  <tr key={year.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {year.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(year.start_date)} - {formatDate(year.end_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {year.is_current ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Current
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                        {year.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(year)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(year.id, year.name)}
                          disabled={year.is_current}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {!loading && academicYears.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No academic years found
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {search ? 'Try adjusting your search terms.' : 'Get started by creating your first academic year.'}
            </p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Academic Year
            </Button>
          </div>
        )}

        {/* Pagination */}
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
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Loading overlay for subsequent requests */}
        {loading && academicYears.length > 0 && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        )}

        {/* Modal for create/edit academic year */}
        <EduConnectAnimatedModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editData ? 'Edit Academic Year' : 'Add Academic Year'}
        >
          <AcademicYearForm
            initialData={editData ? {
              name: editData.name,
              start_date: editData.start_date,
              end_date: editData.end_date,
              description: editData.description,
              is_current: editData.is_current
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setModalOpen(false)}
            loading={formLoading}
          />
        </EduConnectAnimatedModal>
      </CardContent>
    </Card>
  )
} 