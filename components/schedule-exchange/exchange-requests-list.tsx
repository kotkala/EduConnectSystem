"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Trash2, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

import {
  type ScheduleExchangeRequestDetailed
} from "@/lib/actions/schedule-exchange-actions"

interface ExchangeRequestsListProps {
  readonly teacherId: string
  readonly refreshTrigger?: number
}

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    icon: Clock,
    description: "Waiting for admin approval"
  },
  approved: {
    label: "Approved",
    variant: "default" as const,
    icon: CheckCircle,
    description: "Request has been approved"
  },
  rejected: {
    label: "Rejected",
    variant: "destructive" as const,
    icon: XCircle,
    description: "Request has been rejected"
  }
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function ExchangeRequestsList({ teacherId, refreshTrigger }: ExchangeRequestsListProps) {
  const [requests, setRequests] = useState<ScheduleExchangeRequestDetailed[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/exchange-requests?teacher_id=${teacherId}`)
      const result = await response.json()

      if (result.success) {
        setRequests(result.data as ScheduleExchangeRequestDetailed[])
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Failed to load exchange requests")
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    loadRequests()
  }, [loadRequests, refreshTrigger])



  const handleDeleteRequest = async () => {
    if (!requestToDelete) return

    setDeleting(true)
    try {
      const response = await fetch('/api/exchange-requests/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: requestToDelete })
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Request deleted successfully")
        setRequests(prev => prev.filter(req => req.id !== requestToDelete))
        setDeleteDialogOpen(false)
        setRequestToDelete(null)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("Failed to delete request")
    } finally {
      setDeleting(false)
    }
  }

  const openDeleteDialog = (requestId: string) => {
    setRequestToDelete(requestId)
    setDeleteDialogOpen(true)
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

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exchange Requests</CardTitle>
          <CardDescription>Your schedule exchange requests will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              You haven&apos;t submitted any schedule exchange requests yet.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Exchange Requests</CardTitle>
              <CardDescription>
                Your schedule exchange requests and their status
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
        <CardContent className="space-y-4">
          {requests.map((request) => {
            const config = statusConfig[request.status]
            const StatusIcon = config.icon
            const isRequester = request.requester_teacher_id === teacherId
            const otherTeacher = isRequester 
              ? { name: request.target_name, email: request.target_email }
              : { name: request.requester_name, email: request.requester_email }

            return (
              <Card key={request.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={config.variant} className="flex items-center gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {isRequester ? "Sent to" : "Received from"} {otherTeacher.name}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.description}
                      </p>
                    </div>
                    {request.status === 'pending' && isRequester && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(request.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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

                  {/* Timestamps */}
                  <div className="flex justify-between text-xs text-muted-foreground pt-2">
                    <span>
                      Submitted: {format(new Date(request.created_at), 'PPp')}
                    </span>
                    {request.approved_at && (
                      <span>
                        {request.status === 'approved' ? 'Approved' : 'Rejected'}: {format(new Date(request.approved_at), 'PPp')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Exchange Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this exchange request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRequest}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
