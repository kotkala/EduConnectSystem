'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Badge } from '@/shared/components/ui/badge'
import { Trash2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  getSpecializationOptionsAction,
  getTeacherSpecializationsAction,
  addTeacherSpecializationAction,
  removeTeacherSpecializationAction,
  getTeacherAssignedSubjectsAction,
  type SpecializationOption,
  type TeacherSpecialization
} from '../actions/teacher-specialization-actions'

interface TeacherSpecializationInlineFormProps {
  teacherId?: string // Optional for create mode
  disabled?: boolean
  onSpecializationsChange?: (specializations: TeacherSpecialization[]) => void
}

export default function TeacherSpecializationInlineForm({ 
  teacherId, 
  disabled = false,
  onSpecializationsChange 
}: TeacherSpecializationInlineFormProps) {
  const [specializations, setSpecializations] = useState<TeacherSpecialization[]>([])
  const [options, setOptions] = useState<SpecializationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([])

  // For create mode - store specializations locally
  const [pendingSpecializations, setPendingSpecializations] = useState<{
    type: string
    subjects: string[]
  }[]>([])

  const isCreateMode = !teacherId

  useEffect(() => {
    loadData()
  }, [teacherId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true)
    try {
      const optionsResult = await getSpecializationOptionsAction()
      
      if (optionsResult.success && optionsResult.data) {
        setOptions(optionsResult.data)
      }

      // Only load existing data if we have a teacherId (edit mode)
      if (teacherId) {
        const [specializationsResult, assignedResult] = await Promise.all([
          getTeacherSpecializationsAction(teacherId),
          getTeacherAssignedSubjectsAction(teacherId)
        ])

        if (specializationsResult.success && specializationsResult.data) {
          setSpecializations(specializationsResult.data)
          onSpecializationsChange?.(specializationsResult.data)
        }

        if (assignedResult.success && assignedResult.data) {
          setAssignedSubjects(assignedResult.data)
        }
      }
    } catch (error) {
      console.error('Error loading specialization data:', error)
      toast.error('Có lỗi xảy ra khi tải dữ liệu chuyên ngành')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSpecialization = async () => {
    if (!selectedType || selectedSubjects.length === 0) {
      toast.error('Vui lòng chọn chuyên ngành và ít nhất một môn học')
      return
    }

    if (isCreateMode) {
      // Create mode - store locally
      const newSpec = {
        type: selectedType,
        subjects: selectedSubjects
      }
      
      const updatedPending = [...pendingSpecializations, newSpec]
      setPendingSpecializations(updatedPending)
      
      // Convert to TeacherSpecialization format for callback
      const mockSpecialization: TeacherSpecialization = {
        id: `temp-${Date.now()}`,
        teacher_id: '',
        specialization_type: selectedType as 'natural_science_technology' | 'social_humanities' | 'arts_physical_special',
        subjects: selectedSubjects,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const updatedSpecs = [...specializations, mockSpecialization]
      setSpecializations(updatedSpecs)
      onSpecializationsChange?.(updatedSpecs)
      
      setSelectedType('')
      setSelectedSubjects([])
      toast.success('Đã thêm chuyên ngành (sẽ được lưu khi tạo giáo viên)')
      return
    }

    // Edit mode - save to database
    setIsAdding(true)
    try {
      const result = await addTeacherSpecializationAction({
        teacher_id: teacherId!,
        specialization_type: selectedType as 'natural_science_technology' | 'social_humanities' | 'arts_physical_special',
        subjects: selectedSubjects
      })

      if (result.success) {
        toast.success('Đã thêm chuyên ngành thành công')
        setSelectedType('')
        setSelectedSubjects([])
        loadData()
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi thêm chuyên ngành')
      }
    } catch (error) {
      console.error('Error adding specialization:', error)
      toast.error('Có lỗi xảy ra khi thêm chuyên ngành')
    } finally {
      setIsAdding(false)
    }
  }

  const handleRemoveSpecialization = async (specializationId: string) => {
    if (isCreateMode) {
      // Create mode - remove from local state
      const updatedSpecs = specializations.filter(spec => spec.id !== specializationId)
      setSpecializations(updatedSpecs)
      onSpecializationsChange?.(updatedSpecs)
      
      // Also remove from pending if it exists
      const specToRemove = specializations.find(s => s.id === specializationId)
      if (specToRemove) {
        setPendingSpecializations(prev => 
          prev.filter(p => p.type !== specToRemove.specialization_type)
        )
      }
      
      toast.success('Đã xóa chuyên ngành')
      return
    }

    // Edit mode - remove from database
    try {
      const result = await removeTeacherSpecializationAction(specializationId)
      if (result.success) {
        toast.success('Đã xóa chuyên ngành thành công')
        loadData()
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi xóa chuyên ngành')
      }
    } catch (error) {
      console.error('Error removing specialization:', error)
      toast.error('Có lỗi xảy ra khi xóa chuyên ngành')
    }
  }

  const handleSubjectToggle = (subjectId: string) => {
    if (assignedSubjects.includes(subjectId)) {
      toast.error('Không thể bỏ chọn môn học đã được phân công giảng dạy')
      return
    }

    setSelectedSubjects(prev => 
      prev.includes(subjectId) 
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    )
  }

  const getSpecializationTypeLabel = (type: string) => {
    switch (type) {
      case 'natural_science_technology':
        return 'Khoa học tự nhiên - Công nghệ'
      case 'social_humanities':
        return 'Khoa học xã hội - Nhân văn'
      case 'arts_physical_special':
        return 'Nghệ thuật - Thể chất - Đặc biệt'
      default:
        return type
    }
  }

  const getSpecializationTypeColor = (type: string) => {
    switch (type) {
      case 'natural_science_technology':
        return 'bg-blue-100 text-blue-800'
      case 'social_humanities':
        return 'bg-green-100 text-green-800'
      case 'arts_physical_special':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  const selectedOption = options.find(opt => opt.value === selectedType)

  return (
    <div className="space-y-6">
      {/* Existing Specializations */}
      {specializations.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium">Chuyên ngành hiện tại</h4>
          {specializations.map((spec) => (
            <Card key={spec.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    <Badge className={getSpecializationTypeColor(spec.specialization_type)}>
                      {getSpecializationTypeLabel(spec.specialization_type)}
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSpecialization(spec.id)}
                    disabled={disabled}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Môn học:</p>
                  <div className="flex flex-wrap gap-2">
                    {spec.subjects.map((subjectId) => {
                      const subject = options.find(opt =>
                        opt.subjects.some(s => s.id === subjectId)
                      )?.subjects.find(s => s.id === subjectId)

                      return (
                        <Badge key={subjectId} variant="outline" className="text-xs">
                          {subject?.name || subjectId}
                          {assignedSubjects.includes(subjectId) && (
                            <span className="ml-1 text-orange-600">(đã phân công)</span>
                          )}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Specialization */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <h4 className="font-medium">Thêm chuyên ngành mới</h4>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Chọn chuyên ngành</label>
            <Select value={selectedType} onValueChange={setSelectedType} disabled={disabled}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn chuyên ngành" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOption && (
            <div>
              <label className="text-sm font-medium mb-2 block">Chọn môn học</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {selectedOption.subjects.map((subject) => (
                  <div key={subject.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={subject.id}
                      checked={selectedSubjects.includes(subject.id)}
                      onCheckedChange={() => handleSubjectToggle(subject.id)}
                      disabled={disabled || assignedSubjects.includes(subject.id)}
                    />
                    <label 
                      htmlFor={subject.id} 
                      className={`text-sm cursor-pointer ${
                        assignedSubjects.includes(subject.id) ? 'text-orange-600' : ''
                      }`}
                    >
                      {subject.name}
                      {assignedSubjects.includes(subject.id) && (
                        <span className="ml-1 text-xs">(đã phân công)</span>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={handleAddSpecialization}
            disabled={disabled || isAdding || !selectedType || selectedSubjects.length === 0}
            className="w-full"
          >
            {isAdding ? 'Đang thêm...' : 'Thêm chuyên ngành'}
          </Button>
        </div>
      </div>
    </div>
  )
}
