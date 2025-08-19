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
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">ÄÃƒ Xáº¢Y RA Lá»–I</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            CÃ³ lá»—i khÃ´ng mong muá»‘n xáº£y ra. HÃ£y thá»­ láº¡i thao tÃ¡c hoáº·c quay vá» trang chá»§.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-xs text-muted-foreground font-mono">{error.message}</p>
          )}
          <div className="flex items-center justify-center gap-3">
            <Button onClick={reset} size="lg">Thá»­ láº¡i</Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/">Vá» trang chá»§</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="w-full pb-6 text-center text-xs text-muted-foreground">
        Â© {new Date().getFullYear()} EduConnect â€¢ Cá»•ng thÃ´ng tin trÆ°á»ng há»c
      </footer>
    </div>
  )
}
