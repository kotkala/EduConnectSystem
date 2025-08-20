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
      // Lấy các case Ä‘Æ°á»£c gá»­i Ä‘áº¿n GVCN (status = 'sent_to_homeroom')
      const result = await getDisciplinaryCasesAction({
        status: 'sent_to_homeroom'
        // TODO: Filter by homeroom classes của teacher hiá»‡n táº¡i
      })

      if (result.success && result.data) {
        setCases(result.data)
      }
    } catch (error) {
      console.error('Lỗi tải case kỷ luật:', error)
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
        toast.success('ÄÃ£ xác nhận nhận case kỷ luật')
        loadCases()
      } else {
        toast.error(result.error || 'Cập nhật trạng thái tháº¥t báº¡i')
      }
    } catch (error) {
      console.error('Lỗi cập nhật trạng thái:', error)
      toast.error('Có lỗi xảy ra khi cập nhật trạng thái')
    }
  }

  const handleScheduleMeeting = async (caseId: string) => {
    try {
      const result = await updateDisciplinaryCaseStatusAction({
        case_id: caseId,
        status: 'meeting_scheduled'
      })

      if (result.success) {
        toast.success('ÄÃ£ lÃªn lịch hồp về›i phụ huynh')
        loadCases()
        setShowDetailDialog(false)
      } else {
        toast.error(result.error || 'Cập nhật trạng thái tháº¥t báº¡i')
      }
    } catch (error) {
      console.error('Lỗi lÃªn lịch hồp:', error)
      toast.error('Có lỗi xảy ra khi lÃªn lịch hồp')
    }
  }

  const handleResolve = async (caseId: string) => {
    try {
      const result = await updateDisciplinaryCaseStatusAction({
        case_id: caseId,
        status: 'resolved'
      })

      if (result.success) {
        toast.success('ÄÃ£ Ä‘Ã¡nh dấu case Ä‘Ã£ giáº£i quyết')
        loadCases()
        setShowDetailDialog(false)
      } else {
        toast.error(result.error || 'Cập nhật trạng thái tháº¥t báº¡i')
      }
    } catch (error) {
      console.error('Lỗi giáº£i quyết case:', error)
      toast.error('Có lỗi xảy ra khi giáº£i quyết case')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent_to_homeroom':
        return <Badge variant="default">Chồ xá»­ lý</Badge>
      case 'acknowledged':
        return <Badge variant="secondary">ÄÃ£ xem</Badge>
      case 'meeting_scheduled':
        return <Badge variant="outline">ÄÃ£ háº¹n hồp</Badge>
      case 'resolved':
        return <Badge variant="default">ÄÃ£ giáº£i quyết</Badge>
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
            Case kỷ luật cáº§n xá»­ lý
          </CardTitle>
          <CardDescription>
            Các case kỷ luật Ä‘Æ°á»£c admin gá»­i Ä‘áº¿n Ä‘á»ƒ GVCN xá»­ lý
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Äang tải dữ liệu...</div>
          ) : cases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hồc sinh</TableHead>
                  <TableHead>Lớp</TableHead>
                  <TableHead>Hình thức kỷ luật</TableHead>
                  <TableHead>Tuần</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>NgÃ y tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
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
                      <Badge variant="outline">Tuần {caseItem.week_index}</Badge>
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
                              <DialogTitle>Chi tiết case kỷ luật</DialogTitle>
                              <DialogDescription>
                                Xem chi tiết vÃ  xá»­ lý case kỷ luật cho hồc sinh
                              </DialogDescription>
                            </DialogHeader>
                            {selectedCase && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Hồc sinh</Label>
                                    <div className="mt-1">
                                      <div className="font-medium">{selectedCase.student.full_name}</div>
                                      <div className="text-sm text-muted-foreground">{selectedCase.student.student_id}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Lớp</Label>
                                    <div className="mt-1 font-medium">{selectedCase.class.name}</div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Hình thức kỷ luật</Label>
                                    <div className="mt-1 font-medium">{selectedCase.action_type.name}</div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Tuần vi phạm</Label>
                                    <div className="mt-1">
                                      <Badge variant="outline">Tuần {selectedCase.week_index}</Badge>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Ghi chÃº từ admin</Label>
                                  <div className="mt-1 p-3 bg-muted rounded-md">
                                    {selectedCase.notes || 'Không có ghi chÃº'}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Ghi chÃº hồp phụ huynh</Label>
                                  <Textarea
                                    value={meetingNotes}
                                    onChange={(e) => setMeetingNotes(e.target.value)}
                                    placeholder="Nhập ghi chÃº về cuá»™c hồp về›i phụ huynh..."
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
                                      Xác nhận Ä‘Ã£ xem
                                    </Button>
                                  )}
                                  {(selectedCase.status === 'acknowledged' || selectedCase.status === 'sent_to_homeroom') && (
                                    <Button
                                      onClick={() => handleScheduleMeeting(selectedCase.id)}
                                    >
                                      <Calendar className="h-4 w-4 mr-2" />
                                      LÃªn lịch hồp PH
                                    </Button>
                                  )}
                                  {selectedCase.status === 'meeting_scheduled' && (
                                    <Button
                                      variant="default"
                                      onClick={() => handleResolve(selectedCase.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      ÄÃ¡nh dấu Ä‘Ã£ giáº£i quyết
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
              Không có case kỷ luật nÃ o cáº§n xá»­ lý
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
