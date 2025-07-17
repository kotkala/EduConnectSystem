'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Users, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { EduConnectAnimatedModal } from '../ui/animated-components'

interface SubjectGroup {
  code: string
  name: string
  type: string
  description: string
  subject_codes: string[]
  specialization_subjects: string[]
}

interface StudentSelection {
  enrollment_id: string
  student_id: string
  full_name: string
  phone: string
  gender?: string
  enrollment_date: string
  selected_subject_group?: SubjectGroup
  has_selection: boolean
}

interface ClassInfo {
  id: string
  name: string
  code: string
  academic_year_id: string
  is_combined: boolean
}

interface SubjectGroupSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  classInfo: ClassInfo | null
  onSelectionComplete: () => void
}

export function SubjectGroupSelectionModal({ 
  isOpen, 
  onClose, 
  classInfo, 
  onSelectionComplete 
}: SubjectGroupSelectionModalProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selections, setSelections] = useState<Map<string, string>>(new Map())

  // Fetch subject group selections for the class
  const fetchSelections = async () => {
    if (!classInfo) return

    try {
      setLoading(true)
      const response = await fetch(`/api/classes/${classInfo.id}/subject-group-selection`)
      const result = await response.json()

      if (result.success) {
        setData(result.data)
        
        // Initialize selections map
        const currentSelections = new Map<string, string>()
        result.data.students.forEach((student: StudentSelection) => {
          if (student.selected_subject_group) {
            currentSelections.set(student.student_id, student.selected_subject_group.code)
          }
        })
        setSelections(currentSelections)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch selections')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error fetching selections:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && classInfo) {
      fetchSelections()
    }
  }, [isOpen, classInfo])

  const handleSelectionChange = (studentId: string, subjectGroupCode: string | null) => {
    const newSelections = new Map(selections)
    if (subjectGroupCode) {
      newSelections.set(studentId, subjectGroupCode)
    } else {
      newSelections.delete(studentId)
    }
    setSelections(newSelections)
  }

  const handleSaveSelections = async () => {
    if (!classInfo || !data) return

    try {
      setSaving(true)
      
      const selectionsArray = data.students.map((student: StudentSelection) => ({
        student_id: student.student_id,
        subject_group_code: selections.get(student.student_id) || null
      }))

      const response = await fetch(`/api/classes/${classInfo.id}/subject-group-selection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections: selectionsArray })
      })

      const result = await response.json()

      if (result.success) {
        onSelectionComplete()
        onClose()
      } else {
        setError(result.error || 'Failed to save selections')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Error saving selections:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setSelections(new Map())
    setError(null)
    setData(null)
    onClose()
  }

  if (!classInfo) return null

  // Prevent modifications for combined classes
  if (classInfo.is_combined) {
    return (
      <EduConnectAnimatedModal
        isOpen={isOpen}
        onClose={handleClose}
        title="Subject Group Selection"
        className="max-w-2xl"
      >
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Combined Class</h3>
          <p className="text-gray-600">
            Subject group selections cannot be modified for combined classes.
            This class was created based on existing subject group selections.
          </p>
        </div>
      </EduConnectAnimatedModal>
    )
  }

  return (
    <EduConnectAnimatedModal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Subject Group Selection - ${classInfo.name}`}
      className="max-w-6xl"
    >
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">Loading selections...</div>
        ) : error ? (
          <div className="text-red-600 text-sm p-4 bg-red-50 rounded">
            {error}
          </div>
        ) : !data ? (
          <div className="text-center py-8 text-gray-500">No data available</div>
        ) : (
          <>
            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selection Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {data.statistics.total_students}
                    </div>
                    <div className="text-gray-600">Total Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {data.statistics.with_selection}
                    </div>
                    <div className="text-gray-600">With Selection</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {data.statistics.without_selection}
                    </div>
                    <div className="text-gray-600">No Selection</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {data.available_subject_groups.length}
                    </div>
                    <div className="text-gray-600">Subject Groups</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="students" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="students">
                  <Users className="h-4 w-4 mr-2" />
                  Students ({data.students.length})
                </TabsTrigger>
                <TabsTrigger value="groups">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Subject Groups
                </TabsTrigger>
                <TabsTrigger value="summary">
                  <FileText className="h-4 w-4 mr-2" />
                  Summary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Subject Group Selections</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {data.students.map((student: StudentSelection) => (
                        <div
                          key={student.student_id}
                          className="p-4 border rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium">{student.full_name}</div>
                              <div className="text-sm text-gray-600">
                                Phone: {student.phone}
                                {student.gender && ` • Gender: ${student.gender}`}
                              </div>
                            </div>
                            <div className="ml-4 min-w-48">
                              <select
                                value={selections.get(student.student_id) || ''}
                                onChange={(e) => handleSelectionChange(
                                  student.student_id,
                                  e.target.value || null
                                )}
                                className="w-full p-2 border rounded-md text-sm"
                              >
                                <option value="">Select Subject Group</option>
                                {data.available_subject_groups.map((group: SubjectGroup) => (
                                  <option key={group.code} value={group.code}>
                                    {group.code} - {group.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="groups" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.available_subject_groups.map((group: SubjectGroup) => (
                    <Card key={group.code}>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Badge variant="outline">{group.code}</Badge>
                          {group.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Type:</span> {group.type}
                          </div>
                          <div>
                            <span className="font-medium">Description:</span> {group.description}
                          </div>
                          <div>
                            <span className="font-medium">Subjects:</span>{' '}
                            {group.subject_codes.join(', ')}
                          </div>
                          {group.specialization_subjects.length > 0 && (
                            <div>
                              <span className="font-medium">Specialization:</span>{' '}
                              {group.specialization_subjects.join(', ')}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Selection Summary by Subject Group</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.selections_by_group.map((groupSummary: any) => (
                        <div key={groupSummary.subject_group.code} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{groupSummary.subject_group.code}</Badge>
                              <span className="font-medium">{groupSummary.subject_group.name}</span>
                            </div>
                            <Badge variant="default">
                              {groupSummary.student_count} students
                            </Badge>
                          </div>
                          {groupSummary.students.length > 0 && (
                            <div className="text-sm text-gray-600">
                              Students: {groupSummary.students.map((s: any) => s.full_name).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={handleClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveSelections}
                disabled={saving}
              >
                {saving ? (
                  'Saving...'
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Selections
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </EduConnectAnimatedModal>
  )
} 