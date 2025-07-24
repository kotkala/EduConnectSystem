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
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={`Search ${type === "academic-years" ? "academic years" : "semesters"}...`}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
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
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              {type === "academic-years" ? (
                <>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Semesters</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Semester</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Weeks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
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
                          {item.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(item.start_date)}</div>
                          <div className="text-muted-foreground">to {formatDate(item.end_date)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.is_current ? (
                          <Badge className="bg-green-100 text-green-800">Current</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {(item as AcademicYearWithSemesters).semesters?.length || 0} semesters
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.created_at)}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          {item.name}
                          <Badge variant="outline" className="text-xs">
                            S{(item as Semester).semester_number}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {(item as SemesterWithAcademicYear).academic_year?.name}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(item.start_date)}</div>
                          <div className="text-muted-foreground">to {formatDate(item.end_date)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(item as Semester).weeks_count} weeks
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.is_current ? (
                          <Badge className="bg-green-100 text-green-800">Current</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
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
        <div className="flex items-center justify-between">
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
    </div>
  )
}
