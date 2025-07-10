import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { InfoIcon } from "lucide-react";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          Đây là trang được bảo vệ chỉ dành cho người dùng đã đăng nhập
        </div>
      </div>
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Thông tin người dùng</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(data.user, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4">Chức năng hệ thống</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Quản lý năm học</h3>
            <p className="text-sm text-gray-600">Tạo, sửa, xóa năm học</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Quản lý lớp học</h3>
            <p className="text-sm text-gray-600">Quản lý thông tin lớp học</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Quản lý học sinh</h3>
            <p className="text-sm text-gray-600">Quản lý thông tin học sinh</p>
          </div>
          <div className="p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">Quản lý giáo viên</h3>
            <p className="text-sm text-gray-600">Quản lý thông tin giáo viên</p>
          </div>
        </div>
      </div>
    </div>
  );
}
