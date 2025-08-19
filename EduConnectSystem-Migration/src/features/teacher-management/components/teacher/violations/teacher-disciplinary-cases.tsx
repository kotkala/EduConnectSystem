'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Eye, Calendar, MessageSquare, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getDisciplinaryCasesAction, updateDisciplinaryCaseStatusAction } from '@/features/violations/actions/violation-actions'

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

export default function TeacherDisciplinaryCases() {
  const [cases, setCases] = useState<DisciplinaryCase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCase, setSelectedCase] = useState<DisciplinaryCase | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [meetingNotes, setMeetingNotes] = useState('')

  useEffect(() => {
    loadCases()
  }, [])

  const loadCases = async () => {
    setIsLoading(true)
    try {
      // Láº¥y cÃ¡c case Ä‘Æ°á»£c gá»­i Ä‘áº¿n GVCN (status = 'sent_to_homeroom')
      const result = await getDisciplinaryCasesAction({
        status: 'sent_to_homeroom'
        // TODO: Filter by homeroom classes cá»§a teacher hiá»‡n táº¡i
      })

      if (result.success && result.data) {
        setCases(result.data)
      }
    } catch (error) {
      console.error('Lá»—i táº£i case ká»· luáº­t:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAcknowledge = async (caseId: string) => {
    try {
      const result = await updateDisciplinaryCaseStatusAction({
        case_id: caseId,
        status: 'acknowledged'
      })

      if (result.success) {
        toast.success('ÄÃ£ xÃ¡c nháº­n nháº­n case ká»· luáº­t')
        loadCases()
      } else {
        toast.error(result.error || 'Cáº­p nháº­t tráº¡ng thÃ¡i tháº¥t báº¡i')
      }
    } catch (error) {
      console.error('Lá»—i cáº­p nháº­t tráº¡ng thÃ¡i:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi cáº­p nháº­t tráº¡ng thÃ¡i')
    }
  }

  const handleScheduleMeeting = async (caseId: string) => {
    try {
      const result = await updateDisciplinaryCaseStatusAction({
        case_id: caseId,
        status: 'meeting_scheduled'
      })

      if (result.success) {
        toast.success('ÄÃ£ lÃªn lá»‹ch há»p vá»›i phá»¥ huynh')
        loadCases()
        setShowDetailDialog(false)
      } else {
        toast.error(result.error || 'Cáº­p nháº­t tráº¡ng thÃ¡i tháº¥t báº¡i')
      }
    } catch (error) {
      console.error('Lá»—i lÃªn lá»‹ch há»p:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi lÃªn lá»‹ch há»p')
    }
  }

  const handleResolve = async (caseId: string) => {
    try {
      const result = await updateDisciplinaryCaseStatusAction({
        case_id: caseId,
        status: 'resolved'
      })

      if (result.success) {
        toast.success('ÄÃ£ Ä‘Ã¡nh dáº¥u case Ä‘Ã£ giáº£i quyáº¿t')
        loadCases()
        setShowDetailDialog(false)
      } else {
        toast.error(result.error || 'Cáº­p nháº­t tráº¡ng thÃ¡i tháº¥t báº¡i')
      }
    } catch (error) {
      console.error('Lá»—i giáº£i quyáº¿t case:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi giáº£i quyáº¿t case')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent_to_homeroom':
        return <Badge variant="default">Chá» xá»­ lÃ½</Badge>
      case 'acknowledged':
        return <Badge variant="secondary">ÄÃ£ xem</Badge>
      case 'meeting_scheduled':
        return <Badge variant="outline">ÄÃ£ háº¹n há»p</Badge>
      case 'resolved':
        return <Badge variant="default">ÄÃ£ giáº£i quyáº¿t</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Case ká»· luáº­t cáº§n xá»­ lÃ½
          </CardTitle>
          <CardDescription>
            CÃ¡c case ká»· luáº­t Ä‘Æ°á»£c admin gá»­i Ä‘áº¿n Ä‘á»ƒ GVCN xá»­ lÃ½
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Äang táº£i dá»¯ liá»‡u...</div>
          ) : cases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Há»c sinh</TableHead>
                  <TableHead>Lá»›p</TableHead>
                  <TableHead>HÃ¬nh thá»©c ká»· luáº­t</TableHead>
                  <TableHead>Tuáº§n</TableHead>
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
                      <Badge variant="outline">Tuáº§n {caseItem.week_index}</Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(caseItem.status)}</TableCell>
                    <TableCell>{new Date(caseItem.created_at).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog open={showDetailDialog && selectedCase?.id === caseItem.id} onOpenChange={(open) => {
                          setShowDetailDialog(open)
                          if (open) setSelectedCase(caseItem)
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Chi tiáº¿t case ká»· luáº­t</DialogTitle>
                              <DialogDescription>
                                Xem chi tiáº¿t vÃ  xá»­ lÃ½ case ká»· luáº­t cho há»c sinh
                              </DialogDescription>
                            </DialogHeader>
                            {selectedCase && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Há»c sinh</Label>
                                    <div className="mt-1">
                                      <div className="font-medium">{selectedCase.student.full_name}</div>
                                      <div className="text-sm text-muted-foreground">{selectedCase.student.student_id}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Lá»›p</Label>
                                    <div className="mt-1 font-medium">{selectedCase.class.name}</div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">HÃ¬nh thá»©c ká»· luáº­t</Label>
                                    <div className="mt-1 font-medium">{selectedCase.action_type.name}</div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Tuáº§n vi pháº¡m</Label>
                                    <div className="mt-1">
                                      <Badge variant="outline">Tuáº§n {selectedCase.week_index}</Badge>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Ghi chÃº tá»« admin</Label>
                                  <div className="mt-1 p-3 bg-muted rounded-md">
                                    {selectedCase.notes || 'KhÃ´ng cÃ³ ghi chÃº'}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Ghi chÃº há»p phá»¥ huynh</Label>
                                  <Textarea
                                    value={meetingNotes}
                                    onChange={(e) => setMeetingNotes(e.target.value)}
                                    placeholder="Nháº­p ghi chÃº vá» cuá»™c há»p vá»›i phá»¥ huynh..."
                                    rows={3}
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  {selectedCase.status === 'sent_to_homeroom' && (
                                    <Button
                                      variant="outline"
                                      onClick={() => handleAcknowledge(selectedCase.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      XÃ¡c nháº­n Ä‘Ã£ xem
                                    </Button>
                                  )}
                                  {(selectedCase.status === 'acknowledged' || selectedCase.status === 'sent_to_homeroom') && (
                                    <Button
                                      onClick={() => handleScheduleMeeting(selectedCase.id)}
                                    >
                                      <Calendar className="h-4 w-4 mr-2" />
                                      LÃªn lá»‹ch há»p PH
                                    </Button>
                                  )}
                                  {selectedCase.status === 'meeting_scheduled' && (
                                    <Button
                                      variant="default"
                                      onClick={() => handleResolve(selectedCase.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      ÄÃ¡nh dáº¥u Ä‘Ã£ giáº£i quyáº¿t
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        {caseItem.status === 'sent_to_homeroom' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleAcknowledge(caseItem.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              KhÃ´ng cÃ³ case ká»· luáº­t nÃ o cáº§n xá»­ lÃ½
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
