'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/components/ui/form'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { Plus, Edit, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { SharedPaginationControls } from '@/shared/components/shared/shared-pagination-controls'

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

// Helper function to get points color based on severity
function getPointsColor(points: number): string {
  if (points === 0) return 'text-gray-500'
  if (points <= 5) return 'text-yellow-600 border-yellow-300'
  if (points <= 10) return 'text-orange-600 border-orange-300'
  return 'text-red-600 border-red-300'
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
  getViolationTypesWithPaginationAction,
  createViolationCategoryAction,
  createViolationTypeAction,
  updateViolationCategoryAction,
  updateViolationTypeAction
} from '@/features/violations/actions/violation-actions'

export default function ViolationCategoriesManager() {
  const [categories, setCategories] = useState<ViolationCategory[]>([])
  const [violationTypes, setViolationTypes] = useState<ViolationTypeWithCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState<ViolationCategory | null>(null)
  const [selectedType, setSelectedType] = useState<ViolationTypeWithCategory | null>(null)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [typeDialogOpen, setTypeDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  // Pagination and search states for violation types
  const [typesPage, setTypesPage] = useState(1)
  const [typesTotal, setTypesTotal] = useState(0)
  const [typesSearch, setTypesSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [typesCategoryFilter, setTypesCategoryFilter] = useState('all')
  const [typesSeverityFilter, setTypesSeverityFilter] = useState('all')
  const [typesLoading, setTypesLoading] = useState(false)

  const TYPES_PER_PAGE = 10

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
      default_severity: 'minor' as const,
      points: 0
    }
  })

  const loadCategories = useCallback(async () => {
    try {
      const result = await getViolationCategoriesAndTypesAction()
      if (result.success && result.categories) {
        setCategories(result.categories)
      } else {
        console.error('Lỗi tải danh mục:', result.error)
        toast.error(result.error || 'Không thể tải danh mục vi phạm')
      }
    } catch (error) {
      console.error('Lỗi tải danh mục:', error)
      toast.error('Không thể tải danh mục vi phạm')
    }
  }, [])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(typesSearch)
    }, 300)

    return () => clearTimeout(timer)
  }, [typesSearch])

  // Reset page when search changes
  useEffect(() => {
    setTypesPage(1)
  }, [debouncedSearch])

  const loadViolationTypes = useCallback(async () => {
    setTypesLoading(true)
    try {
      const result = await getViolationTypesWithPaginationAction({
        page: typesPage,
        limit: TYPES_PER_PAGE,
        search: debouncedSearch.trim() || undefined,
        category_id: typesCategoryFilter === 'all' ? undefined : typesCategoryFilter,
        severity: typesSeverityFilter === 'all' ? undefined : typesSeverityFilter
      })

      if (result.success) {
        setViolationTypes(result.data || [])
        setTypesTotal(result.total || 0)
      } else {
        console.error('Lỗi tải loại vi phạm:', result.error)
        toast.error(result.error || 'Không thể tải loại vi phạm')
      }
    } catch (error) {
      console.error('Lỗi tải loại vi phạm:', error)
      toast.error('Không thể tải loại vi phạm')
    } finally {
      setTypesLoading(false)
    }
  }, [typesPage, debouncedSearch, typesCategoryFilter, typesSeverityFilter])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  useEffect(() => {
    loadViolationTypes()
  }, [loadViolationTypes])

  const handleCreateCategory = async (data: ViolationCategoryFormData) => {
    try {
      setLoading(true)
      const result = await createViolationCategoryAction(data)

      if (result.success && result.data) {
        toast.success('Tạo danh mục vi phạm thành công')
        categoryForm.reset()
        setCategoryDialogOpen(false)
        // Optimistically update state instead of reloading all data
        setCategories(prev => [...prev, result.data])
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

      if (result.success && result.data) {
        toast.success('Cập nhật danh mục vi phạm thành công')
        categoryForm.reset()
        setCategoryDialogOpen(false)
        setSelectedCategory(null)
        // Optimistically update state
        setCategories(prev => prev.map(cat =>
          cat.id === selectedCategory.id ? result.data : cat
        ))
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

      if (result.success && result.data) {
        toast.success('Tạo loại vi phạm thành công')
        typeForm.reset()
        setTypeDialogOpen(false)
        // Reload types to get updated pagination
        loadViolationTypes()
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
      // Bảo đảm points luôn có số trước khi gọi action
      const result = await updateViolationTypeAction({
        id: selectedType.id,
        category_id: data.category_id,
        name: data.name,
        description: data.description,
        default_severity: data.default_severity,
        points: data.points ?? 0
      })

      if (result.success && result.data) {
        toast.success('Cập nhật loại vi phạm thành công')
        typeForm.reset()
        setTypeDialogOpen(false)
        setSelectedType(null)
        // Reload types to get updated data
        loadViolationTypes()
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
        default_severity: type.default_severity,
        points: type.points || 0
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
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Số loại vi phạm</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="w-[100px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const typesCount = violationTypes.filter(t => t.category_id === category.id).length
                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || 'Chưa có mô tả'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{typesCount} loại</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Hoạt động' : 'Không hoạt động'}
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
                    Chưa có danh mục nào. Tạo danh mục đầu tiên để bắt đầu.
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
                    <FormField
                      control={typeForm.control}
                      name="points"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Điểm trừ</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            Số điểm sẽ bị trừ khi học sinh vi phạm loại này (0-100 điểm)
                          </p>
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
          {/* Search and Filter Controls */}
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Tìm kiếm theo tên hoặc mô tả..."
                  value={typesSearch}
                  onChange={(e) => {
                    setTypesSearch(e.target.value)
                    setTypesPage(1) // Reset to first page when searching
                  }}
                  className="max-w-sm"
                />
              </div>
              <div className="flex gap-2">
                <Select value={typesCategoryFilter} onValueChange={(value) => {
                  setTypesCategoryFilter(value)
                  setTypesPage(1)
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Lọc theo danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả danh mục</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={typesSeverityFilter} onValueChange={(value) => {
                  setTypesSeverityFilter(value)
                  setTypesPage(1)
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Lọc theo mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả mức độ</SelectItem>
                    {violationSeverityLevels.map((severity) => (
                      <SelectItem key={severity} value={severity}>
                        <Badge className={getSeverityColor(severity)}>
                          {getSeverityLabel(severity)}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Types Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên loại vi phạm</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Mức độ mặc định</TableHead>
                  <TableHead>Điểm trừ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[100px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  if (typesLoading) {
                    return (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Đang tải...
                        </TableCell>
                      </TableRow>
                    )
                  }

                  if (violationTypes.length > 0) {
                    return violationTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell>{type.category.name}</TableCell>
                        <TableCell>
                          <Badge className={getSeverityColor(type.default_severity)}>
                            {getSeverityLabel(type.default_severity)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`font-mono ${getPointsColor(type.points)}`}
                          >
                            {type.points} điểm
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={type.is_active ? 'default' : 'secondary'}>
                            {type.is_active ? 'Hoạt động' : 'Không hoạt động'}
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
                    ))
                  }

                  const hasFilters = typesSearch || typesCategoryFilter !== 'all' || typesSeverityFilter !== 'all'
                  return (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        {hasFilters
                          ? 'Không tìm thấy loại vi phạm nào phù hợp với bộ lọc.'
                          : 'Chưa có loại vi phạm nào. Tạo danh mục trước, sau đó thêm loại vi phạm.'}
                      </TableCell>
                    </TableRow>
                  )
                })()}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {typesTotal > TYPES_PER_PAGE && (
            <div className="mt-4">
              <SharedPaginationControls
                currentPage={typesPage}
                totalPages={Math.ceil(typesTotal / TYPES_PER_PAGE)}
                totalCount={typesTotal}
                onPageChange={setTypesPage}
                itemName="loại vi phạm"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
