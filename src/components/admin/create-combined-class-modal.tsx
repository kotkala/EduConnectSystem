'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Layers, Users, BookOpen, Settings, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { EduConnectAnimatedModal } from '../ui/animated-components'

interface AcademicYear {
  id: string
  name: string
}

interface GradeLevel {
  id: string
  name: string
  level: number
}

interface SubjectGroup {
  code: string
  name: string
  type: string
  description: string
  subject_codes: string[]
  specialization_subjects: string[]
  max_students: number
}

interface StudentPreview {
  total_students: number
  with_selection: number
  without_selection: number
  selections_by_group: Array<{
    subject_group: SubjectGroup
    student_count: number
  }>
}

interface CreateCombinedClassModalProps {
  isOpen: boolean
  onClose: () => void
  academicYears: AcademicYear[]
  gradeLevels: GradeLevel[]
  subjectGroups: SubjectGroup[]
  onCreateComplete: () => void
}

export function CreateCombinedClassModal({
  isOpen,
  onClose,
  academicYears,
  gradeLevels,
  subjectGroups,
  onCreateComplete
}: CreateCombinedClassModalProps) {
  const [formData, setFormData] = useState({
    academic_year_id: '',
    grade_level_id: '',
    subject_group_code: '',
    class_name_prefix: '',
    max_students_per_class: 35,
    source_class_ids: [] as string[]
  })
  
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<StudentPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        academic_year_id: '',
        grade_level_id: '',
        subject_group_code: '',
        class_name_prefix: '',
        max_students_per_class: 35,
        source_class_ids: []
      })
      setError(null)
      setPreview(null)
    }
  }, [isOpen])

  // Generate preview when form changes
  useEffect(() => {
    if (formData.academic_year_id && formData.grade_level_id) {
      generatePreview()
    } else {
      setPreview(null)
    }
  }, [formData.academic_year_id, formData.grade_level_id])

  const generatePreview = async () => {
    try {
      setPreviewLoading(true)
      
      // Use the debug API endpoint to get actual student data
      const params = new URLSearchParams({
        academic_year_id: formData.academic_year_id,
        grade_level_id: formData.grade_level_id,
        ...(formData.subject_group_code ? { subject_group_code: formData.subject_group_code } : {})
      })

      const response = await fetch(`/api/classes/create-combined?${params}`)
      const result = await response.json()

      if (result.success) {
        setPreview(result.data)
        setError(null)
      } else {
        setError(result.error || 'Không thể tải dữ liệu xem trước')
        setPreview(null)
      }
    } catch (err) {
      console.error('Error generating preview:', err)
      setError('Lỗi khi tải dữ liệu xem trước')
      setPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      setCreating(true)
      setError(null)

      // Validate that there are eligible students
      if (!preview || !preview.selections_by_group) {
        setError('Vui lòng chọn năm học và khối lớp để xem dữ liệu')
        return
      }

      const selectedGroup = preview.selections_by_group.find(g => g.subject_group.code === formData.subject_group_code)
      if (!selectedGroup || selectedGroup.student_count === 0) {
        setError('Không có học sinh nào chọn tổ hợp môn này. Vui lòng đảm bảo học sinh đã chọn tổ hợp môn trước khi tạo lớp ghép.')
        return
      }

      const response = await fetch('/api/classes/create-combined', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        console.log('Combined classes created successfully:', result.data)
        // Add a small delay to ensure database consistency
        await new Promise(resolve => setTimeout(resolve, 300))
        onCreateComplete()
        onClose()
      } else {
        setError(result.error || 'Không thể tạo lớp ghép')
      }
    } catch (err) {
      setError('Có lỗi mạng xảy ra')
      console.error('Error creating combined classes:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isFormValid = formData.academic_year_id && formData.grade_level_id && formData.subject_group_code
  const selectedSubjectGroup = subjectGroups.find(sg => sg.code === formData.subject_group_code)

  return (
    <EduConnectAnimatedModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo lớp ghép"
      className="max-w-5xl"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              Hướng dẫn tạo lớp ghép
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Trước tiên, học sinh phải chọn tổ hợp môn trong lớp tách (sử dụng nút "Chọn tổ hợp môn" ở bảng lớp học)</li>
              <li>Chọn năm học và khối lớp để xem thống kê học sinh đã chọn tổ hợp môn</li>
              <li>Chọn tổ hợp môn cụ thể để tạo lớp ghép</li>
              <li>Hệ thống sẽ tự động nhóm học sinh có cùng tổ hợp môn vào lớp ghép</li>
            </ol>
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cấu hình
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Academic Year */}
              <div>
                <Label htmlFor="academic_year">Năm học *</Label>
                <select
                  id="academic_year"
                  value={formData.academic_year_id}
                  onChange={(e) => handleFormChange('academic_year_id', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Chọn năm học</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade Level */}
              <div>
                <Label htmlFor="grade_level">Khối lớp *</Label>
                <select
                  id="grade_level"
                  value={formData.grade_level_id}
                  onChange={(e) => handleFormChange('grade_level_id', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Chọn khối lớp</option>
                  {gradeLevels.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name} (Cấp {grade.level})
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Group */}
              <div>
                <Label htmlFor="subject_group">Tổ hợp môn *</Label>
                <select
                  id="subject_group"
                  value={formData.subject_group_code}
                  onChange={(e) => handleFormChange('subject_group_code', e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Chọn tổ hợp môn</option>
                  {subjectGroups.map((group) => (
                    <option key={group.code} value={group.code}>
                      {group.code} - {group.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Max Students per Class */}
              <div>
                <Label htmlFor="max_students">Sĩ số tối đa mỗi lớp</Label>
                <Input
                  id="max_students"
                  type="number"
                  min="1"
                  max="50"
                  value={formData.max_students_per_class}
                  onChange={(e) => handleFormChange('max_students_per_class', parseInt(e.target.value) || 35)}
                />
              </div>

              {/* Class Name Prefix */}
              <div className="md:col-span-2">
                <Label htmlFor="class_prefix">Tiền tố tên lớp (Tùy chọn)</Label>
                <Input
                  id="class_prefix"
                  placeholder="VD: KHTN1-2024, sẽ tự động tạo nếu để trống"
                  value={formData.class_name_prefix}
                  onChange={(e) => handleFormChange('class_name_prefix', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Statistics Preview */}
        {preview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Thống kê học sinh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {preview.total_students}
                    </div>
                    <div className="text-gray-600">Tổng học sinh</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {preview.with_selection}
                    </div>
                    <div className="text-gray-600">Đã chọn tổ hợp</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {preview.without_selection}
                    </div>
                    <div className="text-gray-600">Chưa chọn tổ hợp</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((preview.with_selection / preview.total_students) * 100) || 0}%
                    </div>
                    <div className="text-gray-600">Tỷ lệ hoàn thành</div>
                  </div>
                </div>

                {/* Subject Group Distribution */}
                <div>
                  <h4 className="font-medium mb-3">Phân bố theo tổ hợp môn:</h4>
                  <div className="space-y-2">
                    {preview.selections_by_group.map((group) => (
                      <div 
                        key={group.subject_group.code}
                        className={`p-3 rounded-lg border ${
                          group.subject_group.code === formData.subject_group_code 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{group.subject_group.code}</Badge>
                            <span className="font-medium">{group.subject_group.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {group.student_count}
                            </div>
                            <div className="text-xs text-gray-600">học sinh</div>
                          </div>
                        </div>
                        {group.student_count > 0 && (
                          <div className="mt-2 text-sm text-gray-600">
                            Sẽ tạo {Math.ceil(group.student_count / formData.max_students_per_class)} lớp ghép
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warning if no students selected */}
                {preview.without_selection > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Lưu ý:</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      Có {preview.without_selection} học sinh chưa chọn tổ hợp môn. 
                      Họ sẽ không được đưa vào lớp ghép. Vui lòng sử dụng chức năng "Chọn tổ hợp môn" 
                      trong bảng lớp học để cập nhật.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subject Group Details */}
        {selectedSubjectGroup && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Chi tiết tổ hợp môn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-base">
                    {selectedSubjectGroup.code}
                  </Badge>
                  <span className="font-medium">{selectedSubjectGroup.name}</span>
                </div>
                <div className="text-sm text-gray-600">
                  <div><strong>Loại:</strong> {selectedSubjectGroup.type}</div>
                  <div><strong>Mô tả:</strong> {selectedSubjectGroup.description}</div>
                  <div><strong>Các môn học:</strong> {selectedSubjectGroup.subject_codes.join(', ')}</div>
                  {selectedSubjectGroup.specialization_subjects.length > 0 && (
                    <div><strong>Môn chuyên ngành:</strong> {selectedSubjectGroup.specialization_subjects.join(', ')}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="text-red-600 text-sm p-4 bg-red-50 rounded border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="font-medium">Lỗi:</span>
            </div>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Hủy
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!isFormValid || creating || previewLoading}
          >
            {creating ? (
              'Đang tạo...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Tạo lớp ghép
              </>
            )}
          </Button>
        </div>
      </div>
    </EduConnectAnimatedModal>
  )
} 