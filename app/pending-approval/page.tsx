export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-semibold">Tài khoản đang chờ cấp quyền</h1>
        <p className="text-muted-foreground">
          Tài khoản của bạn đã được tạo nhưng chưa được gán vai trò. Vui lòng liên hệ quản trị viên để được cấp quyền truy cập.
        </p>
        <ul className="text-left list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>Nếu bạn là giáo viên/học sinh: chờ admin gán vai trò phù hợp.</li>
          <li>Nếu bạn là phụ huynh: vui lòng dùng đường dẫn xác nhận được gửi qua email mời tham gia.</li>
        </ul>
      </div>
    </div>
  )
}

