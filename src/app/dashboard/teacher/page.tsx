"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      try {
        const res = await fetch("/api/auth/user");
        const data = await res.json();
        setUser(data);
      } catch (e) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const isTeacher =
    user &&
    (user.role === "homeroom_teacher" || user.role === "subject_teacher");

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Giáo viên - Bảng điều khiển</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <p className="text-gray-700">
              Chào mừng bạn đến với trang giáo viên. Tại đây bạn có thể truy cập các chức năng dành cho giáo viên.
            </p>
            {isTeacher && (
              <Button
                className="w-full text-lg py-6"
                onClick={() => router.push("/dashboard/teacher/schedule")}
                variant="default"
                size="lg"
              >
                Xem lịch dạy của tôi
              </Button>
            )}
            {!isTeacher && !loading && (
              <div className="text-red-500 text-sm">
                Bạn không có quyền truy cập chức năng này.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 