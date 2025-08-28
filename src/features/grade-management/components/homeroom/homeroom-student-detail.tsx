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
      <DialogContent className="w-[95vw] max-w-[1400px] max-h-[95vh] overflow-y-auto">
        <div className="w-full">
          <DialogHeader className="pb-4 sm:pb-6">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
              <AvatarImage src={student.avatar_url} alt={student.full_name} />
              <AvatarFallback className="text-sm sm:text-lg font-bold">
                {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold break-words">{student.full_name}</h2>
              <p className="text-sm sm:text-base text-muted-foreground">Mã học sinh: {student.student_id}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {student.gender && (
                  <Badge variant="outline" className="text-xs sm:text-sm">
                    {student.gender === 'male' ? 'Nam' : 'Nữ'}
                  </Badge>
                )}
                {student.parents.length > 0 ? (
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    <UserCheck className="h-3 w-3 mr-1" />
                    {student.parents.length} Phụ huynh
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs sm:text-sm">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Chưa có phụ huynh
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
                  Thông tin lớp học
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-blue-600">Lớp</p>
                    <p className="text-lg font-bold text-blue-800 break-words">{classInfo.name}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-blue-600">Năm học</p>
                    <p className="text-lg font-bold text-blue-800 break-words">{classInfo.academic_year_name}</p>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-blue-600">Học kỳ</p>
                    <p className="text-lg font-bold text-blue-800 break-words">{classInfo.semester_name}</p>
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
                Thông tin học sinh
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-600">Họ và tên</p>
                  <p className="text-lg font-bold text-gray-800">{student.full_name}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-600">Mã học sinh</p>
                  <p className="text-lg font-bold text-gray-800">{student.student_id}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-500" />
                    <p className="text-base font-semibold text-gray-800 break-all">{student.email}</p>
                  </div>
                </div>
                  {student.phone_number && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Số điện thoại</p>
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
                      <p className="text-sm font-medium text-muted-foreground">Giới tính</p>
                      <Badge variant="outline">
                        {student.gender === 'male' ? 'Nam' : 'Nữ'}
                      </Badge>
                    </div>
                  )}
                  {student.date_of_birth && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ngày sinh</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">{formatDate(student.date_of_birth)}</p>
                      </div>
                    </div>
                  )}
                  {student.address && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Địa chỉ</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="font-semibold">{student.address}</p>
                      </div>
                    </div>
                  )}
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
                Thông tin phụ huynh
                {student.parents.length > 0 ? (
                  <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                    <UserCheck className="h-3 w-3 mr-1" />
                    {student.parents.length} Phụ huynh
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="ml-2">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Chưa có phụ huynh
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {student.parents.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 mx-auto text-red-400 mb-6" />
                  <h3 className="text-xl font-bold mb-3 text-red-800">Chưa có thông tin phụ huynh</h3>
                  <p className="text-red-600 text-base">
                    Học sinh này chưa có thông tin liên hệ phụ huynh nào được đăng ký.
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
                        <h4 className="text-lg font-bold text-green-800">Liên hệ chính</h4>
                        <Badge variant="default" className="bg-green-600 text-white">
                          {primaryParent.relationship_type === 'father' ? 'Cha' :
                           primaryParent.relationship_type === 'mother' ? 'Mẹ' : 'Người giám hộ'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-green-600">Họ và tên</p>
                          <p className="text-lg font-bold text-green-800">{primaryParent.full_name}</p>
                        </div>
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-green-600">Email</p>
                          <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-base font-semibold text-green-800 break-all">{primaryParent.email}</p>
                          </div>
                        </div>
                        {primaryParent.phone_number && (
                          <div className="space-y-3">
                            <p className="text-sm font-medium text-green-600">Số điện thoại</p>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <p className="font-semibold text-green-800 break-all">{primaryParent.phone_number}</p>
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
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                                  <p className="font-semibold">{parent.full_name}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                                  <div className="flex items-start gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <p className="font-semibold break-all">{parent.email}</p>
                                  </div>
                                </div>
                                {parent.phone_number && (
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                      <p className="font-semibold break-all">{parent.phone_number}</p>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
