"use client"

import { Card, CardContent } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
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
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Left Section - Student Info */}
          <div className="flex items-center gap-4 flex-1">
            <Avatar className="h-12 w-12">
              <AvatarImage src={student.avatar_url} alt={student.full_name} />
              <AvatarFallback>
                {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="font-semibold text-lg truncate">{student.full_name}</h3>
                <span className="text-sm text-muted-foreground">ID: {student.student_id}</span>
              </div>

              <div className="flex items-center gap-2 mb-2">
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

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{student.email}</span>
                </div>
                {student.phone_number && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span>{student.phone_number}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Section - Primary Parent Info */}
          {primaryParent && (
            <div className="flex-1 px-4 border-l">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Primary Contact ({primaryParent.relationship_type})
              </p>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{primaryParent.full_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate">{primaryParent.email}</span>
                </div>
                {primaryParent.phone_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    <span>{primaryParent.phone_number}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right Section - Action Button */}
          <div className="flex-shrink-0 ml-4">
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
