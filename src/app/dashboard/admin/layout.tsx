'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  Users,
  BookOpen,
  School,
  Grid3x3,
  Shield,
  BarChart3,
  Target,
  UserCheck,
  Layers,
  AlertTriangle,
  Menu,
  X,
  Home,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface NavigationItem {
  title: string;
  href?: string;
  icon: any;
  isNew?: boolean;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard/admin",
    icon: Home,
  },
  {
    title: "Tổng quan Hệ thống",
    href: "/dashboard/admin/system-overview",
    icon: BarChart3,
    isNew: true,
  },
  {
    title: "Quản lý Cơ bản",
    icon: Calendar,
    children: [
      {
        title: "Năm học",
        href: "/dashboard/admin/academic-years",
        icon: Calendar,
      },
      {
        title: "Học kỳ",
        href: "/dashboard/admin/academic-terms",
        icon: Calendar,
      },
      {
        title: "Khối lớp",
        href: "/dashboard/admin/grade-levels",
        icon: Layers,
      },
    ]
  },
  {
    title: "Quản lý Người dùng",
    icon: Users,
    children: [
      {
        title: "Người dùng",
        href: "/dashboard/admin/users",
        icon: Users,
      },
      {
        title: "Lớp học",
        href: "/dashboard/admin/classes",
        icon: School,
      },
    ]
  },
  {
    title: "Quản lý Môn học",
    icon: BookOpen,
    children: [
      {
        title: "Môn học",
        href: "/dashboard/admin/subjects",
        icon: BookOpen,
      },
      {
        title: "Cụm môn học",
        href: "/dashboard/admin/subject-groups",
        icon: Target,
      },
    ]
  },
  {
    title: "Thời khóa biểu",
    icon: Grid3x3,
    isNew: true,
    children: [
      {
        title: "Tự động tạo TKB",
        href: "/dashboard/admin/auto-schedule",
        icon: Calendar,
        isNew: true,
      },
      {
        title: "Phân phối Chương trình",
        href: "/dashboard/admin/curriculum-distribution",
        icon: BarChart3,
      },
      {
        title: "Thời khóa biểu",
        href: "/dashboard/admin/teaching-schedules",
        icon: Grid3x3,
        isNew: true,
      },
      {
        title: "Ràng buộc TKB",
        href: "/dashboard/admin/schedule-constraints",
        icon: Shield,
        isNew: true,
      },
      {
        title: "Phân công Giảng dạy",
        href: "/dashboard/admin/teacher-assignments",
        icon: UserCheck,
        isNew: true,
      },
    ]
  },
  {
    title: "Quy tắc Vi phạm",
    href: "/dashboard/admin/violation-rules",
    icon: AlertTriangle,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['Thời khóa biểu']);
  const pathname = usePathname();

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    );
  };

  const isActive = (href: string) => {
    return pathname === href;
  };

  const isParentActive = (children: NavigationItem[]) => {
    return children.some(child => child.href && isActive(child.href));
  };

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    const IconComponent = item.icon;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.title);
    const isItemActive = item.href ? isActive(item.href) : false;
    const isParentItemActive = hasChildren ? isParentActive(item.children!) : false;

    if (hasChildren) {
      return (
        <div key={item.title} className="space-y-1">
          <button
            onClick={() => toggleExpanded(item.title)}
            className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              isParentItemActive
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center space-x-3">
              <IconComponent className="h-5 w-5" />
              <span>{item.title}</span>
              {item.isNew && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  New
                </span>
              )}
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-6 space-y-1">
              {item.children!.map(child => renderNavigationItem(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.title}
        href={item.href!}
        className={`flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          isItemActive
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
        }`}
      >
        <IconComponent className="h-5 w-5" />
        <span>{item.title}</span>
        {item.isNew && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            New
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            EduConnect Admin
          </h1>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map(item => renderNavigationItem(item))}
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            EduConnect Admin
          </h1>
          <div></div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
} 