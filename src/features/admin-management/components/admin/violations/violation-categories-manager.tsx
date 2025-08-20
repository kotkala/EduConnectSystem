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
  if (loading) return 'Äang lÆ°u...'
  return selectedCategory ? 'Cáº­p nháº­t' : 'Táº¡o'
}

// Helper function to get button text for type operations
function getTypeButtonText(loading: boolean, selectedType: unknown): string {
  if (loading) return 'Äang lÆ°u...'
  return selectedType ? 'Cáº­p nháº­t' : 'Táº¡o'
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
        console.error('Lá»—i táº£i danh má»¥c:', result.error)
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº£i danh má»¥c vi pháº¡m')
      }
    } catch (error) {
      console.error('Lá»—i táº£i danh má»¥c:', error)
      toast.error('KhÃ´ng thá»ƒ táº£i danh má»¥c vi pháº¡m')
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
        console.error('Lá»—i táº£i loáº¡i vi pháº¡m:', result.error)
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº£i loáº¡i vi pháº¡m')
      }
    } catch (error) {
      console.error('Lá»—i táº£i loáº¡i vi pháº¡m:', error)
      toast.error('KhÃ´ng thá»ƒ táº£i loáº¡i vi pháº¡m')
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
        toast.success('Táº¡o danh má»¥c vi pháº¡m thÃ nh cÃ´ng')
        categoryForm.reset()
        setCategoryDialogOpen(false)
        // Optimistically update state instead of reloading all data
        setCategories(prev => [...prev, result.data])
      } else {
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº¡o danh má»¥c vi pháº¡m')
      }
    } catch {
      toast.error('ÄÃ£ xáº£y ra lá»—i khi táº¡o danh má»¥c')
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
        toast.success('Cáº­p nháº­t danh má»¥c vi pháº¡m thÃ nh cÃ´ng')
        categoryForm.reset()
        setCategoryDialogOpen(false)
        setSelectedCategory(null)
        // Optimistically update state
        setCategories(prev => prev.map(cat =>
          cat.id === selectedCategory.id ? result.data : cat
        ))
      } else {
        toast.error(result.error || 'KhÃ´ng thá»ƒ cáº­p nháº­t danh má»¥c vi pháº¡m')
      }
    } catch {
      toast.error('ÄÃ£ xáº£y ra lá»—i khi cáº­p nháº­t danh má»¥c')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateType = async (data: ViolationTypeFormData) => {
    try {
      setLoading(true)
      const result = await createViolationTypeAction(data)

      if (result.success && result.data) {
        toast.success('Táº¡o loáº¡i vi pháº¡m thÃ nh cÃ´ng')
        typeForm.reset()
        setTypeDialogOpen(false)
        // Reload types to get updated pagination
        loadViolationTypes()
      } else {
        toast.error(result.error || 'KhÃ´ng thá»ƒ táº¡o loáº¡i vi pháº¡m')
      }
    } catch {
      toast.error('ÄÃ£ xáº£y ra lá»—i khi táº¡o loáº¡i vi pháº¡m')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateType = async (data: ViolationTypeFormData) => {
    if (!selectedType) return

    try {
      setLoading(true)
      // Báº£o Ä‘áº£m points luÃ´n cÃ³ sá»‘ trÆ°á»›c khi gá»i action
      const result = await updateViolationTypeAction({
        id: selectedType.id,
        category_id: data.category_id,
        name: data.name,
        description: data.description,
        default_severity: data.default_severity,
        points: data.points ?? 0
      })

      if (result.success && result.data) {
        toast.success('Cáº­p nháº­t loáº¡i vi pháº¡m thÃ nh cÃ´ng')
        typeForm.reset()
        setTypeDialogOpen(false)
        setSelectedType(null)
        // Reload types to get updated data
        loadViolationTypes()
      } else {
        toast.error(result.error || 'KhÃ´ng thá»ƒ cáº­p nháº­t loáº¡i vi pháº¡m')
      }
    } catch {
      toast.error('ÄÃ£ xáº£y ra lá»—i khi cáº­p nháº­t loáº¡i vi pháº¡m')
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
                Danh má»¥c vi pháº¡m
              </CardTitle>
              <CardDescription>
                Quáº£n lÃ½ danh má»¥c vi pháº¡m vÃ  cÃ¡c loáº¡i vi pháº¡m liÃªn quan
              </CardDescription>
            </div>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openCategoryDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  ThÃªm danh má»¥c
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedCategory ? 'Chá»‰nh sá»­a danh má»¥c' : 'Táº¡o danh má»¥c má»›i'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedCategory
                      ? 'Cáº­p nháº­t thÃ´ng tin danh má»¥c bÃªn dÆ°á»›i.'
                      : 'Táº¡o danh má»¥c vi pháº¡m má»›i Ä‘á»ƒ tá»• chá»©c cÃ¡c loáº¡i vi pháº¡m.'
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
                          <FormLabel>TÃªn danh má»¥c</FormLabel>
                          <FormControl>
                            <Input placeholder="vd: Ká»· luáº­t, Há»c thuáº­t" {...field} />
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
                          <FormLabel>MÃ´ táº£</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="MÃ´ táº£ ngáº¯n gá»n vá» danh má»¥c nÃ y..."
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
                        Há»§y
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
                <TableHead>TÃªn danh má»¥c</TableHead>
                <TableHead>MÃ´ táº£</TableHead>
                <TableHead>Sá»‘ loáº¡i vi pháº¡m</TableHead>
                <TableHead>Tráº¡ng thÃ¡i</TableHead>
                <TableHead className="w-[100px]">Thao tÃ¡c</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => {
                const typesCount = violationTypes.filter(t => t.category_id === category.id).length
                return (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {category.description || 'ChÆ°a cÃ³ mÃ´ táº£'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{typesCount} loáº¡i</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Hoáº¡t Ä‘á»™ng' : 'KhÃ´ng hoáº¡t Ä‘á»™ng'}
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
                    ChÆ°a cÃ³ danh má»¥c nÃ o. Táº¡o danh má»¥c Ä‘áº§u tiÃªn Ä‘á»ƒ báº¯t Ä‘áº§u.
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
              <CardTitle>CÃ¡c loáº¡i vi pháº¡m</CardTitle>
              <CardDescription>
                Nhá»¯ng loáº¡i vi pháº¡m cá»¥ thá»ƒ trong tá»«ng danh má»¥c
              </CardDescription>
            </div>
            <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => openTypeDialog()} disabled={categories.length === 0}>
                  <Plus className="h-4 w-4 mr-2" />
                  ThÃªm loáº¡i
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedType ? 'Chá»‰nh sá»­a loáº¡i vi pháº¡m' : 'Táº¡o loáº¡i vi pháº¡m má»›i'}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedType
                      ? 'Cáº­p nháº­t thÃ´ng tin loáº¡i vi pháº¡m bÃªn dÆ°á»›i.'
                      : 'Táº¡o loáº¡i vi pháº¡m má»›i trong má»™t danh má»¥c.'
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
                          <FormLabel>Danh má»¥c</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chá»n danh má»¥c" />
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
                          <FormLabel>TÃªn loáº¡i vi pháº¡m</FormLabel>
                          <FormControl>
                            <Input placeholder="vd: Äi há»c muá»™n, KhÃ´ng lÃ m bÃ i táº­p" {...field} />
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
                          <FormLabel>MÃ´ táº£</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="MÃ´ táº£ chi tiáº¿t vá» loáº¡i vi pháº¡m nÃ y..."
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
                          <FormLabel>Má»©c Ä‘á»™ máº·c Ä‘á»‹nh</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chá»n má»©c Ä‘á»™ máº·c Ä‘á»‹nh" />
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
                          <FormLabel>Äiá»ƒm trá»«</FormLabel>
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
                            Sá»‘ Ä‘iá»ƒm sáº½ bá»‹ trá»« khi há»c sinh vi pháº¡m loáº¡i nÃ y (0-100 Ä‘iá»ƒm)
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
                        Há»§y
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
                  placeholder="TÃ¬m kiáº¿m theo tÃªn hoáº·c mÃ´ táº£..."
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
                    <SelectValue placeholder="Lá»c theo danh má»¥c" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Táº¥t cáº£ danh má»¥c</SelectItem>
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
                    <SelectValue placeholder="Lá»c theo má»©c Ä‘á»™" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Táº¥t cáº£ má»©c Ä‘á»™</SelectItem>
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
                  <TableHead>TÃªn loáº¡i vi pháº¡m</TableHead>
                  <TableHead>Danh má»¥c</TableHead>
                  <TableHead>Má»©c Ä‘á»™ máº·c Ä‘á»‹nh</TableHead>
                  <TableHead>Äiá»ƒm trá»«</TableHead>
                  <TableHead>Tráº¡ng thÃ¡i</TableHead>
                  <TableHead className="w-[100px]">Thao tÃ¡c</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  if (typesLoading) {
                    return (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Äang táº£i...
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
                            {type.points} Ä‘iá»ƒm
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={type.is_active ? 'default' : 'secondary'}>
                            {type.is_active ? 'Hoáº¡t Ä‘á»™ng' : 'KhÃ´ng hoáº¡t Ä‘á»™ng'}
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
                          ? 'KhÃ´ng tÃ¬m tháº¥y loáº¡i vi pháº¡m nÃ o phÃ¹ há»£p vá»›i bá»™ lá»c.'
                          : 'ChÆ°a cÃ³ loáº¡i vi pháº¡m nÃ o. Táº¡o danh má»¥c trÆ°á»›c, sau Ä‘Ã³ thÃªm loáº¡i vi pháº¡m.'}
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
                itemName="loáº¡i vi pháº¡m"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
