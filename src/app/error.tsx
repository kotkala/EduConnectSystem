'use client'

import { useEffect } from 'react'
import Link from 'next/link'

import { Button } from '@/shared/components/ui/button'

interface ErrorPageProps {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Brand header is global now; remove local duplication */}

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">ĐÝ XẢY RA LỖI</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Có lỗi không mong muốn xảy ra. Hãy thử lại thao tác hoặc quay về trang chủ.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-muted-foreground font-mono">{error.message}</p>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button onClick={reset} size="lg">Thử lại</Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Về trang chủ</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="w-full pb-6 text-center text-xs text-muted-foreground">
        Â© {new Date().getFullYear()} EduConnect â€¢ Cổng thông tin trường học
      </footer>
    </div>
  )
}
