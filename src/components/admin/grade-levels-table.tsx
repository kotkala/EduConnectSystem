'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, Edit2, Trash2 } from 'lucide-react'
import { GradeLevelForm, GradeLevelFormValues } from './grade-level-form'
import { EduConnectAnimatedModal } from '../ui/animated-components'

interface GradeLevel {
  id: string
  name: string
  level: number
  description?: string
  created_at: string
  updated_at: string
}

export function GradeLevelsTable() {
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState<GradeLevel | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  // Fetch grade levels
  const fetchGradeLevels = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: '10',
        search: search,
      })
      const response = await fetch(`/api/grade-levels?${params}`)
      const result = await response.json()
      if (result.success) {
        setGradeLevels(result.data)
        setTotalPages(result.pagination.total_pages)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch grade levels')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching grade levels:', err)
    } finally {
      setLoading(false)
    }
  }

  // Delete grade level
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    try {
      const response = await fetch(`/api/grade-levels/${id}`, { method: 'DELETE' })
      const result = await response.json()
      if (result.success) fetchGradeLevels()
      else alert(result.error || 'Failed to delete grade level')
    } catch (err) {
      alert('Network error occurred')
      console.error('Error deleting grade level:', err)
    }
  }

  // Handle add
  const handleAdd = () => {
    setEditData(null)
    setModalOpen(true)
  }

  // Handle edit
  const handleEdit = (gradeLevel: GradeLevel) => {
    setEditData(gradeLevel)
    setModalOpen(true)
  }

  // Handle form submit
  const handleFormSubmit = async (values: GradeLevelFormValues) => {
    setFormLoading(true)
    try {
      let response
      if (editData) {
        response = await fetch(`/api/grade-levels/${editData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
      } else {
        response = await fetch('/api/grade-levels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values)
        })
      }
      const result = await response.json()
      if (result.success) {
        setModalOpen(false)
        fetchGradeLevels()
      } else {
        alert(result.error || 'Failed to save grade level')
      }
    } catch (err) {
      alert('Network error occurred')
      console.error('Error saving grade level:', err)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchGradeLevels()
  }

  // Load data on mount and when page/search changes
  useEffect(() => {
    fetchGradeLevels()
  }, [page])

  useEffect(() => {
    setPage(1)
    fetchGradeLevels()
  }, [search])

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle>Grade Levels</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <Input
            placeholder="Search grade levels..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
            disabled={loading}
          />
          <Button type="submit" variant="outline" disabled={loading}>
            <Search className="w-4 h-4 mr-1" /> Search
          </Button>
          <Button type="button" onClick={handleAdd} className="ml-auto" disabled={loading}>
            <Plus className="w-4 h-4 mr-1" /> Add Grade Level
          </Button>
        </form>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Level</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gradeLevels.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-gray-500">No grade levels found.</td>
                </tr>
              )}
              {gradeLevels.map((g) => (
                <tr key={g.id} className="border-b">
                  <td className="px-3 py-2 font-medium">{g.name}</td>
                  <td className="px-3 py-2">{g.level}</td>
                  <td className="px-3 py-2">{g.description || '-'}</td>
                  <td className="px-3 py-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(g)} disabled={loading}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(g.id, g.name)} disabled={loading}>
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
        {loading && gradeLevels.length > 0 && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        )}
        {/* Modal for create/edit grade level */}
        <EduConnectAnimatedModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editData ? 'Edit Grade Level' : 'Add Grade Level'}
        >
          <GradeLevelForm
            initialData={editData ? {
              name: editData.name,
              level: editData.level,
              description: editData.description
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