"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SubjectFormSchema, SubjectFormData } from "@/lib/validations"
import { Subject } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  submitLabel = "Save Subject"
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
                <FormLabel>Subject Code</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., TOAN, VAN"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  />
                </FormControl>
                <FormDescription>
                  Unique code for the subject (2-10 characters, uppercase)
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
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="core">Core Subject</SelectItem>
                    <SelectItem value="specialized">Specialized Subject</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Core subjects are required, specialized are optional
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
                <FormLabel>Vietnamese Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Toán học" {...field} />
                </FormControl>
                <FormDescription>
                  Subject name in Vietnamese
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
                <FormLabel>English Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Mathematics" {...field} />
                </FormControl>
                <FormDescription>
                  Subject name in English
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the subject (optional)"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Optional description of the subject content and objectives
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
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
