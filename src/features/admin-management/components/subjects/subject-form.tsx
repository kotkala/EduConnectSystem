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
  submitLabel = "LÆ°u mÃ´n hồc"
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
                <FormLabel>MÃ£ mÃ´n hồc</FormLabel>
                <FormControl>
                  <Input
                    placeholder="VD: TOAN, VAN"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription>
                  MÃ£ duy nháº¥t cho mÃ´n hồc (2-10 kÃ½ tá»±, viáº¿t hoa)
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
                <FormLabel>PhÃ¢n loại</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chồn phÃ¢n loại" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="core">Môn hồc cá»‘t lÃµi</SelectItem>
                    <SelectItem value="specialized">Môn hồc chuyÃªn Ä‘á»</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Môn cá»‘t lÃµi lÃ  bắt buá»™c, mÃ´n chuyÃªn Ä‘á» lÃ  tuá»³ chồn
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
                <FormLabel>Tên tiáº¿ng Viá»‡t</FormLabel>
                <FormControl>
                  <Input placeholder="VD: ToÃ¡n hồc" {...field} />
                </FormControl>
                <FormDescription>
                  Tên mÃ´n hồc báº±ng tiáº¿ng Viá»‡t
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
                <FormLabel>Tên tiáº¿ng Anh</FormLabel>
                <FormControl>
                  <Input placeholder="VD: Mathematics" {...field} />
                </FormControl>
                <FormDescription>
                  Tên mÃ´n hồc báº±ng tiáº¿ng Anh
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
                  placeholder="Mô tả ngắn gá»n về mÃ´n hồc (không bắt buá»™c)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Mô tả tuá»³ chồn về ná»™i dung vÃ  mục tiÃªu mÃ´n hồc
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
            {isLoading ? "Äang lưu..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
