"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react"

import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form"
import { Textarea } from "@/shared/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  type ScheduleExchangeRequestDetailed
} from "@/features/teacher-management/actions/schedule-exchange-actions"
import { ExchangeRequestCard, type ExchangeRequest } from "@/shared/components/shared/request-card"

const responseSchema = z.object({
  admin_response: z.string().max(500, "Phản hồ“i pháº£i Ã­t hÆ¡n 500 kÃ½ tá»±").optional()
})

type ResponseFormData = z.infer<typeof responseSchema>

// Convert ScheduleExchangeRequestDetailed to ExchangeRequest format
const convertToExchangeRequest = (request: ScheduleExchangeRequestDetailed): ExchangeRequest => ({
  id: request.id,
  status: request.status,
  created_at: request.created_at,
  requester_name: request.requester_name,
  target_name: request.target_name,
  admin_response: request.admin_response,
  approved_at: request.approved_at,
  approved_by_name: request.approved_by_name,
  subject_code: request.subject_code,
  subject_name: request.subject_name,
  class_name: request.class_name,
  day_of_week: request.day_of_week,
  start_time: request.start_time,
  end_time: request.end_time,
  classroom_name: request.classroom_name,
  week_number: request.week_number,
  exchange_date: request.exchange_date,
  requester_email: request.requester_email,
  target_email: request.target_email,
  reason: request.reason
})



export function ExchangeRequestsManagement() {
  const [requests, setRequests] = useState<ScheduleExchangeRequestDetailed[]>([])
  const [loading, setLoading] = useState(true)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ScheduleExchangeRequestDetailed | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [processing, setProcessing] = useState(false)

  // Helper function to render request cards
  const renderRequestCards = (requestList: ScheduleExchangeRequestDetailed[]) => {
    return requestList.map(request => (
      <ExchangeRequestCard
        key={request.id}
        request={convertToExchangeRequest(request)}
        onApprove={() => openActionDialog(request, 'approve')}
        onReject={() => openActionDialog(request, 'reject')}
      />
    ))
  }
  const [activeTab, setActiveTab] = useState('pending')

  const form = useForm<ResponseFormData>({
    resolver: zodResolver(responseSchema),
    defaultValues: {
      admin_response: ""
    }
  })

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/exchange-requests')
      const result = await response.json()

      if (result.success) {
        console.log('Exchange requests data:', result.data)
        setRequests(result.data as ScheduleExchangeRequestDetailed[])
      } else {
        console.error('Error loading requests:', result.error)
        toast.error(result.error)
      }
    } catch (error) {
      console.error('Exception loading requests:', error)
      toast.error("Không thể tải danh sách yêu cầu Ä‘á»•i lịch")
    } finally {
      setLoading(false)
    }
  }

  const openActionDialog = (request: ScheduleExchangeRequestDetailed, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setActionType(action)
    setActionDialogOpen(true)
    form.reset()
  }

  const handleAction = async (data: ResponseFormData) => {
    if (!selectedRequest) return

    setProcessing(true)
    try {
      const formData = {
        request_id: selectedRequest.id,
        status: actionType === 'approve' ? 'approved' : 'rejected',
        admin_response: data.admin_response
      }

      const response = await fetch('/api/exchange-requests/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        toast.success(result.message)
        setRequests(prev => prev.map(req =>
          req.id === selectedRequest.id
            ? { ...req, status: actionType === 'approve' ? 'approved' : 'rejected', admin_response: data.admin_response || null }
            : req
        ))
        setActionDialogOpen(false)
        setSelectedRequest(null)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error(`Failed to ${actionType} request`)
    } finally {
      setProcessing(false)
    }
  }

  const filterRequestsByStatus = (status: string) => {
    return requests.filter(req => req.status === status)
  }



  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Äang tải danh sách yêu cầu Ä‘á»•i lịch...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  const pendingRequests = filterRequestsByStatus('pending')
  const approvedRequests = filterRequestsByStatus('approved')
  const rejectedRequests = filterRequestsByStatus('rejected')

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Yêu cầu Ä‘á»•i lịch</CardTitle>
              <CardDescription>
                Quản lý yêu cầu Ä‘á»•i lịch giảng dạy của giáo viên
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRequests}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              LÃ m mới
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Äang chồ ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                ÄÃ£ chấp thuận ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Bá»‹ từ chồ‘i ({rejectedRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 mt-4">
              {pendingRequests.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Hiá»‡n chưa có yêu cầu Ä‘á»•i lịch Ä‘ang chồ xá»­ lý.
                  </AlertDescription>
                </Alert>
              ) : (
                renderRequestCards(pendingRequests)
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4 mt-4">
              {approvedRequests.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Chưa có yêu cầu Ä‘á»•i lịch nÃ o Ä‘Æ°á»£c chấp thuận.
                  </AlertDescription>
                </Alert>
              ) : (
                renderRequestCards(approvedRequests)
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4 mt-4">
              {rejectedRequests.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    Chưa có yêu cầu Ä‘á»•i lịch nÃ o bị từ chồ‘i.
                  </AlertDescription>
                </Alert>
              ) : (
                renderRequestCards(rejectedRequests)
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Chấp thuận' : 'Từ chồ‘i'} yêu cầu Ä‘á»•i lịch
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? 'Thao tác nÃ y sẽ chấp thuận Ä‘á»•i lịch vÃ  cập nhật thồi khóa biểu.'
                : 'Thao tác nÃ y sẽ từ chồ‘i yêu cầu Ä‘á»•i lịch.'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="text-sm">
                <strong>Yêu cầu:</strong> {selectedRequest.requester_name} â†’ {selectedRequest.target_name}
                <br />
                <strong>Môn hồc:</strong> {selectedRequest.subject_code} - {selectedRequest.class_name}
                <br />
                <strong>NgÃ y:</strong> {format(new Date(selectedRequest.exchange_date), 'PPP')}
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAction)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="admin_response"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Ná»™i dung pháº£n hồ“i {(() => {
                            return actionType === 'reject' ? '(Báº¯t buá»™c)' : '(Không bắt buá»™c)'
                          })()}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              actionType === 'approve'
                                ? "Tin nhắn tuá»³ chồn gá»­i tá»›i giáo viên..."
                                : "Vui lòng giáº£i thÃ­ch lý do từ chồ‘i yêu cầu nÃ y..."
                            }
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActionDialogOpen(false)}
                      disabled={processing}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      variant={actionType === 'approve' ? 'default' : 'destructive'}
                      disabled={processing}
                    >
                      {(() => {
                        if (processing) return 'Äang xá»­ lý...'
                        return actionType === 'approve' ? 'Chấp thuận' : 'Từ chồ‘i'
                      })()}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
