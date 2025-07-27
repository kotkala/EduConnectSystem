"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Users,
  UserCheck,
  AlertTriangle,
  GraduationCap
} from "lucide-react"
import { type HomeroomStudent, type HomeroomClass } from "@/lib/validations/homeroom-validations"

interface HomeroomStudentDetailProps {
  student: HomeroomStudent
  classInfo: HomeroomClass | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HomeroomStudentDetail({ 
  student, 
  classInfo, 
  open, 
  onOpenChange 
}: HomeroomStudentDetailProps) {
  const primaryParent = student.parents.find(p => p.is_primary_contact)
  const otherParents = student.parents.filter(p => !p.is_primary_contact)

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={student.avatar_url} alt={student.full_name} />
              <AvatarFallback>
                {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{student.full_name}</h2>
              <p className="text-sm text-muted-foreground">Student ID: {student.student_id}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Class Information */}
          {classInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Class Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Class</p>
                    <p className="font-semibold">{classInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Academic Year</p>
                    <p className="font-semibold">{classInfo.academic_year_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Semester</p>
                    <p className="font-semibold">{classInfo.semester_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                    <p className="font-semibold">{student.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                    <p className="font-semibold">{student.student_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <p className="font-semibold">{student.email}</p>
                    </div>
                  </div>
                  {student.phone_number && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">{student.phone_number}</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {student.gender && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Gender</p>
                      <Badge variant="outline">
                        {student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}
                      </Badge>
                    </div>
                  )}
                  {student.date_of_birth && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">{formatDate(student.date_of_birth)}</p>
                      </div>
                    </div>
                  )}
                  {student.address && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Address</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="font-semibold">{student.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Parent Information
                {student.parents.length > 0 ? (
                  <Badge variant="secondary" className="ml-2">
                    <UserCheck className="h-3 w-3 mr-1" />
                    {student.parents.length} Parent{student.parents.length !== 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="ml-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    No Parents
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.parents.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Parent Information</h3>
                  <p className="text-muted-foreground">
                    This student does not have any parent contacts registered.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Primary Parent */}
                  {primaryParent && (
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <h4 className="font-semibold">Primary Contact</h4>
                        <Badge variant="default">
                          {primaryParent.relationship_type}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                          <p className="font-semibold">{primaryParent.full_name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Email</p>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <p className="font-semibold">{primaryParent.email}</p>
                          </div>
                        </div>
                        {primaryParent.phone_number && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <p className="font-semibold">{primaryParent.phone_number}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Other Parents */}
                  {otherParents.length > 0 && (
                    <>
                      {primaryParent && <Separator />}
                      <div>
                        <h4 className="font-semibold mb-4">
                          Other Parent{otherParents.length !== 1 ? 's' : ''}
                        </h4>
                        <div className="space-y-4">
                          {otherParents.map((parent) => (
                            <div key={parent.id} className="p-4 border rounded-lg">
                              <div className="flex items-center gap-2 mb-3">
                                <Badge variant="outline">
                                  {parent.relationship_type}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                                  <p className="font-semibold">{parent.full_name}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <p className="font-semibold">{parent.email}</p>
                                  </div>
                                </div>
                                {parent.phone_number && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground" />
                                      <p className="font-semibold">{parent.phone_number}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
