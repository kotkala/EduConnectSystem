"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Separator } from "@/shared/components/ui/separator"
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
  readonly student: HomeroomStudent
  readonly classInfo: HomeroomClass | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={student.avatar_url} alt={student.full_name} />
              <AvatarFallback className="text-lg font-bold">
                {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{student.full_name}</h2>
              <p className="text-base text-muted-foreground">Student ID: {student.student_id}</p>
              <div className="flex items-center gap-2 mt-2">
                {student.gender && (
                  <Badge variant="outline" className="text-sm">
                    {student.gender.charAt(0).toUpperCase() + student.gender.slice(1)}
                  </Badge>
                )}
                {student.parents.length > 0 ? (
                  <Badge variant="secondary" className="text-sm">
                    <UserCheck className="h-3 w-3 mr-1" />
                    {student.parents.length} Parent{student.parents.length !== 1 ? 's' : ''}
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-sm">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    No Parents
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* Class Information */}
          {classInfo && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  Class Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-600">Class</p>
                    <p className="text-lg font-bold text-blue-800">{classInfo.name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-600">Academic Year</p>
                    <p className="text-lg font-bold text-blue-800">{classInfo.academic_year_name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-blue-600">Semester</p>
                    <p className="text-lg font-bold text-blue-800">{classInfo.semester_name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student Information */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-gray-700">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <User className="h-6 w-6" />
                </div>
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Full Name</p>
                    <p className="text-lg font-bold text-gray-800">{student.full_name}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Student ID</p>
                    <p className="text-lg font-bold text-gray-800">{student.student_id}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">Email</p>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <p className="text-base font-semibold text-gray-800">{student.email}</p>
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
          <Card className={student.parents.length > 0 ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
            <CardHeader>
              <CardTitle className={`flex items-center gap-3 ${student.parents.length > 0 ? "text-green-700" : "text-red-700"}`}>
                <div className={`p-2 rounded-lg ${student.parents.length > 0 ? "bg-green-100" : "bg-red-100"}`}>
                  <Users className="h-6 w-6" />
                </div>
                Parent Information
                {student.parents.length > 0 ? (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
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
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 mx-auto text-red-400 mb-6" />
                  <h3 className="text-xl font-bold mb-3 text-red-800">No Parent Information</h3>
                  <p className="text-red-600 text-base">
                    This student does not have any parent contacts registered.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Primary Parent */}
                  {primaryParent && (
                    <div className="border border-green-200 rounded-xl p-6 bg-white">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <UserCheck className="h-5 w-5 text-green-600" />
                        </div>
                        <h4 className="text-lg font-bold text-green-800">Primary Contact</h4>
                        <Badge variant="default" className="bg-green-600 text-white">
                          {primaryParent.relationship_type.charAt(0).toUpperCase() + primaryParent.relationship_type.slice(1)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-green-600">Full Name</p>
                          <p className="text-lg font-bold text-green-800">{primaryParent.full_name}</p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-green-600">Email</p>
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-green-500" />
                            <p className="text-base font-semibold text-green-800">{primaryParent.email}</p>
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
