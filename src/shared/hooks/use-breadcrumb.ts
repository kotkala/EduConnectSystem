import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { UserRole } from '@/lib/types'

interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

const ROUTE_LABELS: Record<string, string> = {
  // Admin routes
  'dashboard': 'Bảng điều khiển',
  'admin': 'Quản trị',
  'users': 'Người dùng',
  'students': 'Học sinh',
  'teachers': 'Giáo viên',
  'classes': 'Lớp học',
  'subjects': 'Môn học',
  'academic-years': 'Năm học',
  'grade-tracking': 'Theo dõi điểm',
  'notifications': 'Thông báo',
  'classrooms': 'Phòng học',
  'admin-timetable': 'Thời khóa biểu',
  'schedule-change': 'Đơn thay đổi lịch',
  'grade-periods': 'Kỳ báo cáo điểm',
  'grade-overwrite-approvals': 'Phê duyệt ghi đè điểm',
  'report-periods': 'Báo cáo học tập',
  'grade-improvement': 'Cải thiện điểm số',
  'teacher-assignments': 'Phân công giáo viên',
  'violations': 'Vi phạm',

  // Teacher routes
  'teacher': 'Giáo viên',
  'grade-management': 'Quản lý điểm',
  'schedule': 'Lịch giảng dạy',
  'meetings': 'Họp phụ huynh',
  'grade-reports': 'Bảng điểm',
  'homeroom-grades': 'Điểm lớp chủ nhiệm',
  'homeroom-students': 'Học sinh chủ nhiệm',
  'leave-requests': 'Đơn xin nghỉ',
  'reports': 'Báo cáo',
  'feedback': 'Phản hồi',

  // Parent routes
  'parent': 'Phụ huynh',
  'grades': 'Bảng điểm',
  'chatbot': 'Trợ lý AI',
  'leave-application': 'Đơn xin nghỉ',
  'leave-status': 'Trạng thái đơn nghỉ',

  // Student routes
  'student': 'Học sinh',
  'courses': 'Khóa học',
  'assignments': 'Bài tập',
  'timetable': 'Thời khóa biểu',
}

export function useBreadcrumb(role: UserRole): BreadcrumbItem[] {
  const pathname = usePathname()
  
  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = []
    
    // Always start with Home
    breadcrumbs.push({
      label: 'Trang chủ',
      href: '/'
    })
    
    // Build breadcrumb path
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const isLast = index === segments.length - 1
      
      // Skip dynamic segments like [id]
      if (segment.startsWith('[') && segment.endsWith(']')) {
        return
      }
      
      const label = ROUTE_LABELS[segment] || segment
      
      breadcrumbs.push({
        label,
        href: isLast ? undefined : currentPath,
        isCurrentPage: isLast
      })
    })
    
    return breadcrumbs
  }, [pathname])
}
