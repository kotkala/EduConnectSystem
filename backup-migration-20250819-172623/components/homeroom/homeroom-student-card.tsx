"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  User,
  Mail,
  Phone,
  Eye,
  UserCheck,
  AlertTriangle
} from "lucide-react"
import { type HomeroomStudent } from "@/lib/validations/homeroom-validations"

interface HomeroomStudentCardProps {
  readonly student: HomeroomStudent
  readonly onClick: () => void
}

export function HomeroomStudentCard({ student, onClick }: HomeroomStudentCardProps) {
  const primaryParent = student.parents.find(p => p.is_primary_contact)
  const hasParents = student.parents.length > 0

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={student.avatar_url} alt={student.full_name} />
            <AvatarFallback>
              {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{student.full_name}</h3>
            <p className="text-sm text-muted-foreground">ID: {student.student_id}</p>
            <div className="flex items-center gap-2 mt-1">
              {hasParents ? (
                <Badge variant="secondary" className="text-xs">
                  <UserCheck className="h-3 w-3 mr-1" />
                  {student.parents.length} Parent{student.parents.length !== 1 ? 's' : ''}
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  No Parents
                </Badge>
              )}
              {student.gender && (
                <Badge variant="outline" className="text-xs">
                  {student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {/* Student Contact */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="truncate">{student.email}</span>
          </div>
          {student.phone_number && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{student.phone_number}</span>
            </div>
          )}
        </div>

        {/* Primary Parent Contact */}
        {primaryParent && (
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Primary Contact ({primaryParent.relationship_type})
            </p>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{primaryParent.full_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{primaryParent.email}</span>
              </div>
              {primaryParent.phone_number && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{primaryParent.phone_number}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Button variant="outline" size="sm" className="w-full">
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
