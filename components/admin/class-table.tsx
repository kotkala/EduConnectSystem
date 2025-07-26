"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Users,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  UserPlus
} from "lucide-react"
import {
  type ClassWithDetails,
  type ClassFilters,
  getSubjectCombinationName
} from "@/lib/validations/class-validations"
import { deleteClassAction } from "@/lib/actions/class-actions"
import StudentAssignmentForm from "./student-assignment-form"

interface ClassTableProps {
  data: ClassWithDetails[]
  total: number
  currentPage: number
  limit: number
  onPageChange: (page: number) => void
  onFiltersChange: (filters: Partial<ClassFilters>) => void
  onEdit: (classData: ClassWithDetails) => void
  onRefresh: () => void
  academicYears?: Array<{ id: string; name: string }>
  semesters?: Array<{ id: string; name: string }>
  teachers?: Array<{ id: string; full_name: string; employee_id: string }>
}

export function ClassTable({
  data,
  total,
  currentPage,
  limit,
  onPageChange,
  onFiltersChange,
  onEdit,
  onRefresh,
  academicYears = [],
  semesters = [],
  teachers = []
}: ClassTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("all")
  const [selectedSemester, setSelectedSemester] = useState<string>("all")
  const [selectedClassType, setSelectedClassType] = useState<string>("all")
  const [selectedTeacher, setSelectedTeacher] = useState<string>("all")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false)
  const [selectedClassForAssignment, setSelectedClassForAssignment] = useState<ClassWithDetails | null>(null)

  const totalPages = Math.ceil(total / limit)

  const handleSearch = () => {
    onFiltersChange({
      search: searchTerm || undefined,
      academic_year_id: selectedAcademicYear === "all" ? undefined : selectedAcademicYear || undefined,
      semester_id: selectedSemester === "all" ? undefined : selectedSemester || undefined,
      is_subject_combination: selectedClassType === "combined" ? true : selectedClassType === "main" ? false : undefined,
      homeroom_teacher_id: selectedTeacher === "all" ? undefined : selectedTeacher || undefined,
      page: 1
    })
  }

  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedAcademicYear("all")
    setSelectedSemester("all")
    setSelectedClassType("all")
    setSelectedTeacher("all")
    onFiltersChange({ page: 1 })
  }

  const handleDelete = async (classData: ClassWithDetails) => {
    if (!confirm(`Are you sure you want to delete class "${classData.name}"?`)) {
      return
    }

    setDeletingId(classData.id)
    setDeleteError(null)

    try {
      const result = await deleteClassAction(classData.id)
      
      if (result.success) {
        onRefresh()
      } else {
        setDeleteError(result.error || "Failed to delete class")
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete class")
    } finally {
      setDeletingId(null)
    }
  }

  const getClassTypeBadge = (classData: ClassWithDetails) => {
    if (classData.is_subject_combination) {
      return (
        <Badge variant="secondary" className="bg-purple-100 text-purple-800">
          Combined
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800">
        Main
      </Badge>
    )
  }

  const getSubjectCombinationDisplay = (classData: ClassWithDetails) => {
    if (!classData.is_subject_combination || !classData.subject_combination_type || !classData.subject_combination_variant) {
      return "-"
    }

    return getSubjectCombinationName(classData.subject_combination_type, classData.subject_combination_variant)
  }

  const handleAssignStudents = (classData: ClassWithDetails) => {
    setSelectedClassForAssignment(classData)
    setAssignmentFormOpen(true)
  }

  const handleAssignmentSuccess = () => {
    onRefresh() // Refresh the class list to update student counts
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search by class name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            {/* Academic Year Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All academic years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All academic years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semester Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Semester</label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="All semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All semesters</SelectItem>
                  {semesters.map((semester) => (
                    <SelectItem key={semester.id} value={semester.id}>
                      {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class Type Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Class Type</label>
              <Select value={selectedClassType} onValueChange={setSelectedClassType}>
                <SelectTrigger>
                  <SelectValue placeholder="All class types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All class types</SelectItem>
                  <SelectItem value="main">Main Classes</SelectItem>
                  <SelectItem value="combined">Combined Classes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Teacher Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Homeroom Teacher</label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="All teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All teachers</SelectItem>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.full_name} ({teacher.employee_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <Button variant="outline" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {deleteError && (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Classes ({total} total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Class Name</TableHead>
                  <TableHead className="min-w-[80px]">Type</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[120px]">Academic Year</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[100px]">Semester</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[140px]">Subject Combination</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[140px]">Homeroom Teacher</TableHead>
                  <TableHead className="min-w-[80px]">Students</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No classes found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((classData) => (
                    <TableRow key={classData.id}>
                      <TableCell className="font-medium">{classData.name}</TableCell>
                      <TableCell>{getClassTypeBadge(classData)}</TableCell>
                      <TableCell>{classData.academic_year?.name || "-"}</TableCell>
                      <TableCell>{classData.semester?.name || "-"}</TableCell>
                      <TableCell>{getSubjectCombinationDisplay(classData)}</TableCell>
                      <TableCell>
                        {classData.homeroom_teacher ? (
                          <div>
                            <div className="font-medium">{classData.homeroom_teacher.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {classData.homeroom_teacher.employee_id}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No teacher assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{classData.current_students}/{classData.max_students}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(classData)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignStudents(classData)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign Students
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(classData)}
                              disabled={deletingId === classData.id}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {deletingId === classData.id ? "Deleting..." : "Delete"}
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
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} classes
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
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
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

      {/* Student Assignment Form */}
      {selectedClassForAssignment && (
        <StudentAssignmentForm
          classId={selectedClassForAssignment.id}
          className={selectedClassForAssignment.name}
          isOpen={assignmentFormOpen}
          onClose={() => {
            setAssignmentFormOpen(false)
            setSelectedClassForAssignment(null)
          }}
          onSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  )
}
