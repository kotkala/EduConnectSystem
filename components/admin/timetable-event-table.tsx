"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
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
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Clock,
  MapPin,
  User
} from "lucide-react"
import { deleteTimetableEventAction, type TimetableEventDetailed } from "@/lib/actions/timetable-actions"
import { 
  type TimetableFilters,
  getDayName
} from "@/lib/validations/timetable-validations"

interface TimetableEventTableProps {
  data: TimetableEventDetailed[]
  onEdit: (event: TimetableEventDetailed) => void
  onDuplicate: (event: TimetableEventDetailed) => void
  onRefresh: () => void
  filters: TimetableFilters
  onFiltersChange: (filters: Partial<TimetableFilters>) => void
}

export function TimetableEventTable({
  data,
  onEdit,
  onDuplicate,
  onRefresh,
  filters,
  onFiltersChange
}: TimetableEventTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timetable event? This action cannot be undone.')) {
      return
    }

    setDeletingId(id)
    setError(null)

    try {
      const result = await deleteTimetableEventAction(id)
      if (result.success) {
        onRefresh()
      } else {
        setError(result.error || 'Failed to delete timetable event')
      }
    } catch {
      setError('Failed to delete timetable event')
    } finally {
      setDeletingId(null)
    }
  }

  const formatTime12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':')
    const hourNum = parseInt(hour)
    const period = hourNum >= 12 ? 'PM' : 'AM'
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum
    return `${hour12}:${minute} ${period}`
  }

  const getSubjectColor = (subjectCode: string) => {
    const colors = {
      'MATH': 'bg-blue-100 text-blue-800',
      'PHYS': 'bg-green-100 text-green-800',
      'CHEM': 'bg-purple-100 text-purple-800',
      'BIO': 'bg-emerald-100 text-emerald-800',
      'LIT': 'bg-orange-100 text-orange-800',
      'HIST': 'bg-yellow-100 text-yellow-800',
      'GEO': 'bg-cyan-100 text-cyan-800',
      'ENG': 'bg-pink-100 text-pink-800'
    }
    const key = subjectCode.substring(0, 4).toUpperCase()
    return colors[key as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  // Group events by day for better display
  const groupedEvents = data.reduce((acc, event) => {
    const day = event.day_of_week
    if (!acc[day]) {
      acc[day] = []
    }
    acc[day].push(event)
    return acc
  }, {} as Record<number, TimetableEventDetailed[]>)

  // Sort events within each day by start time
  Object.keys(groupedEvents).forEach(day => {
    groupedEvents[parseInt(day)].sort((a, b) => a.start_time.localeCompare(b.start_time))
  })

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Select 
          value={filters.class_id || "all"} 
          onValueChange={(value) => onFiltersChange({ class_id: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {/* TODO: Load classes from API */}
            <SelectItem value="class1">10A1</SelectItem>
            <SelectItem value="class2">10A2</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.teacher_id || "all"} 
          onValueChange={(value) => onFiltersChange({ teacher_id: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Teachers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            {/* TODO: Load teachers from API */}
            <SelectItem value="teacher1">Mr. Smith</SelectItem>
            <SelectItem value="teacher2">Ms. Johnson</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.classroom_id || "all"} 
          onValueChange={(value) => onFiltersChange({ classroom_id: value === "all" ? undefined : value })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Classrooms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classrooms</SelectItem>
            {/* TODO: Load classrooms from API */}
            <SelectItem value="room1">A101</SelectItem>
            <SelectItem value="room2">A102</SelectItem>
          </SelectContent>
        </Select>

        <Select 
          value={filters.day_of_week?.toString() || "all"} 
          onValueChange={(value) => onFiltersChange({ 
            day_of_week: value === "all" ? undefined : parseInt(value) 
          })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Days" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Days</SelectItem>
            <SelectItem value="1">Monday</SelectItem>
            <SelectItem value="2">Tuesday</SelectItem>
            <SelectItem value="3">Wednesday</SelectItem>
            <SelectItem value="4">Thursday</SelectItem>
            <SelectItem value="5">Friday</SelectItem>
            <SelectItem value="6">Saturday</SelectItem>
            <SelectItem value="0">Sunday</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Events Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day & Time</TableHead>
              <TableHead>Class & Subject</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Classroom</TableHead>
              <TableHead>Week</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No timetable events found
                </TableCell>
              </TableRow>
            ) : (
              data.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {getDayName(event.day_of_week)}
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatTime12Hour(event.start_time)} - {formatTime12Hour(event.end_time)}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{event.class_name}</div>
                      <Badge className={getSubjectColor(event.subject_code)}>
                        {event.subject_code}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{event.teacher_name}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{event.classroom_name}</span>
                      </div>
                      {event.building && (
                        <div className="text-xs text-muted-foreground">
                          {event.building}
                          {event.floor && `, Floor ${event.floor}`}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      Week {event.week_number}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {event.notes || 'No notes'}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          disabled={deletingId === event.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(event)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(event)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(event.id)}
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

      {/* Summary */}
      {data.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {data.length} timetable event{data.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
