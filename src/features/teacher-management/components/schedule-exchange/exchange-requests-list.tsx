"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { Trash2, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"

import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Separator } from "@/shared/components/ui/separator"
import { Alert, AlertDescription } from "@/shared/components/ui/alert"

import {
  type ScheduleExchangeRequestDetailed
} from "@/features/teacher-management/actions/schedule-exchange-actions"

interface ExchangeRequestsListProps {
  readonly teacherId: string
  readonly refreshTrigger?: number
}

const statusConfig = {
  pending: {
    label: "Äang chá»",
    variant: "secondary" as const,
    icon: Clock,
    description: "Äang chá» phÃª duyá»‡t tá»« admin"
  },
  approved: {
    label: "ÄÃ£ cháº¥p thuáº­n",
    variant: "default" as const,
    icon: CheckCircle,
    description: "YÃªu cáº§u Ä‘Ã£ Ä‘Æ°á»£c cháº¥p thuáº­n"
  },
  rejected: {
    label: "ÄÃ£ tá»« chá»‘i",
    variant: "destructive" as const,
    icon: XCircle,
    description: "YÃªu cáº§u Ä‘Ã£ bá»‹ tá»« chá»‘i"
  }
}

const dayNames = ['Chá»§ Nháº­t', 'Thá»© Hai', 'Thá»© Ba', 'Thá»© TÆ°', 'Thá»© NÄƒm', 'Thá»© SÃ¡u', 'Thá»© Báº£y']

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
      toast.error("KhÃ´ng thá»ƒ táº£i danh sÃ¡ch yÃªu cáº§u Ä‘á»•i lá»‹ch")
    } finally {
      setLoading(false)
    }
  }, [teacherId])

  useEffect(() => {
    loadRequests()
  }, [loadRequests, refreshTrigger])

  // Memoize formatted requests to prevent unnecessary re-renders
  const formattedRequests = useMemo(() => {
    return requests.map((request) => ({
      ...request,
      formattedCreatedAt: format(new Date(request.created_at), 'PPp'),
      formattedExchangeDate: format(new Date(request.exchange_date), 'PPP'),
      formattedApprovedAt: request.approved_at ? format(new Date(request.approved_at), 'PPp') : null
    }))
  }, [requests])

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
        toast.success("ÄÃ£ xoÃ¡ yÃªu cáº§u thÃ nh cÃ´ng")
        setRequests(prev => prev.filter(req => req.id !== requestToDelete))
        setDeleteDialogOpen(false)
        setRequestToDelete(null)
      } else {
        toast.error(result.error)
      }
    } catch {
      toast.error("KhÃ´ng thá»ƒ xoÃ¡ yÃªu cáº§u")
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
            Äang táº£i yÃªu cáº§u Ä‘á»•i lá»‹ch...
          </CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>YÃªu cáº§u Ä‘á»•i lá»‹ch</CardTitle>
          <CardDescription>CÃ¡c yÃªu cáº§u Ä‘á»•i lá»‹ch cá»§a báº¡n sáº½ hiá»ƒn thá»‹ táº¡i Ä‘Ã¢y</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Báº¡n chÆ°a gá»­i yÃªu cáº§u Ä‘á»•i lá»‹ch nÃ o.
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
              <CardTitle>YÃªu cáº§u Ä‘á»•i lá»‹ch</CardTitle>
              <CardDescription>
                CÃ¡c yÃªu cáº§u Ä‘á»•i lá»‹ch cá»§a báº¡n vÃ  tráº¡ng thÃ¡i xá»­ lÃ½
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadRequests}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              LÃ m má»›i
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formattedRequests.map((request) => {
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
                          {isRequester ? "Gá»­i tá»›i" : "Nháº­n tá»«"} {otherTeacher.name}
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
                      <strong>MÃ´n:</strong> {request.subject_code} - {request.subject_name}
                    </div>
                    <div>
                      <strong>Lá»›p:</strong> {request.class_name}
                    </div>
                    <div>
                      <strong>Thá»i gian:</strong> {dayNames[request.day_of_week]} {request.start_time}-{request.end_time}
                    </div>
                    <div>
                      <strong>PhÃ²ng há»c:</strong> {request.classroom_name}
                    </div>
                    <div>
                      <strong>Tuáº§n:</strong> {request.week_number}
                    </div>
                    <div>
                      <strong>NgÃ y Ä‘á»•i lá»‹ch:</strong> {request.formattedExchangeDate}
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
                        <strong className="text-sm">Pháº£n há»“i tá»« admin:</strong>
                        <p className="text-sm text-muted-foreground mt-1">{request.admin_response}</p>
                      </div>
                    </>
                  )}

                  {/* Timestamps */}
                  <div className="flex justify-between text-xs text-muted-foreground pt-2">
                    <span>
                      ÄÃ£ gá»­i: {request.formattedCreatedAt}
                    </span>
                    {request.formattedApprovedAt && (
                      <span>
                        {request.status === 'approved' ? 'ÄÃ£ cháº¥p thuáº­n' : 'ÄÃ£ tá»« chá»‘i'}: {request.formattedApprovedAt}
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
            <DialogTitle>XoÃ¡ yÃªu cáº§u Ä‘á»•i lá»‹ch</DialogTitle>
            <DialogDescription>
              Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n xoÃ¡ yÃªu cáº§u Ä‘á»•i lá»‹ch nÃ y? HÃ nh Ä‘á»™ng nÃ y khÃ´ng thá»ƒ hoÃ n tÃ¡c.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Há»§y
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRequest}
              disabled={deleting}
            >
              {deleting ? "Äang xoÃ¡..." : "XoÃ¡"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
