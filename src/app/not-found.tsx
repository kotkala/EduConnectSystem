import Link from 'next/link'

import { Button } from '@/shared/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Brand header provided globally; remove local header duplication */}

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">KHÃ”NG TÃŒM THáº¤Y TRANG</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Trang báº¡n truy cáº­p khÃ´ng tá»“n táº¡i hoáº·c Ä‘Ã£ Ä‘Æ°á»£c di chuyá»ƒn. Vui lÃ²ng kiá»ƒm tra láº¡i Ä‘Æ°á»ng dáº«n hoáº·c quay vá» trang chá»§.
          </p>
          <div className="pt-2">
            <Button asChild size="lg" className="px-6">
              <Link href="/">Vá» trang chá»§</Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full pb-6 text-center text-xs text-muted-foreground">
        Â© {new Date().getFullYear()} EduConnect â€¢ Cá»•ng thÃ´ng tin trÆ°á»ng há»c
      </footer>
    </div>
  )
}
