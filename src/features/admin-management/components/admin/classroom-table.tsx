"use client"

import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Badge } from "@/shared/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/shared/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"

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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/components/ui/tooltip"
import { type Classroom } from "@/features/admin-management/actions/classroom-actions"
import {
  type ClassroomFilters,
  ROOM_TYPES
} from "@/lib/validations/timetable-validations"
import { ClassroomEditDialog } from "./classroom-edit-dialog"
import { ClassroomDeleteDialog } from "./classroom-delete-dialog"

interface ClassroomTableProps {
  readonly data: Classroom[]
  readonly total: number
  readonly currentPage: number
  readonly limit?: number
  readonly onPageChange: (page: number) => void
  readonly onFiltersChange: (filters: Partial<ClassroomFilters>) => void
  readonly onRefresh: () => void
}

export function ClassroomTable({
  data,
  total,
  currentPage,
  limit = 10,
  onPageChange,
  onFiltersChange,
  onRefresh
}: ClassroomTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [buildingFilter, setBuildingFilter] = useState("")
  const [roomTypeFilter, setRoomTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null)

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

  const handleEdit = (classroom: Classroom) => {
    setSelectedClassroom(classroom)
    setEditModalOpen(true)
  }

  const handleDelete = (classroom: Classroom) => {
    setSelectedClassroom(classroom)
    setDeleteModalOpen(true)
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
    if (equipment.length === 0) return "Không có"
    if (equipment.length <= 2) return equipment.join(", ")
    return `${equipment.slice(0, 2).join(", ")} +${equipment.length - 2} khác`
  }

  // Extract location formatting logic to reduce complexity
  const formatLocation = (building: string | null, floor: number | null) => {
    if (building && floor) {
      return `${building}, Tầng ${floor}`
    }
    if (building || floor) {
      const buildingPart = building || ''
      const floorPart = floor ? ` Tầng ${floor}` : ''
      return buildingPart + floorPart
    }
    return 'Chưa xác định'
  }

  return (
    <div className="space-y-4">


      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm phòng học..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={buildingFilter} onValueChange={handleBuildingFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tất cả tòa nhà" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả tòa nhà</SelectItem>
            {getUniqueBuildings().map((building) => (
              <SelectItem key={building} value={building}>
                {building}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={roomTypeFilter} onValueChange={handleRoomTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tất cả loại phòng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại phòng</SelectItem>
            {ROOM_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="active">Hoạt động</SelectItem>
            <SelectItem value="inactive">Không hoạt động</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[100px]">Phòng học</TableHead>
              <TableHead className="hidden sm:table-cell min-w-[120px]">Vị trí</TableHead>
              <TableHead className="min-w-[80px]">Loại phòng</TableHead>
              <TableHead className="min-w-[80px]">Sức chứa</TableHead>
              <TableHead className="hidden md:table-cell min-w-[100px]">Trang thiết bị</TableHead>
              <TableHead className="min-w-[80px]">Trạng thái</TableHead>
              <TableHead className="w-[70px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Không tìm thấy phòng học nào
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
                      {formatLocation(classroom.building, classroom.floor)}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>
                        {formatLocation(classroom.building, classroom.floor)}
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
                                {classroom.equipment.map((eq) => (
                                  <li key={eq}>{eq}</li>
                                ))}
                              </ul>
                            ) : (
                              "Không có trang thiết bị"
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge variant={classroom.is_active ? "default" : "secondary"} className="text-xs">
                      {classroom.is_active ? "Hoạt động" : "Không hoạt động"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(classroom)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(classroom)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
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
            Hiển thị {((currentPage - 1) * limit) + 1} đến {Math.min(currentPage * limit, total)} trong tổng số {total} phòng học
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
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
              Tiếp
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <ClassroomEditDialog
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        classroom={selectedClassroom}
        onSuccess={onRefresh}
      />

      {/* Delete Modal */}
      <ClassroomDeleteDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        classroom={selectedClassroom}
        onSuccess={onRefresh}
      />
    </div>
  )
}
