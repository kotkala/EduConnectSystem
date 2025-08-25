"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form'
import { Switch } from '@/shared/components/ui/switch'
import { X } from 'lucide-react'
import { 
  createClassroomAction, 
  updateClassroomAction,
  type Classroom 
} from '@/features/admin-management/actions/classroom-actions'
import { 
  classroomSchema,
  updateClassroomSchema,
  ROOM_TYPES,
  EQUIPMENT_OPTIONS,
  type ClassroomFormData,
  type UpdateClassroomFormData
} from '@/lib/validations/timetable-validations'

interface ClassroomFormProps {
  readonly classroom?: Classroom
  readonly onSuccess: () => void
  readonly onCancel: () => void
}

export function ClassroomForm({ classroom, onSuccess, onCancel }: ClassroomFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(
    classroom?.equipment || []
  )

  const isEditing = !!classroom

  const form = useForm({
    resolver: zodResolver(isEditing ? updateClassroomSchema : classroomSchema),
    defaultValues: isEditing ? {
      id: classroom.id,
      name: classroom.name,
      building: classroom.building || '',
      floor: classroom.floor || 1,
      capacity: classroom.capacity,
      room_type: classroom.room_type as 'standard' | 'lab' | 'computer' | 'auditorium' | 'gym' | 'library',
      equipment: classroom.equipment,
      is_active: classroom.is_active
    } : {
      name: '',
      building: '',
      floor: 1,
      capacity: 40,
      room_type: 'standard',
      equipment: [],
      is_active: true
    }
  })

  // Update equipment in form when selectedEquipment changes
  useEffect(() => {
    form.setValue('equipment', selectedEquipment)
  }, [selectedEquipment, form])

  const addEquipment = (equipment: string) => {
    if (!selectedEquipment.includes(equipment)) {
      setSelectedEquipment([...selectedEquipment, equipment])
    }
  }

  const removeEquipment = (equipment: string) => {
    setSelectedEquipment(selectedEquipment.filter(item => item !== equipment))
  }

  const onSubmit = async (data: Record<string, unknown>) => {
    setLoading(true)
    setError(null)

    try {
      const result = isEditing
        ? await updateClassroomAction(data as UpdateClassroomFormData)
        : await createClassroomAction(data as ClassroomFormData)

      if (result.success) {
        onSuccess()
      } else {
        setError(result.error || 'Không thể lưu phòng học')
      }
    } catch {
      setError('Đã xảy ra lỗi không mong muốn')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên phòng học *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: A101, Phòng thí nghiệm Vật lý 1"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="building"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tòa nhà</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="VD: Tòa A, Khối Khoa học"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Location and Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="floor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tầng</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      placeholder="1"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 1)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sức chứa *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      min="1"
                      max="200"
                      placeholder="40"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 40)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="room_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại phòng *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại phòng" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROOM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Equipment Section */}
          <div className="space-y-4">
            <Label>Trang thiết bị</Label>

            {/* Equipment Selection */}
            <Select onValueChange={addEquipment}>
              <SelectTrigger>
                <SelectValue placeholder="Thêm trang thiết bị" />
              </SelectTrigger>
              <SelectContent>
                {EQUIPMENT_OPTIONS.filter(eq => !selectedEquipment.includes(eq)).map((equipment) => (
                  <SelectItem key={equipment} value={equipment}>
                    {equipment}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Selected Equipment Display */}
            {selectedEquipment.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedEquipment.map((equipment) => (
                  <Badge key={equipment} variant="secondary" className="flex items-center gap-1">
                    {equipment}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeEquipment(equipment)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Active Status */}
          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Trạng thái hoạt động</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Kích hoạt phòng học này để lập lịch
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Form Actions */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {(() => {
                if (loading) return 'Đang lưu...'
                return isEditing ? 'Cập nhật phòng học' : 'Tạo phòng học'
              })()}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
