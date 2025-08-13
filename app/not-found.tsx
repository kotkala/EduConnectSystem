import Link from 'next/link'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Brand header provided globally; remove local header duplication */}

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">KHÔNG TÌM THẤY TRANG</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Trang bạn truy cập không tồn tại hoặc đã được di chuyển. Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="px-6">
              <Link href="/">Về trang chủ</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full pb-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EduConnect • Cổng thông tin trường học
      </footer>
    </div>
  )
}
