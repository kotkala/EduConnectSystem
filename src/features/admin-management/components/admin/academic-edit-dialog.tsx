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
import { updateAcademicYearAction, updateSemesterAction } from "@/features/admin-management/actions/academic-actions"
import { type AcademicYear, type Semester } from "@/lib/validations/academic-validations"

interface AcademicEditDialogProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
  readonly item: AcademicYear | Semester | null
  readonly type: "academic-years" | "semesters"
  readonly onSuccess: () => void
}

export function AcademicEditDialog({
  open,
  onOpenChange,
  item,
  type,
  onSuccess
}: AcademicEditDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: item?.name || '',
    start_date: item?.start_date || '',
    end_date: item?.end_date || '',
    semester_number: (item as Semester)?.semester_number || 1,
    weeks_count: (item as Semester)?.weeks_count || 18
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    setIsLoading(true)
    try {
      const result = type === "academic-years"
        ? await updateAcademicYearAction({
            id: item.id,
            name: formData.name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            is_current: item.is_current
          })
        : await updateSemesterAction({
            id: item.id,
            academic_year_id: (item as Semester).academic_year_id,
            name: formData.name,
            start_date: formData.start_date,
            end_date: formData.end_date,
            semester_number: formData.semester_number,
            weeks_count: formData.weeks_count,
            is_current: item.is_current
          })

      if (result.success) {
        toast.success(`ÄÃ£ cáº­p nháº­t ${type === "academic-years" ? "nÄƒm há»c" : "há»c ká»³"} thÃ nh cÃ´ng`)
        onSuccess()
        onOpenChange(false)
      } else {
        toast.error(result.error || "Cáº­p nháº­t tháº¥t báº¡i")
      }
    } catch (error) {
      console.error('Lá»—i cáº­p nháº­t:', error)
      toast.error("CÃ³ lá»—i xáº£y ra khi cáº­p nháº­t")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateISO = (dateString: string) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Chá»‰nh sá»­a {type === "academic-years" ? "nÄƒm há»c" : "há»c ká»³"}
          </DialogTitle>
          <DialogDescription>
            Cáº­p nháº­t thÃ´ng tin {type === "academic-years" ? "nÄƒm há»c" : "há»c ká»³"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">TÃªn {type === "academic-years" ? "nÄƒm há»c" : "há»c ká»³"}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={`Nháº­p tÃªn ${type === "academic-years" ? "nÄƒm há»c" : "há»c ká»³"}`}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_date">NgÃ y báº¯t Ä‘áº§u</Label>
              <Input
                id="start_date"
                type="date"
                value={formatDateISO(formData.start_date)}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">NgÃ y káº¿t thÃºc</Label>
              <Input
                id="end_date"
                type="date"
                value={formatDateISO(formData.end_date)}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                required
              />
            </div>
          </div>
          {type === "semesters" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="semester_number">Há»c ká»³ sá»‘</Label>
                <Input
                  id="semester_number"
                  type="number"
                  min="1"
                  max="3"
                  value={formData.semester_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, semester_number: parseInt(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="weeks_count">Sá»‘ tuáº§n</Label>
                <Input
                  id="weeks_count"
                  type="number"
                  min="1"
                  max="52"
                  value={formData.weeks_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, weeks_count: parseInt(e.target.value) }))}
                  required
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge variant={item?.is_current ? "default" : "secondary"}>
              {item?.is_current ? "Hiá»‡n táº¡i" : "KhÃ´ng hoáº¡t Ä‘á»™ng"}
            </Badge>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Há»§y
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Äang cáº­p nháº­t..." : "Cáº­p nháº­t"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
