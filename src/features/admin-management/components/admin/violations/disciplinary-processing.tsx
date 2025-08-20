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
import { updateDisciplinaryActionTypeAction, deactivateDisciplinaryActionTypeAction } from '@/features/violations/actions/violation-actions'

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
      const { getDisciplinaryActionTypesAction } = await import('@/features/violations/actions/violation-actions')
      const result = await getDisciplinaryActionTypesAction()
      if (result.success && result.data) {
        setActionTypes(result.data as unknown as DisciplinaryActionType[])
        return
      }
      // Fallback: if no data, keep empty
      setActionTypes([])
    } catch (error) {
      console.error('Lá»—i táº£i hÃ¬nh thá»©c ká»· luáº­t:', error)
      setActionTypes([])
    }
  }

  const loadCases = async () => {
    try {
      const { getDisciplinaryCasesAction } = await import('@/features/violations/actions/violation-actions')
      const result = await getDisciplinaryCasesAction()
      if (result.success && result.data) {
        setCases(result.data as unknown as DisciplinaryCase[])
      } else {
        setCases([])
      }
    } catch (error) {
      console.error('Lá»—i táº£i case ká»· luáº­t:', error)
      setCases([])
    }
  }

  // Duplicate handlers removed below. Use single definitions above.

  const handleSendToHomeroom = async (caseId: string) => {
    // Avoid duplicate implementation â€“ delegate to a single internal function
    return sendCaseToHomeroom(caseId)
  }

  const sendCaseToHomeroom = async (caseId: string) => {
    try {
      const { updateDisciplinaryCaseStatusAction } = await import('@/features/violations/actions/violation-actions')
      const res = await updateDisciplinaryCaseStatusAction({ case_id: caseId, status: 'sent_to_homeroom' })
      if (res.success) {
        setCases(prev => prev.map(c => c.id === caseId ? { ...c, status: 'sent_to_homeroom' as const } : c))
        toast.success('ÄÃ£ gá»­i case cho GVCN')
      } else {
        toast.error(res.error || 'CÃ³ lá»—i xáº£y ra khi gá»­i case')
      }
    } catch (error) {
      console.error('Lá»—i gá»­i case:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi gá»­i case')
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
        toast.success('ÄÃ£ cáº­p nháº­t hÃ¬nh thá»©c ká»· luáº­t')
        setActionTypes(prev => prev.map(t =>
          t.id === editingActionType.id
            ? { ...t, name: editForm.name, description: editForm.description, severity_level: editForm.severity_level }
            : t
        ))
        setEditModalOpen(false)
        setEditingActionType(null)
      } else {
        toast.error(res.error || 'Cáº­p nháº­t tháº¥t báº¡i')
      }
    } catch (error) {
      console.error('Lá»—i cáº­p nháº­t:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi cáº­p nháº­t')
    }
  }

  const handleDeleteSubmit = async () => {
    if (!deletingActionType) return

    try {
      const res = await deactivateDisciplinaryActionTypeAction({ id: deletingActionType.id })
      if (res.success) {
        toast.success('ÄÃ£ vÃ´ hiá»‡u hÃ³a hÃ¬nh thá»©c ká»· luáº­t')
        setActionTypes(prev => prev.map(t =>
          t.id === deletingActionType.id ? { ...t, is_active: false } : t
        ))
        setDeleteModalOpen(false)
        setDeletingActionType(null)
      } else {
        toast.error(res.error || 'Thao tÃ¡c tháº¥t báº¡i')
      }
    } catch (error) {
      console.error('Lá»—i xÃ³a:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi xÃ³a')
    }
  }


  // Legacy mock loader block removed; using real API above


  const handleCreateActionType = async () => {
    if (!newActionType.name.trim()) {
      toast.error('Vui lÃ²ng nháº­p tÃªn hÃ¬nh thá»©c ká»· luáº­t')
      return
    }

    try {
      const { createDisciplinaryActionTypeAction } = await import('@/features/violations/actions/violation-actions')
      const res = await createDisciplinaryActionTypeAction({
        name: newActionType.name,
        description: newActionType.description
      })
      if (res.success && res.data) {
        setActionTypes(prev => [...prev, res.data as unknown as DisciplinaryActionType])
        setNewActionType({ name: '', description: '', severity_level: 1 })
        toast.success('ÄÃ£ táº¡o hÃ¬nh thá»©c ká»· luáº­t má»›i')
      } else {
        toast.error(res.error || 'CÃ³ lá»—i xáº£y ra khi táº¡o hÃ¬nh thá»©c ká»· luáº­t')
      }
    } catch (error) {
      console.error('Lá»—i táº¡o hÃ¬nh thá»©c ká»· luáº­t:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi táº¡o hÃ¬nh thá»©c ká»· luáº­t')
    }
  }

  const handleCreateCase = async () => {
    if (!selectedStudent || !selectedActionType || !caseDescription.trim()) {
      toast.error('Vui lÃ²ng Ä‘iá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin')
      return
    }

    try {
      const [{ createDisciplinaryCaseAction }, { getSemestersAction }] = await Promise.all([
        import('@/features/violations/actions/violation-actions'),
        import('@/features/admin-management/actions/academic-actions')
      ])

      const semestersRes = await getSemestersAction()
      const current = semestersRes.success && semestersRes.data
        ? semestersRes.data.find((s: { is_current: boolean }) => s.is_current)
        : null
      if (!current) {
        toast.error('KhÃ´ng tÃ¬m tháº¥y há»c kÃ¬ hiá»‡n táº¡i')
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
        toast.success('ÄÃ£ táº¡o case ká»· luáº­t má»›i')
        setCaseDescription('')
        setSelectedStudent('')
        setSelectedActionType('')
        loadCases()
      } else {
        toast.error(res.error || 'CÃ³ lá»—i xáº£y ra khi táº¡o case ká»· luáº­t')
      }
    } catch (error) {
      console.error('Lá»—i táº¡o case ká»· luáº­t:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi táº¡o case ká»· luáº­t')
    }
  }

  // Duplicate implementation removed. Use the single handler above.


  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { variant: 'outline' as const, label: 'NhÃ¡p' },
      sent_to_homeroom: { variant: 'secondary' as const, label: 'ÄÃ£ gá»­i GVCN' },
      acknowledged: { variant: 'default' as const, label: 'GVCN Ä‘Ã£ xÃ¡c nháº­n' },
      meeting_scheduled: { variant: 'default' as const, label: 'ÄÃ£ lÃªn lá»‹ch há»p' },
      resolved: { variant: 'default' as const, label: 'ÄÃ£ giáº£i quyáº¿t' }
    }
    const config = statusMap[status as keyof typeof statusMap] || statusMap.draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getSeverityBadge = (level: number) => {
    if (level >= 4) return <Badge variant="destructive">Ráº¥t nghiÃªm trá»ng</Badge>
    if (level >= 3) return <Badge variant="secondary">NghiÃªm trá»ng</Badge>
    if (level >= 2) return <Badge variant="outline">Trung bÃ¬nh</Badge>
    return <Badge variant="default">Nháº¹</Badge>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Xá»­ lÃ½ ká»· luáº­t vi pháº¡m
          </CardTitle>
          <CardDescription>
            Quáº£n lÃ½ hÃ¬nh thá»©c ká»· luáº­t vÃ  táº¡o case xá»­ lÃ½ cho há»c sinh vi pháº¡m
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="add-case">Táº¡o case ká»· luáº­t</TabsTrigger>
          <TabsTrigger value="manage-types">Quáº£n lÃ½ hÃ¬nh thá»©c</TabsTrigger>
          <TabsTrigger value="view-cases">Xem táº¥t cáº£ case</TabsTrigger>
        </TabsList>

        {/* Tab táº¡o case ká»· luáº­t */}
        <TabsContent value="add-case" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Táº¡o case ká»· luáº­t má»›i</CardTitle>
              <CardDescription>
                Chá»n há»c sinh vÃ  hÃ¬nh thá»©c ká»· luáº­t phÃ¹ há»£p
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Khá»‘i lá»›p</Label>
                  <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chá»n khá»‘i" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">Khá»‘i 10</SelectItem>
                      <SelectItem value="11">Khá»‘i 11</SelectItem>
                      <SelectItem value="12">Khá»‘i 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Lá»›p</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chá»n lá»›p" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10A1">10A1</SelectItem>
                      <SelectItem value="10A2">10A2</SelectItem>
                      <SelectItem value="10A3">10A3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>TÃ¬m há»c sinh</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nháº­p tÃªn hoáº·c mÃ£ há»c sinh"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Há»c sinh</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chá»n há»c sinh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student1">Nguyá»…n VÄƒn An (SU0001)</SelectItem>
                    <SelectItem value="student2">Tráº§n Thá»‹ BÃ¬nh (SU002)</SelectItem>
                    <SelectItem value="student3">LÃª VÄƒn CÆ°á»ng (SU006)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>HÃ¬nh thá»©c ká»· luáº­t</Label>
                <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chá»n hÃ¬nh thá»©c ká»· luáº­t" />
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
                <Label>Ná»™i dung cá»¥ thá»ƒ vi pháº¡m</Label>
                <Textarea
                  placeholder="MÃ´ táº£ chi tiáº¿t cÃ¡c vi pháº¡m vÃ  lÃ½ do Ã¡p dá»¥ng hÃ¬nh thá»©c ká»· luáº­t nÃ y..."
                  value={caseDescription}
                  onChange={(e) => setCaseDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <Button onClick={handleCreateCase} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Táº¡o case ká»· luáº­t
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab quáº£n lÃ½ hÃ¬nh thá»©c ká»· luáº­t */}
        <TabsContent value="manage-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ThÃªm hÃ¬nh thá»©c ká»· luáº­t má»›i</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>TÃªn hÃ¬nh thá»©c</Label>
                  <Input
                    placeholder="VD: Khiá»ƒn trÃ¡ch trÆ°á»›c lá»›p"
                    value={newActionType.name}
                    onChange={(e) => setNewActionType(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Má»©c Ä‘á»™ nghiÃªm trá»ng</Label>
                  <Select 
                    value={newActionType.severity_level.toString()} 
                    onValueChange={(value) => setNewActionType(prev => ({ ...prev, severity_level: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Nháº¹</SelectItem>
                      <SelectItem value="2">2 - Trung bÃ¬nh</SelectItem>
                      <SelectItem value="3">3 - NghiÃªm trá»ng</SelectItem>
                      <SelectItem value="4">4 - Ráº¥t nghiÃªm trá»ng</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>MÃ´ táº£</Label>
                <Textarea
                  placeholder="MÃ´ táº£ chi tiáº¿t vá» hÃ¬nh thá»©c ká»· luáº­t nÃ y..."
                  value={newActionType.description}
                  onChange={(e) => setNewActionType(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <Button onClick={handleCreateActionType}>
                <Plus className="h-4 w-4 mr-2" />
                ThÃªm hÃ¬nh thá»©c ká»· luáº­t
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danh sÃ¡ch hÃ¬nh thá»©c ká»· luáº­t</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>TÃªn hÃ¬nh thá»©c</TableHead>
                    <TableHead>Má»©c Ä‘á»™</TableHead>
                    <TableHead>MÃ´ táº£</TableHead>
                    <TableHead>Tráº¡ng thÃ¡i</TableHead>
                    <TableHead className="text-right">Thao tÃ¡c</TableHead>
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
                          {type.is_active ? 'Hoáº¡t Ä‘á»™ng' : 'Táº¡m dá»«ng'}
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

        {/* Tab xem táº¥t cáº£ case */}
        <TabsContent value="view-cases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Táº¥t cáº£ case ká»· luáº­t</CardTitle>
              <CardDescription>
                Theo dÃµi tiáº¿n Ä‘á»™ xá»­ lÃ½ cÃ¡c case ká»· luáº­t
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Há»c sinh</TableHead>
                    <TableHead>Lá»›p</TableHead>
                    <TableHead>HÃ¬nh thá»©c ká»· luáº­t</TableHead>
                    <TableHead>Tráº¡ng thÃ¡i</TableHead>
                    <TableHead>NgÃ y táº¡o</TableHead>
                    <TableHead className="text-right">Thao tÃ¡c</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => (
                    <TableRow key={caseItem.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{caseItem.student?.full_name || 'KhÃ´ng xÃ¡c Ä‘á»‹nh'}</div>
                          <div className="text-sm text-muted-foreground">{caseItem.student?.student_id || 'N/A'}</div>
                        </div>
                      </TableCell>
                      <TableCell>{caseItem.class?.name || 'KhÃ´ng xÃ¡c Ä‘á»‹nh'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{caseItem.action_type?.name || 'KhÃ´ng xÃ¡c Ä‘á»‹nh'}</div>
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
                            Gá»­i GVCN
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
            <DialogTitle>Chá»‰nh sá»­a hÃ¬nh thá»©c ká»· luáº­t</DialogTitle>
            <DialogDescription>
              Cáº­p nháº­t thÃ´ng tin hÃ¬nh thá»©c ká»· luáº­t
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">TÃªn hÃ¬nh thá»©c</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nháº­p tÃªn hÃ¬nh thá»©c"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">MÃ´ táº£</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Nháº­p mÃ´ táº£"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-severity">Má»©c Ä‘á»™ nghiÃªm trá»ng</Label>
              <Select
                value={String(editForm.severity_level)}
                onValueChange={(value) => setEditForm(prev => ({ ...prev, severity_level: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Má»©c 1 - Nháº¹</SelectItem>
                  <SelectItem value="2">Má»©c 2 - Trung bÃ¬nh</SelectItem>
                  <SelectItem value="3">Má»©c 3 - Náº·ng</SelectItem>
                  <SelectItem value="4">Má»©c 4 - Ráº¥t náº·ng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Há»§y
            </Button>
            <Button onClick={handleEditSubmit}>
              Cáº­p nháº­t
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Action Type Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>XÃ¡c nháº­n vÃ´ hiá»‡u hÃ³a</DialogTitle>
            <DialogDescription>
              Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n vÃ´ hiá»‡u hÃ³a hÃ¬nh thá»©c ká»· luáº­t &quot;{deletingActionType?.name}&quot;?
              HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Há»§y
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubmit}>
              VÃ´ hiá»‡u hÃ³a
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
