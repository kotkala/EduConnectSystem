'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Database,
  Users,
  BookOpen,
  Calendar,
  School,
  Target,
  BarChart3,
  Grid3x3,
  Shield,
  AlertTriangle,
  RefreshCw,
  Play
} from 'lucide-react';

interface SystemStatus {
  category: string;
  name: string;
  status: 'completed' | 'pending' | 'error';
  count: number;
  description: string;
  action?: string;
  actionLink?: string;
}

export default function SystemOverviewPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoInitializing, setAutoInitializing] = useState(false);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    setLoading(true);
    try {
      // Check various system components
      const checks = await Promise.allSettled([
        fetch('/api/academic-years').then(r => r.json()),
        fetch('/api/academic-terms').then(r => r.json()),
        fetch('/api/grade-levels').then(r => r.json()),
        fetch('/api/subjects').then(r => r.json()),
        fetch('/api/classes').then(r => r.json()),
        fetch('/api/users?role=teacher').then(r => r.json()),
        fetch('/api/users?role=student').then(r => r.json()),
        fetch('/api/time-slots').then(r => r.json()),
        fetch('/api/subject-groups').then(r => r.json()),
        fetch('/api/curriculum-distribution').then(r => r.json()),
        fetch('/api/teaching-schedules').then(r => r.json()),
        fetch('/api/schedule-constraints').then(r => r.json()),
        fetch('/api/violation-rules').then(r => r.json()),
      ]);

      const [
        academicYears, academicTerms, gradeLevels, subjects, classes, 
        teachers, students, timeSlots, subjectGroups, curriculum,
        schedules, constraints, violationRules
      ] = checks.map(result => 
        result.status === 'fulfilled' ? result.value : []
      );

      const status: SystemStatus[] = [
        {
          category: 'Cơ bản',
          name: 'Năm học',
          status: academicYears.length > 0 ? 'completed' : 'pending',
          count: academicYears.length || 0,
          description: 'Thiết lập năm học cho hệ thống',
          action: 'Tạo năm học',
          actionLink: '/dashboard/admin/academic-years'
        },
        {
          category: 'Cơ bản',
          name: 'Học kỳ',
          status: academicTerms.length > 0 ? 'completed' : 'pending',
          count: academicTerms.length || 0,
          description: 'Thiết lập các học kỳ trong năm',
          action: 'Tạo học kỳ',
          actionLink: '/dashboard/admin/academic-terms'
        },
        {
          category: 'Cơ bản',
          name: 'Khối lớp',
          status: gradeLevels.length >= 3 ? 'completed' : 'pending',
          count: gradeLevels.length || 0,
          description: 'Khối 10, 11, 12 (cần ít nhất 3 khối)',
          action: 'Khởi tạo khối',
          actionLink: '/dashboard/admin/grade-levels'
        },
        {
          category: 'Môn học',
          name: 'Môn học',
          status: subjects.length >= 10 ? 'completed' : 'pending',
          count: subjects.length || 0,
          description: 'Môn bắt buộc và tự chọn THPT 2018',
          action: 'Khởi tạo môn học',
          actionLink: '/dashboard/admin/subjects'
        },
        {
          category: 'Môn học',
          name: 'Cụm môn học',
          status: subjectGroups.length >= 5 ? 'completed' : 'pending',
          count: subjectGroups.length || 0,
          description: 'Tổ hợp môn KHTN1, KHTN2, KHXH1, KHXH2, KHXH3',
          action: 'Khởi tạo cụm môn',
          actionLink: '/dashboard/admin/subject-groups'
        },
        {
          category: 'Người dùng',
          name: 'Giáo viên',
          status: teachers.length > 0 ? 'completed' : 'pending',
          count: teachers.length || 0,
          description: 'Giáo viên để phân công giảng dạy',
          action: 'Thêm giáo viên',
          actionLink: '/dashboard/admin/users'
        },
        {
          category: 'Người dùng',
          name: 'Học sinh',
          status: students.length > 0 ? 'completed' : 'pending',
          count: students.length || 0,
          description: 'Học sinh để tạo lớp học',
          action: 'Import học sinh',
          actionLink: '/dashboard/admin/users'
        },
        {
          category: 'Lớp học',
          name: 'Lớp học',
          status: classes.length > 0 ? 'completed' : 'pending',
          count: classes.length || 0,
          description: 'Lớp gốc và lớp ghép',
          action: 'Tạo lớp học',
          actionLink: '/dashboard/admin/classes'
        },
        {
          category: 'Thời khóa biểu',
          name: 'Khung giờ học',
          status: timeSlots.length >= 8 ? 'completed' : 'pending',
          count: timeSlots.length || 0,
          description: 'Khung giờ học trong ngày (8-10 tiết)',
          action: 'Khởi tạo khung giờ',
          actionLink: '/dashboard/admin/time-slots'
        },
        {
          category: 'Thời khóa biểu',
          name: 'Phân phối chương trình',
          status: curriculum.length > 0 ? 'completed' : 'pending',
          count: curriculum.length || 0,
          description: 'Curriculum distribution theo THPT 2018',
          action: 'Thiết lập curriculum',
          actionLink: '/dashboard/admin/curriculum-distribution'
        },
        {
          category: 'Thời khóa biểu',
          name: 'Thời khóa biểu',
          status: schedules.length > 0 ? 'completed' : 'pending',
          count: schedules.length || 0,
          description: 'Thời khóa biểu giảng dạy',
          action: 'Tự động tạo TKB',
          actionLink: '/dashboard/admin/teaching-schedules'
        },
        {
          category: 'Nâng cao',
          name: 'Ràng buộc TKB',
          status: 'completed', // Optional
          count: constraints.length || 0,
          description: 'Ràng buộc và quy tắc thời khóa biểu',
          action: 'Thiết lập ràng buộc',
          actionLink: '/dashboard/admin/schedule-constraints'
        },
        {
          category: 'Nâng cao',
          name: 'Quy tắc vi phạm',
          status: violationRules.length > 0 ? 'completed' : 'pending',
          count: violationRules.length || 0,
          description: 'Quy tắc vi phạm học đường',
          action: 'Khởi tạo quy tắc',
          actionLink: '/dashboard/admin/violation-rules'
        },
      ];

      setSystemStatus(status);
    } catch (error) {
      toast.error('Lỗi khi kiểm tra trạng thái hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const autoInitializeSystem = async () => {
    setAutoInitializing(true);
    try {
      // Initialize basic data step by step
      const steps = [
        { name: 'Khởi tạo khối lớp', endpoint: '/api/grade-levels/initialize' },
        { name: 'Khởi tạo năm học', endpoint: '/api/academic-years/initialize' },
        { name: 'Khởi tạo môn học', endpoint: '/api/subjects/initialize' },
        { name: 'Khởi tạo cụm môn học', endpoint: '/api/subject-groups/initialize' },
        { name: 'Khởi tạo khung giờ học', endpoint: '/api/time-slots/initialize' },
        { name: 'Khởi tạo quy tắc vi phạm', endpoint: '/api/violation-rules/initialize' },
        { name: 'Tạo 50 giáo viên', endpoint: '/api/users/generate-teachers' },
      ];

      for (const step of steps) {
        toast.info(`Đang ${step.name.toLowerCase()}...`);
        const response = await fetch(step.endpoint, { method: 'POST' });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(`${step.name}: ${error.message || 'Có lỗi xảy ra'}`);
        }
        
        toast.success(`${step.name} thành công`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
      }

      toast.success('Khởi tạo hệ thống thành công!');
      checkSystemStatus(); // Refresh status
    } catch (error: any) {
      toast.error(`Lỗi khởi tạo: ${error.message}`);
    } finally {
      setAutoInitializing(false);
    }
  };

  const getCompletionPercentage = () => {
    const requiredItems = systemStatus.filter(item => 
      !['Ràng buộc TKB'].includes(item.name) // Optional items
    );
    const completedItems = requiredItems.filter(item => item.status === 'completed');
    return Math.round((completedItems.length / requiredItems.length) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Hoàn thành</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Lỗi</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Đang chờ</Badge>;
    }
  };

  const groupedStatus = systemStatus.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SystemStatus[]>);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">Đang kiểm tra trạng thái hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Tổng quan Hệ thống</h1>
        <p className="text-gray-600">Kiểm tra và khởi tạo các thành phần hệ thống</p>
      </div>

      {/* Overall Progress */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tiến độ thiết lập hệ thống</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">{getCompletionPercentage()}% hoàn thành</Badge>
              <Button 
                onClick={autoInitializeSystem}
                disabled={autoInitializing}
                size="sm"
              >
                {autoInitializing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Đang khởi tạo...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Tự động khởi tạo
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={getCompletionPercentage()} className="mb-4" />
          <p className="text-sm text-gray-600">
            Hệ thống cần được thiết lập đầy đủ để có thể tạo thời khóa biểu tự động
          </p>
        </CardContent>
      </Card>

      {/* System Status by Category */}
      {Object.entries(groupedStatus).map(([category, items]) => (
        <Card key={category} className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{category}</span>
              <Badge variant="outline" className="ml-2">
                {items.filter(item => item.status === 'completed').length}/{items.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(item.status)}
                      <h3 className="font-medium">{item.name}</h3>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="font-medium">{item.count}</span>
                      <span className="text-gray-500"> mục</span>
                    </div>
                    
                    {item.action && item.actionLink && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={item.actionLink}>
                          {item.action}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác Nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
              <a href="/dashboard/admin/teaching-schedules">
                <Grid3x3 className="h-6 w-6" />
                <span className="text-sm">Tạo TKB tự động</span>
              </a>
            </Button>
            
            <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
              <a href="/dashboard/admin/users">
                <Users className="h-6 w-6" />
                <span className="text-sm">Import người dùng</span>
              </a>
            </Button>
            
            <Button className="h-20 flex-col space-y-2" variant="outline" asChild>
              <a href="/dashboard/admin/classes">
                <School className="h-6 w-6" />
                <span className="text-sm">Quản lý lớp học</span>
              </a>
            </Button>
            
            <Button 
              className="h-20 flex-col space-y-2" 
              variant="outline"
              onClick={checkSystemStatus}
            >
              <RefreshCw className="h-6 w-6" />
              <span className="text-sm">Làm mới trạng thái</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 