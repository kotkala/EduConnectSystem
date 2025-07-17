import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Calendar,
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  Grid3x3,
  Shield,
  Zap,
  Settings,
  BarChart3,
  FileText,
  Download,
  Upload,
  School,
  Target,
  Layers,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Lightbulb
} from "lucide-react";

interface NavigationCard {
  title: string;
  description: string;
  href: string;
  icon: any;
  color: string;
  badge?: string;
  isNew?: boolean;
}

const navigationCards: NavigationCard[] = [
  // Core Management
  {
    title: "Quản lý Năm học",
    description: "Tạo và quản lý các năm học",
    href: "/dashboard/admin/academic-years",
    icon: Calendar,
    color: "bg-blue-500",
  },
  {
    title: "Quản lý Học kỳ", 
    description: "Thiết lập các học kỳ trong năm",
    href: "/dashboard/admin/academic-terms",
    icon: Calendar,
    color: "bg-indigo-500",
  },
  {
    title: "Quản lý Khối lớp",
    description: "Thiết lập khối 10, 11, 12",
    href: "/dashboard/admin/grade-levels", 
    icon: Layers,
    color: "bg-purple-500",
  },

  // User & Class Management
  {
    title: "Quản lý Người dùng",
    description: "Quản lý học sinh, giáo viên, admin",
    href: "/dashboard/admin/users",
    icon: Users,
    color: "bg-green-500",
  },
  {
    title: "Quản lý Lớp học",
    description: "Tạo lớp gốc và lớp ghép",
    href: "/dashboard/admin/classes",
    icon: School,
    color: "bg-yellow-500",
  },

  // Subject Management
  {
    title: "Quản lý Môn học",
    description: "Thiết lập môn bắt buộc và tự chọn",
    href: "/dashboard/admin/subjects",
    icon: BookOpen,
    color: "bg-orange-500",
  },
  {
    title: "Cụm môn học",
    description: "Quản lý tổ hợp môn THPT 2018",
    href: "/dashboard/admin/subject-groups",
    icon: Target,
    color: "bg-red-500",
    badge: "THPT 2018"
  },

  // Schedule Management
  {
    title: "Phân phối Chương trình",
    description: "Thiết lập curriculum cho từng cấp",
    href: "/dashboard/admin/curriculum-distribution",
    icon: BarChart3,
    color: "bg-teal-500",
  },
  {
    title: "Thời khóa biểu",
    description: "Tự động tạo và quản lý TKB",
    href: "/dashboard/admin/teaching-schedules",
    icon: Grid3x3,
    color: "bg-cyan-500",
    badge: "Auto Gen",
    isNew: true
  },
  {
    title: "Ràng buộc TKB",
    description: "Thiết lập quy tắc thời khóa biểu", 
    href: "/dashboard/admin/schedule-constraints",
    icon: Shield,
    color: "bg-pink-500",
    isNew: true
  },

  // Violation Management
  {
    title: "Quy tắc Vi phạm",
    description: "Quản lý các loại vi phạm học đường",
    href: "/dashboard/admin/violation-rules",
    icon: AlertTriangle,
    color: "bg-amber-500",
  }
];

const quickStartSteps = [
  {
    title: "1. Khởi tạo dữ liệu cơ bản",
    description: "Thiết lập năm học, học kỳ, khối lớp",
    links: [
      { title: "Năm học", href: "/dashboard/admin/academic-years" },
      { title: "Học kỳ", href: "/dashboard/admin/academic-terms" },
      { title: "Khối lớp", href: "/dashboard/admin/grade-levels" }
    ],
    icon: Calendar,
    color: "bg-blue-500"
  },
  {
    title: "2. Quản lý môn học",
    description: "Thiết lập môn học và cụm môn theo THPT 2018",
    links: [
      { title: "Môn học", href: "/dashboard/admin/subjects" },
      { title: "Cụm môn học", href: "/dashboard/admin/subject-groups" }
    ],
    icon: BookOpen,
    color: "bg-orange-500"
  },
  {
    title: "3. Quản lý người dùng & lớp",
    description: "Import học sinh, tạo lớp gốc và lớp ghép",
    links: [
      { title: "Người dùng", href: "/dashboard/admin/users" },
      { title: "Lớp học", href: "/dashboard/admin/classes" }
    ],
    icon: Users,
    color: "bg-green-500"
  },
  {
    title: "4. Tự động tạo thời khóa biểu",
    description: "Thiết lập curriculum và tạo TKB tự động",
    links: [
      { title: "Phân phối chương trình", href: "/dashboard/admin/curriculum-distribution" },
      { title: "Thời khóa biểu", href: "/dashboard/admin/teaching-schedules" }
    ],
    icon: Zap,
    color: "bg-cyan-500"
  }
];

export default async function AdminDashboard() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Hệ thống quản lý trường học EduConnect - Chào mừng bạn đến với bảng điều khiển
        </p>
      </div>

      {/* Quick Start Guide */}
      <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-6 w-6 text-yellow-500" />
            <CardTitle className="text-xl">Hướng dẫn Nhanh</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Làm theo các bước sau để thiết lập hệ thống trường học hoàn chỉnh:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStartSteps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={`p-2 rounded-lg ${step.color} text-white`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold text-sm">{step.title}</h3>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{step.description}</p>
                  <div className="space-y-1">
                    {step.links.map((link, linkIndex) => (
                      <Link 
                        key={linkIndex}
                        href={link.href}
                        className="flex items-center justify-between text-xs text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
                      >
                        <span>{link.title}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">1,250</div>
                <div className="text-sm text-gray-600">Học sinh</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">85</div>
                <div className="text-sm text-gray-600">Giáo viên</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <School className="h-8 w-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">42</div>
                <div className="text-sm text-gray-600">Lớp học</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">420</div>
                <div className="text-sm text-gray-600">Tiết học/tuần</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Cards */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Quản lý Hệ thống</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {navigationCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Link key={index} href={card.href}>
                <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${card.color} text-white group-hover:scale-110 transition-transform`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <CardTitle className="text-lg">{card.title}</CardTitle>
                      </div>
                      <div className="flex items-center space-x-1">
                        {card.isNew && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            New
                          </Badge>
                        )}
                        {card.badge && (
                          <Badge variant="outline" className="text-xs">
                            {card.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Thao tác Nhanh</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/admin/teaching-schedules">
            <Button className="p-6 h-auto flex-col space-y-2 w-full" variant="outline">
              <Zap className="h-6 w-6" />
              <span className="text-sm">Tự động tạo TKB</span>
            </Button>
          </Link>
          
          <Button className="p-6 h-auto flex-col space-y-2" variant="outline">
            <Upload className="h-6 w-6" />
            <span className="text-sm">Import Excel</span>
          </Button>
          
          <Button className="p-6 h-auto flex-col space-y-2" variant="outline">
            <Download className="h-6 w-6" />
            <span className="text-sm">Export TKB</span>
          </Button>
          
          <Button className="p-6 h-auto flex-col space-y-2" variant="outline">
            <Settings className="h-6 w-6" />
            <span className="text-sm">Cài đặt</span>
          </Button>
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Hoạt động Gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Grid3x3 className="h-5 w-5 text-blue-500" />
              <div className="flex-1">
                <div className="font-medium">Tạo thời khóa biểu tự động</div>
                <div className="text-sm text-gray-600">Học kỳ I năm học 2024-2025 • 180 tiết học</div>
              </div>
              <div className="text-xs text-gray-500">5 phút trước</div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Users className="h-5 w-5 text-green-500" />
              <div className="flex-1">
                <div className="font-medium">Import danh sách học sinh</div>
                <div className="text-sm text-gray-600">Lớp 10A1 • 35 học sinh</div>
              </div>
              <div className="text-xs text-gray-500">1 giờ trước</div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Target className="h-5 w-5 text-purple-500" />
              <div className="flex-1">
                <div className="font-medium">Tạo lớp ghép môn học</div>
                <div className="text-sm text-gray-600">Tổ hợp KHTN1 • 4 lớp ghép</div>
              </div>
              <div className="text-xs text-gray-500">2 giờ trước</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 