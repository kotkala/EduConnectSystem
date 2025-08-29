"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog"
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  MessageSquare,
  Plus,
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { getTeacherScheduleChangeRequestsAction } from "../actions/schedule-change-actions"
import { type ScheduleChangeRequest } from "../types/schedule-change-types"

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Chờ duyệt'
    case 'approved':
      return 'Đã duyệt'
    case 'rejected':
      return 'Từ chối'
    default:
      return status
  }
}

export default function TeacherScheduleChangeList() {
  const [requests, setRequests] = useState<ScheduleChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [, setSelectedRequest] = useState<ScheduleChangeRequest | null>(null)

  // Filter and pagination state
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)


  // Filtered and paginated data
  const filteredRequests = useMemo(() => {
    let filtered = requests

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.subject.name_vietnamese.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.class.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.id.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    return filtered
  }, [requests, searchTerm, statusFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRequests = filteredRequests.slice(startIndex, endIndex)

  useEffect(() => {
    loadRequests()
  }, [])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, statusFilter])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const result = await getTeacherScheduleChangeRequestsAction()
      
      if (result.success && result.data) {
        setRequests(result.data)
      } else {
        toast.error(result.error || 'Không thể tải danh sách đơn thay đổi')
      }
    } catch (error) {
      console.error('Error loading requests:', error)
      toast.error('Có lỗi xảy ra khi tải danh sách')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Đơn Thay Đổi Lịch Dạy</h1>
          <Button asChild>
            <Link href="/dashboard/teacher/schedule-change/create">
              <Plus className="h-4 w-4 mr-2" />
              Tạo Đơn Mới
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Đang tải...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Đơn Thay Đổi Lịch Dạy</h1>
        <Button asChild>
          <Link href="/dashboard/teacher/schedule-change/create">
            <Plus className="h-4 w-4 mr-2" />
            Tạo Đơn Mới
          </Link>
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo môn học, lớp, lý do hoặc mã đơn..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results summary */}
          <div className="mt-4 text-sm text-muted-foreground">
            Hiển thị {currentRequests.length} trong tổng số {filteredRequests.length} đơn
            {searchTerm && ` (tìm kiếm: "${searchTerm}")`}
            {statusFilter !== "all" && ` (trạng thái: ${getStatusLabel(statusFilter)})`}
          </div>
        </CardContent>
      </Card>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Không tìm thấy đơn nào phù hợp với bộ lọc"
                  : "Chưa có đơn thay đổi lịch dạy nào"
                }
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button asChild>
                  <Link href="/dashboard/teacher/schedule-change/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo Đơn Đầu Tiên
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Compact Request Cards */}
          <div className="space-y-3">
            {currentRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusLabel(request.status)}
                        </Badge>
                        <span className="font-medium text-sm">
                          #{request.id.slice(-8)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(request.change_date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{request.subject.name_vietnamese}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{request.class.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Tuần {request.week_number}, Tiết {request.original_period}</span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {request.reason}
                      </p>
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Chi tiết
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Chi tiết đơn thay đổi lịch dạy #{request.id.slice(-8)}
                          </DialogTitle>
                        </DialogHeader>

                        {/* Detailed View Content */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(request.status)}>
                              {getStatusLabel(request.status)}
                            </Badge>
                          </div>

                          {/* Request Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Ngày thay đổi</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(request.change_date).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Tuần & Tiết</p>
                                <p className="text-sm text-muted-foreground">
                                  Tuần {request.week_number}, Tiết {request.original_period}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Môn học</p>
                                <p className="text-sm text-muted-foreground">
                                  {request.subject.name_vietnamese} ({request.subject.code})
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">Lớp học</p>
                                <p className="text-sm text-muted-foreground">
                                  {request.class.name}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Academic Info */}
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{request.academic_year.name}</span>
                            <span>•</span>
                            <span>{request.semester.name}</span>
                          </div>

                          {/* Reason */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium">Lý do thay đổi:</p>
                            <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded-md">
                              {request.reason}
                            </p>
                          </div>

                          {/* Admin Response */}
                          {request.admin_response && (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">Phản hồi từ Admin:</p>
                              </div>
                              <p className={`text-sm p-3 rounded-md ${
                                request.status === 'approved'
                                  ? 'bg-green-50 text-green-800 border border-green-200'
                                  : 'bg-red-50 text-red-800 border border-red-200'
                              }`}>
                                {request.admin_response}
                              </p>
                              {request.admin && request.responded_at && (
                                <p className="text-xs text-muted-foreground">
                                  Phản hồi bởi {request.admin.full_name} vào {new Date(request.responded_at).toLocaleString('vi-VN')}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Timestamps */}
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                            <span>Tạo: {new Date(request.created_at).toLocaleString('vi-VN')}</span>
                            {request.updated_at !== request.created_at && (
                              <span>Cập nhật: {new Date(request.updated_at).toLocaleString('vi-VN')}</span>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Trang {currentPage} / {totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Sau
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
