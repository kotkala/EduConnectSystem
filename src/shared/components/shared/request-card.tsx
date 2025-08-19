"use client"

import { format } from "date-fns"
import { CheckCircle, XCircle } from "lucide-react"

import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card"
import { Separator } from "@/shared/components/ui/separator"

import { getStatusConfig, dayNames } from "./status-config"

// Generic request interface that can be extended
export interface BaseRequest {
  id: string
  status: string
  created_at: string
  requester_name: string
  target_name?: string
  admin_response?: string | null
  approved_at?: string | null
  approved_by_name?: string | null
}

// Exchange request specific interface
export interface ExchangeRequest extends BaseRequest {
  subject_code: string
  subject_name: string
  class_name: string
  day_of_week: number
  start_time: string
  end_time: string
  classroom_name: string
  week_number: number
  exchange_date: string
  requester_email: string
  target_email: string
  reason: string
}

interface RequestCardProps<T extends BaseRequest> {
  request: T
  onApprove?: (request: T) => void
  onReject?: (request: T) => void
  renderDetails: (request: T) => React.ReactNode
  showActions?: boolean
}

export function RequestCard<T extends BaseRequest>({
  request,
  onApprove,
  onReject,
  renderDetails,
  showActions = true
}: RequestCardProps<T>) {
  const config = getStatusConfig(request.status)
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
                {request.requester_name}
                {request.target_name && ` â†’ ${request.target_name}`}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Gá»­i lÃºc {format(new Date(request.created_at), 'PPp')}
            </p>
          </div>
          {showActions && request.status === 'pending' && onApprove && onReject && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onApprove(request)}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Cháº¥p thuáº­n
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(request)}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Tá»« chá»‘i
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Custom details rendered by parent component */}
        {renderDetails(request)}

        {/* Admin Response */}
        {request.admin_response && (
          <>
            <Separator />
            <div>
              <strong className="text-sm">Pháº£n há»“i tá»« quáº£n trá»‹:</strong>
              <p className="text-sm text-muted-foreground mt-1">{request.admin_response}</p>
            </div>
          </>
        )}

        {/* Status Info */}
        {request.approved_at && (
          <div className="text-xs text-muted-foreground pt-2">
            {request.status === 'approved' ? 'ÄÃ£ cháº¥p thuáº­n' : 'ÄÃ£ tá»« chá»‘i'} lÃºc {format(new Date(request.approved_at), 'PPp')}
            {request.approved_by_name && ` bá»Ÿi ${request.approved_by_name}`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Specific component for exchange requests
export function ExchangeRequestCard({
  request,
  onApprove,
  onReject
}: {
  request: ExchangeRequest
  onApprove?: (request: ExchangeRequest) => void
  onReject?: (request: ExchangeRequest) => void
}) {
  const renderExchangeDetails = (req: ExchangeRequest) => (
    <>
      {/* Teaching Slot Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <strong>MÃ´n:</strong> {req.subject_code} - {req.subject_name}
        </div>
        <div>
          <strong>Lá»›p:</strong> {req.class_name}
        </div>
        <div>
          <strong>Thá»i gian:</strong> {dayNames[req.day_of_week]} {req.start_time}-{req.end_time}
        </div>
        <div>
          <strong>PhÃ²ng há»c:</strong> {req.classroom_name}
        </div>
        <div>
          <strong>Tuáº§n:</strong> {req.week_number}
        </div>
        <div>
          <strong>NgÃ y Ä‘á»•i lá»‹ch:</strong> {format(new Date(req.exchange_date), 'PPP')}
        </div>
      </div>

      <Separator />

      {/* Teacher Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <strong>GiÃ¡o viÃªn yÃªu cáº§u:</strong>
          <p className="text-muted-foreground">{req.requester_name} ({req.requester_email})</p>
        </div>
        <div>
          <strong>GiÃ¡o viÃªn thay tháº¿:</strong>
          <p className="text-muted-foreground">{req.target_name} ({req.target_email})</p>
        </div>
      </div>

      <Separator />

      {/* Reason */}
      <div>
        <strong className="text-sm">LÃ½ do:</strong>
        <p className="text-sm text-muted-foreground mt-1">{req.reason}</p>
      </div>
    </>
  )

  return (
    <RequestCard
      request={request}
      onApprove={onApprove}
      onReject={onReject}
      renderDetails={renderExchangeDetails}
    />
  )
}
