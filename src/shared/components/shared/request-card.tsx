"use client"

import { format } from "date-fns"
import { CheckCircle, XCircle } from "lucide-react"

import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card"
import { Separator } from "@/shared/components/ui/separator"

import { getStatusConfig } from "./status-config"

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

// Exchange request interface removed

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
              Gửi lúc {format(new Date(request.created_at), 'PPp')}
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
                Chấp thuận
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(request)}
                className="text-red-600 hover:text-red-700"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Từ chối
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
              <strong className="text-sm">Phản hồi từ quản trị:</strong>
              <p className="text-sm text-muted-foreground mt-1">{request.admin_response}</p>
            </div>
          </>
        )}

        {/* Status Info */}
        {request.approved_at && (
          <div className="text-xs text-muted-foreground pt-2">
            {request.status === 'approved' ? 'Đã chấp thuận' : 'Đã từ chối'} lúc {format(new Date(request.approved_at), 'PPp')}
            {request.approved_by_name && ` bởi ${request.approved_by_name}`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Exchange request card component removed
