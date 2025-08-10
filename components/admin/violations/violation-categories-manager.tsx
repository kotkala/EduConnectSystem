'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Edit, Settings } from 'lucide-react'
import { toast } from 'sonner'

// Helper function to get button text for category operations
function getCategoryButtonText(loading: boolean, selectedCategory: unknown): string {
  if (loading) return 'Đang lưu...'
  return selectedCategory ? 'Cập nhật' : 'Tạo'
}

// Helper function to get button text for type operations
function getTypeButtonText(loading: boolean, selectedType: unknown): string {
  if (loading) return 'Đang lưu...'
  return selectedType ? 'Cập nhật' : 'Tạo'
}

import {
  violationCategorySchema,
  violationTypeSchema,
  getSeverityLabel,
  getSeverityColor,
  violationSeverityLevels,
  type ViolationCategoryFormData,
  type ViolationTypeFormData,
  type ViolationCategory,
  type ViolationTypeWithCategory
} from '@/lib/validations/violation-validations'
import {
  getViolationCategoriesAndTypesAction,
  createViolationCategoryAction,
  createViolationTypeAction,
  updateViolationCategoryAction,
  updateViolationTypeAction
} from '@/lib/actions/violation-actions'

export default function ViolationCategoriesManager() {
  const [categories, setCategories] = useState<ViolationCategory[]>([])
  const [violationTypes, setViolationTypes] = useState<ViolationTypeWithCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ViolationCategory | null>(null)
  const [selectedType, setSelectedType] = useState<ViolationTypeWithCategory | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const categoryForm = useForm<ViolationCategoryFormData>({
    resolver: zodResolver(violationCategorySchema),
    defaultValues: {
      name: '',
      description: ''
    }
  })

  const typeForm = useForm<ViolationTypeFormData>({
    resolver: zodResolver(violationTypeSchema),
    defaultValues: {
      category_id: '',
      name: '',
      description: '',
      default_severity: 'minor' as const
    }
  })

  useEffect(() => {
    loadCategoriesAndTypes()
  }, [])

  const loadCategoriesAndTypes = async () => {
    try {
      const result = await getViolationCategoriesAndTypesAction()
      if (result.success) {
        if (result.categories) {
          setCategories(result.categories)
        }
        if (result.types) {
          setViolationTypes(result.types)
        }
      } else {
        console.error('Failed to load categories and types:', result.error)
        toast.error(result.error || 'Failed to load violation categories and types')
      }
    } catch (error) {
      console.error('Error loading categories and types:', error)
      toast.error('Failed to load violation categories and types')
    }
  }

  const handleCreateCategory = async (data: ViolationCategoryFormData) => {
    try {
      setLoading(true)
      const result = await createViolationCategoryAction(data)
      
      if (result.success) {
        toast.success('Tạo danh mục vi phạm thành công')
        categoryForm.reset()
        setCategoryDialogOpen(false)
        loadCategoriesAndTypes()
      } else {
        toast.error(result.error || 'Không thể tạo danh mục vi phạm')
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi tạo danh mục')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateCategory = async (data: ViolationCategoryFormData) => {
    if (!selectedCategory) return

    try {
      setLoading(true)
      const result = await updateViolationCategoryAction({
        id: selectedCategory.id,
        ...data
      })
      
      if (result.success) {
        toast.success('Cập nhật danh mục vi phạm thành công')
        categoryForm.reset()
        setCategoryDialogOpen(false)
        setSelectedCategory(null)
        loadCategoriesAndTypes()
      } else {
        toast.error(result.error || 'Không thể cập nhật danh mục vi phạm')
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi cập nhật danh mục')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateType = async (data: ViolationTypeFormData) => {
    try {
      setLoading(true)
      const result = await createViolationTypeAction(data)
      
      if (result.success) {
        toast.success('Tạo loại vi phạm thành công')
        typeForm.reset()
        setTypeDialogOpen(false)
        loadCategoriesAndTypes()
      } else {
        toast.error(result.error || 'Không thể tạo loại vi phạm')
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi tạo loại vi phạm')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateType = async (data: ViolationTypeFormData) => {
    if (!selectedType) return

    try {
      setLoading(true)
      const result = await updateViolationTypeAction({
        id: selectedType.id,
        ...data
      })
      
      if (result.success) {
        toast.success('Cập nhật loại vi phạm thành công')
        typeForm.reset()
        setTypeDialogOpen(false)
        setSelectedType(null)
        loadCategoriesAndTypes()
      } else {
        toast.error(result.error || 'Không thể cập nhật loại vi phạm')
      }
    } catch {
      toast.error('Đã xảy ra lỗi khi cập nhật loại vi phạm')
    } finally {
      setLoading(false)
    }
  }

  const openCategoryDialog = (category?: ViolationCategory) => {
    if (category) {
      setSelectedCategory(category)
      categoryForm.reset({
        name: category.name,
        description: category.description || ''
      })
    } else {
      setSelectedCategory(null)
      categoryForm.reset()
    }
    setCategoryDialogOpen(true)
  }

  const openTypeDialog = (type?: ViolationTypeWithCategory) => {
    if (type) {
      setSelectedType(type)
      typeForm.reset({
        category_id: type.category_id,
        name: type.name,
        description: type.description || '',
        default_severity: type.default_severity
      })
    } else {
      setSelectedType(null)
      typeForm.reset()
    }
    setTypeDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Categories Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Danh mục vi phạm
              </CardTitle>
              <CardDescription>
                Quản lý danh mục vi phạm và các loại vi phạm liên quan
              </CardDescription>
            </div>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openCategoryDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm danh mục
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedCategory
                      ? 'Cập nhật thông tin danh mục bên dưới.'
                      : 'Tạo danh mục vi phạm mới để tổ chức các loại vi phạm.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...categoryForm}>
                  <form 
                    onSubmit={categoryForm.handleSubmit(
                      selectedCategory ? handleUpdateCategory : handleCreateCategory
                    )} 
                    className="space-y-4"
                  >
                    <FormField
                      control={categoryForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên danh mục</FormLabel>
                          <FormControl>
                            <Input placeholder="vd: Kỷ luật, Học thuật" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={categoryForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mô tả</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Mô tả ngắn gọn về danh mục này..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCategoryDialogOpen(false)}
                        disabled={loading}
                      >
                        Hủy
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {getCategoryButtonText(loading, selectedCategory)}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Types Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const typesCount = violationTypes.filter(t => t.category_id === category.id).length
                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{typesCount} types</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCategoryDialog(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No categories found. Create your first category to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Violation Types Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Các loại vi phạm</CardTitle>
              <CardDescription>
                Những loại vi phạm cụ thể trong từng danh mục
              </CardDescription>
            </div>
            <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openTypeDialog()} disabled={categories.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm loại
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedType ? 'Chỉnh sửa loại vi phạm' : 'Tạo loại vi phạm mới'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedType
                      ? 'Cập nhật thông tin loại vi phạm bên dưới.'
                      : 'Tạo loại vi phạm mới trong một danh mục.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <Form {...typeForm}>
                  <form 
                    onSubmit={typeForm.handleSubmit(
                      selectedType ? handleUpdateType : handleCreateType
                    )} 
                    className="space-y-4"
                  >
                    <FormField
                      control={typeForm.control}
                      name="category_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Danh mục</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn danh mục" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={typeForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tên loại vi phạm</FormLabel>
                          <FormControl>
                            <Input placeholder="vd: Đi học muộn, Không làm bài tập" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={typeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mô tả</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Mô tả chi tiết về loại vi phạm này..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={typeForm.control}
                      name="default_severity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mức độ mặc định</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn mức độ mặc định" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {violationSeverityLevels.map((severity) => (
                                <SelectItem key={severity} value={severity}>
                                  <Badge className={getSeverityColor(severity)}>
                                    {getSeverityLabel(severity)}
                                  </Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTypeDialogOpen(false)}
                        disabled={loading}
                      >
                        Hủy
                      </Button>
                      <Button type="submit" disabled={loading}>
                        {getTypeButtonText(loading, selectedType)}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Default Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {violationTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>{type.category.name}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(type.default_severity)}>
                      {getSeverityLabel(type.default_severity)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.is_active ? 'default' : 'secondary'}>
                      {type.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openTypeDialog(type)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {violationTypes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No violation types found. Create categories first, then add violation types.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
