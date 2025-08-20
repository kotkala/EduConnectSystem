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
import { ROOM_TYPES } from "@/lib/validations/timetable-validations"

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
  const [formData, setFormData] = useState({
    name: classroom?.name || '',
    building: classroom?.building || '',
    floor: classroom?.floor || 1,
    room_type: classroom?.room_type || 'standard',
    capacity: classroom?.capacity || 30,
    equipment: classroom?.equipment?.join(', ') || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classroom) return

    setIsLoading(true)
    try {
      const equipmentArray = formData.equipment
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0)

      const result = await updateClassroomAction({
        id: classroom.id,
        name: formData.name,
        building: formData.building || undefined,
        floor: formData.floor || undefined,
        room_type: formData.room_type as "standard" | "lab" | "computer" | "auditorium" | "gym" | "library",
        capacity: formData.capacity,
        equipment: equipmentArray
      })

      if (result.success) {
        toast.success("ÄÃ£ cập nhật phÃ²ng hồc thÃ nh công")
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Cập nhật tháº¥t báº¡i")
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
          <DialogTitle>Chỉnh sửa phÃ²ng hồc</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin phÃ²ng hồc
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Tên phÃ²ng hồc</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên phÃ²ng hồc"
                required
              />
            </div>
            <div>
              <Label htmlFor="building">TÃ²a nhÃ </Label>
              <Input
                id="building"
                value={formData.building}
                onChange={(e) => setFormData(prev => ({ ...prev, building: e.target.value }))}
                placeholder="Nhập tên tÃ²a nhÃ "
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="floor">Táº§ng</Label>
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
              <Label htmlFor="room_type">Loáº¡i phÃ²ng</Label>
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
              <Label htmlFor="capacity">Sá»©c chồ©a</Label>
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

          <div>
            <Label htmlFor="equipment">Thiáº¿t bị (phÃ¢n cách báº±ng dấu pháº©y)</Label>
            <Input
              id="equipment"
              value={formData.equipment}
              onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
              placeholder="MÃ¡y chiáº¿u, Bảng thông minh, MÃ¡y tÃ­nh..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={classroom?.is_active ? "default" : "secondary"}>
              {classroom?.is_active ? "Hoạt Ä‘á»™ng" : "Không hoạt Ä‘á»™ng"}
            </Badge>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Äang cập nhật..." : "Cập nhật"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
