"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Phone,
  Mail,
  User,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { type TeacherProfile, type StudentWithParent, type UserFilters } from "@/lib/validations/user-validations"
import { deleteTeacherAction, deleteStudentAction } from "@/lib/actions/user-actions"

interface UserTableProps {
  readonly users: (TeacherProfile | StudentWithParent)[]
  readonly userType: "teacher" | "student"
  readonly total: number
  readonly currentPage: number
  readonly limit: number
  readonly onPageChange: (page: number) => void
  readonly onFiltersChange: (filters: Partial<UserFilters>) => void
  readonly onEdit: (user: TeacherProfile | StudentWithParent) => void
  readonly onRefresh: () => void
}

export function UserTable({
  users,
  userType,
  total,
  currentPage,
  limit,
  onPageChange,
  onFiltersChange,
  onEdit,
  onRefresh
}: UserTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [genderFilter, setGenderFilter] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const totalPages = Math.ceil(total / limit)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onFiltersChange({ search: value, page: 1 })
  }

  const handleGenderFilter = (value: string) => {
    setGenderFilter(value)
    onFiltersChange({ 
      gender: value === "all" ? undefined : value as "male" | "female" | "other",
      page: 1 
    })
  }

  const handleDelete = async (userId: string) => {
    if (!confirm(`Are you sure you want to delete this ${userType}? This action cannot be undone.`)) {
      return
    }

    setIsDeleting(userId)
    setDeleteError(null)

    try {
      let result
      if (userType === "teacher") {
        result = await deleteTeacherAction(userId)
      } else {
        result = await deleteStudentAction(userId)
      }

      if (result.success) {
        onRefresh()
      } else {
        setDeleteError(result.error || "Failed to delete user")
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete user")
    } finally {
      setIsDeleting(null)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  const getGenderBadge = (gender: string | null) => {
    if (!gender) return <Badge variant="secondary">N/A</Badge>
    
    const variants = {
      male: "default",
      female: "secondary", 
      other: "outline"
    } as const

    return (
      <Badge variant={variants[gender as keyof typeof variants] || "secondary"}>
        {gender.charAt(0).toUpperCase() + gender.slice(1)}
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
              {userType === "teacher" ? "Teachers" : "Students & Parents"}
            </CardTitle>
            <CardDescription>
              Manage {userType === "teacher" ? "teacher" : "student and parent"} accounts
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            Total: {total} {userType}s
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Tìm kiếm ${userType} theo tên, email, hoặc Mã...`}
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
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error Alert */}
        {deleteError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Date of Birth</TableHead>
                {userType === "student" && <TableHead>Parent</TableHead>}
                {userType === "teacher" && <TableHead>Homeroom</TableHead>}
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={userType === "teacher" ? 8 : 9} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      {userType === "teacher" ? <User className="h-8 w-8 text-muted-foreground" /> : <Users className="h-8 w-8 text-muted-foreground" />}
                      <p className="text-muted-foreground">No {userType}s found</p>
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
                          <Badge variant="destructive">No Parent</Badge>
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
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(user.id)}
                            disabled={isDeleting === user.id}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting === user.id ? "Deleting..." : "Delete"}
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
