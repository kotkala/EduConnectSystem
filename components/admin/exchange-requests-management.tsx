"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { CheckCircle, XCircle, Clock, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  type ScheduleExchangeRequestDetailed
} from "@/lib/actions/schedule-exchange-actions"

const responseSchema = z.object({
  admin_response: z.string().max(500, "Response must be less than 500 characters").optional()
})

type ResponseFormData = z.infer<typeof responseSchema>

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-yellow-600"
  },
  approved: {
    label: "Approved",
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-green-600"
  },
  rejected: {
    label: "Rejected",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600"
  }
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function ExchangeRequestsManagement() {
  const [requests, setRequests] = useState<ScheduleExchangeRequestDetailed[]>([])
  const [loading, setLoading] = useState(true)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<ScheduleExchangeRequestDetailed | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [processing, setProcessing] = useState(false)
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
      toast.error("Failed to load exchange requests")
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

  const RequestCard = ({ request }: { request: ScheduleExchangeRequestDetailed }) => {
    const config = statusConfig[request.status]
    const StatusIcon = config.icon

    return (
      <Card key={request.id}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={config.variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
                <span className="text-sm font-medium">
                  {request.requester_name} → {request.target_name}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Submitted {format(new Date(request.created_at), 'PPp')}
              </p>
            </div>
            {request.status === 'pending' && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openActionDialog(request, 'approve')}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openActionDialog(request, 'reject')}
                  className="text-red-600 hover:text-red-700"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Teaching Slot Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Subject:</strong> {request.subject_code} - {request.subject_name}
            </div>
            <div>
              <strong>Class:</strong> {request.class_name}
            </div>
            <div>
              <strong>Time:</strong> {dayNames[request.day_of_week]} {request.start_time}-{request.end_time}
            </div>
            <div>
              <strong>Classroom:</strong> {request.classroom_name}
            </div>
            <div>
              <strong>Week:</strong> {request.week_number}
            </div>
            <div>
              <strong>Exchange Date:</strong> {format(new Date(request.exchange_date), 'PPP')}
            </div>
          </div>

          <Separator />

          {/* Teacher Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Requesting Teacher:</strong>
              <p className="text-muted-foreground">{request.requester_name} ({request.requester_email})</p>
            </div>
            <div>
              <strong>Substitute Teacher:</strong>
              <p className="text-muted-foreground">{request.target_name} ({request.target_email})</p>
            </div>
          </div>

          <Separator />

          {/* Reason */}
          <div>
            <strong className="text-sm">Reason:</strong>
            <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
          </div>

          {/* Admin Response */}
          {request.admin_response && (
            <>
              <Separator />
              <div>
                <strong className="text-sm">Admin Response:</strong>
                <p className="text-sm text-muted-foreground mt-1">{request.admin_response}</p>
              </div>
            </>
          )}

          {/* Status Info */}
          {request.approved_at && (
            <div className="text-xs text-muted-foreground pt-2">
              {request.status === 'approved' ? 'Approved' : 'Rejected'} on {format(new Date(request.approved_at), 'PPp')}
              {request.approved_by_name && ` by ${request.approved_by_name}`}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading Exchange Requests...
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
              <CardTitle>Schedule Exchange Requests</CardTitle>
              <CardDescription>
                Manage teacher schedule exchange requests
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRequests}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Approved ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rejected ({rejectedRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4 mt-4">
              {pendingRequests.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No pending exchange requests at the moment.
                  </AlertDescription>
                </Alert>
              ) : (
                pendingRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </TabsContent>

            <TabsContent value="approved" className="space-y-4 mt-4">
              {approvedRequests.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No approved exchange requests yet.
                  </AlertDescription>
                </Alert>
              ) : (
                approvedRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))
              )}
            </TabsContent>

            <TabsContent value="rejected" className="space-y-4 mt-4">
              {rejectedRequests.length === 0 ? (
                <Alert>
                  <AlertDescription>
                    No rejected exchange requests yet.
                  </AlertDescription>
                </Alert>
              ) : (
                rejectedRequests.map(request => (
                  <RequestCard key={request.id} request={request} />
                ))
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
              {actionType === 'approve' ? 'Approve' : 'Reject'} Exchange Request
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? 'This will approve the schedule exchange and update the timetable.'
                : 'This will reject the schedule exchange request.'
              }
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="text-sm">
                <strong>Request:</strong> {selectedRequest.requester_name} → {selectedRequest.target_name}
                <br />
                <strong>Subject:</strong> {selectedRequest.subject_code} - {selectedRequest.class_name}
                <br />
                <strong>Date:</strong> {format(new Date(selectedRequest.exchange_date), 'PPP')}
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleAction)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="admin_response"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Response Message {actionType === 'reject' ? '(Required)' : '(Optional)'}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={
                              actionType === 'approve' 
                                ? "Optional message to the teachers..."
                                : "Please explain why this request is being rejected..."
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
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant={actionType === 'approve' ? 'default' : 'destructive'}
                      disabled={processing}
                    >
                      {processing ? 'Processing...' : (actionType === 'approve' ? 'Approve' : 'Reject')}
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
