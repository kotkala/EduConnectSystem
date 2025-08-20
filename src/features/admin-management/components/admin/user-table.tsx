"use client"

import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table"
import { Badge } from "@/shared/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/shared/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Phone,
  Mail,
  User,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { type TeacherProfile, type StudentWithParent, type UserFilters } from "@/lib/validations/user-validations"

interface UserTableProps {
  readonly users: (TeacherProfile | StudentWithParent)[]
  readonly userType: "teacher" | "student"
  readonly total: number
  readonly currentPage: number
  readonly limit: number
  readonly onPageChange: (page: number) => void
  readonly onFiltersChange: (filters: Partial<UserFilters>) => void
  readonly onEdit: (user: TeacherProfile | StudentWithParent) => void
}

export function UserTable({
  users,
  userType,
  total,
  currentPage,
  limit,
  onPageChange,
  onFiltersChange,
  onEdit
}: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState<string>("")


  const totalPages = Math.ceil(total / limit)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onFiltersChange({ search: value, page: 1 })
  }

  const handleGenderFilter = (value: string) => {
    setGenderFilter(value)
    onFiltersChange({
      gender: value === "all" ? undefined : (value as "male" | "female"),
      page: 1
    })
  }



  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Không có"
    return new Date(dateString).toLocaleDateString()
  }

  const getGenderBadge = (gender: string | null) => {
    if (!gender) return <Badge variant="secondary">Không có</Badge>

    const variants = {
      male: "default",
      female: "secondary"
    } as const

    let label = "Không rõ"
    if (gender === "male") label = "Nam"
    else if (gender === "female") label = "Nữ"

    return (
      <Badge variant={variants[gender as keyof typeof variants] || "secondary"}>
        {label}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {userType === "teacher" ? <User className="h-5 w-5" /> : <Users className="h-5 w-5" />}
              {userType === "teacher" ? "Giáo viên" : "Học sinh & Phụ huynh"}
            </CardTitle>
            <CardDescription>
              {userType === "teacher" ? "Quản lý tài khoản giáo viên" : "Quản lý tài khoản học sinh và phụ huynh"}
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            Tổng: {total} {userType === "teacher" ? "giáo viên" : "học sinh"}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Tìm kiếm ${userType === "teacher" ? "giáo viên" : "học sinh"} theo tên, email hoặc mã`}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={genderFilter} onValueChange={handleGenderFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Giới tính" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="male">Nam</SelectItem>
                <SelectItem value="female">Nữ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã</TableHead>
                <TableHead>Họ và tên</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Giới tính</TableHead>
                <TableHead>Ngày sinh</TableHead>
                {userType === "student" && <TableHead>Phụ huynh</TableHead>}
                {userType === "teacher" && <TableHead>GVCN</TableHead>}
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userType === "teacher" ? 8 : 9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      {userType === "teacher" ? <User className="h-8 w-8 text-muted-foreground" /> : <Users className="h-8 w-8 text-muted-foreground" />}
                      <p className="text-muted-foreground">Không có dữ liệu {userType === "teacher" ? "giáo viên" : "học sinh"}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {userType === "teacher" 
                        ? (user as TeacherProfile).employee_id 
                        : (user as StudentWithParent).student_id
                      }
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                        {user.phone_number && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {user.phone_number}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getGenderBadge(user.gender)}</TableCell>
                    <TableCell>{formatDate(user.date_of_birth)}</TableCell>
                    {userType === "student" && (
                      <TableCell>
                        {(user as StudentWithParent).parent_relationship ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {(user as StudentWithParent).parent_relationship!.parent.full_name}
                            </div>
                            <div className="text-muted-foreground capitalize">
                              {(user as StudentWithParent).parent_relationship!.relationship_type}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="destructive">Chưa có phụ huynh</Badge>
                        )}
                      </TableCell>
                    )}
                    {userType === "teacher" && (
                      <TableCell>
                        <Badge variant={(user as TeacherProfile).homeroom_enabled ? "default" : "secondary"}>
                          {(user as TeacherProfile).homeroom_enabled ? "Enabled" : "Disabled"}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Chỉnh sửa
                          </DropdownMenuItem>

                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page)}
                      className="w-8 h-8 p-0"
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
