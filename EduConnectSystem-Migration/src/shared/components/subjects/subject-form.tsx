"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubjectFormSchema, SubjectFormData } from "@/lib/validations"
import { Subject } from "@/lib/types"
import { Button } from "@/shared/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

interface SubjectFormProps {
  readonly subject?: Subject | null
  readonly onSubmit: (data: SubjectFormData) => Promise<void>
  readonly onCancel: () => void
  readonly isLoading?: boolean
  readonly submitLabel?: string
}

export function SubjectForm({
  subject,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Lưu môn học"
}: SubjectFormProps) {
  const form = useForm<SubjectFormData>({
    resolver: zodResolver(SubjectFormSchema),
    defaultValues: {
      code: subject?.code || "",
      name_vietnamese: subject?.name_vietnamese || "",
      name_english: subject?.name_english || "",
      category: subject?.category || "core",
      description: subject?.description || "",
    },
  })

  const handleSubmit = async (data: SubjectFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mã môn học</FormLabel>
                <FormControl>
                  <Input
                    placeholder="VD: TOAN, VAN"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription>
                  Mã duy nhất cho môn học (2-10 ký tự, viết hoa)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phân loại</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phân loại" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="core">Môn học cốt lõi</SelectItem>
                    <SelectItem value="specialized">Môn học chuyên đề</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Môn cốt lõi là bắt buộc, môn chuyên đề là tuỳ chọn
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name_vietnamese"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên tiếng Việt</FormLabel>
                <FormControl>
                  <Input placeholder="VD: Toán học" {...field} />
                </FormControl>
                <FormDescription>
                  Tên môn học bằng tiếng Việt
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name_english"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tên tiếng Anh</FormLabel>
                <FormControl>
                  <Input placeholder="VD: Mathematics" {...field} />
                </FormControl>
                <FormDescription>
                  Tên môn học bằng tiếng Anh
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mô tả</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Mô tả ngắn gọn về môn học (không bắt buộc)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Mô tả tuỳ chọn về nội dung và mục tiêu môn học
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Đang lưu..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
