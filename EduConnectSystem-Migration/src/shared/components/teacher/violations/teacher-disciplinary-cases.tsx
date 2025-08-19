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
import { getDisciplinaryCasesAction, updateDisciplinaryCaseStatusAction } from '@/lib/actions/violation-actions'

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
      // Lấy các case được gửi đến GVCN (status = 'sent_to_homeroom')
      const result = await getDisciplinaryCasesAction({
        status: 'sent_to_homeroom'
        // TODO: Filter by homeroom classes của teacher hiện tại
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
        toast.success('Đã xác nhận nhận case kỷ luật')
        loadCases()
      } else {
        toast.error(result.error || 'Cập nhật trạng thái thất bại')
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
        toast.success('Đã lên lịch họp với phụ huynh')
        loadCases()
        setShowDetailDialog(false)
      } else {
        toast.error(result.error || 'Cập nhật trạng thái thất bại')
      }
    } catch (error) {
      console.error('Lỗi lên lịch họp:', error)
      toast.error('Có lỗi xảy ra khi lên lịch họp')
    }
  }

  const handleResolve = async (caseId: string) => {
    try {
      const result = await updateDisciplinaryCaseStatusAction({
        case_id: caseId,
        status: 'resolved'
      })

      if (result.success) {
        toast.success('Đã đánh dấu case đã giải quyết')
        loadCases()
        setShowDetailDialog(false)
      } else {
        toast.error(result.error || 'Cập nhật trạng thái thất bại')
      }
    } catch (error) {
      console.error('Lỗi giải quyết case:', error)
      toast.error('Có lỗi xảy ra khi giải quyết case')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent_to_homeroom':
        return <Badge variant="default">Chờ xử lý</Badge>
      case 'acknowledged':
        return <Badge variant="secondary">Đã xem</Badge>
      case 'meeting_scheduled':
        return <Badge variant="outline">Đã hẹn họp</Badge>
      case 'resolved':
        return <Badge variant="default">Đã giải quyết</Badge>
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
            Case kỷ luật cần xử lý
          </CardTitle>
          <CardDescription>
            Các case kỷ luật được admin gửi đến để GVCN xử lý
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Đang tải dữ liệu...</div>
          ) : cases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Học sinh</TableHead>
                  <TableHead>Lớp</TableHead>
                  <TableHead>Hình thức kỷ luật</TableHead>
                  <TableHead>Tuần</TableHead>
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
                                Xem chi tiết và xử lý case kỷ luật cho học sinh
                              </DialogDescription>
                            </DialogHeader>
                            {selectedCase && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm font-medium">Học sinh</Label>
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
                                  <Label className="text-sm font-medium">Ghi chú từ admin</Label>
                                  <div className="mt-1 p-3 bg-muted rounded-md">
                                    {selectedCase.notes || 'Không có ghi chú'}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Ghi chú họp phụ huynh</Label>
                                  <Textarea
                                    value={meetingNotes}
                                    onChange={(e) => setMeetingNotes(e.target.value)}
                                    placeholder="Nhập ghi chú về cuộc họp với phụ huynh..."
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
                                      Xác nhận đã xem
                                    </Button>
                                  )}
                                  {(selectedCase.status === 'acknowledged' || selectedCase.status === 'sent_to_homeroom') && (
                                    <Button
                                      onClick={() => handleScheduleMeeting(selectedCase.id)}
                                    >
                                      <Calendar className="h-4 w-4 mr-2" />
                                      Lên lịch họp PH
                                    </Button>
                                  )}
                                  {selectedCase.status === 'meeting_scheduled' && (
                                    <Button
                                      variant="default"
                                      onClick={() => handleResolve(selectedCase.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Đánh dấu đã giải quyết
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
              Không có case kỷ luật nào cần xử lý
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
