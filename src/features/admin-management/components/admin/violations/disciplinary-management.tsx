'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { Plus, Send, Eye, Settings, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createDisciplinaryCaseAction, getDisciplinaryActionTypesAction, createDisciplinaryActionTypeAction, getDisciplinaryCasesAction, getStudentsByClassAction, getClassBlocksAction, getClassesByBlockAction } from '@/features/violations/actions/violation-actions'
import { getSemestersAction } from '@/features/admin-management/actions/academic-actions'

interface ClassBlock {
  id: string
  name: string
}

interface Class {
  id: string
  name: string
  academic_year: { name: string }
  semester: { name: string }
}

interface Student {
  id: string
  full_name: string
  student_id: string
}

interface DisciplinaryActionType {
  id: string
  name: string
  description: string
  is_active: boolean
}

interface DisciplinaryCase {
  id: string
  student_id: string
  class_id: string
  semester_id: string
  week_index: number
  total_points: number
  action_type_id: string
  notes: string
  status: 'draft' | 'sent_to_homeroom' | 'acknowledged' | 'meeting_scheduled' | 'resolved'
  created_at: string
  student: { full_name: string; student_id: string }
  class: { name: string }
  action_type: { name: string }
}

export default function DisciplinaryManagement() {
  const [blocks, setBlocks] = useState<ClassBlock[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [actionTypes, setActionTypes] = useState<DisciplinaryActionType[]>([])
  const [cases, setCases] = useState<DisciplinaryCase[]>([])
  
  const [selectedBlock, setSelectedBlock] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedActionType, setSelectedActionType] = useState('')
  const [notes, setNotes] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  
  const [isLoading, setIsLoading] = useState(false)
  const [showActionTypeDialog, setShowActionTypeDialog] = useState(false)
  const [newActionType, setNewActionType] = useState({ name: '', description: '' })
  const [currentSemester, setCurrentSemester] = useState<{ id: string; name: string } | null>(null)

  // Load initial data
  useEffect(() => {
    loadCurrentSemester()
    loadBlocks()
    loadActionTypes()
    loadCases()
  }, [])

  const loadCurrentSemester = async () => {
    try {
      const result = await getSemestersAction()
      if (result.success && result.data) {
        const current = result.data.find(s => s.is_current)
        if (current) {
          setCurrentSemester({ id: current.id, name: current.name })
        }
      }
    } catch (error) {
      console.error('Lá»—i táº£i há»c kÃ¬ hiá»‡n táº¡i:', error)
    }
  }

  // Helper functions to reduce cognitive complexity
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'secondary'
      case 'sent_to_homeroom': return 'default'
      case 'resolved': return 'default'
      default: return 'outline'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'NhÃ¡p'
      case 'sent_to_homeroom': return 'ÄÃ£ gá»­i GVCN'
      case 'acknowledged': return 'GVCN Ä‘Ã£ xem'
      case 'meeting_scheduled': return 'ÄÃ£ lÃªn lá»‹ch há»p'
      case 'resolved': return 'ÄÃ£ giáº£i quyáº¿t'
      default: return 'KhÃ´ng xÃ¡c Ä‘á»‹nh'
    }
  }

  const loadBlocks = async () => {
    try {
      const result = await getClassBlocksAction()
      if (result.success && result.data) {
        setBlocks(result.data)
      }
    } catch (error) {
      console.error('Lá»—i táº£i khá»‘i lá»›p:', error)
    }
  }

  const loadActionTypes = async () => {
    try {
      const result = await getDisciplinaryActionTypesAction()
      if (result.success && result.data) {
        setActionTypes(result.data)
      }
    } catch (error) {
      console.error('Lá»—i táº£i hÃ¬nh thá»©c ká»· luáº­t:', error)
    }
  }

  const loadCases = async () => {
    try {
      const result = await getDisciplinaryCasesAction()
      if (result.success && result.data) {
        setCases(result.data)
      }
    } catch (error) {
      console.error('Lá»—i táº£i case ká»· luáº­t:', error)
    }
  }

  const handleBlockChange = async (blockId: string) => {
    setSelectedBlock(blockId)
    setSelectedClass('')
    setSelectedStudent('')
    setClasses([])
    setStudents([])
    
    if (blockId) {
      try {
        const result = await getClassesByBlockAction(blockId)
        if (result.success && result.data) {
          setClasses(result.data)
        }
      } catch (error) {
        console.error('Lá»—i táº£i lá»›p:', error)
      }
    }
  }

  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId)
    setSelectedStudent('')
    setStudents([])
    
    if (classId) {
      try {
        const result = await getStudentsByClassAction(classId)
        if (result.success && result.data) {
          setStudents(result.data)
        }
      } catch (error) {
        console.error('Lá»—i táº£i há»c sinh:', error)
      }
    }
  }

  const filteredStudents = students.filter(student => 
    student.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    student.student_id.toLowerCase().includes(studentSearch.toLowerCase())
  )

  const handleCreateCase = async () => {
    if (!selectedStudent || !selectedActionType || !selectedClass || !currentSemester) {
      toast.error('Vui lÃ²ng chá»n Ä‘áº§y Ä‘á»§ thÃ´ng tin')
      return
    }

    setIsLoading(true)
    try {
      // Láº¥y vi pháº¡m tuáº§n hiá»‡n táº¡i cá»§a há»c sinh Ä‘á»ƒ Ä‘Ã­nh kÃ¨m
      const currentWeek = Math.ceil((Date.now() - new Date('2024-01-01').getTime()) / (7 * 24 * 60 * 60 * 1000))

      const result = await createDisciplinaryCaseAction({
        student_id: selectedStudent,
        class_id: selectedClass,
        semester_id: currentSemester.id,
        week_index: currentWeek,
        action_type_id: selectedActionType,
        notes,
        violation_ids: [] // Will be populated by the action based on student/week
      })

      if (result.success) {
        toast.success('Táº¡o case ká»· luáº­t thÃ nh cÃ´ng')
        setSelectedStudent('')
        setSelectedActionType('')
        setNotes('')
        loadCases()
      } else {
        toast.error(result.error || 'Táº¡o case ká»· luáº­t tháº¥t báº¡i')
      }
    } catch (error: unknown) {
      console.error('Lá»—i táº¡o case ká»· luáº­t:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi táº¡o case ká»· luáº­t')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateActionType = async () => {
    if (!newActionType.name.trim()) {
      toast.error('Vui lÃ²ng nháº­p tÃªn hÃ¬nh thá»©c ká»· luáº­t')
      return
    }

    try {
      const result = await createDisciplinaryActionTypeAction({
        name: newActionType.name,
        description: newActionType.description
      })

      if (result.success) {
        toast.success('Táº¡o hÃ¬nh thá»©c ká»· luáº­t thÃ nh cÃ´ng')
        setNewActionType({ name: '', description: '' })
        setShowActionTypeDialog(false)
        loadActionTypes()
      } else {
        toast.error(result.error || 'Táº¡o hÃ¬nh thá»©c ká»· luáº­t tháº¥t báº¡i')
      }
    } catch (error: unknown) {
      console.error('Lá»—i táº¡o hÃ¬nh thá»©c ká»· luáº­t:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi táº¡o hÃ¬nh thá»©c ká»· luáº­t')
    }
  }

  return (
    <div className="space-y-6">
      {/* Form táº¡o case ká»· luáº­t */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Táº¡o case ká»· luáº­t má»›i
          </CardTitle>
          <CardDescription>
            Chá»n há»c sinh vÃ  hÃ¬nh thá»©c ká»· luáº­t Ä‘á»ƒ táº¡o case xá»­ lÃ½
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="block">Khá»‘i lá»›p</Label>
              <Select value={selectedBlock} onValueChange={handleBlockChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Chá»n khá»‘i" />
                </SelectTrigger>
                <SelectContent>
                  {blocks.map((block) => (
                    <SelectItem key={block.id} value={block.id}>
                      {block.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Lá»›p</Label>
              <Select value={selectedClass} onValueChange={handleClassChange} disabled={!selectedBlock}>
                <SelectTrigger>
                  <SelectValue placeholder="Chá»n lá»›p" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="student-search">TÃ¬m há»c sinh</Label>
              <Input
                id="student-search"
                placeholder="Nháº­p tÃªn hoáº·c mÃ£ há»c sinh"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                disabled={!selectedClass}
              />
            </div>
          </div>

          {selectedClass && (
            <div className="space-y-2">
              <Label>Chá»n há»c sinh</Label>
              <div className="max-h-32 overflow-y-auto border rounded-md p-2">
                {filteredStudents.length > 0 ? (
                  <div className="space-y-1">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        type="button"
                        className={`w-full p-2 rounded text-left hover:bg-muted ${
                          selectedStudent === student.id ? 'bg-primary text-primary-foreground' : ''
                        }`}
                        onClick={() => setSelectedStudent(student.id)}
                      >
                        <div className="font-medium">{student.full_name}</div>
                        <div className="text-sm text-muted-foreground">{student.student_id}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-4">
                    KhÃ´ng tÃ¬m tháº¥y há»c sinh
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="action-type">HÃ¬nh thá»©c ká»· luáº­t</Label>
                <Dialog open={showActionTypeDialog} onOpenChange={setShowActionTypeDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Quáº£n lÃ½
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>ThÃªm hÃ¬nh thá»©c ká»· luáº­t</DialogTitle>
                      <DialogDescription>
                        Táº¡o hÃ¬nh thá»©c ká»· luáº­t má»›i cho há»‡ thá»‘ng
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-action-name">TÃªn hÃ¬nh thá»©c</Label>
                        <Input
                          id="new-action-name"
                          value={newActionType.name}
                          onChange={(e) => setNewActionType(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="VD: Khiá»ƒn trÃ¡ch trÆ°á»›c lá»›p"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-action-desc">MÃ´ táº£</Label>
                        <Textarea
                          id="new-action-desc"
                          value={newActionType.description}
                          onChange={(e) => setNewActionType(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="MÃ´ táº£ chi tiáº¿t hÃ¬nh thá»©c ká»· luáº­t"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowActionTypeDialog(false)}>
                          Há»§y
                        </Button>
                        <Button onClick={handleCreateActionType}>
                          Táº¡o
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Select value={selectedActionType} onValueChange={setSelectedActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Chá»n hÃ¬nh thá»©c ká»· luáº­t" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.filter(type => type.is_active).map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chÃº</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ná»™i dung cá»¥ thá»ƒ cá»§a vi pháº¡m vÃ  biá»‡n phÃ¡p xá»­ lÃ½"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCreateCase} disabled={isLoading || !selectedStudent || !selectedActionType}>
              <Plus className="h-4 w-4 mr-2" />
              {isLoading ? 'Äang táº¡o...' : 'ThÃªm vÃ o danh sÃ¡ch xá»­ lÃ½'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danh sÃ¡ch case ká»· luáº­t */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sÃ¡ch case ká»· luáº­t</CardTitle>
          <CardDescription>
            Quáº£n lÃ½ cÃ¡c case ká»· luáº­t Ä‘Ã£ táº¡o
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length > 0 ? (
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
                        <div className="font-medium">{caseItem.student.full_name}</div>
                        <div className="text-sm text-muted-foreground">{caseItem.student.student_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>{caseItem.class.name}</TableCell>
                    <TableCell>{caseItem.action_type.name}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(caseItem.status)}>
                        {getStatusLabel(caseItem.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(caseItem.created_at).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {caseItem.status === 'draft' && (
                          <Button variant="default" size="sm">
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              ChÆ°a cÃ³ case ká»· luáº­t nÃ o Ä‘Æ°á»£c táº¡o
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
