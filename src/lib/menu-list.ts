import {
  Home,
  Users,
  BookOpen,
  FileText,
  Calendar,
  Award,
  Building,
  Bell,
  Bot,
  AlertTriangle,
  BarChart3,
  Calculator,
  CalendarClock,
  BookCheck,
  Heart,
  LucideIcon
} from "lucide-react"

import { UserRole } from '@/lib/types'

type Submenu = {
  href: string
  label: string
  active?: boolean
}

type Menu = {
  href: string
  label: string
  active?: boolean
  icon: LucideIcon
  submenus?: Submenu[]
  onClick?: () => void
}

type Group = {
  groupLabel: string
  menus: Menu[]
}

export function getMenuList(pathname: string, role: UserRole, onChatbotOpen?: () => void): Group[] {
  const menuConfig: Record<UserRole, Group[]> = {
    admin: [
      {
        groupLabel: "",
        menus: [
          {
            href: "/dashboard/admin",
            label: "Tổng quan",
            icon: Home
          }
        ]
      },
      {
        groupLabel: "Platform",
        menus: [
          {
            href: "/dashboard/admin/notifications",
            label: "Thông báo",
            icon: Bell
          },
          {
            href: "/dashboard/admin/analytics",
            label: "Phân tích",
            icon: BarChart3
          }
        ]
      },
      {
        groupLabel: "Management",
        menus: [
          {
            href: "/dashboard/admin/users",
            label: "Người dùng",
            icon: Users
          },
          {
            href: "",
            label: "Học tập",
            icon: BookOpen,
            submenus: [
              {
                href: "/dashboard/admin/classes",
                label: "Lớp học"
              },
              {
                href: "/dashboard/admin/subjects",
                label: "Môn học"
              },
              {
                href: "/dashboard/admin/academic-years",
                label: "Năm học"
              }
            ]
          },
          {
            href: "",
            label: "Cơ sở vật chất",
            icon: Building,
            submenus: [
              {
                href: "/dashboard/admin/classrooms",
                label: "Phòng học"
              },
              {
                href: "/dashboard/admin/timetable",
                label: "Thời khóa biểu"
              }
            ]
          },
          {
            href: "",
            label: "Điểm số",
            icon: Calculator,
            submenus: [
              {
                href: "/dashboard/admin/grade-tracking",
                label: "Theo dõi điểm"
              },
              {
                href: "/dashboard/admin/grade-periods",
                label: "Kỳ báo cáo"
              },
              {
                href: "/dashboard/admin/grade-overwrite-approvals",
                label: "Phê duyệt điểm"
              }
            ]
          }
        ]
      },
      {
        groupLabel: "System",
        menus: [
          {
            href: "/dashboard/admin/schedule-change",
            label: "Đơn thay đổi lịch",
            icon: CalendarClock
          },
          {
            href: "/dashboard/admin/violations",
            label: "Vi phạm",
            icon: AlertTriangle
          }
        ]
      }
    ],

    teacher: [
      {
        groupLabel: "",
        menus: [
          {
            href: "/dashboard/teacher",
            label: "Tổng quan",
            icon: Home
          }
        ]
      },
      {
        groupLabel: "Platform",
        menus: [
          {
            href: "/dashboard/teacher/notifications",
            label: "Thông báo",
            icon: Bell
          },
          {
            href: "/dashboard/teacher/schedule",
            label: "Lịch giảng dạy",
            icon: Calendar
          }
        ]
      },
      {
        groupLabel: "Management",
        menus: [
          {
            href: "",
            label: "Điểm số",
            icon: Calculator,
            submenus: [
              {
                href: "/dashboard/teacher/grade-management",
                label: "Nhập điểm"
              },
              {
                href: "/dashboard/teacher/grade-reports",
                label: "Bảng điểm"
              }
            ]
          },
          {
            href: "",
            label: "Báo cáo",
            icon: BookCheck,
            submenus: [
              {
                href: "/dashboard/teacher/reports",
                label: "Báo cáo học tập"
              },
              {
                href: "/dashboard/teacher/meetings",
                label: "Họp phụ huynh"
              }
            ]
          },
          {
            href: "",
            label: "Chủ nhiệm",
            icon: Heart,
            submenus: [
              {
                href: "/dashboard/teacher/homeroom-students",
                label: "Học sinh"
              },
              {
                href: "/dashboard/teacher/homeroom-grades",
                label: "Điểm lớp"
              }
            ]
          },
          {
            href: "/dashboard/teacher/leave-requests",
            label: "Đơn xin nghỉ",
            icon: FileText
          },
          {
            href: "/dashboard/teacher/schedule-change",
            label: "Đơn thay đổi lịch",
            icon: CalendarClock
          }
        ]
      }
    ],

    student: [
      {
        groupLabel: "",
        menus: [
          {
            href: "/student",
            label: "Tổng quan",
            icon: Home
          }
        ]
      },
      {
        groupLabel: "Platform",
        menus: [
          {
            href: "/student/notifications",
            label: "Thông báo",
            icon: Bell
          },
          {
            href: "/student/courses",
            label: "Khóa học",
            icon: BookOpen
          },
          {
            href: "/student/assignments",
            label: "Bài tập",
            icon: FileText
          },
          {
            href: "/student/grades",
            label: "Điểm số",
            icon: Award
          },
          {
            href: "/student/timetable",
            label: "Thời khóa biểu",
            icon: Calendar
          }
        ]
      }
    ],

    parent: [
      {
        groupLabel: "",
        menus: [
          {
            href: "/dashboard/parent",
            label: "Tổng quan",
            icon: Home
          }
        ]
      },
      {
        groupLabel: "Platform",
        menus: [
          {
            href: "/dashboard/parent/notifications",
            label: "Thông báo",
            icon: Bell
          },
          {
            href: "",
            label: "Trợ lý AI",
            icon: Bot,
            onClick: onChatbotOpen
          }
        ]
      },
      {
        groupLabel: "Family",
        menus: [
          {
            href: "",
            label: "Học tập",
            icon: BookCheck,
            submenus: [
              {
                href: "/dashboard/parent/grades",
                label: "Bảng điểm"
              },
              {
                href: "/dashboard/parent/reports",
                label: "Báo cáo"
              },
              {
                href: "/dashboard/parent/feedback",
                label: "Phản hồi"
              }
            ]
          },
          {
            href: "/dashboard/parent/violations",
            label: "Vi phạm",
            icon: AlertTriangle
          },
          {
            href: "/dashboard/parent/meetings",
            label: "Lịch họp",
            icon: Calendar
          },
          {
            href: "/dashboard/parent/leave-application",
            label: "Đơn xin nghỉ",
            icon: FileText
          }
        ]
      }
    ]
  }

  return menuConfig[role] || []
}
