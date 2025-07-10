import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>EduConnect System</Link>
            </div>
            <div className="flex gap-4">
              <Link href="/auth/login" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Đăng nhập
              </Link>
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">EduConnect System</h1>
            <p className="text-lg text-gray-600">Hệ thống quản lý giáo dục thông minh</p>
            <div className="mt-8">
              <Link href="/auth/login" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Bắt đầu sử dụng
              </Link>
            </div>
          </div>
        </div>
        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
          <p>Powered by EduConnect Team</p>
        </footer>
      </div>
    </main>
  );
}
