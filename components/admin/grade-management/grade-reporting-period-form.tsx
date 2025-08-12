'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  gradeReportingPeriodSchema,
  updateGradeReportingPeriodSchema,
  type GradeReportingPeriodFormData,
  type UpdateGradeReportingPeriodFormData,
  type GradeReportingPeriod
} from '@/lib/validations/grade-management-validations'
import {
  createGradeReportingPeriodAction,
  updateGradeReportingPeriodAction
} from '@/lib/actions/grade-management-actions'
import { getAcademicYearsAction, getSemestersAction } from '@/lib/actions/academic-actions'

interface GradeReportingPeriodFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  period?: GradeReportingPeriod
  onSuccess?: () => void
}

interface AcademicYear {
  id: string
  name: string
  is_current: boolean
}

interface Semester {
  id: string
  name: string
  is_current: boolean
}

export function GradeReportingPeriodForm({
  open,
  onOpenChange,
  period,
  onSuccess
}: GradeReportingPeriodFormProps) {
  const [loading, setLoading] = useState(false)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])

  const isEditing = !!period

  const form = useForm<GradeReportingPeriodFormData | UpdateGradeReportingPeriodFormData>({
    resolver: zodResolver(isEditing ? updateGradeReportingPeriodSchema : gradeReportingPeriodSchema),
    defaultValues: {
      name: period?.name || '',
      academic_year_id: period?.academic_year_id || '',
      semester_id: period?.semester_id || '',
      start_date: period?.start_date || '',
      end_date: period?.end_date || '',
      import_deadline: period?.import_deadline || '',
      edit_deadline: period?.edit_deadline || '',
      description: period?.description || '',
      ...(isEditing && { id: period.id })
    }
  })

  // Load academic years and semesters
  useEffect(() => {
    const loadData = async () => {
      try {
        const [academicYearsResult, semestersResult] = await Promise.all([
          getAcademicYearsAction(),
          getSemestersAction()
        ])

        if (academicYearsResult.success) {
          setAcademicYears(academicYearsResult.data.filter(ay => ay.is_current))
        }

        if (semestersResult.success) {
          setSemesters(semestersResult.data.filter(s => s.is_current))
        }
      } catch {
        toast.error("Không thể tải dữ liệu năm học và học kỳ")
      }
    }

    if (open) {
      loadData()
    }
  }, [open])

  const onSubmit = async (data: GradeReportingPeriodFormData | UpdateGradeReportingPeriodFormData) => {
    try {
      setLoading(true)

      const result = isEditing
        ? await updateGradeReportingPeriodAction(data as UpdateGradeReportingPeriodFormData)
        : await createGradeReportingPeriodAction(data as GradeReportingPeriodFormData)

      if (result.success) {
        toast.success(result.message)
        onSuccess?.()
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Đã xảy ra lỗi không mong muốn")
    } finally {
      setLoading(false)
    }
  }



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Cập nhật kỳ báo cáo' : 'Tạo kỳ báo cáo mới'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Cập nhật thông tin kỳ báo cáo điểm số'
              : 'Tạo kỳ báo cáo điểm số mới với thời gian và hạn chót cụ thể'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên kỳ báo cáo *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="VD: Kỳ báo cáo giữa học kỳ I"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="academic_year_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Năm học *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn năm học" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="semester_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Học kỳ *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn học kỳ" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {semesters.map((semester) => (
                            <SelectItem key={semester.id} value={semester.id}>
                              {semester.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày bắt đầu *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày kết thúc *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="import_deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hạn chót nhập điểm *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Sau thời gian này không thể nhập điểm mới
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="edit_deadline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hạn chót sửa điểm *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Sau thời gian này không thể sửa điểm
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả chi tiết về kỳ báo cáo này..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Cập nhật' : 'Tạo kỳ báo cáo'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
