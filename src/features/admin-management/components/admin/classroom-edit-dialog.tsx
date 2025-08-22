"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Badge } from "@/shared/components/ui/badge"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { updateClassroomAction, type Classroom } from "@/features/admin-management/actions/classroom-actions"
import { ROOM_TYPES, EQUIPMENT_OPTIONS } from "@/lib/validations/timetable-validations"
import { X } from "lucide-react"

interface ClassroomEditDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly classroom: Classroom | null
  readonly onSuccess: () => void
}

export function ClassroomEditDialog({
  open,
  onOpenChange,
  classroom,
  onSuccess
}: ClassroomEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>(classroom?.equipment || [])
  const [formData, setFormData] = useState({
    name: classroom?.name || '',
    building: classroom?.building || '',
    floor: classroom?.floor || 1,
    room_type: classroom?.room_type || 'standard',
    capacity: classroom?.capacity || 30
  })

  const addEquipment = (equipment: string) => {
    if (!selectedEquipment.includes(equipment)) {
      setSelectedEquipment([...selectedEquipment, equipment])
    }
  }

  const removeEquipment = (equipment: string) => {
    setSelectedEquipment(selectedEquipment.filter(item => item !== equipment))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classroom) return

    setIsLoading(true)
    try {
      const result = await updateClassroomAction({
        id: classroom.id,
        name: formData.name,
        building: formData.building || undefined,
        floor: formData.floor || undefined,
        room_type: formData.room_type as "standard" | "lab" | "computer" | "auditorium" | "gym" | "library",
        capacity: formData.capacity,
        equipment: selectedEquipment
      })

      if (result.success) {
        toast.success("Đã cập nhật phòng học thành công")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Cập nhật thất bại")
      }
    } catch (error) {
      console.error('Lỗi cập nhật:', error)
      toast.error("Có lỗi xảy ra khi cập nhật")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa phòng học</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin phòng học
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Tên phòng học</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên phòng học"
                required
              />
            </div>
            <div>
              <Label htmlFor="building">Tòa nhà</Label>
              <Input
                id="building"
                value={formData.building}
                onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                placeholder="Nhập tên tòa nhà"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="floor">Tầng</Label>
              <Input
                id="floor"
                type="number"
                min="1"
                max="50"
                value={formData.floor}
                onChange={(e) => setFormData(prev => ({ ...prev, floor: parseInt(e.target.value) }))}
              />
            </div>
            <div>
              <Label htmlFor="room_type">Loại phòng</Label>
              <Select
                value={formData.room_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, room_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="capacity">Sức chứa</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                max="500"
                value={formData.capacity}
                onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                required
              />
            </div>
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

          <div className="flex items-center gap-2">
            <Badge variant={classroom?.is_active ? "default" : "secondary"}>
              {classroom?.is_active ? "Hoạt động" : "Không hoạt động"}
            </Badge>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
