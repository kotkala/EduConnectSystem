'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { UsersTable } from '@/components/admin/users-table';
import { toast } from 'sonner';
import { Users, UserPlus, Zap, RefreshCw } from 'lucide-react';

export default function UsersPage() {
  const [generating, setGenerating] = useState(false);

  const handleGenerateTeachers = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/users/generate-teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`🎉 Tạo thành công ${data.stats.total_teachers} giáo viên!`);
        toast.info(`📊 ${data.stats.homeroom_teachers} giáo viên chủ nhiệm, ${data.stats.subject_teachers} giáo viên bộ môn`);
        
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(data.error || 'Lỗi khi tạo giáo viên');
      }
    } catch (error) {
      toast.error('Lỗi kết nối khi tạo giáo viên');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/admin">
              <Button variant="outline">← Dashboard</Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Quản lý Người dùng</h1>
              <p className="text-gray-600">Quản lý học sinh, giáo viên và phụ huynh</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              onClick={handleGenerateTeachers}
              disabled={generating}
              className="bg-green-600 hover:bg-green-700"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Tạo 50 Giáo viên
                </>
              )}
            </Button>
            
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Thêm Người dùng
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">-</div>
                  <div className="text-sm text-gray-600">Tổng người dùng</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">-</div>
                  <div className="text-sm text-gray-600">Giáo viên</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-8 w-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">-</div>
                  <div className="text-sm text-gray-600">Học sinh</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Zap className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Tự động tạo Giáo viên</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Nhấn "Tạo 50 Giáo viên" để tự động tạo 50 giáo viên với phân bổ môn học đầy đủ. 
                  Bao gồm 15 giáo viên chủ nhiệm và 35 giáo viên bộ môn, phân bổ đều cho tất cả môn học.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <UsersTable />
    </div>
  );
} 