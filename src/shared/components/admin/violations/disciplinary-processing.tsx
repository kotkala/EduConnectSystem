'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Label } from '@/shared/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Plus, Search, FileText, Send, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateDisciplinaryActionTypeAction, deactivateDisciplinaryActionTypeAction } from '@/lib/actions/violation-actions'

interface DisciplinaryActionType {
  id: string
  name: string
  description: string
  severity_level: number
  is_active: boolean
}

interface DisciplinaryCase {
  id: string
  student: {
    id: string
    full_name: string
    student_id: string
  }
  class: {
    id: string
    name: string
  }
  action_type: DisciplinaryActionType
  description: string
  status: 'draft' | 'sent_to_homeroom' | 'acknowledged' | 'meeting_scheduled' | 'resolved'
  created_at: string
  created_by: string
}

export default function DisciplinaryProcessing() {
  const [actionTypes, setActionTypes] = useState<DisciplinaryActionType[]>([])
  const [cases, setCases] = useState<DisciplinaryCase[]>([])
  // const [isLoading, setIsLoading] = useState(false) // not used currently
  const [activeTab, setActiveTab] = useState('add-case')
  
  // Form states
  const [selectedBlock, setSelectedBlock] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedActionType, setSelectedActionType] = useState('')
  const [caseDescription, setCaseDescription] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  
  // Action type form
  const [newActionType, setNewActionType] = useState({
    name: '',
    description: '',
    severity_level: 1
  })

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingActionType, setEditingActionType] = useState<DisciplinaryActionType | null>(null)
  const [deletingActionType, setDeletingActionType] = useState<DisciplinaryActionType | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', severity_level: 1 })

  useEffect(() => {
    loadActionTypes()
    loadCases()
  }, [])

  const loadActionTypes = async () => {
    try {
      const { getDisciplinaryActionTypesAction } = await import('@/lib/actions/violation-actions')
      const result = await getDisciplinaryActionTypesAction()
      if (result.success && result.data) {
        setActionTypes(result.data as unknown as DisciplinaryActionType[])
        return
      }
      // Fallback: if no data, keep empty
      setActionTypes([])
    } catch (error) {
      console.error('Lỗi tải hình thức kỷ luật:', error)
      setActionTypes([])
    }
  }

  const loadCases = async () => {
    try {
      const { getDisciplinaryCasesAction } = await import('@/lib/actions/violation-actions')
      const result = await getDisciplinaryCasesAction()
      if (result.success && result.data) {
        setCases(result.data as unknown as DisciplinaryCase[])
      } else {
        setCases([])
      }
    } catch (error) {
      console.error('Lỗi tải case kỷ luật:', error)
      setCases([])
    }
  }

  // Duplicate handlers removed below. Use single definitions above.

  const handleSendToHomeroom = async (caseId: string) => {
    // Avoid duplicate implementation – delegate to a single internal function
    return sendCaseToHomeroom(caseId)
  }

  const sendCaseToHomeroom = async (caseId: string) => {
    try {
      const { updateDisciplinaryCaseStatusAction } = await import('@/lib/actions/violation-actions')
      const res = await updateDisciplinaryCaseStatusAction({ case_id: caseId, status: 'sent_to_homeroom' })
      if (res.success) {
        setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'sent_to_homeroom' as const } : c))
        toast.success('Đã gửi case cho GVCN')
      } else {
        toast.error(res.error || 'Có lỗi xảy ra khi gửi case')
      }
    } catch (error) {
      console.error('Lỗi gửi case:', error)
      toast.error('Có lỗi xảy ra khi gửi case')
    }
  }

  // Modal handlers
  const handleEditActionType = (actionType: DisciplinaryActionType) => {
    setEditingActionType(actionType)
    setEditForm({
      name: actionType.name,
      description: actionType.description || '',
      severity_level: actionType.severity_level || 1
    })
    setEditModalOpen(true)
  }

  const handleDeleteActionType = (actionType: DisciplinaryActionType) => {
    setDeletingActionType(actionType)
    setDeleteModalOpen(true)
  }

  const handleEditSubmit = async () => {
    if (!editingActionType) return

    try {
      const res = await updateDisciplinaryActionTypeAction({
        id: editingActionType.id,
        name: editForm.name,
        description: editForm.description,
        severity_level: editForm.severity_level
      })

      if (res.success) {
        toast.success('Đã cập nhật hình thức kỷ luật')
        setActionTypes(prev => prev.map(t =>
          t.id === editingActionType.id
            ? { ...t, name: editForm.name, description: editForm.description, severity_level: editForm.severity_level }
            : t
        ))
        setEditModalOpen(false)
        setEditingActionType(null)
      } else {
        toast.error(res.error || 'Cập nhật thất bại')
      }
    } catch (error) {
      console.error('Lỗi cập nhật:', error)
      toast.error('Có lỗi xảy ra khi cập nhật')
    }
  }

  const handleDeleteSubmit = async () => {
    if (!deletingActionType) return

    try {
      const res = await deactivateDisciplinaryActionTypeAction({ id: deletingActionType.id })
      if (res.success) {
        toast.success('Đã vô hiệu hóa hình thức kỷ luật')
        setActionTypes(prev => prev.map(t =>
          t.id === deletingActionType.id ? { ...t, is_active: false } : t
        ))
        setDeleteModalOpen(false)
        setDeletingActionType(null)
      } else {
        toast.error(res.error || 'Thao tác thất bại')
      }
    } catch (error) {
      console.error('Lỗi xóa:', error)
      toast.error('Có lỗi xảy ra khi xóa')
    }
  }


  // Legacy mock loader block removed; using real API above


  const handleCreateActionType = async () => {
    if (!newActionType.name.trim()) {
      toast.error('Vui lòng nhập tên hình thức kỷ luật')
      return
    }

    try {
      const { createDisciplinaryActionTypeAction } = await import('@/lib/actions/violation-actions')
      const res = await createDisciplinaryActionTypeAction({
        name: newActionType.name,
        description: newActionType.description
      })
      if (res.success && res.data) {
        setActionTypes(prev => [...prev, res.data as unknown as DisciplinaryActionType])
        setNewActionType({ name: '', description: '', severity_level: 1 })
        toast.success('Đã tạo hình thức kỷ luật mới')
      } else {
        toast.error(res.error || 'Có lỗi xảy ra khi tạo hình thức kỷ luật')
      }
    } catch (error) {
      console.error('Lỗi tạo hình thức kỷ luật:', error)
      toast.error('Có lỗi xảy ra khi tạo hình thức kỷ luật')
    }
  }

  const handleCreateCase = async () => {
    if (!selectedStudent || !selectedActionType || !caseDescription.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      const [{ createDisciplinaryCaseAction }, { getSemestersAction }] = await Promise.all([
        import('@/lib/actions/violation-actions'),
        import('@/lib/actions/academic-actions')
      ])

      const semestersRes = await getSemestersAction()
      const current = semestersRes.success && semestersRes.data
        ? semestersRes.data.find((s: { is_current: boolean }) => s.is_current)
        : null
      if (!current) {
        toast.error('Không tìm thấy học kì hiện tại')
        return
      }

      const start = new Date(current.start_date)
      const now = new Date()
      const week_index = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)))

      const res = await createDisciplinaryCaseAction({
        student_id: selectedStudent,
        class_id: selectedClass || undefined,
        semester_id: current.id,
        week_index,
        action_type_id: selectedActionType,
        notes: caseDescription
      })
      if (res.success) {
        toast.success('Đã tạo case kỷ luật mới')
        setCaseDescription('')
        setSelectedStudent('')
        setSelectedActionType('')
        loadCases()
      } else {
        toast.error(res.error || 'Có lỗi xảy ra khi tạo case kỷ luật')
      }
    } catch (error) {
      console.error('Lỗi tạo case kỷ luật:', error)
      toast.error('Có lỗi xảy ra khi tạo case kỷ luật')
    }
  }

  // Duplicate implementation removed. Use the single handler above.


  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { variant: 'outline' as const, label: 'Nháp' },
      sent_to_homeroom: { variant: 'secondary' as const, label: 'Đã gửi GVCN' },
      acknowledged: { variant: 'default' as const, label: 'GVCN đã xác nhận' },
      meeting_scheduled: { variant: 'default' as const, label: 'Đã lên lịch họp' },
      resolved: { variant: 'default' as const, label: 'Đã giải quyết' }
    }
    const config = statusMap[status as keyof typeof statusMap] || statusMap.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getSeverityBadge = (level: number) => {
    if (level >= 4) return <Badge variant="destructive">Rất nghiêm trọng</Badge>
    if (level >= 3) return <Badge variant="secondary">Nghiêm trọng</Badge>
    if (level >= 2) return <Badge variant="outline">Trung bình</Badge>
    return <Badge variant="default">Nhẹ</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Xử lý kỷ luật vi phạm
          </CardTitle>
          <CardDescription>
            Quản lý hình thức kỷ luật và tạo case xử lý cho học sinh vi phạm
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="add-case">Tạo case kỷ luật</TabsTrigger>
          <TabsTrigger value="manage-types">Quản lý hình thức</TabsTrigger>
          <TabsTrigger value="view-cases">Xem tất cả case</TabsTrigger>
        </TabsList>

        {/* Tab tạo case kỷ luật */}
        <TabsContent value="add-case" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tạo case kỷ luật mới</CardTitle>
              <CardDescription>
                Chọn học sinh và hình thức kỷ luật phù hợp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Khối lớp</Label>
                  <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn khối" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Khối 10</SelectItem>
                      <SelectItem value="11">Khối 11</SelectItem>
                      <SelectItem value="12">Khối 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lớp</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn lớp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10A1">10A1</SelectItem>
                      <SelectItem value="10A2">10A2</SelectItem>
                      <SelectItem value="10A3">10A3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tìm học sinh</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nhập tên hoặc mã học sinh"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Học sinh</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn học sinh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student1">Nguyễn Văn An (SU0001)</SelectItem>
                    <SelectItem value="student2">Trần Thị Bình (SU002)</SelectItem>
                    <SelectItem value="student3">Lê Văn Cường (SU006)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Hình thức kỷ luật</Label>
                <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn hình thức kỷ luật" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionTypes.filter(type => type.is_active).map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          {getSeverityBadge(type.severity_level)}
                          <span>{type.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nội dung cụ thể vi phạm</Label>
                <Textarea
                  placeholder="Mô tả chi tiết các vi phạm và lý do áp dụng hình thức kỷ luật này..."
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={handleCreateCase} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Tạo case kỷ luật
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab quản lý hình thức kỷ luật */}
        <TabsContent value="manage-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Thêm hình thức kỷ luật mới</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên hình thức</Label>
                  <Input
                    placeholder="VD: Khiển trách trước lớp"
                    value={newActionType.name}
                    onChange={(e) => setNewActionType(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mức độ nghiêm trọng</Label>
                  <Select 
                    value={newActionType.severity_level.toString()} 
                    onValueChange={(value) => setNewActionType(prev => ({ ...prev, severity_level: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Nhẹ</SelectItem>
                      <SelectItem value="2">2 - Trung bình</SelectItem>
                      <SelectItem value="3">3 - Nghiêm trọng</SelectItem>
                      <SelectItem value="4">4 - Rất nghiêm trọng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mô tả</Label>
                <Textarea
                  placeholder="Mô tả chi tiết về hình thức kỷ luật này..."
                  value={newActionType.description}
                  onChange={(e) => setNewActionType(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button onClick={handleCreateActionType}>
                <Plus className="h-4 w-4 mr-2" />
                Thêm hình thức kỷ luật
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách hình thức kỷ luật</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên hình thức</TableHead>
                    <TableHead>Mức độ</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actionTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{getSeverityBadge(type.severity_level)}</TableCell>
                      <TableCell className="max-w-xs truncate">{type.description}</TableCell>
                      <TableCell>
                        <Badge variant={type.is_active ? 'default' : 'secondary'}>
                          {type.is_active ? 'Hoạt động' : 'Tạm dừng'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditActionType(type)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteActionType(type)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab xem tất cả case */}
        <TabsContent value="view-cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tất cả case kỷ luật</CardTitle>
              <CardDescription>
                Theo dõi tiến độ xử lý các case kỷ luật
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Học sinh</TableHead>
                    <TableHead>Lớp</TableHead>
                    <TableHead>Hình thức kỷ luật</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{caseItem.student?.full_name || 'Không xác định'}</div>
                          <div className="text-sm text-muted-foreground">{caseItem.student?.student_id || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{caseItem.class?.name || 'Không xác định'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{caseItem.action_type?.name || 'Không xác định'}</div>
                          {caseItem.action_type?.severity_level ? getSeverityBadge(caseItem.action_type.severity_level) : <Badge variant="outline">N/A</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                      <TableCell>
                        {new Date(caseItem.created_at).toLocaleDateString('vi-VN')}
                      </TableCell>
                      <TableCell className="text-right">
                        {caseItem.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendToHomeroom(caseItem.id)}
                            className="flex items-center gap-2"
                          >
                            <Send className="h-4 w-4" />
                            Gửi GVCN
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Action Type Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa hình thức kỷ luật</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin hình thức kỷ luật
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Tên hình thức</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nhập tên hình thức"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Nhập mô tả"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-severity">Mức độ nghiêm trọng</Label>
              <Select
                value={String(editForm.severity_level)}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, severity_level: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Mức 1 - Nhẹ</SelectItem>
                  <SelectItem value="2">Mức 2 - Trung bình</SelectItem>
                  <SelectItem value="3">Mức 3 - Nặng</SelectItem>
                  <SelectItem value="4">Mức 4 - Rất nặng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleEditSubmit}>
              Cập nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Action Type Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận vô hiệu hóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn vô hiệu hóa hình thức kỷ luật &quot;{deletingActionType?.name}&quot;?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>
              Vô hiệu hóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
