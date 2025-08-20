'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ThemeToggle } from '@/shared/components/theme-toggle'

const nav = [
  { href: '#features', label: 'Chức năng' },
  { href: '#roles', label: 'Vai trò' },
  { href: '#docs', label: 'Hướng dẫn' },
  { href: '#about', label: 'Về hệ thống' },
  { href: '#contact', label: 'Liên hệ' },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
      <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-4 md:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/Edu Connect.svg" alt="EduConnect" width={28} height={28} className="h-7 w-7" />
          <span className="font-semibold">EduConnect Portal</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {nav.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}


