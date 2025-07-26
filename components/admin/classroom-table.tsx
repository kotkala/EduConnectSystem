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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { deleteClassroomAction, type Classroom } from "@/lib/actions/classroom-actions"
import { 
  type ClassroomFilters,
  ROOM_TYPES 
} from "@/lib/validations/timetable-validations"

interface ClassroomTableProps {
  data: Classroom[]
  total: number
  currentPage: number
  limit?: number
  onPageChange: (page: number) => void
  onFiltersChange: (filters: Partial<ClassroomFilters>) => void
  onEdit: (classroom: Classroom) => void
  onRefresh: () => void
}

export function ClassroomTable({
  data,
  total,
  currentPage,
  limit = 10,
  onPageChange,
  onFiltersChange,
  onEdit,
  onRefresh
}: ClassroomTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [buildingFilter, setBuildingFilter] = useState("")
  const [roomTypeFilter, setRoomTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totalPages = Math.ceil(total / limit)

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onFiltersChange({ search: value, page: 1 })
  }

  const handleBuildingFilter = (value: string) => {
    setBuildingFilter(value)
    onFiltersChange({ building: value === "all" ? undefined : value, page: 1 })
  }

  const handleRoomTypeFilter = (value: string) => {
    setRoomTypeFilter(value)
    onFiltersChange({ room_type: value === "all" ? undefined : value, page: 1 })
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    onFiltersChange({ 
      is_active: value === "all" ? undefined : value === "active", 
      page: 1 
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      return
    }

    setDeletingId(id)
    setError(null)

    try {
      const result = await deleteClassroomAction(id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error || 'Failed to delete classroom')
      }
    } catch {
      setError('Failed to delete classroom')
    } finally {
      setDeletingId(null)
    }
  }

  const getRoomTypeColor = (roomType: string) => {
    const colors = {
      standard: "bg-blue-100 text-blue-800",
      lab: "bg-green-100 text-green-800",
      computer: "bg-purple-100 text-purple-800",
      auditorium: "bg-orange-100 text-orange-800",
      gym: "bg-red-100 text-red-800",
      library: "bg-yellow-100 text-yellow-800"
    }
    return colors[roomType as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getUniqueBuildings = () => {
    const buildings = data
      .map(classroom => classroom.building)
      .filter((building): building is string => !!building)
    return [...new Set(buildings)]
  }

  const formatEquipment = (equipment: string[]) => {
    if (equipment.length === 0) return "None"
    if (equipment.length <= 2) return equipment.join(", ")
    return `${equipment.slice(0, 2).join(", ")} +${equipment.length - 2} more`
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classrooms..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={buildingFilter} onValueChange={handleBuildingFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Buildings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Buildings</SelectItem>
            {getUniqueBuildings().map((building) => (
              <SelectItem key={building} value={building}>
                {building}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={roomTypeFilter} onValueChange={handleRoomTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Room Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Room Types</SelectItem>
            {ROOM_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">Classroom</TableHead>
              <TableHead className="hidden sm:table-cell min-w-[120px]">Location</TableHead>
              <TableHead className="min-w-[80px]">Type</TableHead>
              <TableHead className="min-w-[80px]">Capacity</TableHead>
              <TableHead className="hidden md:table-cell min-w-[100px]">Equipment</TableHead>
              <TableHead className="min-w-[80px]">Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No classrooms found
                </TableCell>
              </TableRow>
            ) : (
              data.map((classroom) => (
                <TableRow key={classroom.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm sm:text-base">{classroom.name}</span>
                    </div>
                    {/* Mobile: Show location info */}
                    <div className="sm:hidden text-xs text-muted-foreground mt-1">
                      {classroom.building && classroom.floor
                        ? `${classroom.building}, Floor ${classroom.floor}`
                        : classroom.building || classroom.floor
                        ? `${classroom.building || ''}${classroom.floor ? ` Floor ${classroom.floor}` : ''}`
                        : 'Not specified'
                      }
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {classroom.building && classroom.floor
                          ? `${classroom.building}, Floor ${classroom.floor}`
                          : classroom.building || classroom.floor
                          ? `${classroom.building || ''}${classroom.floor ? ` Floor ${classroom.floor}` : ''}`
                          : 'Not specified'
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getRoomTypeColor(classroom.room_type)} text-xs`}>
                      {ROOM_TYPES.find(type => type.value === classroom.room_type)?.label || classroom.room_type}
                    </Badge>
                    {/* Mobile: Show equipment info */}
                    <div className="md:hidden text-xs text-muted-foreground mt-1">
                      {formatEquipment(classroom.equipment)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{classroom.capacity}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-sm cursor-help">
                            {formatEquipment(classroom.equipment)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="max-w-xs">
                            {classroom.equipment.length > 0 ? (
                              <ul className="list-disc list-inside">
                                {classroom.equipment.map((eq, index) => (
                                  <li key={index}>{eq}</li>
                                ))}
                              </ul>
                            ) : (
                              "No equipment listed"
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge variant={classroom.is_active ? "default" : "secondary"} className="text-xs">
                      {classroom.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          disabled={deletingId === classroom.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(classroom)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(classroom.id)}
                          className="text-destructive"
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
            Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} classrooms
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
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
