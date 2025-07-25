"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { deleteAcademicYearAction, deleteSemesterAction } from "@/lib/actions/academic-actions"
import { 
  type AcademicYear, 
  type Semester, 
  type AcademicYearWithSemesters,
  type SemesterWithAcademicYear,
  type AcademicFilters 
} from "@/lib/validations/academic-validations"

interface AcademicTableProps {
  data: AcademicYearWithSemesters[] | SemesterWithAcademicYear[]
  type: "academic-years" | "semesters"
  total: number
  currentPage: number
  limit?: number
  onPageChange: (page: number) => void
  onFiltersChange: (filters: Partial<AcademicFilters>) => void
  onEdit: (item: AcademicYear | Semester) => void
  onRefresh: () => void
}

export function AcademicTable({
  data,
  type,
  total,
  currentPage,
  limit = 10,
  onPageChange,
  onFiltersChange,
  onEdit,
  onRefresh
}: AcademicTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const totalPages = Math.ceil(total / limit)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onFiltersChange({ search: value, page: 1 })
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    setDeletingId(id)
    setDeleteError(null)

    try {
      const result = type === "academic-years" 
        ? await deleteAcademicYearAction(id)
        : await deleteSemesterAction(id)

      if (result.success) {
        onRefresh()
      } else {
        setDeleteError(result.error || "Failed to delete item")
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "An unexpected error occurred")
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={`Search ${type === "academic-years" ? "academic years" : "semesters"}...`}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" className="w-full sm:w-auto">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Error Alert */}
      {deleteError && (
        <Alert variant="destructive">
          <AlertDescription>{deleteError}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {type === "academic-years" ? (
                <>
                  <TableHead className="min-w-[120px]">Academic Year</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[140px]">Period</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[100px]">Semesters</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[100px]">Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </>
              ) : (
                <>
                  <TableHead className="min-w-[120px]">Semester</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[120px]">Academic Year</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[140px]">Period</TableHead>
                  <TableHead className="min-w-[80px]">Weeks</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[100px]">Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={type === "academic-years" ? 6 : 7} 
                  className="text-center py-8 text-muted-foreground"
                >
                  No {type === "academic-years" ? "academic years" : "semesters"} found
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id}>
                  {type === "academic-years" ? (
                    <>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm sm:text-base">{item.name}</span>
                        </div>
                        {/* Mobile: Show period info */}
                        <div className="sm:hidden text-xs text-muted-foreground mt-1">
                          {formatDate(item.start_date)} - {formatDate(item.end_date)}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">
                          <div>{formatDate(item.start_date)}</div>
                          <div className="text-muted-foreground">to {formatDate(item.end_date)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.is_current ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Current</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                        {/* Mobile: Show semesters count */}
                        <div className="md:hidden text-xs text-muted-foreground mt-1">
                          {(item as AcademicYearWithSemesters).semesters?.length || 0} semesters
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          {(item as AcademicYearWithSemesters).semesters?.length || 0} semesters
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(item.created_at)}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm sm:text-base">{item.name}</span>
                          <Badge variant="outline" className="text-xs">
                            S{(item as Semester).semester_number}
                          </Badge>
                        </div>
                        {/* Mobile: Show academic year */}
                        <div className="sm:hidden text-xs text-muted-foreground mt-1">
                          {(item as SemesterWithAcademicYear).academic_year?.name}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {(item as SemesterWithAcademicYear).academic_year?.name}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          <div>{formatDate(item.start_date)}</div>
                          <div className="text-muted-foreground">to {formatDate(item.end_date)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {(item as Semester).weeks_count} weeks
                        </Badge>
                        {/* Mobile: Show period info */}
                        <div className="md:hidden text-xs text-muted-foreground mt-1">
                          {formatDate(item.start_date)} - {formatDate(item.end_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.is_current ? (
                          <Badge className="bg-green-100 text-green-800 text-xs">Current</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {formatDate(item.created_at)}
                      </TableCell>
                    </>
                  )}
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(item.id, item.name)}
                          disabled={deletingId === item.id}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} results
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
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
                    className="w-8 h-8 p-0 text-xs"
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
              className="h-8"
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
