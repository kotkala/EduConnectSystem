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
  updateTeacherSpecializationAction,
  removeTeacherSpecializationAction,
  getTeacherAssignedSubjectsAction,
  type SpecializationOption,
  type TeacherSpecialization
} from '../actions/teacher-specialization-actions'

interface TeacherSpecializationFormProps {
  teacherId: string
  disabled?: boolean
}

export default function TeacherSpecializationForm({ teacherId, disabled = false }: TeacherSpecializationFormProps) {
  const [specializations, setSpecializations] = useState<TeacherSpecialization[]>([])
  const [options, setOptions] = useState<SpecializationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string>('')
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([])

  useEffect(() => {
    loadData()
  }, [teacherId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setLoading(true)
    try {
      const [optionsResult, specializationsResult, assignedResult] = await Promise.all([
        getSpecializationOptionsAction(),
        getTeacherSpecializationsAction(teacherId),
        getTeacherAssignedSubjectsAction(teacherId)
      ])

      if (optionsResult.success) {
        setOptions(optionsResult.data || [])
      }

      if (specializationsResult.success) {
        setSpecializations(specializationsResult.data || [])
      }

      if (assignedResult.success) {
        setAssignedSubjects(assignedResult.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Có lỗi xảy ra khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSpecialization = async () => {
    if (!selectedType || selectedSubjects.length === 0) {
      toast.error('Vui lòng chọn chuyên ngành và ít nhất một môn học')
      return
    }

    // Check if specialization type already exists
    if (specializations.some(s => s.specialization_type === selectedType)) {
      toast.error('Chuyên ngành này đã được thêm')
      return
    }

    setIsAdding(true)
    try {
      const result = await addTeacherSpecializationAction({
        teacher_id: teacherId,
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

  const handleUpdateSpecialization = async (id: string, subjects: string[]) => {
    try {
      const result = await updateTeacherSpecializationAction({ id, subjects })

      if (result.success) {
        toast.success('Đã cập nhật chuyên ngành thành công')
        loadData()
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi cập nhật chuyên ngành')
      }
    } catch (error) {
      console.error('Error updating specialization:', error)
      toast.error('Có lỗi xảy ra khi cập nhật chuyên ngành')
    }
  }

  const handleRemoveSpecialization = async (id: string) => {
    try {
      const result = await removeTeacherSpecializationAction(id)

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

  const getSpecializationLabel = (type: string) => {
    const option = options.find(o => o.value === type)
    return option?.label || type
  }



  const getAvailableTypes = () => {
    return options.filter(option => 
      !specializations.some(s => s.specialization_type === option.value)
    )
  }

  const getSubjectsForType = (type: string) => {
    const option = options.find(o => o.value === type)
    return option?.subjects || []
  }

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Chuyên ngành giảng dạy</h3>
        <Badge variant="outline" className="text-xs">
          Tùy chọn
        </Badge>
      </div>

      {/* Existing Specializations */}
      {specializations.map((spec) => (
        <Card key={spec.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {getSpecializationLabel(spec.specialization_type)}
              </CardTitle>
              {!disabled && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSpecialization(spec.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">Môn học:</div>
              <div className="grid grid-cols-2 gap-2">
                {getSubjectsForType(spec.specialization_type).map((subject) => {
                  const isAssigned = assignedSubjects.includes(subject.id)
                  const isChecked = spec.subjects.includes(subject.id)
                  return (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${spec.id}-${subject.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          if (disabled) return
                          // Prevent unchecking if subject is assigned to classes
                          if (!checked && isAssigned) {
                            toast.error('Không thể bỏ chọn môn học đã được phân công giảng dạy')
                            return
                          }
                          const newSubjects = checked
                            ? [...spec.subjects, subject.id]
                            : spec.subjects.filter(s => s !== subject.id)
                          handleUpdateSpecialization(spec.id, newSubjects)
                        }}
                        disabled={disabled}
                      />
                      <label
                        htmlFor={`${spec.id}-${subject.id}`}
                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                          isAssigned ? 'text-orange-600' : ''
                        }`}
                      >
                        {subject.name}
                        {isAssigned && (
                          <span className="ml-1 text-xs text-orange-600">(đã phân công)</span>
                        )}
                      </label>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add New Specialization */}
      {!disabled && getAvailableTypes().length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Thêm chuyên ngành mới
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn chuyên ngành" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableTypes().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedType && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Chọn môn học:</div>
                <div className="grid grid-cols-2 gap-2">
                  {getSubjectsForType(selectedType).map((subject) => (
                    <div key={subject.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`new-${subject.id}`}
                        checked={selectedSubjects.includes(subject.id)}
                        onCheckedChange={(checked) => {
                          setSelectedSubjects(prev =>
                            checked
                              ? [...prev, subject.id]
                              : prev.filter(s => s !== subject.id)
                          )
                        }}
                      />
                      <label
                        htmlFor={`new-${subject.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {subject.name}
                      </label>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleAddSpecialization}
                  disabled={isAdding || selectedSubjects.length === 0}
                  className="w-full"
                >
                  {isAdding ? 'Đang thêm...' : 'Thêm chuyên ngành'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {specializations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Chưa có chuyên ngành nào được thêm
        </div>
      )}
    </div>
  )
}
