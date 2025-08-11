"use client"

import { memo, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle, AlertCircle, Users, User } from "lucide-react"
import { type ClassProgress } from "@/lib/actions/report-period-actions"

interface ClassProgressTableProps {
  readonly data: ClassProgress[]
  readonly loading?: boolean
}

function ClassProgressTableComponent({ data, loading }: ClassProgressTableProps) {
  // Memoize expensive calculations
  const summaryStats = useMemo(() => {
    const totalClasses = data.length
    const completeClasses = data.filter(c => c.status === 'complete').length
    const incompleteClasses = totalClasses - completeClasses
    const totalStudents = data.reduce((sum, c) => sum + c.total_students, 0)

    return {
      totalClasses,
      completeClasses,
      incompleteClasses,
      totalStudents
    }
  }, [data])

  const getStatusIcon = (status: 'complete' | 'incomplete') => {
    if (status === 'complete') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <AlertCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (status: 'complete' | 'incomplete') => {
    if (status === 'complete') {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
          Complete
        </Badge>
      )
    }
    return (
      <Badge variant="destructive">
        Incomplete
      </Badge>
    )
  }

  const getProgressPercentage = (sent: number, total: number) => {
    if (total === 0) return 0
    return Math.round((sent / total) * 100)
  }
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Classes Found
          </h3>
          <p className="text-gray-600">
            No classes found for the selected report period and filters.
          </p>
        </div>
      </div>
    )
  }



  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[150px]">Class</TableHead>
              <TableHead className="hidden sm:table-cell min-w-[180px]">Homeroom Teacher</TableHead>
              <TableHead className="min-w-[120px]">Progress</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((classItem) => {
              const percentage = getProgressPercentage(classItem.sent_reports, classItem.total_students)
              
              return (
                <TableRow key={classItem.class_id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm sm:text-base">{classItem.class_name}</span>
                    </div>
                    {/* Mobile: Show teacher info */}
                    <div className="sm:hidden text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {classItem.homeroom_teacher_name}
                    </div>
                  </TableCell>
                  
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{classItem.homeroom_teacher_name}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {classItem.sent_reports}/{classItem.total_students}
                        </span>
                        <span className="text-muted-foreground">
                          {percentage}%
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            classItem.status === 'complete' 
                              ? 'bg-green-500' 
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      
                      {/* Mobile: Show status */}
                      <div className="sm:hidden">
                        {getStatusBadge(classItem.status)}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(classItem.status)}
                      {getStatusBadge(classItem.status)}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Total Classes</p>
            <p className="text-lg font-semibold">{summaryStats.totalClasses}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Complete</p>
            <p className="text-lg font-semibold text-green-600">
              {summaryStats.completeClasses}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Incomplete</p>
            <p className="text-lg font-semibold text-red-600">
              {summaryStats.incompleteClasses}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Students</p>
            <p className="text-lg font-semibold">
              {summaryStats.totalStudents}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add display name for debugging
ClassProgressTableComponent.displayName = 'ClassProgressTableComponent'

// Export memoized component for performance optimization
export const ClassProgressTable = memo(ClassProgressTableComponent)
ClassProgressTable.displayName = 'ClassProgressTable'
