'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, UserPlus, X } from 'lucide-react'
import { EduConnectAnimatedModal } from '../ui/animated-components'

interface Student {
  id: string
  full_name: string
  phone: string
  gender?: string
  date_of_birth?: string
  avatar_url?: string
}

interface ClassInfo {
  id: string
  name: string
  code: string
  capacity: number
  academic_year_id: string
}

interface StudentImportModalProps {
  isOpen: boolean
  onClose: () => void
  classInfo: ClassInfo | null
  onImportComplete: () => void
}

export function StudentImportModal({ isOpen, onClose, classInfo, onImportComplete }: StudentImportModalProps) {
  const [availableStudents, setAvailableStudents] = useState<Student[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch available students
  const fetchAvailableStudents = async () => {
    if (!classInfo) return
    
    try {
      setLoading(true)
      const params = new URLSearchParams({
        academic_year_id: classInfo.academic_year_id,
        page: page.toString(),
        per_page: '20',
        ...(search ? { search } : {})
      })
      
      const response = await fetch(`/api/students/available?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setAvailableStudents(result.data)
        setTotalPages(result.pagination.total_pages)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch students')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching available students:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && classInfo) {
      fetchAvailableStudents()
    }
  }, [isOpen, classInfo, page, search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchAvailableStudents()
  }

  const handleSelectStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudents)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudents(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedStudents.size === availableStudents.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(availableStudents.map(s => s.id)))
    }
  }

  const handleImport = async () => {
    if (!classInfo || selectedStudents.size === 0) return
    
    try {
      setImporting(true)
      const response = await fetch(`/api/classes/${classInfo.id}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_ids: Array.from(selectedStudents),
          enrollment_date: new Date().toISOString().split('T')[0]
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        onImportComplete()
        onClose()
        setSelectedStudents(new Set())
      } else {
        setError(result.error || 'Failed to import students')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error importing students:', err)
    } finally {
      setImporting(false)
    }
  }

  const handleClose = () => {
    setSelectedStudents(new Set())
    setSearch('')
    setPage(1)
    setError(null)
    onClose()
  }

  if (!classInfo) return null

  // Check capacity constraints
  const currentEnrollment = classInfo.capacity - availableStudents.length // This is a rough estimation
  const willExceedCapacity = currentEnrollment + selectedStudents.size > classInfo.capacity

  return (
    <EduConnectAnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Import Students to ${classInfo.name}`}
      className="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Class Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Class Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span> {classInfo.name}
              </div>
              <div>
                <span className="font-medium">Code:</span> {classInfo.code}
              </div>
              <div>
                <span className="font-medium">Capacity:</span> {classInfo.capacity}
              </div>
              <div>
                <span className="font-medium">Selected:</span>{' '}
                <Badge variant={willExceedCapacity ? 'destructive' : 'default'}>
                  {selectedStudents.size}
                </Badge>
              </div>
            </div>
            {willExceedCapacity && (
              <p className="text-red-600 text-sm mt-2">
                Warning: Selecting {selectedStudents.size} students will exceed class capacity
              </p>
            )}
          </CardContent>
        </Card>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Available Students</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <Input
                placeholder="Search students by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </form>

            {error && (
              <div className="text-red-600 text-sm mb-4 p-2 bg-red-50 rounded">
                {error}
              </div>
            )}

            {/* Bulk Actions */}
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSelectAll}
                disabled={loading || availableStudents.length === 0}
              >
                {selectedStudents.size === availableStudents.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-gray-600">
                {availableStudents.length} students available
              </span>
            </div>

            {/* Students List */}
            {loading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : availableStudents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No available students found
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedStudents.has(student.id)
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectStudent(student.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{student.full_name}</div>
                        <div className="text-sm text-gray-600">
                          Phone: {student.phone}
                          {student.gender && ` • Gender: ${student.gender}`}
                          {student.date_of_birth && ` • DOB: ${student.date_of_birth}`}
                        </div>
                      </div>
                      <div className="ml-4">
                        {selectedStudents.has(student.id) ? (
                          <Badge variant="default">Selected</Badge>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={selectedStudents.size === 0 || importing || willExceedCapacity}
          >
            {importing ? (
              'Importing...'
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Import {selectedStudents.size} Students
              </>
            )}
          </Button>
        </div>
      </div>
    </EduConnectAnimatedModal>
  )
} 